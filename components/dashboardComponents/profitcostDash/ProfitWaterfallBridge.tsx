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
import { ComponentHeader } from "@/components/ComponentHeader";
import RangeBadge from "@/components/ui/RangeBadge";
import ExpenseBadge from "@/components/ui/ExpenseBadge";
import type {
  ProfitWaterfall,
  WaterfallStep,
} from "@/services/dashboardServices/apiProfitCost";

const BAR_COLORS: Record<WaterfallStep["type"], string> = {
  start: "#64748b",
  deduct: "#f43f5e",
  // Inert, so it is drawn as an absence rather than a cost.
  locked: "#e2e8f0",
  result: "#22c55e",
};

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

  return (
    <div className="rounded-xl border border-gray-100 bg-white px-3 py-2.5 text-xs shadow-lg">
      <p className="mb-1 font-semibold text-gray-700">{label}</p>

      {step.type === "locked" ? (
        <p className="max-w-52 leading-relaxed text-gray-500">
          Staff pay isn&apos;t recorded yet, so labour can&apos;t be shown as
          its own step. Payroll entered as an expense appears under its own
          category.
        </p>
      ) : step.deduction > 0 ? (
        <>
          <p className="flex flex-row justify-between gap-4 text-gray-500">
            Before
            <span className="tabular-nums text-gray-700">
              {money(step.value + step.deduction)}
            </span>
          </p>
          <p className="flex flex-row justify-between gap-4 text-red-500">
            Deduction
            <span className="font-bold tabular-nums">
              −{money(step.deduction)}
            </span>
          </p>
          <p className="mt-1 flex flex-row justify-between gap-4 border-t border-gray-100 pt-1 text-gray-500">
            After
            <span className="font-bold tabular-nums text-gray-800">
              {money(step.value)}
            </span>
          </p>
        </>
      ) : (
        <p className="flex flex-row justify-between gap-4 text-gray-500">
          Running total
          <span className="font-bold tabular-nums text-gray-800">
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

  return (
    <div className="w-full rounded-2xl border border-gray-200 bg-white p-5">
      <div className="mb-6 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-teal-50">
            <ChartColumnDecreasing size={15} className="text-teal-600" />
          </div>
          <ComponentHeader
            title="Profit Waterfall Bridge"
            subHeader="Where each rupee of revenue goes, from gross to net"
          />
        </div>

        <div className="flex items-center gap-2">
          <RangeBadge />
          <ExpenseBadge className="ml-0" />
        </div>
      </div>

      {!hasData ? (
        <p className="rounded-xl border border-dashed border-gray-200 bg-gray-50 px-4 py-14 text-center text-[12px] text-gray-400">
          No revenue in this period, so there is nothing to break down yet.
        </p>
      ) : (
        <>
          <div className="overflow-x-auto scrollbar-hide [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <div style={{ minWidth: chartWidth }}>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart
                  data={steps}
                  margin={{ top: 10, right: 10, left: 10, bottom: 10 }}
                  barCategoryGap="10%"
                >
                  <CartesianGrid vertical={false} stroke="#f3f4f6" />
                  <XAxis
                    dataKey="label"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "#9ca3af", fontSize: 10 }}
                    interval={0}
                    dy={8}
                  />
                  <YAxis
                    tickFormatter={(v) =>
                      formatCompactCurrency(v, currency.symbol, currency.locale)
                    }
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "#9ca3af", fontSize: 11 }}
                    width={65}
                  />
                  <Tooltip
                    content={<StepTooltip />}
                    cursor={{ fill: "rgba(0,0,0,0.03)" }}
                  />
                  <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                    {steps.map((step) => (
                      <Cell key={step.label} fill={BAR_COLORS[step.type]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="mt-2 flex flex-wrap items-center justify-between tracking-wide gap-3 border-t border-gray-100 pt-3 text-[12px]">
            <span className="text-gray-500">
              From:{"  "}
              <span className="font-semibold tracking-wide tabular-nums text-gray-800">
                {money(revenue)}
              </span>{" "}
              [{(steps[0]?.label ?? "revenue").toLowerCase()}]
            </span>

            <span className="text-gray-500">
              To:{" "}
              <span
                className={`font-semibold tracking-wide tabular-nums ${
                  net >= 0 ? "text-green-600" : "text-red-600"
                }`}
              >
                {money(net)}
              </span>{" "}
              [net profit]
            </span>

            <span className="flex items-center gap-1.5 text-gray-400">
              <Lock size={11} />
              Labour not yet tracked
            </span>
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
    </div>
  );
}
