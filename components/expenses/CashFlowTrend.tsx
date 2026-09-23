"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import type {
  NameType,
  Payload,
  ValueType,
} from "recharts/types/component/DefaultTooltipContent";
import { useCurrency } from "@/providers/CurrencyContext";
import { formatCurrencySymbol, formatCompactCurrency } from "@/utils/helper";
import {
  AXIS_TICK,
  CHART_PALETTE,
  ChartCard,
  ChartLegend,
  ChartTooltipBox,
  yAxisTitle,
} from "../dashboardComponents/chartCard";
import { ArrowLeftRight, AlertTriangle } from "lucide-react";
import { useCashFlowTrend } from "@/hooks/useCashFlowTrend";
import { CashFlowTrendSkeleton } from "./ExpenseAnalyticsSkeletons";

const INFLOW_COLOR = "#22c55e";
const OUTFLOW_COLOR = "#ef4444";

/** Coerce a recharts payload value (number | string | array) to a number. */
const toNumber = (v: ValueType | undefined): number =>
  typeof v === "number" ? v : Number(v) || 0;

const CustomTooltip = ({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Payload<ValueType, NameType>[];
  label?: string | number;
}) => {
  const { currency } = useCurrency();

  const fmtK = (v: number) => {
    return `${formatCurrencySymbol(v, currency.symbol, currency.locale)}`;
  };

  if (!active || !payload?.length) return null;
  const inflow = payload.find((p) => p.dataKey === "inflow");
  const outflow = payload.find((p) => p.dataKey === "outflow");
  const net = toNumber(inflow?.value) - toNumber(outflow?.value);

  return (
    <ChartTooltipBox
      label={label}
      rows={payload.map((entry) => ({
        name: String(entry.name ?? ""),
        color: entry.color ?? CHART_PALETTE.blue,
        value: fmtK(toNumber(entry.value)),
      }))}
      footer={
        <div className="flex items-center justify-between gap-4">
          <span className="text-xs" style={{ color: CHART_PALETTE.axis }}>
            Net
          </span>
          <span
            className="text-xs font-medium"
            style={{
              color: net >= 0 ? CHART_PALETTE.good : CHART_PALETTE.bad,
            }}
          >
            {net >= 0 ? "+" : ""}
            {fmtK(net)}
          </span>
        </div>
      }
    />
  );
};

export default function CashFlowTrend() {
  const { currency } = useCurrency();

  // Fixed six-month window — deliberately not the page's month/year filter.
  // See useCashFlowTrend for why.
  const { data, isLoading, isError, failedMonths } = useCashFlowTrend();

  const hasData = data.some((d) => d.inflow > 0 || d.outflow > 0);

  const fmtK = (v: number) => {
    return formatCompactCurrency(v, currency.symbol, currency.locale);
  };

  if (isLoading)
    return (
      <>
        <CashFlowTrendSkeleton />
      </>
    );

  return (
    <ChartCard
      icon={ArrowLeftRight}
      // Emerald, as before: Tailwind's emerald-600 / emerald-200 / emerald-50.
      iconColor="#059669"
      iconBorder="#a7f3d0"
      iconBg="#ecfdf5"
      title="Cash Flow Trend"
      info={{
        heading: "Reading this chart",
        // From useCashFlowTrend: income is inflow, everything else outflow.
        body: "Six months to date, always — it ignores the month picked at the top of the page. Inflow is everything you logged as income that month; outflow is every other entry, so expenses. The hover box shows the two and what they leave behind.",
      }}
      subtitle="Monthly comparison of cash inflows vs outflows"
      controls={
        // States plainly that this card ignores the page's month filter —
        // otherwise the fixed window looks like the filter is broken.
        <span
          className="shrink-0 rounded-full border bg-white px-2 py-0.5 text-[11px]"
          style={{
            borderColor: CHART_PALETTE.control,
            color: CHART_PALETTE.title,
          }}
        >
          Last 6 months
        </span>
      }
    >
      {failedMonths > 0 && !isError && (
        <p
          className="mb-3 flex items-center gap-1.5 text-[11px]"
          style={{ color: CHART_PALETTE.warn }}
        >
          <AlertTriangle size={12} className="shrink-0" />
          {failedMonths} of 6 months could not be loaded — the chart is
          incomplete.
        </p>
      )}
      {isError ? (
        <div className="py-16 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-red-50">
            <AlertTriangle size={22} className="text-red-400" />
          </div>
          <p className="text-sm" style={{ color: CHART_PALETTE.title }}>
            Could not load cash flow
          </p>
          <p className="mt-1 text-xs" style={{ color: CHART_PALETTE.subtitle }}>
            None of the last six months could be fetched.
          </p>
        </div>
      ) : !hasData ? (
        <div className="py-16 text-center">
          <div
            className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full"
            style={{ backgroundColor: CHART_PALETTE.hover }}
          >
            <ArrowLeftRight
              size={22}
              style={{ color: CHART_PALETTE.subtitle }}
            />
          </div>
          <p className="text-sm" style={{ color: CHART_PALETTE.title }}>
            No income or expenses recorded
          </p>
          <p className="mt-1 text-xs" style={{ color: CHART_PALETTE.subtitle }}>
            Nothing was logged in the last six months.
          </p>
        </div>
      ) : (
        <>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart
              data={data}
              margin={{ top: 10, right: 10, left: 10, bottom: 10 }}
            >
              <CartesianGrid vertical={false} stroke={CHART_PALETTE.grid} />
              <XAxis
                dataKey="month"
                axisLine={false}
                tickLine={false}
                tick={AXIS_TICK}
                dy={8}
              />
              <YAxis
                tickFormatter={fmtK}
                axisLine={false}
                tickLine={false}
                tick={AXIS_TICK}
                width={80}
                label={yAxisTitle("Amount")}
              />
              <Tooltip content={<CustomTooltip />} />

              <Line
                type="monotone"
                dataKey="inflow"
                name="Cash Inflow"
                stroke={INFLOW_COLOR}
                strokeWidth={2.5}
                dot={{
                  r: 4,
                  fill: "white",
                  stroke: INFLOW_COLOR,
                  strokeWidth: 2,
                }}
                activeDot={{ r: 5 }}
              />
              <Line
                type="monotone"
                dataKey="outflow"
                name="Cash Outflow"
                stroke={OUTFLOW_COLOR}
                strokeWidth={2.5}
                dot={{
                  r: 4,
                  fill: "white",
                  stroke: OUTFLOW_COLOR,
                  strokeWidth: 2,
                }}
                activeDot={{ r: 5 }}
              />
            </LineChart>
          </ResponsiveContainer>

          <ChartLegend
            items={[
              { label: "Cash Inflow", color: INFLOW_COLOR, shape: "line" },
              { label: "Cash Outflow", color: OUTFLOW_COLOR, shape: "line" },
            ]}
          />
        </>
      )}
    </ChartCard>
  );
}
