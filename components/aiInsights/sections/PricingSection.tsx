"use client";

import type { ReactNode } from "react";
import {
  ArrowDownRight,
  ArrowUpRight,
  BadgePercent,
  Hourglass,
  Scale,
  Tags,
  TriangleAlert,
  type LucideIcon,
} from "lucide-react";

import type { AiSectionState } from "@/hooks/useAiSection";
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
  SectionHeader,
  SectionRefreshButton,
  useMoney,
  type AccentName,
  type Metric,
} from "../parts";

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
  "low-margin": { label: "Thin margin", icon: TriangleAlert, accent: "amber" },
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
  const lossClass = (v: number) => (v < 0 ? "text-red-600" : undefined);

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
          delta: { pct: pctChange(f.unitsPerWeekAfter, f.unitsPerWeekBefore) },
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
            f.profitPerUnit < 0 ? "text-red-600" : "text-amber-700",
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

/** One suggested figure in the recommendation: today's struck through, the new one large. */
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
      <span className="text-[11px] font-medium text-gray-500">{label}</span>
      <span className="flex items-baseline gap-2">
        {was && (
          <span className="text-[11px] tabular-nums text-gray-400 line-through">
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

function PricingCard({
  item,
  onDismiss,
}: {
  item: PricingInsight;
  onDismiss: (id: string) => void;
}) {
  const money = useMoney();
  const f = item.facts;
  const kind = KIND[f.kind];
  const metrics = useMetrics(item);
  const price = item.suggestedPrice;
  const discount = item.suggestedDiscount;
  const up = price !== null && price > f.price;
  const hasSuggestion = price !== null || discount !== null;

  return (
    <InsightCard
      accent={kind.accent}
      // The item's emoji, as the AI chose it (kept in the day's cache with
      // its answer), on a tile tinted by the kind of finding.
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
      onDismiss={() => onDismiss(item.id)}
      dismissLabel={f.name}
      metrics={metrics}
      // Prices and discounts are edited on the products page; the card takes
      // the owner there rather than changing a price itself.
      footer={
        <CardAction href="/records/products" primary={hasSuggestion}>
          {price !== null
            ? "Apply new price"
            : discount !== null
              ? "Update discount"
              : "View in products"}
        </CardAction>
      }
    >
      <p className="text-[13px] leading-relaxed text-gray-600">
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
                    className={up ? "text-emerald-700" : "text-blue-700"}
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
                    className="text-blue-700"
                  >
                    {discount === 0 ? "None" : `${money(discount)} off`}
                  </SuggestedRow>
                )}
                {item.breakEvenUnitsPct !== null && (
                  <p className="flex items-start gap-1.5 text-[11px] leading-relaxed text-gray-500">
                    <Scale size={12} className="mt-0.5 shrink-0" aria-hidden />
                    {breakEvenText(item.breakEvenUnitsPct)}.
                  </p>
                )}
              </>
            ) : undefined
          }
        >
          {item.advice}
        </Recommendation>
      </div>
    </InsightCard>
  );
}

export default function PricingSection({
  items,
  state,
  onDismiss,
}: {
  /** The cards still on the page, after dismissals. */
  items: PricingInsight[];
  state: AiSectionState<PricingInsight>;
  onDismiss: (id: string) => void;
}) {
  return (
    <section>
      <SectionHeader
        icon={BadgePercent}
        iconClassName="bg-emerald-50 text-emerald-600"
        title="Pricing Opportunities"
        subtitle={`Price changes, discounts and margins from your last ${PRICING_WEEKS} weeks of sales`}
        actions={
          <div className="flex flex-row w-full md:w-fit items-end justify-end absolute md:relative top-2">
            <SectionRefreshButton
              state={state}
              textClassName="text-emerald-700"
            />
          </div>
        }
      />

      <AiSectionBody
        state={state}
        visibleCount={items.length}
        layout="cards"
        noSalesMessage={`No sales in the last ${PRICING_WEEKS} weeks to judge prices from yet.`}
        nothingFlaggedMessage="Your prices, discounts and margins look healthy. Nothing to change right now."
        emptyMessage="No price changes suggested right now."
      >
        <CardGrid>
          {items.map((item) => (
            <PricingCard key={item.id} item={item} onDismiss={onDismiss} />
          ))}
        </CardGrid>
      </AiSectionBody>
    </section>
  );
}
