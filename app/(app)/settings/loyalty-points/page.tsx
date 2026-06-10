"use client";

import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { Loader2, Gift, Coins, ArrowDownUp } from "lucide-react";
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
  // ── React Query approach (commented out) ──────────────────────────────────
  // const queryClient = useQueryClient();
  //
  // const { data: settings, isLoading } = useQuery({
  //   queryKey: ["loyalty-point"],
  //   queryFn: fetchLoyaltyPointSettings,
  //   staleTime: 5 * 60 * 1000,
  // });
  //
  // const { mutate: save, isPending: saving } = useMutation({
  //   mutationFn: updateLoyaltyPointSettings,
  //   onSuccess: () => {
  //     queryClient.invalidateQueries({ queryKey: ["loyalty-point"] });
  //     toast.success("Loyalty point settings saved");
  //   },
  //   onError: () => {
  //     toast.error("Failed to save settings");
  //   },
  // });
  // ─────────────────────────────────────────────────────────────────────────

  // ── Manual fetch state ────────────────────────────────────────────────────
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

  // Fetch on mount
  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      try {
        const response = await fetchLoyaltyPointSettings();

        const data = response && "data" in response ? response.data : response;

        if (data) {
          setSettings(data);
          setForm({
            loyaltyPoint: data.loyaltyPointPercentage,
            redeemLimit: data.redeemLimit,
            basePoint: data.basePoint,
          });
        }

        // console.log("Loyalty points:", data);
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
        // Settings already exist → use PUT to update
        const updated = await updateLoyaltyPointSettings(form);
        // console.log("Update Loyalty points:", updated);
        setSettings(updated);
      } else {
        // No settings yet → use POST to create
        const created = await createLoyaltyPointSettings({
          ...form,
          businessName: business?.businessName ?? "Default",
        });
        // console.log("Created Loyalty points:", created);
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

  console.log("Loyalty Points Setttings:", settings);

  return (
    <div className="min-h-screen bg-50 px-6 py-8 md:px-10">
      <div className="max-w-7xl mx-auto">
        {/* ── Header ─────────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 pb-4 border-b border-gray-200">
          <div>
            <h1 className="font-bold text-xl md:text-2xl truncate">
              Loyalty Points
            </h1>
            <p className="text-sm text-gray-500 mt-0.5">
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
            {/* Current settings summary */}
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
                      {settings.redeemLimit}
                    </p>
                    <p className="text-xs text-blue-500">Redeem limit</p>
                  </div>
                </div>
              </div>
            )}

            {/* Loyalty point percentage */}
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

            {/* Redeem limit */}
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

            {/* Base point */}
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
      </div>
    </div>
  );
}
