"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
  ResponsiveContainer,
} from "recharts";
import { ChartColumnDecreasing, Info, Lock } from "lucide-react";

import { useCurrency } from "@/providers/CurrencyContext";
import { formatCurrencySymbol, formatCompactCurrency } from "@/utils/helper";
import RangeBadge from "@/components/ui/RangeBadge";
import ExpenseBadge from "@/components/ui/ExpenseBadge";
import type {
  ProfitWaterfall,
  WaterfallStep,
} from "@/services/dashboardServices/apiProfitCost";
import {
  AXIS_TICK,
  BAR_RADIUS,
  CHART_PALETTE,
  ChartCard,
  ChartLegend,
  niceTicks,
  yAxisTitle,
} from "../chartCard";

const BAR_COLORS: Record<WaterfallStep["type"], string> = {
  start: CHART_PALETTE.darkBlue,
  // deduct: "#ea4335",
  deduct: "#F43F5E",
  // Inert, so it is drawn as an absence rather than a cost.
  locked: CHART_PALETTE.grid,
  result: "#34a853",
};

/**
 * An X-axis label over up to two lines. Step names like "Revenue + Misc
 * income" are wider than their column and ran into the next one; split at the
 * space nearest the middle, they fit under their own bar.
 */
function WrappedTick({
  x = 0,
  y = 0,
  payload,
}: {
  x?: number;
  y?: number;
  payload?: { value: string };
}) {
  const text = String(payload?.value ?? "");
  let lines = [text];
  if (text.length > 14) {
    const spaces = [...text.matchAll(/ /g)].map((m) => m.index ?? 0);
    if (spaces.length > 0) {
      const middle = text.length / 2;
      const at = spaces.reduce((best, i) =>
        Math.abs(i - middle) < Math.abs(best - middle) ? i : best,
      );
      lines = [text.slice(0, at), text.slice(at + 1)];
    }
  }
  return (
    <text
      x={x}
      y={y + 14}
      textAnchor="middle"
      fill={AXIS_TICK.fill}
      fontSize={11}
    >
      {lines.map((line, i) => (
        <tspan key={i} x={x} dy={i === 0 ? 0 : 13}>
          {line}
        </tspan>
      ))}
    </text>
  );
}

function StepTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: { payload: WaterfallStep }[];
  label?: string;
}) {
  const { currency } = useCurrency();

  if (!active || !payload?.length) return null;
  const step = payload[0].payload;

  const money = (v: number) =>
    formatCurrencySymbol(v, currency.symbol, currency.locale);

  const row = "flex flex-row justify-between gap-4";

  return (
    <div
      className="min-w-44 rounded-lg border bg-white px-3 py-2.5 text-xs shadow-sm"
      style={{ borderColor: CHART_PALETTE.control, color: CHART_PALETTE.axis }}
    >
      <p className="mb-1.5" style={{ color: CHART_PALETTE.title }}>
        {label}
      </p>

      {step.type === "locked" ? (
        <p className="max-w-52 leading-relaxed">
          No staff pay was recorded this period, so this step takes nothing.
          Record payroll as an expense and it will appear here.
        </p>
      ) : step.deduction > 0 ? (
        <>
          <p className={row}>
            Before
            <span
              className="tabular-nums"
              style={{ color: CHART_PALETTE.title }}
            >
              {money(step.value + step.deduction)}
            </span>
          </p>
          <p className={row} style={{ color: CHART_PALETTE.bad }}>
            Deduction
            <span className="font-medium tabular-nums">
              −{money(step.deduction)}
            </span>
          </p>
          <p
            className={`${row} mt-1 border-t pt-1`}
            style={{ borderColor: CHART_PALETTE.grid }}
          >
            After
            <span
              className="font-medium tabular-nums"
              style={{ color: CHART_PALETTE.title }}
            >
              {money(step.value)}
            </span>
          </p>
        </>
      ) : (
        <p className={row}>
          Running total
          <span
            className="font-medium tabular-nums"
            style={{ color: CHART_PALETTE.title }}
          >
            {money(step.value)}
          </span>
        </p>
      )}
    </div>
  );
}

export default function ProfitWaterfallBridge({
  data,
}: {
  data: ProfitWaterfall;
}) {
  const { currency } = useCurrency();
  const { steps, missing } = data;

  const money = (v: number) =>
    formatCurrencySymbol(v, currency.symbol, currency.locale);

  const revenue = steps[0]?.value ?? 0;
  const net = steps[steps.length - 1]?.value ?? 0;
  const hasData = steps.length > 0 && revenue > 0;

  const longestLabel = Math.max(...steps.map((s) => s.label.length), 0);
  const chartWidth = steps.length * Math.max(86, longestLabel * 4);

  // Round-number steps; below zero when the costs outran what came in.
  const values = steps.map((s) => s.value);
  const ticks = niceTicks(
    values.length > 0 ? Math.min(...values) : 0,
    values.length > 0 ? Math.max(...values) : 0,
  );
  const locked = steps.some((s) => s.type === "locked");

  return (
    <ChartCard
      icon={ChartColumnDecreasing}
      // Teal, as before: Tailwind's teal-600 / teal-200 / teal-50.
      iconColor="#0d9488"
      iconBorder="#99f6e4"
      iconBg="#f0fdfa"
      title="Profit Waterfall Bridge"
      info={{
        heading: "Reading this chart",
        // From getProfitWaterfall: revenue (+ side income), then cost of
        // goods, tax, labor, then expense purposes largest first.
        body: "It starts from what came in during the date range at the top of the page — sales, plus any side income you recorded — then takes out the cost of goods, tax, staff pay and your recorded expenses, largest first with the smallest grouped together. Each bar is what is left after that step; the last is net profit.",
      }}
      subtitle="Where each rupee of revenue goes, from gross to net"
      controls={
        <>
          <RangeBadge variant="pill" />
          <ExpenseBadge variant="pill" />
        </>
      }
    >
      {!hasData ? (
        <p
          className="rounded-xl border border-dashed px-4 py-14 text-center text-xs"
          style={{
            borderColor: CHART_PALETTE.control,
            color: CHART_PALETTE.subtitle,
          }}
        >
          No revenue in this period, so there is nothing to break down yet.
        </p>
      ) : (
        <>
          <div className="overflow-x-auto scrollbar-hide [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <div style={{ minWidth: chartWidth }}>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart
                  data={steps}
                  margin={{ top: 8, right: 8, left: 8, bottom: 0 }}
                  barCategoryGap="10%"
                >
                  <CartesianGrid vertical={false} stroke={CHART_PALETTE.grid} />
                  <XAxis
                    dataKey="label"
                    axisLine={false}
                    tickLine={{ stroke: CHART_PALETTE.control }}
                    tickSize={6}
                    tick={<WrappedTick />}
                    height={40}
                    interval={0}
                  />
                  <YAxis
                    tickFormatter={(v) =>
                      formatCompactCurrency(v, currency.symbol, currency.locale)
                    }
                    axisLine={false}
                    tickLine={false}
                    tick={AXIS_TICK}
                    ticks={ticks}
                    domain={[ticks[0], ticks[ticks.length - 1]]}
                    width={72}
                    label={yAxisTitle("Left after step")}
                  />
                  <Tooltip
                    content={<StepTooltip />}
                    cursor={{ fill: "rgba(60,64,67,0.04)" }}
                  />
                  <Bar dataKey="value" radius={BAR_RADIUS}>
                    {steps.map((step) => (
                      <Cell key={step.label} fill={BAR_COLORS[step.type]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <ChartLegend
            items={[
              { label: "Came in", color: BAR_COLORS.start, shape: "dot" },
              {
                label: "After a cost",
                color: BAR_COLORS.deduct,
                shape: "square",
              },
              ...(locked
                ? [
                    {
                      label: "Not recorded",
                      color: BAR_COLORS.locked,
                      shape: "square" as const,
                    },
                  ]
                : []),
              {
                label: "Net profit",
                color: BAR_COLORS.result,
                shape: "square",
              },
            ]}
          />

          {/* From → to: where the money started and where it ended up. */}
          <div
            className="mt-3 flex flex-wrap items-center justify-between gap-3 border-t pt-3 text-xs tracking-wide"
            style={{
              borderColor: CHART_PALETTE.grid,
              color: CHART_PALETTE.axis,
            }}
          >
            <span>
              From{" "}
              <span
                className="font-medium tabular-nums"
                style={{ color: CHART_PALETTE.title }}
              >
                {money(revenue)}
              </span>{" "}
              <span style={{ color: CHART_PALETTE.subtitle }}>
                {(steps[0]?.label ?? "revenue").toLowerCase()}
              </span>
            </span>

            <span>
              to{" "}
              <span
                className="font-medium tabular-nums"
                style={{
                  color: net >= 0 ? CHART_PALETTE.good : CHART_PALETTE.bad,
                }}
              >
                {money(net)}
              </span>{" "}
              <span style={{ color: CHART_PALETTE.subtitle }}>net profit</span>
            </span>

            {/* Only while the labor step is inert. Once payroll is recorded
                the step deducts like any other and needs no caveat. */}
            {locked && (
              <span
                className="flex items-center gap-1.5"
                style={{ color: CHART_PALETTE.subtitle }}
              >
                <Lock size={11} />
                No staff pay recorded
              </span>
            )}
          </div>

          {missing.length > 0 && (
            <p className="mt-3 flex items-start gap-1.5 rounded-lg bg-amber-50 px-3 py-2.5 text-[11px] leading-relaxed text-amber-800">
              <Info className="mt-px h-3.5 w-3.5 shrink-0" />
              <span>
                Some figures could not be loaded ({missing.join(", ")}), so
                these steps cover only part of the picture.
              </span>
            </p>
          )}
        </>
      )}
    </ChartCard>
  );
}
