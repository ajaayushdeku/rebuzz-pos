"use client";

import { useState, type ReactNode, type FormEvent } from "react";
import {
  ArrowDownRight,
  ArrowUpRight,
  BadgePercent,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Hourglass,
  Loader2,
  Scale,
  Tags,
  TriangleAlert,
  X,
  type LucideIcon,
} from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";

import type { AiSectionState } from "@/hooks/useAiSection";
import { productKeys } from "@/hooks/useProducts";
import { useWindowPhrase } from "@/components/aiInsights/periodLabel";
import {
  PRICING_WEEKS,
  type PricingInsight,
  type PricingKind,
} from "@/lib/ai-insights/sections/pricing";
import {
  AiSectionBody,
  CardAction,
  CardGrid,
  InsightCard,
  LabelNote,
  LeadTile,
  Recommendation,
  TipList,
  SectionHeader,
  useMoney,
  type AccentName,
  type Metric,
} from "../parts";
import {
  fetchProductsListClient,
  fetchProductVariant,
  updateProductVariant,
  removeProductDiscounts,
  updateProduct,
} from "@/services/product/apiProduct.client";
import { useDiscounts } from "@/hooks/useDiscounts";
import { Discount } from "@/services/apiDiscounts.client";
import {
  useApplyPricingSuggestion,
  useDismissPricingSuggestion,
} from "@/hooks/usePeriodInsights";
import type { PeriodKind } from "@/services/apiPeriodInsights.client";

/** Each kind of finding: its label, a small icon, and the card's accent. */
const KIND: Record<
  PricingKind,
  { label: string; icon: LucideIcon; accent: AccentName }
> = {
  "price-change": { label: "Price change", icon: Tags, accent: "emerald" },
  "just-changed": {
    label: "Too new to judge",
    icon: Hourglass,
    accent: "slate",
  },
  discount: { label: "Discount review", icon: BadgePercent, accent: "blue" },
  "below-cost": {
    label: "Selling below cost",
    icon: TriangleAlert,
    accent: "red",
  },
  "low-margin": {
    label: "Thin margin",
    icon: TriangleAlert,
    accent: "amber",
  },
};

/** "Aug 7" for the week a price changed. */
function weekLabel(iso: string): string {
  return new Date(`${iso}T12:00:00Z`).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });
}

const pctChange = (now: number, before: number) =>
  before !== 0 ? Math.round(((now - before) / Math.abs(before)) * 100) : null;

/** The figures for each kind of finding, all worked out by the app. */
function useMetrics(item: PricingInsight): Metric[] {
  const money = useMoney();
  const f = item.facts;

  const lossClass = (v: number) =>
    v < 0 ? "text-red-600 dark:text-red-300" : undefined;

  switch (f.kind) {
    case "price-change":
      return [
        {
          label: "Price",
          value: money(f.price),
          note: `was ${money(f.oldPrice)}`,
          delta: { pct: pctChange(f.price, f.oldPrice), neutral: true },
        },
        {
          label: "Sold / week",
          value: String(f.unitsPerWeekAfter),
          note: `was ${f.unitsPerWeekBefore}`,
          delta: {
            pct: pctChange(f.unitsPerWeekAfter, f.unitsPerWeekBefore),
          },
        },
        f.profitPerWeekBefore === null || f.profitPerWeekAfter === null
          ? { label: "Profit / week", value: "—", note: "No cost set" }
          : {
              label: "Profit / week",
              value: money(f.profitPerWeekAfter),
              valueClassName: lossClass(f.profitPerWeekAfter),
              note: `was ${money(f.profitPerWeekBefore)}`,
              delta: {
                pct: pctChange(f.profitPerWeekAfter, f.profitPerWeekBefore),
              },
            },
      ];

    case "just-changed":
      return [
        {
          label: "Price",
          value: money(f.price),
          note: `was ${money(f.oldPrice)}`,
          delta: { pct: pctChange(f.price, f.oldPrice), neutral: true },
        },
        {
          label: "Sold since",
          value: String(f.unitsSince),
          note: "at the new price",
        },
      ];

    case "discount":
      return [
        {
          label: "Discounted",
          value: `${f.discountedSharePct}%`,
          note: "of units sold",
        },
        {
          label: "Average off",
          value: money(f.avgDiscount),
          note: `on ${money(f.price)}`,
        },
        f.profitPerUnitFull === null || f.profitPerUnitDiscounted === null
          ? { label: "Profit / sale", value: "—", note: "No cost set" }
          : {
              label: "Profit / sale",
              value: money(f.profitPerUnitDiscounted),
              valueClassName: lossClass(f.profitPerUnitDiscounted),
              note: `${money(f.profitPerUnitFull)} at full price`,
            },
      ];

    case "below-cost":
    case "low-margin":
      return [
        { label: "Price", value: money(f.price) },
        { label: "Cost", value: money(f.cost) },
        {
          label: "Per sale",
          value: money(f.profitPerUnit),
          valueClassName:
            f.profitPerUnit < 0
              ? "text-red-600 dark:text-red-300"
              : "text-amber-700 dark:text-amber-300",
          note: `${f.marginPct}% margin`,
        },
      ];
  }
}

/** "Can sell 25% fewer and earn the same", from price and cost alone. */
function breakEvenText(pct: number): string {
  return pct < 0
    ? `Profit stays the same even if you sell ${Math.abs(pct)}% fewer`
    : `You need to sell ${pct}% more to make the same profit`;
}

/** One suggested figure in the recommendation. */
function SuggestedRow({
  label,
  was,
  children,
  className,
}: {
  label: string;
  was?: string;
  children: ReactNode;
  className: string;
}) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <span className="text-[11px] font-medium text-[#5f6368] dark:text-[#a9b4c7]">
        {label}
      </span>

      <span className="flex items-baseline gap-2">
        {was && (
          <span className="text-[11px] tabular-nums text-[#9aa0a6] line-through dark:text-[#9aa6bd]">
            {was}
          </span>
        )}

        <span
          className={`inline-flex items-center gap-0.5 text-lg font-bold tabular-nums ${className}`}
        >
          {children}
        </span>
      </span>
    </div>
  );
}

/** Individual pricing insight card. */
function PricingCard({
  item,
  onDismiss,
  onApplyPrice,
  isUpdatingPrice,
  onManageDiscounts,
  isLoadingDiscounts,
}: {
  item: PricingInsight;
  onDismiss: (id: string) => void;
  onApplyPrice: (item: PricingInsight) => void;
  isUpdatingPrice: boolean;
  onManageDiscounts: (item: PricingInsight) => void;
  isLoadingDiscounts: boolean;
}) {
  const money = useMoney();
  const f = item.facts;
  const kind = KIND[f.kind];
  const metrics = useMetrics(item);
  const price = item.suggestedPrice;
  const discount = item.suggestedDiscount;

  const up = price !== null && price > f.price;
  const hasSuggestion = price !== null || discount !== null;
  const isDismissed = item.status === "dismissed";
  const isApplied = item.status === "applied";
  const isCompleted = isDismissed || isApplied;

  return (
    <InsightCard
      accent={kind.accent}
      lead={<LeadTile accent={kind.accent}>{item.icon}</LeadTile>}
      label={
        <>
          <kind.icon size={11} aria-hidden />
          {kind.label}

          {f.kind === "price-change" && (
            <LabelNote>since {weekLabel(f.changedWeekOf)}</LabelNote>
          )}
        </>
      }
      title={f.name}
      onDismiss={() => {
        if (!isCompleted) onDismiss(item.id);
      }}
      dismissLabel={f.name}
      metrics={metrics}
      footer={
        isApplied ? (
          <div className="flex w-full items-center justify-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2.5 text-xs font-semibold text-emerald-700 dark:border-emerald-400/20 dark:bg-emerald-400/10 dark:text-emerald-300">
            <CheckCircle2 size={14} aria-hidden />
            {item.actionType === "price-updated"
              ? "Price updated"
              : "Discount removed"}
          </div>
        ) : isDismissed ? (
          <div className="flex w-full items-center justify-center gap-2 rounded-lg border border-[#e5e7eb] bg-[#f8f9fa] px-3 py-2.5 text-xs font-medium text-[#6b7280] dark:border-white/10 dark:bg-white/[0.03] dark:text-[#a9b4c7]">
            <CheckCircle2 size={14} aria-hidden />
            Dismissed
          </div>
        ) : price !== null && f.productId ? (
          <button
            type="button"
            onClick={() => onApplyPrice(item)}
            disabled={isUpdatingPrice}
            className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-[#244074] px-3 py-2.5 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-[#1d3561] disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-[#171e2c]"
          >
            Apply new price
            <ArrowUpRight size={14} aria-hidden />
          </button>
        ) : discount !== null && f.productId ? (
          <button
            type="button"
            onClick={() => onManageDiscounts(item)}
            disabled={isLoadingDiscounts}
            className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-blue-200 bg-blue-50 px-3 py-2.5 text-xs font-semibold text-[#244074] transition-colors hover:bg-blue-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-blue-400/20 dark:bg-blue-400/10 dark:text-blue-300 dark:hover:bg-blue-400/15"
          >
            Update discount
            <BadgePercent size={14} aria-hidden />
          </button>
        ) : (
          <CardAction href="/records/products" primary={hasSuggestion}>
            View in products
          </CardAction>
        )
      }
    >
      <p className="text-[13px] leading-relaxed text-[#5f6368] dark:text-[#a9b4c7]">
        {item.verdict}
      </p>

      <div className="mt-auto">
        <Recommendation
          details={
            hasSuggestion ? (
              <>
                {price !== null && (
                  <SuggestedRow
                    label="Suggested price"
                    was={money(f.price)}
                    className={
                      up
                        ? "text-emerald-700 dark:text-emerald-300"
                        : "text-blue-700 dark:text-blue-300"
                    }
                  >
                    {up ? (
                      <ArrowUpRight size={15} aria-hidden />
                    ) : (
                      <ArrowDownRight size={15} aria-hidden />
                    )}
                    {money(price)}
                  </SuggestedRow>
                )}

                {discount !== null && (
                  <SuggestedRow
                    label="Suggested discount"
                    was={
                      f.kind === "discount"
                        ? `${money(f.avgDiscount)} off`
                        : undefined
                    }
                    className="text-blue-700 dark:text-blue-300"
                  >
                    {discount === 0 ? "None" : `${money(discount)} off`}
                  </SuggestedRow>
                )}

                {item.breakEvenUnitsPct !== null && (
                  <p className="flex items-start gap-1.5 text-[11px] leading-relaxed text-[#5f6368] dark:text-[#a9b4c7]">
                    <Scale size={12} className="mt-0.5 shrink-0" aria-hidden />
                    {breakEvenText(item.breakEvenUnitsPct)}.
                  </p>
                )}
              </>
            ) : undefined
          }
          title={item.advice.length > 1 ? "Ways to fix it" : "Recommendation"}
        >
          <TipList tips={item.advice} />
        </Recommendation>
      </div>
    </InsightCard>
  );
}

/** Modal for reviewing and updating a product's selling price. */
function UpdateSellingPriceModal({
  item,
  value,
  isSaving,
  onChange,
  onClose,
  onSubmit,
}: {
  item: PricingInsight;
  value: string;
  isSaving: boolean;
  onChange: (value: string) => void;
  onClose: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}) {
  const money = useMoney();

  const currentPrice = item.facts.price;
  const newPrice = Number(value);

  const isValid =
    value.trim() !== "" && Number.isFinite(newPrice) && newPrice > 0;

  const difference = newPrice - currentPrice;
  const differencePct =
    currentPrice > 0 ? (difference / currentPrice) * 100 : 0;

  const canSave = isValid && Math.abs(difference) > 0.000001 && !isSaving;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4 backdrop-blur-[3px]"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="update-selling-price-title"
        className="w-full max-w-md overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl dark:border-white/10 dark:bg-[#171e2c]"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 border-b border-gray-100 px-5 py-4 dark:border-white/10">
          <div className="flex min-w-0 items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-[#244074] dark:bg-blue-400/10 dark:text-blue-300">
              <Tags size={19} />
            </div>

            <div className="min-w-0">
              <h3
                id="update-selling-price-title"
                className="text-sm font-bold text-gray-900 dark:text-[#e8ecf4]"
              >
                Update selling price
              </h3>

              <p className="mt-1 truncate text-xs text-gray-500 dark:text-[#9aa6bd]">
                {item.facts.name}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={isSaving}
            aria-label="Close modal"
            className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700 disabled:opacity-50 dark:hover:bg-white/10 dark:hover:text-white"
          >
            <X size={17} />
          </button>
        </div>

        <form onSubmit={onSubmit}>
          <div className="space-y-4 px-5 py-5">
            <div className="flex items-center justify-between rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 dark:border-white/10 dark:bg-white/[0.04]">
              <div>
                <p className="text-xs font-medium text-gray-500 dark:text-[#9aa6bd]">
                  Current selling price
                </p>

                <p className="mt-1 text-base font-bold tabular-nums text-gray-800 dark:text-[#e8ecf4]">
                  {money(currentPrice)}
                </p>
              </div>

              <div className="text-right">
                <p className="text-xs font-medium text-gray-500 dark:text-[#9aa6bd]">
                  AI suggestion
                </p>

                <p className="mt-1 text-base font-bold tabular-nums text-emerald-600 dark:text-emerald-400">
                  {money(item.suggestedPrice ?? 0)}
                </p>
              </div>
            </div>

            <div>
              <label
                htmlFor="new-selling-price"
                className="mb-2 block text-xs font-semibold text-gray-700 dark:text-[#cbd5e1]"
              >
                New selling price
              </label>

              <input
                id="new-selling-price"
                type="number"
                min="0.01"
                step="0.01"
                inputMode="decimal"
                autoFocus
                value={value}
                onChange={(event) => onChange(event.target.value)}
                placeholder="Enter new selling price"
                disabled={isSaving}
                className="h-11 w-full rounded-xl border border-gray-200 bg-white px-3 text-sm font-semibold tabular-nums text-gray-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 disabled:opacity-60 dark:border-white/15 dark:bg-white/[0.04] dark:text-[#e8ecf4]"
              />

              {value.trim() !== "" && !isValid && (
                <p className="mt-1.5 text-[11px] text-red-500">
                  Enter a valid price greater than zero.
                </p>
              )}
            </div>

            {isValid && Math.abs(difference) > 0.000001 && (
              <div className="flex items-center justify-between rounded-xl bg-blue-50/80 px-4 py-3 dark:bg-blue-400/[0.08]">
                <div>
                  <p className="text-xs font-medium text-gray-600 dark:text-[#a9b4c7]">
                    Price difference
                  </p>

                  <p
                    className={`mt-1 text-sm font-bold tabular-nums ${
                      difference > 0
                        ? "text-emerald-600 dark:text-emerald-400"
                        : "text-red-600 dark:text-red-400"
                    }`}
                  >
                    {difference > 0 ? "+" : "-"}
                    {money(Math.abs(difference))}
                  </p>
                </div>

                <span
                  className={`rounded-lg px-2.5 py-1 text-xs font-bold tabular-nums ${
                    difference > 0
                      ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-400/10 dark:text-emerald-300"
                      : "bg-red-100 text-red-700 dark:bg-red-400/10 dark:text-red-300"
                  }`}
                >
                  {difference > 0 ? "+" : ""}
                  {differencePct.toFixed(1)}%
                </span>
              </div>
            )}

            <p className="text-[11px] leading-relaxed text-gray-500 dark:text-[#9aa6bd]">
              Only the selling price will be updated. Your cost price, stock,
              discounts and other product details will remain unchanged.
            </p>
          </div>

          <div className="flex items-center justify-end gap-2 border-t border-gray-100 px-5 py-4 dark:border-white/10">
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className="h-9 rounded-lg border border-gray-200 px-4 text-xs font-semibold text-gray-600 transition-colors hover:bg-gray-50 disabled:opacity-50 dark:border-white/10 dark:text-[#cbd5e1] dark:hover:bg-white/[0.06]"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={!canSave}
              className="inline-flex h-9 items-center justify-center gap-2 rounded-lg bg-[#244074] px-4 text-xs font-semibold text-white transition-colors hover:bg-[#1d3561] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSaving ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  Updating...
                </>
              ) : (
                "Update price"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/** Modal for reviewing and removing an assigned product discount. */
function ManageDiscountModal({
  item,
  discounts,
  isLoading,
  isRemoving,
  onClose,
  onRemove,
}: {
  item: PricingInsight;
  discounts: Discount[];
  isLoading: boolean;
  isRemoving: boolean;
  onClose: () => void;
  onRemove: (discountId: string) => void;
}) {
  const money = useMoney();
  const [confirmingId, setConfirmingId] = useState<string | null>(null);

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4 backdrop-blur-[3px]"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="manage-discount-title"
        className="w-full max-w-md overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl dark:border-white/10 dark:bg-[#171e2c]"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 border-b border-gray-100 px-5 py-4 dark:border-white/10">
          <div className="flex min-w-0 items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-[#244074] dark:bg-blue-400/10 dark:text-blue-300">
              <BadgePercent size={19} />
            </div>

            <div className="min-w-0">
              <h3
                id="manage-discount-title"
                className="text-sm font-bold text-gray-900 dark:text-[#e8ecf4]"
              >
                Update discount
              </h3>
              <p className="mt-1 truncate text-xs text-gray-500 dark:text-[#9aa6bd]">
                {item.facts.name}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={isRemoving}
            aria-label="Close modal"
            className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700 disabled:opacity-50 dark:hover:bg-white/10 dark:hover:text-white"
          >
            <X size={17} />
          </button>
        </div>

        <div className="space-y-3 px-5 py-5">
          <div>
            <p className="text-xs font-semibold text-gray-800 dark:text-[#e8ecf4]">
              Assigned discounts
            </p>
            <p className="mt-1 text-[11px] text-gray-500 dark:text-[#9aa6bd]">
              Select a discount to remove it from this product.
            </p>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center gap-2 py-8 text-xs text-gray-500 dark:text-[#9aa6bd]">
              <Loader2 size={16} className="animate-spin" />
              Loading assigned discounts...
            </div>
          ) : discounts.length === 0 ? (
            <div className="rounded-xl border border-dashed border-gray-200 px-4 py-8 text-center dark:border-white/10">
              <BadgePercent className="mx-auto h-7 w-7 text-gray-300 dark:text-[#657188]" />
              <p className="mt-2 text-xs font-semibold text-gray-700 dark:text-[#cbd5e1]">
                No discounts assigned
              </p>
              <p className="mt-1 text-[11px] text-gray-500 dark:text-[#9aa6bd]">
                This product has no matching assigned discounts.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {discounts.map((discount) => {
                const confirming = confirmingId === discount._id;

                return (
                  <div
                    key={discount._id}
                    className="rounded-xl border border-gray-200 p-3 dark:border-white/10 dark:bg-white/[0.02]"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex min-w-0 items-center gap-2.5">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 dark:bg-emerald-400/10 dark:text-emerald-300">
                          <BadgePercent size={17} />
                        </div>

                        <div className="min-w-0">
                          <p className="truncate text-xs font-semibold text-gray-800 dark:text-[#e8ecf4]">
                            {discount.name}
                          </p>
                          <p className="mt-0.5 text-[11px] text-gray-500 dark:text-[#9aa6bd]">
                            {discount.type === "percentage"
                              ? `${discount.rate}% off`
                              : `${money(discount.rate)} off`}
                            <span className="mx-1.5">·</span>
                            <span
                              className={
                                discount.isEnabled
                                  ? "text-emerald-600 dark:text-emerald-400"
                                  : "text-gray-400"
                              }
                            >
                              {discount.isEnabled ? "Active" : "Disabled"}
                            </span>
                          </p>
                        </div>
                      </div>

                      {!confirming && (
                        <button
                          type="button"
                          disabled={isRemoving}
                          onClick={() => setConfirmingId(discount._id)}
                          className="shrink-0 rounded-lg border border-red-200 px-3 py-1.5 text-[11px] font-semibold text-red-600 transition-colors hover:bg-red-50 disabled:opacity-50 dark:border-red-400/20 dark:text-red-300 dark:hover:bg-red-400/10"
                        >
                          Remove
                        </button>
                      )}
                    </div>

                    {confirming && (
                      <div className="mt-3 border-t border-gray-100 pt-3 dark:border-white/10">
                        <p className="text-[11px] text-gray-600 dark:text-[#cbd5e1]">
                          Remove <strong>{discount.name}</strong> from this
                          product?
                        </p>

                        <div className="mt-2.5 flex justify-end gap-2">
                          <button
                            type="button"
                            disabled={isRemoving}
                            onClick={() => setConfirmingId(null)}
                            className="rounded-lg px-3 py-1.5 text-[11px] font-semibold text-gray-500 hover:bg-gray-100 disabled:opacity-50 dark:text-[#a9b4c7] dark:hover:bg-white/10"
                          >
                            Cancel
                          </button>

                          <button
                            type="button"
                            disabled={isRemoving}
                            onClick={() => onRemove(discount._id)}
                            className="inline-flex items-center gap-1.5 rounded-lg bg-red-600 px-3 py-1.5 text-[11px] font-semibold text-white transition-colors hover:bg-red-700 disabled:opacity-50"
                          >
                            {isRemoving ? (
                              <>
                                <Loader2 size={12} className="animate-spin" />
                                Removing...
                              </>
                            ) : (
                              "Confirm removal"
                            )}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="flex justify-end border-t border-gray-100 px-5 py-4 dark:border-white/10">
          <button
            type="button"
            onClick={onClose}
            disabled={isRemoving}
            className="h-9 rounded-lg border border-gray-200 px-4 text-xs font-semibold text-gray-600 transition-colors hover:bg-gray-50 disabled:opacity-50 dark:border-white/10 dark:text-[#cbd5e1] dark:hover:bg-white/[0.06]"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}

export default function PricingSection({
  items,
  state,
  onDismiss,
  kind,
  periodId,
  promptVersion,
}: {
  items: PricingInsight[];
  state: AiSectionState<PricingInsight>;
  onDismiss: (id: string) => void;
  kind: PeriodKind;
  periodId: string;
  promptVersion: string;
}) {
  const windowText = useWindowPhrase(
    `your last ${PRICING_WEEKS} weeks of sales`,
  );

  const [isBodyExpanded, setIsBodyExpanded] = useState(true);

  const queryClient = useQueryClient();
  const dismissPricing = useDismissPricingSuggestion();
  const applyPricing = useApplyPricingSuggestion();

  const [selectedItem, setSelectedItem] = useState<PricingInsight | null>(null);

  const [priceDraft, setPriceDraft] = useState("");
  const [isUpdatingPrice, setIsUpdatingPrice] = useState(false);
  const { data: availableDiscounts = [], isLoading: isDiscountsLoading } =
    useDiscounts();

  const [selectedDiscountItem, setSelectedDiscountItem] =
    useState<PricingInsight | null>(null);

  const [assignedDiscounts, setAssignedDiscounts] = useState<Discount[]>([]);
  const [isLoadingAssignedDiscounts, setIsLoadingAssignedDiscounts] =
    useState(false);
  const [isRemovingDiscount, setIsRemovingDiscount] = useState(false);

  const handleOpenPriceModal = (item: PricingInsight) => {
    if (!item.facts.productId || item.suggestedPrice === null) return;

    setSelectedItem(item);
    setPriceDraft(String(item.suggestedPrice));
  };

  const handleDismiss = async (suggestionId: string) => {
    if (dismissPricing.isPending) return;

    try {
      await dismissPricing.mutateAsync({
        kind,
        id: periodId,
        promptVersion,
        suggestionId,
      });

      // Update the parent's local dismissed state only after persistence.
      onDismiss(suggestionId);
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to dismiss pricing suggestion.",
      );
    }
  };

  // const persistPricingAction = async ({
  //   item,
  //   actionType,
  //   previousValue,
  //   appliedValue,
  // }: {
  //   item: PricingInsight;
  //   actionType: "price-updated" | "discount-removed";
  //   previousValue?: number;
  //   appliedValue?: number;
  // }): Promise<boolean> => {
  //   const productId = item.facts.productId;

  //   if (!productId) return false;

  //   try {
  //     const url =
  //       `/api/period-insights/${encodeURIComponent(kind)}` +
  //       `/${encodeURIComponent(periodId)}` +
  //       `/pricing/${encodeURIComponent(promptVersion)}` +
  //       `/items/${encodeURIComponent(item.id)}/apply`;

  //     const response = await fetch(url, {
  //       method: "PATCH",
  //       headers: {
  //         "Content-Type": "application/json",
  //       },
  //       body: JSON.stringify({
  //         actionType,
  //         productId,
  //         ...(item.facts.variantId ? { variantId: item.facts.variantId } : {}),
  //         ...(previousValue !== undefined ? { previousValue } : {}),
  //         ...(appliedValue !== undefined ? { appliedValue } : {}),
  //       }),
  //     });

  //     if (!response.ok) {
  //       const result = await response.json().catch(() => ({}));

  //       console.error("[pricing-insights] Failed to persist action:", result);

  //       return false;
  //     }

  //     return true;
  //   } catch (error) {
  //     console.error("[pricing-insights] Failed to persist action:", error);

  //     return false;
  //   }
  // };
  const persistPricingAction = async ({
    item,
    actionType,
    previousValue,
    appliedValue,
  }: {
    item: PricingInsight;
    actionType: "price-updated" | "discount-removed";
    previousValue?: number;
    appliedValue?: number;
  }): Promise<boolean> => {
    const productId = item.facts.productId;

    if (!productId) return false;

    try {
      await applyPricing.mutateAsync({
        kind,
        id: periodId,
        promptVersion,
        suggestionId: item.id,
        actionType,
        productId,
        ...(item.facts.variantId ? { variantId: item.facts.variantId } : {}),
        ...(previousValue !== undefined ? { previousValue } : {}),
        ...(appliedValue !== undefined ? { appliedValue } : {}),
      });

      return true;
    } catch (error) {
      console.error("[pricing-insights] Failed to persist action:", error);

      return false;
    }
  };

  const handleClosePriceModal = () => {
    if (isUpdatingPrice) return;

    setSelectedItem(null);
    setPriceDraft("");
  };

  const handleUpdatePrice = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!selectedItem || isUpdatingPrice) return;

    const productId = selectedItem.facts.productId;
    const newPrice = Number(priceDraft);
    const currentPrice = selectedItem.facts.price;

    if (!productId) {
      toast.error("Product could not be identified.");
      return;
    }

    if (!priceDraft.trim() || !Number.isFinite(newPrice) || newPrice <= 0) {
      toast.error("Please enter a valid selling price.");
      return;
    }

    if (Math.abs(newPrice - currentPrice) < 0.000001) {
      toast.error("The new price is the same as the current price.");
      return;
    }

    setIsUpdatingPrice(true);

    try {
      if (selectedItem.facts.variantId) {
        const variantId = selectedItem.facts.variantId;

        // Always fetch the latest complete variant configuration.
        const config = await fetchProductVariant(productId);

        const targetExists = config.variantItems.some(
          (item) => item._id === variantId,
        );

        if (!targetExists) {
          throw new Error(
            "This variant no longer exists. Refresh the pricing insights and try again.",
          );
        }

        // Change only the selected variant's price.
        const updatedVariantItems = config.variantItems.map((item) =>
          item._id === variantId ? { ...item, price: newPrice } : item,
        );

        await updateProductVariant(productId, {
          options: config.options,
          variantItems: updatedVariantItems,
        });
      } else {
        // Keep the existing regular product update behavior.
        await updateProduct(productId, {
          price: newPrice,
        });
      }

      const statusSaved = await persistPricingAction({
        item: selectedItem,
        actionType: "price-updated",
        previousValue: currentPrice,
        appliedValue: newPrice,
      });

      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: productKeys.lists(),
        }),
        queryClient.invalidateQueries({
          queryKey: productKeys.detail(productId),
        }),
        queryClient.invalidateQueries({
          queryKey: ["products-list"],
        }),
      ]);

      toast.success(`${selectedItem.facts.name} price updated successfully.`);

      if (!statusSaved) {
        toast.error(
          "Price updated, but the insight status could not be saved.",
        );
      }

      setSelectedItem(null);
      setPriceDraft("");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to update price.",
      );
    } finally {
      setIsUpdatingPrice(false);
    }
  };

  const handleOpenDiscountModal = async (item: PricingInsight) => {
    const productId = item.facts.productId;

    if (!productId) {
      toast.error("Product could not be identified.");
      return;
    }

    setSelectedDiscountItem(item);
    setAssignedDiscounts([]);
    setIsLoadingAssignedDiscounts(true);

    try {
      // Fetch the latest product assignments.
      const products = await fetchProductsListClient();

      const product = products.find((p) => p.id === productId);

      if (!product) {
        throw new Error("Could not find this product.");
      }

      const assignedIds = product.discounts ?? [];

      const matchedDiscounts = availableDiscounts.filter((discount) =>
        assignedIds.includes(discount._id),
      );

      setAssignedDiscounts(matchedDiscounts);

      if (matchedDiscounts.length === 0) {
        toast("No assigned discounts were found for this product.");
      }
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to load product discounts.",
      );
      setSelectedDiscountItem(null);
    } finally {
      setIsLoadingAssignedDiscounts(false);
    }
  };

  const handleCloseDiscountModal = () => {
    if (isRemovingDiscount || isLoadingAssignedDiscounts) return;

    setSelectedDiscountItem(null);
    setAssignedDiscounts([]);
  };

  const handleRemoveDiscount = async (discountId: string) => {
    if (!selectedDiscountItem || isRemovingDiscount) return;

    const productId = selectedDiscountItem.facts.productId;

    if (!productId) {
      toast.error("Product could not be identified.");
      return;
    }

    const discount = assignedDiscounts.find((item) => item._id === discountId);

    setIsRemovingDiscount(true);

    try {
      await removeProductDiscounts(productId, [discountId]);

      const statusSaved = await persistPricingAction({
        item: selectedDiscountItem,
        actionType: "discount-removed",
      });

      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: productKeys.lists(),
        }),
        queryClient.invalidateQueries({
          queryKey: productKeys.detail(productId),
        }),
        queryClient.invalidateQueries({
          queryKey: ["products-list"],
        }),
      ]);

      setAssignedDiscounts((previous) =>
        previous.filter((item) => item._id !== discountId),
      );

      toast.success(
        `${discount?.name ?? "Discount"} removed from ${selectedDiscountItem.facts.name}.`,
      );

      if (!statusSaved) {
        toast.error(
          "Discount removed, but the insight status could not be saved.",
        );
      }
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to remove product discount.",
      );
    } finally {
      setIsRemovingDiscount(false);
    }
  };

  return (
    <section>
      <SectionHeader
        icon={Tags}
        iconClassName="bg-emerald-50 text-emerald-600 dark:text-emerald-300 dark:bg-emerald-400/10"
        title="Pricing Opportunities"
        subtitle={`Price changes, discounts and margins from ${windowText}`}
        info={{
          heading: "How to read these",
          body: `Each card compares what an item earns now against what it earned over ${windowText}. The suggested price is an estimate from your own sales, not a promise — nothing changes until you set it yourself.`,
        }}
        actions={
          <div className="flex w-full flex-row items-end justify-end md:w-fit">
            <button
              type="button"
              onClick={() => setIsBodyExpanded((prev) => !prev)}
              aria-expanded={isBodyExpanded}
              aria-label={
                isBodyExpanded ? "Collapse section" : "Expand section"
              }
              title={isBodyExpanded ? "Collapse section" : "Expand section"}
              className="inline-flex shrink-0 items-center justify-center rounded-lg border border-[#e2e6ed] bg-white p-2 text-[#737b89] transition-all duration-200 hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-600 dark:border-[#293750] dark:bg-[#182338] dark:text-[#aab4c4] dark:hover:border-emerald-400/40 dark:hover:bg-emerald-400/10 dark:hover:text-emerald-300"
            >
              {isBodyExpanded ? (
                <ChevronUp size={15} />
              ) : (
                <ChevronDown size={15} />
              )}
            </button>
          </div>
        }
      />

      <div
        className={`grid transition-[grid-template-rows,opacity] duration-300 ease-in-out ${
          isBodyExpanded
            ? "grid-rows-[1fr] opacity-100"
            : "grid-rows-[0fr] opacity-0"
        }`}
      >
        <div className="min-h-0 overflow-hidden">
          <AiSectionBody
            state={state}
            visibleCount={items.length}
            layout="cards"
            noSalesMessage={`No sales in ${windowText} to judge prices from.`}
            nothingFlaggedMessage="Your prices, discounts and margins look healthy. Nothing to change right now."
            emptyMessage="No price changes suggested right now."
          >
            <CardGrid>
              {items.map((item) => (
                <PricingCard
                  key={item.id}
                  item={item}
                  onDismiss={(id) => void handleDismiss(id)}
                  onApplyPrice={handleOpenPriceModal}
                  isUpdatingPrice={isUpdatingPrice}
                  onManageDiscounts={handleOpenDiscountModal}
                  isLoadingDiscounts={isDiscountsLoading}
                />
              ))}
            </CardGrid>
          </AiSectionBody>
        </div>
      </div>

      {selectedItem && (
        <UpdateSellingPriceModal
          item={selectedItem}
          value={priceDraft}
          isSaving={isUpdatingPrice}
          onChange={setPriceDraft}
          onClose={handleClosePriceModal}
          onSubmit={handleUpdatePrice}
        />
      )}

      {selectedDiscountItem && (
        <ManageDiscountModal
          item={selectedDiscountItem}
          discounts={assignedDiscounts}
          isLoading={isLoadingAssignedDiscounts}
          isRemoving={isRemovingDiscount}
          onClose={handleCloseDiscountModal}
          onRemove={handleRemoveDiscount}
        />
      )}
    </section>
  );
}
