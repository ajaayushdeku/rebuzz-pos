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
  Trash2,
  Edit3,
  Diamond,
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

const inputClass =
  "w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition";

// ── Loyalty Status Types ────────────────────────────────────────────────────
interface LoyaltyStatus {
  id: string;
  name: string;
  minPoints: number;
  color: string;
  bgColor: string;
}

const STATUS_COLORS: Record<
  string,
  { color: string; bg: string; label: string }
> = {
  diamond: {
    color: "text-cyan-700",
    bg: "bg-cyan-100 border-cyan-200",
    label: "Diamond",
  },
  gold: {
    color: "text-yellow-700",
    bg: "bg-yellow-100 border-yellow-200",
    label: "Gold",
  },
  silver: {
    color: "text-gray-600",
    bg: "bg-gray-100 border-gray-200",
    label: "Silver",
  },
  bronze: {
    color: "text-orange-700",
    bg: "bg-orange-100 border-orange-200",
    label: "Bronze",
  },
  platinum: {
    color: "text-indigo-700",
    bg: "bg-indigo-100 border-indigo-200",
    label: "Platinum",
  },
};

// ── Mock Initial Statuses ───────────────────────────────────────────────────
const MOCK_STATUSES: LoyaltyStatus[] = [
  {
    id: "1",
    name: "Bronze",
    minPoints: 0,
    color: "text-orange-700",
    bgColor: "bg-orange-100",
  },
  {
    id: "2",
    name: "Silver",
    minPoints: 500,
    color: "text-gray-600",
    bgColor: "bg-gray-100",
  },
  {
    id: "3",
    name: "Gold",
    minPoints: 1500,
    color: "text-yellow-700",
    bgColor: "bg-yellow-100",
  },
  {
    id: "4",
    name: "Platinum",
    minPoints: 5000,
    color: "text-indigo-700",
    bgColor: "bg-indigo-100",
  },
];

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

  // ── Loyalty Status State (mock) ──────────────────────────────────────────
  const [statuses, setStatuses] = useState<LoyaltyStatus[]>(MOCK_STATUSES);
  const [statusForm, setStatusForm] = useState<{
    name: string;
    minPoints: string;
  }>({ name: "", minPoints: "" });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [statusErrors, setStatusErrors] = useState<{
    name?: string;
    minPoints?: string;
  }>({});

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
  const validateStatusForm = (): boolean => {
    const e: typeof statusErrors = {};
    if (!statusForm.name.trim()) e.name = "Status name is required";
    if (
      !statusForm.minPoints ||
      isNaN(Number(statusForm.minPoints)) ||
      Number(statusForm.minPoints) < 0
    )
      e.minPoints = "Enter a valid minimum points (0 or more)";
    setStatusErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleAddStatus = () => {
    if (!validateStatusForm()) return;

    const colorKeys = ["bronze", "silver", "gold", "diamond", "platinum"];
    const usedColors = statuses.map((s) => s.color);
    const availableColor = colorKeys.find(
      (k) => !usedColors.includes(STATUS_COLORS[k]?.color ?? ""),
    );
    const fallbackColor = { color: "text-blue-700", bg: "bg-blue-100" };

    if (editingId) {
      setStatuses((prev) =>
        prev.map((s) =>
          s.id === editingId
            ? {
                ...s,
                name: statusForm.name.trim(),
                minPoints: Number(statusForm.minPoints),
              }
            : s,
        ),
      );
      toast.success(`Status "${statusForm.name}" updated`);
    } else {
      const colorInfo = availableColor
        ? STATUS_COLORS[availableColor]
        : fallbackColor;
      const newStatus: LoyaltyStatus = {
        id: crypto.randomUUID(),
        name: statusForm.name.trim(),
        minPoints: Number(statusForm.minPoints),
        color: colorInfo.color,
        bgColor: colorInfo.bg,
      };
      setStatuses((prev) => [...prev, newStatus]);
      toast.success(`Status "${newStatus.name}" added`);
    }

    setStatusForm({ name: "", minPoints: "" });
    setEditingId(null);
    setStatusErrors({});
  };

  const handleEditStatus = (status: LoyaltyStatus) => {
    setEditingId(status.id);
    setStatusForm({ name: status.name, minPoints: String(status.minPoints) });
    setStatusErrors({});
  };

  const handleDeleteStatus = (id: string) => {
    const status = statuses.find((s) => s.id === id);
    setStatuses((prev) => prev.filter((s) => s.id !== id));
    if (editingId === id) {
      setEditingId(null);
      setStatusForm({ name: "", minPoints: "" });
    }
    toast.success(`Status "${status?.name}" removed`);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setStatusForm({ name: "", minPoints: "" });
    setStatusErrors({});
  };

  return (
    <div className="min-h-screen bg-50 px-6 py-8 md:px-10">
      <div className="max-w-7xl mx-auto space-y-10">
        {/* ── Header ─────────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-200">
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
                <p className="text-xs font-semibold text-blue-700 uppercase tracking-wide">
                  Current saved settings
                </p>
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <p className="text-lg font-bold text-blue-800">
                      {settings.loyaltyPointPercentage}%
                    </p>
                    <p className="text-xs text-blue-500">Earn rate</p>
                  </div>
                  <div>
                    <p className="text-lg font-bold text-blue-800">
                      {settings.basePoint}
                    </p>
                    <p className="text-xs text-blue-500">Base point</p>
                  </div>
                  <div>
                    <p className="text-lg font-bold text-blue-800">
                      {settings.redeemLimit}%
                    </p>
                    <p className="text-xs text-blue-500">Redeem limit</p>
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
                <div className="max-w-xs">
                  <Input
                    type="number"
                    min={1}
                    value={form.redeemLimit}
                    onChange={(e) => set("redeemLimit", Number(e.target.value))}
                    className={`${inputClass} ${errors.redeemLimit ? "border-red-300 focus:ring-red-400" : ""}`}
                    placeholder="e.g. 50"
                  />
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
          <div className="mb-6">
            <div className="flex items-center gap-2.5 mb-1">
              <Trophy className="h-5 w-5 text-yellow-500" />
              <h2 className="text-lg font-bold text-gray-900">
                Customer Loyalty Status
              </h2>
            </div>
            <p className="text-sm text-gray-500 ml-8">
              Define loyalty tiers (Bronze, Silver, Gold, Diamond, etc.) and
              their point thresholds.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            {/* ── Form Section (2 cols) ── */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 space-y-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center">
                    {editingId ? (
                      <Edit3 className="h-4 w-4 text-blue-600" />
                    ) : (
                      <Plus className="h-4 w-4 text-blue-600" />
                    )}
                  </div>
                  <p className="text-sm font-semibold text-gray-900">
                    {editingId ? "Edit Status" : "Add New Status"}
                  </p>
                </div>

                <div>
                  <Label className="text-xs text-gray-500 mb-1.5 block">
                    Status Name
                  </Label>
                  <Input
                    value={statusForm.name}
                    onChange={(e) => {
                      setStatusForm((prev) => ({
                        ...prev,
                        name: e.target.value,
                      }));
                      if (statusErrors.name)
                        setStatusErrors((prev) => ({
                          ...prev,
                          name: undefined,
                        }));
                    }}
                    placeholder="e.g. Platinum"
                    className={`${inputClass} ${statusErrors.name ? "border-red-300 focus:ring-red-400" : ""}`}
                  />
                  {statusErrors.name && (
                    <p className="text-xs text-red-500 mt-1">
                      {statusErrors.name}
                    </p>
                  )}
                </div>

                <div>
                  <Label className="text-xs text-gray-500 mb-1.5 block">
                    Minimum Points Required
                  </Label>
                  <Input
                    type="number"
                    min={0}
                    value={statusForm.minPoints}
                    onChange={(e) => {
                      setStatusForm((prev) => ({
                        ...prev,
                        minPoints: e.target.value,
                      }));
                      if (statusErrors.minPoints)
                        setStatusErrors((prev) => ({
                          ...prev,
                          minPoints: undefined,
                        }));
                    }}
                    placeholder="e.g. 10000"
                    className={`${inputClass} ${statusErrors.minPoints ? "border-red-300 focus:ring-red-400" : ""}`}
                  />
                  {statusErrors.minPoints && (
                    <p className="text-xs text-red-500 mt-1">
                      {statusErrors.minPoints}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <Button
                    onClick={handleAddStatus}
                    className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm h-9 px-4"
                  >
                    {editingId ? "Update Status" : "Add Status"}
                  </Button>
                  {editingId && (
                    <Button
                      variant="outline"
                      onClick={handleCancelEdit}
                      className="rounded-lg text-sm h-9 px-4"
                    >
                      Cancel
                    </Button>
                  )}
                </div>
              </div>
            </div>

            {/* ── Table Section (3 cols) ── */}
            <div className="lg:col-span-3">
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-200">
                        <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                          Min Points
                        </th>
                        <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {statuses.length === 0 ? (
                        <tr>
                          <td
                            colSpan={3}
                            className="px-4 py-8 text-center text-sm text-gray-400"
                          >
                            No loyalty statuses defined yet. Add one using the
                            form.
                          </td>
                        </tr>
                      ) : (
                        statuses.map((status) => (
                          <tr
                            key={status.id}
                            className="hover:bg-gray-50 transition-colors"
                          >
                            <td className="px-4 py-3">
                              <span
                                className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full border ${status.bgColor} ${status.color} border-current`}
                              >
                                <Diamond className="h-3 w-3" />
                                {status.name}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-700 font-medium">
                              {status.minPoints.toLocaleString()} pts
                            </td>
                            <td className="px-4 py-3 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => handleEditStatus(status)}
                                  className="p-1.5 rounded-md text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                                  title="Edit"
                                >
                                  <Edit3 className="h-3.5 w-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteStatus(status.id)}
                                  className="p-1.5 rounded-md text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                                  title="Delete"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
