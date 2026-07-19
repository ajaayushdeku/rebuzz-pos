"use client";

import { useMemo } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import type {
  NameType,
  Payload,
  ValueType,
} from "recharts/types/component/DefaultTooltipContent";
import { useTracker } from "@/providers/ExpenseContext";
import { useCurrency } from "@/providers/CurrencyContext";
import { formatCompactNumber, formatCurrencySymbol } from "@/utils/helper";
import { ComponentHeader } from "../ComponentHeader";

/** Coerce a recharts payload value (number | string | array) to a number. */
const toNumber = (v: ValueType | undefined): number =>
  typeof v === "number" ? v : Number(v) || 0;

const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

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
    <div className="bg-white border border-gray-100 rounded-xl px-4 py-3 shadow-lg text-xs min-w-40">
      <p className="font-semibold text-gray-700 mb-2">{label}</p>
      {payload.map((entry, i) => (
        <div key={i} className="flex items-center justify-between gap-5 mb-0.5">
          <div className="flex items-center gap-1.5">
            <span
              className="w-2 h-2 rounded-full shrink-0"
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-gray-500">{String(entry.name)}</span>
          </div>
          <span className="font-bold text-gray-800">
            {fmtK(toNumber(entry.value))}
          </span>
        </div>
      ))}
      <div className="border-t border-gray-100 pt-1.5 mt-1.5 flex justify-between">
        <span className="text-gray-400">Net</span>
        <span
          className={`font-bold ${net >= 0 ? "text-green-600" : "text-red-500"}`}
        >
          {net >= 0 ? "+" : ""}
          {fmtK(net)}
        </span>
      </div>
    </div>
  );
};

const CustomLegend = () => (
  <div className="flex items-center justify-center gap-6 mt-3">
    {[
      { label: "Cash Inflow", color: "#22c55e" },
      { label: "Cash Outflow", color: "#ef4444" },
    ].map(({ label, color }) => (
      <div key={label} className="flex items-center gap-1.5">
        <svg width="18" height="8">
          <line x1="0" y1="4" x2="18" y2="4" stroke={color} strokeWidth="2.5" />
          <circle
            cx="9"
            cy="4"
            r="2.5"
            fill="white"
            stroke={color}
            strokeWidth="1.5"
          />
        </svg>
        <span className="text-xs font-semibold" style={{ color }}>
          {label}
        </span>
      </div>
    ))}
  </div>
);

export default function CashFlowTrend() {
  const { currency } = useCurrency();
  const { transactions } = useTracker();

  // Inflow = income, outflow = expenses — aggregated over the last 6 months.
  const data = useMemo(() => {
    const now = new Date();
    const rows: { month: string; inflow: number; outflow: number }[] = [];
    const byKey = new Map<string, (typeof rows)[number]>();

    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      const row = { month: MONTHS[d.getMonth()], inflow: 0, outflow: 0 };
      byKey.set(key, row);
      rows.push(row);
    }

    for (const t of transactions) {
      const row = byKey.get(t.date.slice(0, 7));
      if (!row) continue;
      if (t.type === "income") row.inflow += t.amount;
      else row.outflow += t.amount;
    }

    return rows;
  }, [transactions]);

  const hasData = data.some((d) => d.inflow > 0 || d.outflow > 0);

  const fmtK = (v: number) => {
    return `${currency.symbol} ${formatCompactNumber(v)}`;
  };

  return (
    <div className="relative bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex flex-col gap-4">
      {/* <div>
        <h2 className="text-sm font-bold text-gray-900">Cash Flow Trend</h2>
        <p className="text-xs text-gray-400 mt-0.5">
          Monthly comparison of{" "}
          <span className="text-green-500 font-semibold">cash inflows</span> vs{" "}
          <span className="text-red-500 font-semibold">outflows</span>
        </p>
      </div> */}

      <ComponentHeader
        title="Cash Flow Trend"
        subHeader="Monthly comparison of cash inflows vs outflows"
      />
      {!hasData ? (
        <div className="py-16 text-center text-sm text-gray-400">
          No income or expenses recorded yet.
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={280}>
          <LineChart
            data={data}
            margin={{ top: 10, right: 10, left: 10, bottom: 10 }}
          >
            <CartesianGrid vertical={false} stroke="#f3f4f6" />
            <XAxis
              dataKey="month"
              axisLine={false}
              tickLine={false}
              tick={{ fill: "#9ca3af", fontSize: 11 }}
              dy={8}
            />
            <YAxis
              tickFormatter={fmtK}
              axisLine={false}
              tickLine={false}
              tick={{ fill: "#9ca3af", fontSize: 11 }}
              width={42}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend content={<CustomLegend />} />

            <Line
              type="monotone"
              dataKey="inflow"
              name="Cash Inflow"
              stroke="#22c55e"
              strokeWidth={2.5}
              dot={{ r: 4, fill: "white", stroke: "#22c55e", strokeWidth: 2 }}
              activeDot={{ r: 5 }}
            />
            <Line
              type="monotone"
              dataKey="outflow"
              name="Cash Outflow"
              stroke="#ef4444"
              strokeWidth={2.5}
              dot={{ r: 4, fill: "white", stroke: "#ef4444", strokeWidth: 2 }}
              activeDot={{ r: 5 }}
            />
          </LineChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
