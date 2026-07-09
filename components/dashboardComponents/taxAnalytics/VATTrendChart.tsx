"use client";

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
import { Info } from "lucide-react";
import { mockVATTrendData } from "@/lib/mockData/mock-tax-data";
import LockDimFeactureOverlay from "@/components/LockDimFeactureOverlay";
import { formatCompactNumber, formatCurrencySymbol } from "@/utils/helper";
import { useCurrency } from "@/providers/CurrencyContext";

const FmtRs = (v: number) => {
  const { currency } = useCurrency();
  return `${currency.symbol} ${formatCompactNumber(v)}`;
};

const CustomTooltip = ({ active, payload, label }: any) => {
  const { currency } = useCurrency();
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-gray-100 rounded-xl px-4 py-3 shadow-lg text-xs min-w-44">
      <p className="font-semibold text-gray-700 mb-2">{label}</p>
      {payload.map((entry: any, i: number) => (
        <div key={i} className="flex items-center justify-between gap-6 mb-0.5">
          <div className="flex items-center gap-1.5">
            <span
              className="w-2 h-2 rounded-full shrink-0"
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-gray-500">{entry.name}</span>
          </div>
          <span className="font-bold text-gray-800">
            {formatCurrencySymbol(
              entry.value,
              currency.symbol,
              currency.locale,
            )}
          </span>
        </div>
      ))}
    </div>
  );
};

const CustomLegend = () => (
  <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-1.5 mt-3">
    {[
      { label: "Input VAT (reclaimed)", color: "#22c55e", dashed: false },
      { label: "Net Payable", color: "#f59e0b", dashed: true },
      { label: "Output VAT (collected)", color: "#6366f1", dashed: false },
    ].map(({ label, color, dashed }) => (
      <div key={label} className="flex items-center gap-1.5">
        {dashed ? (
          <svg width="18" height="8">
            <line
              x1="0"
              y1="4"
              x2="18"
              y2="4"
              stroke={color}
              strokeWidth="2"
              strokeDasharray="4 3"
            />
          </svg>
        ) : (
          <svg width="18" height="8">
            <line x1="0" y1="4" x2="18" y2="4" stroke={color} strokeWidth="2" />
            <circle
              cx="9"
              cy="4"
              r="2.5"
              fill="white"
              stroke={color}
              strokeWidth="1.5"
            />
          </svg>
        )}
        <span className="text-xs text-gray-500">{label}</span>
      </div>
    ))}
  </div>
);

export default function VATTrendChart() {
  return (
    <div className="relative bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex flex-col gap-4">
      <LockDimFeactureOverlay component_name="VAT Trend Chart" />

      <div>
        <h2 className="text-sm font-bold text-gray-900">
          Input vs Output VAT Trend
        </h2>
        <p className="text-xs text-gray-400 mt-0.5">
          How much VAT you collect vs reclaim, over 6 months
        </p>
      </div>

      <ResponsiveContainer width="100%" height={280}>
        <LineChart
          data={mockVATTrendData}
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
            tickFormatter={FmtRs}
            axisLine={false}
            tickLine={false}
            tick={{ fill: "#9ca3af", fontSize: 11 }}
            ticks={[0, 40000, 80000, 120000, 160000]}
            width={52}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend content={<CustomLegend />} />

          {/* Input VAT — green solid */}
          <Line
            type="monotone"
            dataKey="inputVAT"
            name="Input VAT (reclaimed)"
            stroke="#22c55e"
            strokeWidth={2.5}
            dot={{ r: 4, fill: "white", stroke: "#22c55e", strokeWidth: 2 }}
            activeDot={{ r: 5 }}
          />

          {/* Net Payable — amber dashed */}
          <Line
            type="monotone"
            dataKey="netPayable"
            name="Net Payable"
            stroke="#f59e0b"
            strokeWidth={2}
            strokeDasharray="6 4"
            dot={{ r: 3, fill: "white", stroke: "#f59e0b", strokeWidth: 2 }}
            activeDot={{ r: 5 }}
          />

          {/* Output VAT — indigo solid */}
          <Line
            type="monotone"
            dataKey="outputVAT"
            name="Output VAT (collected)"
            stroke="#6366f1"
            strokeWidth={2.5}
            dot={{ r: 4, fill: "white", stroke: "#6366f1", strokeWidth: 2 }}
            activeDot={{ r: 5 }}
          />
        </LineChart>
      </ResponsiveContainer>

      {/* Insight note */}
      <div className="flex items-start gap-2 bg-gray-50 rounded-xl px-3 py-2.5">
        <Info size={13} className="text-gray-400 shrink-0 mt-0.5" />
        <p className="text-[11px] text-gray-500 leading-relaxed">
          The gap between the blue (collected) and green (reclaimed) lines is
          what you owe IRD — the amber line. If input VAT ever jumps closer to
          output, either purchases rose or something&lsquo;s worth checking.
        </p>
      </div>
    </div>
  );
}
