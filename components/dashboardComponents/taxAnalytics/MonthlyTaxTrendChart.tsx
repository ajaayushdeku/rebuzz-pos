"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { Info } from "lucide-react";
import { mockMonthlyTaxData } from "@/lib/mockData/mock-tax-data";

function fmtRs(v: number) {
  return `Rs ${(v / 1000).toFixed(0)}k`;
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  const total = payload.reduce((s: number, e: any) => s + (e.value ?? 0), 0);
  return (
    <div className="bg-white border border-gray-100 rounded-xl px-4 py-3 shadow-lg text-xs min-w-40">
      <p className="font-semibold text-gray-700 mb-2">{label}</p>
      {payload.map((entry: any, i: number) => (
        <div key={i} className="flex items-center justify-between gap-5 mb-0.5">
          <div className="flex items-center gap-1.5">
            <span
              className="w-2 h-2 rounded-sm shrink-0"
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-gray-500">{entry.name}</span>
          </div>
          <span className="font-bold text-gray-800">
            Rs {entry.value.toLocaleString()}
          </span>
        </div>
      ))}
      <div className="border-t border-gray-100 mt-2 pt-1.5 flex justify-between">
        <span className="text-gray-400">Total</span>
        <span className="font-bold text-gray-900">
          Rs {total.toLocaleString()}
        </span>
      </div>
    </div>
  );
};

const CustomLegend = () => (
  <div className="flex items-center justify-center gap-6 mt-3">
    {[
      { label: "Income Tax", color: "#f59e0b" },
      { label: "Net VAT", color: "#6366f1" },
    ].map(({ label, color }) => (
      <div key={label} className="flex items-center gap-1.5">
        <span
          className="w-2.5 h-2.5 rounded-sm shrink-0"
          style={{ backgroundColor: color }}
        />
        <span className="text-xs text-gray-500">{label}</span>
      </div>
    ))}
  </div>
);

export default function MonthlyTaxTrendChart() {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex flex-col gap-4">
      <div>
        <h2 className="text-sm font-bold text-gray-900">Monthly Tax Trend</h2>
        <p className="text-xs text-gray-400 mt-0.5">
          Your total tax burden over 6 months — VAT plus income tax
        </p>
      </div>

      <ResponsiveContainer width="100%" height={280}>
        <BarChart
          data={mockMonthlyTaxData}
          margin={{ top: 10, right: 10, left: 10, bottom: 10 }}
          barCategoryGap="30%"
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
            tickFormatter={fmtRs}
            axisLine={false}
            tickLine={false}
            tick={{ fill: "#9ca3af", fontSize: 11 }}
            ticks={[0, 30000, 60000, 90000, 120000]}
            width={52}
          />
          <Tooltip
            content={<CustomTooltip />}
            cursor={{ fill: "rgba(0,0,0,0.03)" }}
          />
          <Legend content={<CustomLegend />} />

          {/* Stacked bars — Net VAT first (bottom), Income Tax on top */}
          <Bar dataKey="netVAT" name="Net VAT" stackId="tax" fill="#6366f1" />
          <Bar
            dataKey="incomeTax"
            name="Income Tax"
            stackId="tax"
            fill="#f59e0b"
            radius={[3, 3, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>

      {/* Insight note */}
      <div className="flex items-start gap-2 bg-gray-50 rounded-xl px-3 py-2.5">
        <Info size={13} className="text-gray-400 shrink-0 mt-0.5" />
        <p className="text-[11px] text-gray-500 leading-relaxed">
          Each bar stacks your two main taxes for that month — net VAT and
          monthly income tax — so you can see your total tax load trending over
          time.
        </p>
      </div>
    </div>
  );
}
