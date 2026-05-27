"use client";

import { useMemo, useState } from "react";
import { formatCurrency } from "@/utils/helper";
import { useCurrency } from "@/providers/CurrencyContext";
import { TrendingUp, TrendingDown, Scale } from "lucide-react";
import { PURPOSE_COLORS, useTracker } from "@/providers/ExpenseContext";

function DonutChart({
  data,
}: {
  data: { purpose: string; amount: number; color: string; pct: number }[];
}) {
  const [hovered, setHovered] = useState<string | null>(null);
  const size = 160;
  const cx = size / 2;
  const cy = size / 2;
  const R = 60;
  const r = 38;

  const slices = data.reduce(
    (acc, d) => {
      const previous = acc[acc.length - 1];
      const startAngle = previous ? previous.startAngle + previous.sweep : -90;
      const sweep = (d.pct / 100) * 360;
      acc.push({ ...d, startAngle, sweep });
      return acc;
    },
    [] as { purpose: string; amount: number; color: string; pct: number; startAngle: number; sweep: number }[],
  );

  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const arc = (cx: number, cy: number, r: number, startDeg: number, endDeg: number) => {
    const sx = cx + r * Math.cos(toRad(startDeg));
    const sy = cy + r * Math.sin(toRad(startDeg));
    const ex = cx + r * Math.cos(toRad(endDeg));
    const ey = cy + r * Math.sin(toRad(endDeg));
    const large = endDeg - startDeg > 180 ? 1 : 0;
    return `M${sx},${sy} A${r},${r},0,${large},1,${ex},${ey}`;
  };

  const hoveredSlice = slices.find((s) => s.purpose === hovered);

  return (
    <div className="relative flex items-center justify-center">
      <svg width={size} height={size}>
        {data.length === 0 ? (
          <circle cx={cx} cy={cy} r={R} fill="none" stroke="#e5e7eb" strokeWidth={R - r} />
        ) : (
          slices.map((s) => {
            if (s.sweep < 0.5) return null;
            const endAngle = s.startAngle + s.sweep;
            const outerPath = arc(cx, cy, R, s.startAngle, endAngle);
            const innerPath = arc(cx, cy, r, endAngle, s.startAngle);
            const isHovered = hovered === s.purpose;
            return (
              <path
                key={s.purpose}
                d={`${outerPath} L${cx + r * Math.cos(toRad(endAngle))},${cy + r * Math.sin(toRad(endAngle))} ${innerPath} Z`}
                fill={s.color}
                opacity={hovered && !isHovered ? 0.4 : 1}
                className="transition-opacity duration-200 cursor-pointer"
                onMouseEnter={() => setHovered(s.purpose)}
                onMouseLeave={() => setHovered(null)}
              />
            );
          })
        )}
      </svg>

      {/* Center text */}
      <div className="absolute text-center pointer-events-none">
        {hoveredSlice ? (
          <>
            <p className="text-xs text-gray-500 leading-tight">{hoveredSlice.purpose}</p>
            <p className="text-sm font-bold text-gray-900">{hoveredSlice.pct.toFixed(0)}%</p>
          </>
        ) : (
          <p className="text-xs text-gray-400">Expenses</p>
        )}
      </div>
    </div>
  );
}

export default function ExpenseTrackerStats() {
  const { transactions } = useTracker();
  const { currency } = useCurrency();

  const totalExpense = useMemo(
    () => transactions.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0),
    [transactions],
  );
  const totalIncome = useMemo(
    () => transactions.filter((t) => t.type === "income").reduce((s, t) => s + t.amount, 0),
    [transactions],
  );
  const net = totalIncome - totalExpense;

  // Group expenses by purpose for donut
  const expenseByPurpose = useMemo(() => {
    const map: Record<string, number> = {};
    transactions.filter((t) => t.type === "expense").forEach((t) => {
      map[t.purpose] = (map[t.purpose] ?? 0) + t.amount;
    });
    return Object.entries(map)
      .sort(([, a], [, b]) => b - a)
      .map(([purpose, amount]) => ({
        purpose,
        amount,
        color: PURPOSE_COLORS[purpose] ?? "#6b7280",
        pct: totalExpense > 0 ? (amount / totalExpense) * 100 : 0,
      }));
  }, [transactions, totalExpense]);

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 h-full">
      {/* Summary row */}
      <div className="grid grid-cols-3 gap-3 mb-5">
        <div className="bg-red-50 rounded-xl p-3 text-center">
          <div className="flex items-center justify-center gap-1 mb-1">
            <TrendingDown size={13} className="text-red-500" />
            <p className="text-xs text-red-500 font-medium">Expenses</p>
          </div>
          <p className="text-sm font-bold text-red-700">
            {formatCurrency(totalExpense, currency)}
          </p>
        </div>
        <div className="bg-green-50 rounded-xl p-3 text-center">
          <div className="flex items-center justify-center gap-1 mb-1">
            <TrendingUp size={13} className="text-green-500" />
            <p className="text-xs text-green-500 font-medium">Income</p>
          </div>
          <p className="text-sm font-bold text-green-700">
            {formatCurrency(totalIncome, currency)}
          </p>
        </div>
        <div className={`rounded-xl p-3 text-center ${net >= 0 ? "bg-blue-50" : "bg-orange-50"}`}>
          <div className="flex items-center justify-center gap-1 mb-1">
            <Scale size={13} className={net >= 0 ? "text-blue-500" : "text-orange-500"} />
            <p className={`text-xs font-medium ${net >= 0 ? "text-blue-500" : "text-orange-500"}`}>
              Net
            </p>
          </div>
          <p className={`text-sm font-bold ${net >= 0 ? "text-blue-700" : "text-orange-700"}`}>
            {net >= 0 ? "+" : ""}{formatCurrency(net, currency)}
          </p>
        </div>
      </div>

      {/* Donut + legend */}
      <div className="flex items-center gap-5">
        <div className="shrink-0">
          <DonutChart data={expenseByPurpose} />
        </div>
        <div className="flex-1 min-w-0 space-y-1.5 max-h-44 overflow-y-auto pr-1">
          {expenseByPurpose.length === 0 ? (
            <p className="text-xs text-gray-400 text-center py-4">No expense data</p>
          ) : (
            expenseByPurpose.map((d) => (
              <div key={d.purpose} className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 min-w-0">
                  <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: d.color }} />
                  <span className="text-xs text-gray-600 truncate">{d.purpose}</span>
                </div>
                <div className="text-right shrink-0">
                  <span className="text-xs font-medium text-gray-800">
                    {formatCurrency(d.amount, currency)}
                  </span>
                  <span className="text-xs text-gray-400 ml-1">
                    ({d.pct.toFixed(0)}%)
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}