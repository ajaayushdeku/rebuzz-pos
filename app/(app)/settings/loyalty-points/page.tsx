"use client";

import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import {
  Loader2,
  Gift,
  Coins,
  ArrowDownUp,
  Trophy,
  Plus,
  Info,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  fetchLoyaltyPointSettings,
  updateLoyaltyPointSettings,
  createLoyaltyPointSettings,
  LoyaltyPointSettings,
  LoyaltyPointPayload,
} from "@/services/apiLoyaltyPoint";
import { useBusiness } from "@/hooks/useBusiness";
import { ComponentHeader } from "@/components/ComponentHeader";
import { DeleteConfirmDialog } from "@/components/DeleteConfirmDialog";
import LoyaltyStatusTable from "@/components/settingsComponents/loyaltyPoints/LoyaltyStatusTable";
import LoyaltyStatusModal, {
  type LoyaltyStatusDraft,
} from "@/components/settingsComponents/loyaltyPoints/LoyaltyStatusModal";
import {
  type LoyaltyStatus,
  sortByThreshold,
} from "@/components/settingsComponents/loyaltyPoints/loyaltyStatusConfig";
import {
  useLoyaltyTiers,
  useLoyaltyTierMutations,
} from "@/hooks/useLoyaltyTiers";

const inputClass =
  "w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition";

function FieldCard({
  icon: Icon,
  title,
  description,
  children,
}: {
  icon: React.ElementType;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 flex flex-col sm:flex-row sm:items-start gap-4">
      <div className="shrink-0 w-9 h-9 bg-blue-50 rounded-lg flex items-center justify-center">
        <Icon className="h-4 w-4 text-blue-600" />
      </div>
      <div className="flex-1 space-y-3">
        <div>
          <p className="text-sm font-semibold text-gray-900">{title}</p>
          <p className="text-xs text-gray-400 mt-0.5">{description}</p>
        </div>
        {children}
      </div>
    </div>
  );
}

export default function LoyaltyPointPage() {
  const [settings, setSettings] = useState<LoyaltyPointSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState<LoyaltyPointPayload>({
    loyaltyPoint: 0,
    redeemLimit: 0,
    basePoint: 0,
  });

  const [errors, setErrors] = useState<
    Partial<Record<keyof LoyaltyPointPayload, boolean>>
  >({});

  // ── Loyalty Status State ─────────────────────────────────────────────────
  //
  // The ladder lives on the server now. Every write re-reads it rather than
  // patching locally: a tier's place in the ladder depends on every other
  // tier's threshold, and the ids come back from the API.
  const {
    data: statuses = [],
    isLoading: tiersLoading,
    error: tiersError,
  } = useLoyaltyTiers();
  const {
    create: createTier,
    update: updateTier,
    remove: removeTier,
    isSaving: savingTier,
    isDeleting: deletingTier,
  } = useLoyaltyTierMutations();
  const [deleteTarget, setDeleteTarget] = useState<{
    id: string;
    name: string;
  } | null>(null);
  // One modal covers both add and edit; `editingStatus` decides which.
  const [statusModalOpen, setStatusModalOpen] = useState(false);
  const [editingStatus, setEditingStatus] = useState<LoyaltyStatus | null>(
    null,
  );

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      try {
        const response = await fetchLoyaltyPointSettings();
        const data = response && "data" in response ? response.data : response;

        if (
          data &&
          typeof data === "object" &&
          "loyaltyPointPercentage" in data &&
          "redeemLimit" in data &&
          "basePoint" in data
        ) {
          const settingsData = data as LoyaltyPointSettings;
          setSettings(settingsData);
          setForm({
            loyaltyPoint: settingsData.loyaltyPointPercentage,
            redeemLimit: settingsData.redeemLimit,
            basePoint: settingsData.basePoint,
          });
        }
      } catch {
        toast.error("Failed to load loyalty point settings");
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, []);

  const set = (key: keyof LoyaltyPointPayload, value: number) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: false }));
  };

  const validate = (): boolean => {
    const e: Partial<Record<keyof LoyaltyPointPayload, boolean>> = {};
    if (form.loyaltyPoint <= 0 || form.loyaltyPoint > 100)
      e.loyaltyPoint = true;
    if (form.redeemLimit <= 0) e.redeemLimit = true;
    if (form.basePoint <= 0) e.basePoint = true;
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const { data: business } = useBusiness();

  const handleSave = async () => {
    if (!validate()) return;
    setSaving(true);
    try {
      if (settings) {
        const updated = await updateLoyaltyPointSettings(form);
        setSettings(updated);
      } else {
        const created = await createLoyaltyPointSettings({
          ...form,
          businessName: business?.businessName ?? "Default",
        });
        setSettings(created);
      }
      toast.success("Loyalty point settings saved");
    } catch {
      toast.error("Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  const hasChanges = settings
    ? form.loyaltyPoint !== settings.loyaltyPointPercentage ||
      form.redeemLimit !== settings.redeemLimit ||
      form.basePoint !== settings.basePoint
    : form.loyaltyPoint > 0 || form.redeemLimit > 0 || form.basePoint > 0;

  // ── Loyalty Status Handlers ──────────────────────────────────────────────
  const openAddStatus = () => {
    setEditingStatus(null);
    setStatusModalOpen(true);
  };

  const openEditStatus = (status: LoyaltyStatus) => {
    setEditingStatus(status);
    setStatusModalOpen(true);
  };

  const closeStatusModal = () => {
    setStatusModalOpen(false);
    setEditingStatus(null);
  };

  /**
   * Handles both paths — the modal reports a validated draft either way.
   *
   * `minPoint` goes out as a string because that is what the endpoint takes;
   * it comes back as a number, which `mapTiers` normalises.
   */
  const handleSubmitStatus = async ({
    name,
    minPoints,
  }: LoyaltyStatusDraft) => {
    const payload = { name, minPoint: String(minPoints) };

    try {
      if (editingStatus) {
        await updateTier.mutateAsync({ id: editingStatus.id, payload });
        toast.success(`Status "${name}" updated`);
      } else {
        await createTier.mutateAsync(payload);
        toast.success(`Status "${name}" added`);
      }
      closeStatusModal();
    } catch (err) {
      // The modal stays open with what was typed, so a rejected name or a
      // clashing threshold can be corrected rather than re-entered.
      toast.error(
        err instanceof Error
          ? err.message
          : "Failed to save the loyalty status",
      );
    }
  };

  /**
   * Deleting a tier re-bands every customer sitting in it, so it goes
   * through the app's shared confirmation rather than firing on one click.
   */
  const confirmDeleteStatus = async () => {
    if (!deleteTarget) return;
    const { id, name } = deleteTarget;

    try {
      await removeTier.mutateAsync(id);
      if (editingStatus?.id === id) closeStatusModal();
      setDeleteTarget(null);
      toast.success(`Status "${name}" removed`);
    } catch (err) {
      toast.error(
        err instanceof Error
          ? err.message
          : "Failed to delete the loyalty status",
      );
    }
  };

  const sortedStatuses = sortByThreshold(statuses);

  /**
   * The lowest rung, when the ladder does not start at 0.
   *
   * A ladder with no rung at zero leaves every customer below its first
   * threshold unbanded — they show as "No tier" rather than being quietly
   * rounded down into the bottom one. That is a legitimate choice, so this
   * says what it means rather than blocking it.
   */
  const missingZeroFloor =
    sortedStatuses.length > 0 && sortedStatuses[0].minPoints > 0
      ? sortedStatuses[0].minPoints
      : null;

  return (
    <div className="min-h-screen bg-50 px-6 py-8 md:px-10">
      <div className="w-full mx-auto ">
        {/* ── Header ─────────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5 pb-4 border-b border-gray-200">
          <div>
            <h1 className="font-bold text-xl md:text-2xl truncate">
              Loyalty Points
            </h1>
            <p className="text-xs text-gray-400 mt-0.5">
              Configure how customers earn and redeem loyalty points on
              invoices.
            </p>
          </div>
          <Button
            onClick={handleSave}
            disabled={saving || isLoading || !hasChanges}
            className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center gap-2"
          >
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              "Save changes"
            )}
          </Button>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-24">
            <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
          </div>
        ) : (
          <div className="space-y-4">
            {settings && (
              <div className="bg-blue-50 border border-blue-100 rounded-xl px-5 py-4 space-y-2">
                <div className="w-full  flex items-center justify-center gap-2.5 mb-4">
                  <p
                    className="text-xs 
            w-fit font-bold text-blue-700 uppercase tracking-wide"
                  >
                    Current saved settings
                  </p>
                </div>
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <p className="text-lg font-bold text-blue-800">
                      {settings.loyaltyPointPercentage}%
                    </p>
                    <p className="text-xs text-blue-500">Earn rate</p>
                  </div>

                  <div>
                    <p className="text-lg font-bold text-blue-800">
                      {settings.redeemLimit}%
                    </p>
                    <p className="text-xs text-blue-500">Redeem limit</p>
                  </div>

                  <div>
                    <p className="text-lg font-bold text-blue-800">
                      {settings.basePoint}
                    </p>
                    <p className="text-xs text-blue-500">Base point</p>
                  </div>
                </div>
              </div>
            )}

            <FieldCard
              icon={Gift}
              title="Loyalty Point Percentage"
              description="Percentage of the invoice total awarded as loyalty points to the customer."
            >
              <div>
                <Label className="text-xs text-gray-500 mb-1.5 block">
                  Percentage (%)
                </Label>
                <div className="relative max-w-xs">
                  <Input
                    type="number"
                    min={1}
                    max={100}
                    value={form.loyaltyPoint}
                    onChange={(e) =>
                      set("loyaltyPoint", Number(e.target.value))
                    }
                    className={`${inputClass} pr-8 ${errors.loyaltyPoint ? "border-red-300 focus:ring-red-400" : ""}`}
                    placeholder="e.g. 30"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">
                    %
                  </span>
                </div>
                {errors.loyaltyPoint && (
                  <p className="text-xs text-red-500 mt-1">
                    Enter a value between 1 and 100.
                  </p>
                )}
                <p className="text-xs text-gray-400 mt-1.5">
                  Example: 30% on a Rs 100 invoice → customer earns 30 points.
                </p>
              </div>
            </FieldCard>

            <FieldCard
              icon={ArrowDownUp}
              title="Redeem Limit"
              description="Maximum number of loyalty points a customer can redeem on a single invoice."
            >
              <div>
                <Label className="text-xs text-gray-500 mb-1.5 block">
                  Max points per invoice in percentage (%)
                </Label>
                <div className="relative max-w-xs">
                  <Input
                    type="number"
                    min={1}
                    max={100}
                    value={form.redeemLimit}
                    onChange={(e) => set("redeemLimit", Number(e.target.value))}
                    className={`${inputClass} ${errors.redeemLimit ? "border-red-300 focus:ring-red-400" : ""}`}
                    placeholder="e.g. 50"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">
                    %
                  </span>
                </div>
                {errors.redeemLimit && (
                  <p className="text-xs text-red-500 mt-1">
                    Redeem limit must be greater than 0.
                  </p>
                )}
                <p className="text-xs text-gray-400 mt-1.5">
                  Example: 50% means a customer can redeem up to 50% points of
                  the total price before tax (if applied) per invoice.
                </p>
              </div>
            </FieldCard>

            <FieldCard
              icon={Coins}
              title="Base Point"
              description="Number of points awarded per base unit of spend (e.g. per Rs 10 spent)."
            >
              <div>
                <Label className="text-xs text-gray-500 mb-1.5 block">
                  Points per unit
                </Label>
                <div className="max-w-xs">
                  <Input
                    type="number"
                    min={1}
                    value={form.basePoint}
                    onChange={(e) => set("basePoint", Number(e.target.value))}
                    className={`${inputClass} ${errors.basePoint ? "border-red-300 focus:ring-red-400" : ""}`}
                    placeholder="e.g. 10"
                  />
                </div>
                {errors.basePoint && (
                  <p className="text-xs text-red-500 mt-1">
                    Base point must be greater than 0.
                  </p>
                )}
                <p className="text-xs text-gray-400 mt-1.5">
                  Example: 10 base points means 1 point per Rs 10 spent.
                </p>
              </div>
            </FieldCard>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════════════ */}
        {/* ── CUSTOMER LOYALTY STATUS SECTION ── */}
        {/* ═══════════════════════════════════════════════════════════════════ */}
        <div className="border-t pt-8">
          <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-50">
                <Trophy className="h-4 w-4 text-blue-500" />
              </div>
              <ComponentHeader
                title="Customer Loyalty Status"
                subHeader="Define loyalty tiers and the point thresholds a customer crosses to reach them."
              />
            </div>

            <Button
              onClick={openAddStatus}
              disabled={tiersLoading || !!tiersError}
              className="shrink-0 rounded-lg bg-blue-600 text-sm text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Plus className="mr-1.5 h-4 w-4" />
              Add Tier
            </Button>
          </div>

          {missingZeroFloor !== null && (
            <div className="mb-4 flex items-start gap-2.5 rounded-lg border border-amber-200 bg-amber-50 px-3.5 py-3">
              <Info className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
              <p className="text-[13px] leading-relaxed text-amber-800">
                No tier starts at 0 points. Customers with fewer than{" "}
                <span className="font-semibold">
                  {missingZeroFloor.toLocaleString()}
                </span>{" "}
                points will show as{" "}
                <span className="font-semibold">No tier</span> — add a tier with
                a minimum of 0 to cover everyone.
              </p>
            </div>
          )}

          {/* The ladder is remote now, so it has the three states any fetched
              list needs — and an empty one says what to do rather than
              rendering a table with no rows. */}
          {tiersLoading ? (
            <div className="flex items-center justify-center gap-2 rounded-lg border border-gray-200 py-12 text-sm text-gray-400">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading loyalty tiers
            </div>
          ) : tiersError ? (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-6 text-center">
              <p className="text-sm text-red-600">
                {tiersError instanceof Error
                  ? tiersError.message
                  : "Failed to load loyalty tiers."}
              </p>
            </div>
          ) : sortedStatuses.length === 0 ? (
            <div className="rounded-lg border border-dashed border-gray-200 px-4 py-12 text-center">
              <p className="text-sm font-medium text-gray-700">
                No loyalty tiers yet
              </p>
              <p className="mt-1 text-xs text-gray-400">
                Add one to start banding customers by the points they have
                earned.
              </p>
            </div>
          ) : (
            <LoyaltyStatusTable
              statuses={sortedStatuses}
              editingId={editingStatus?.id ?? null}
              onEdit={openEditStatus}
              onDelete={(status) =>
                setDeleteTarget({ id: status.id, name: status.name })
              }
            />
          )}
        </div>
      </div>

      <LoyaltyStatusModal
        open={statusModalOpen}
        editing={editingStatus}
        onClose={closeStatusModal}
        onSubmit={handleSubmitStatus}
        isSaving={savingTier}
        missingZeroFloor={missingZeroFloor}
      />

      <DeleteConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        icon={Trophy}
        title="Delete loyalty tier?"
        description={
          deleteTarget
            ? `“${deleteTarget.name}” will be removed from the tier ladder.`
            : "This tier will be removed from the tier ladder."
        }
        warning={
          deleteTarget && deleteTarget.id === sortedStatuses[0]?.id
            ? "Customers in this tier will have no tier until another one starts at their point total."
            : "Customers in this tier will fall back to the next lowest one."
        }
        onConfirm={confirmDeleteStatus}
        isPending={deletingTier}
      />
    </div>
  );
}
