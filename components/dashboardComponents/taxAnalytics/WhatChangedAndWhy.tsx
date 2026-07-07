"use client";

import { useState } from "react";
import {
  TrendingUp,
  TrendingDown,
  Info,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import { mockVATComparisonData } from "@/lib/mockData/mock-tax-data";
import LockDimFeactureOverlay from "@/components/LockDimFeactureOverlay";

const DONUT_COLORS = ["#6366f1", "#e5e7eb"];

const CustomDonutTooltip = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null;
  const d = payload[0]?.payload;
  return (
    <div className="bg-white border border-gray-100 rounded-xl px-3 py-2 shadow-lg text-xs">
      <p className="font-semibold text-gray-700">{d.name}</p>
      <p className="text-gray-500 mt-0.5">Rs {d.value.toLocaleString()}</p>
    </div>
  );
};

export default function WhatChangedAndWhy() {
  const data = mockVATComparisonData;
  const [showBreakdown, setShowBreakdown] = useState(true);

  const increased = data.change > 0;
  const donutData = [
    { name: `Taxable (${data.taxableRate}%)`, value: data.taxableSales },
    { name: "Exempt / Zero Rate", value: data.exemptSales },
  ];
  const taxablePct = Math.round((data.taxableSales / data.totalSales) * 100);
  const exemptPct = 100 - taxablePct;
  const totalSalesK = `Rs ${(data.totalSales / 1000).toFixed(0)}k`;

  return (
    <div className="space-y-4">
      {/* ── What Changed & Why ── */}
      <div className=" relative bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <LockDimFeactureOverlay component_name="What Changed And Why" />

        <div className="flex items-center gap-2 mb-1">
          {increased ? (
            <TrendingUp size={14} className="text-amber-500" />
          ) : (
            <TrendingDown size={14} className="text-blue-500" />
          )}
          <h2 className="text-sm font-bold text-gray-900">
            What Changed & Why
          </h2>
        </div>
        <p className="text-xs text-gray-400 mb-5">
          Your VAT bill this month compared to last
        </p>

        {/* Comparison row */}
        <div className="flex items-center justify-between gap-4">
          {/* Last month */}
          <div>
            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-1">
              Last Month
            </p>
            <p className="text-xl font-bold text-gray-500">
              Rs {data.lastMonth.toLocaleString()}
            </p>
          </div>

          {/* Change pill — center */}
          <div className="flex-1 flex justify-center">
            <div
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold ${
                increased
                  ? "text-amber-600 bg-amber-50"
                  : "text-blue-600 bg-blue-50"
              }`}
            >
              {increased ? (
                <TrendingUp size={12} />
              ) : (
                <TrendingDown size={12} />
              )}
              Rs {Math.abs(data.change).toLocaleString()} ({data.changePct}%)
            </div>
          </div>

          {/* This month — blue card */}
          <div className="bg-blue-600 rounded-2xl px-5 py-3 text-right min-w-[140px]">
            <p className="text-[10px] font-semibold text-blue-200 uppercase tracking-widest mb-0.5">
              This Month
            </p>
            <p className="text-2xl font-bold text-white leading-none">
              Rs {data.thisMonth.toLocaleString()}
            </p>
          </div>
        </div>

        {/* Reason */}
        <div className="mt-4 flex items-start gap-2 bg-gray-50 rounded-xl px-3 py-2.5">
          <Info size={13} className="text-gray-400 shrink-0 mt-0.5" />
          <div>
            <p className="text-[11px] font-semibold text-gray-500 mb-0.5">
              Why it changed
            </p>
            <p className="text-[11px] text-gray-500 leading-relaxed">
              {data.reason}
            </p>
          </div>
        </div>
      </div>

      {/* ── VAT Breakdown label ── */}
      <div className="flex items-center justify-between">
        <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">
          VAT Breakdown
        </p>
        <div className="h-px flex-1 bg-gray-200 ml-3" />
      </div>

      {/* ── Taxable vs Exempt ── */}
      <div className="relative bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <LockDimFeactureOverlay component_name="VAT Breakdown" />

        <div className="flex items-center justify-between mb-1">
          <div>
            <h2 className="text-sm font-bold text-gray-900">
              Taxable vs Exempt Sales
            </h2>
            <p className="text-xs text-gray-400 mt-0.5">
              Portion of total sales subject to tax
            </p>
          </div>
          <button
            onClick={() => setShowBreakdown((p) => !p)}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            {showBreakdown ? (
              <ChevronUp size={16} />
            ) : (
              <ChevronDown size={16} />
            )}
          </button>
        </div>

        {showBreakdown && (
          <div className="flex flex-col sm:flex-row items-center gap-6 mt-4">
            {/* Donut */}
            <div
              className="relative shrink-0"
              style={{ width: 140, height: 140 }}
            >
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={donutData}
                    cx="50%"
                    cy="50%"
                    innerRadius={44}
                    outerRadius={68}
                    startAngle={90}
                    endAngle={-270}
                    dataKey="value"
                    strokeWidth={0}
                  >
                    {donutData.map((_, i) => (
                      <Cell key={i} fill={DONUT_COLORS[i]} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomDonutTooltip />} />
                </PieChart>
              </ResponsiveContainer>
              {/* Center label */}
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <p className="text-[10px] text-gray-400 font-medium">
                  Total Sales
                </p>
                <p className="text-xs font-bold text-gray-900">{totalSalesK}</p>
              </div>
            </div>

            {/* Legend + values */}
            <div className="flex-1 space-y-3 w-full">
              {[
                {
                  label: `Taxable (${data.taxableRate}%)`,
                  color: "#6366f1",
                  value: data.taxableSales,
                  pct: taxablePct,
                },
                {
                  label: "Exempt / Zero Rate",
                  color: "#e5e7eb",
                  value: data.exemptSales,
                  pct: exemptPct,
                },
              ].map(({ label, color, value, pct }) => (
                <div
                  key={label}
                  className="flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: color }}
                    />
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-gray-700 truncate">
                        {label}
                      </p>
                      <p className="text-[10px] text-gray-400">
                        Rs {value.toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <p className="text-sm font-bold text-gray-900 shrink-0">
                    {pct}.0%
                  </p>
                </div>
              ))}

              {/* Nepal note */}
              <div className="bg-amber-50 border border-amber-100 rounded-lg px-3 py-2">
                <p className="text-[10px] text-amber-700">
                  Note: There is no 5% tier in Nepal. Goods are either Standard
                  (13%) or Exempt (0%).
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
