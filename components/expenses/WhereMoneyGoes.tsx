"use client";

import { mockWhereMoneyGoesData } from "@/lib/mockData/mock-expense-data";
import { Zap } from "lucide-react";
import LockDimFeactureOverlay from "../LockDimFeactureOverlay";

function fmtRs(v: number) {
  return `Rs ${v.toLocaleString("en-IN")}`;
}

export default function WhereMoneyGoes() {
  const d = mockWhereMoneyGoesData;

  // Max amount for bar scaling
  const maxAmount = Math.max(...d.categories.map((c) => c.amount));

  return (
    <div className="flex flex-col gap-2">
      {/* Section header */}
      <h2 className="text-sm font-bold text-gray-900">Where the money goes</h2>
      <p className="text-xs text-gray-400 mb-3">
        Category breakdown and top vendor concentration
      </p>

      <div className=" grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* ── Spend by category ── */}
        <div className="relative bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <LockDimFeactureOverlay component_name="Spend by Category" />

          <h3 className="text-sm font-bold text-gray-900 mb-4">
            Spend by category
          </h3>

          <div className="space-y-4">
            {d.categories.map((cat) => {
              const barWidth = Math.round((cat.amount / maxAmount) * 100);
              const isUp = cat.changeDir === "up";
              const isFlat = cat.changeDir === "flat";

              return (
                <div key={cat.label}>
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <span className="text-base leading-none">
                        {cat.emoji}
                      </span>
                      <span className="text-sm text-gray-700 font-medium">
                        {cat.label}
                      </span>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-gray-900">
                        {fmtRs(cat.amount)}
                      </p>
                      {isFlat ? (
                        <p className="text-[11px] text-gray-400">flat</p>
                      ) : (
                        <p
                          className={`text-[11px] font-semibold ${isUp ? "text-red-500" : "text-green-500"}`}
                        >
                          {isUp ? "↑" : "↓"} {cat.changePct}%
                        </p>
                      )}
                    </div>
                  </div>
                  {/* Progress bar */}
                  <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-500 rounded-full transition-all duration-500"
                      style={{ width: `${barWidth}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── Top suppliers ── */}
        <div className="relative bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex flex-col gap-4">
          <LockDimFeactureOverlay component_name="Top Suppliers" />

          <div>
            <h3 className="text-sm font-bold text-gray-900">Top suppliers</h3>
            <p className="text-xs text-gray-400 mt-0.5">Who you pay the most</p>
          </div>

          <div className="space-y-4">
            {d.topSuppliers.map((supplier) => (
              <div key={supplier.rank}>
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-gray-100 flex items-center justify-center text-[10px] font-bold text-gray-500 shrink-0">
                      {supplier.rank}
                    </span>
                    <span className="text-sm text-gray-800 font-medium">
                      {supplier.name}
                    </span>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-gray-900">
                      {fmtRs(supplier.amount)}
                    </p>
                    <p className="text-[11px] text-gray-400">
                      {supplier.pctOfPurchases}% of purchases
                    </p>
                  </div>
                </div>
                <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-500 rounded-full transition-all duration-500"
                    style={{ width: `${supplier.pctOfPurchases * 3.5}%` }}
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Other vendors row */}
          <div className="flex items-center justify-between pt-2 border-t border-gray-100">
            <span className="text-xs text-gray-400">
              Other {d.otherVendorsCount} vendors
            </span>
            <span className="text-xs text-gray-500 font-medium">
              {fmtRs(d.otherVendorsAmount)}
            </span>
          </div>

          {/* Insight banner */}
          <div className="flex items-start gap-2 bg-blue-50 border border-blue-100 rounded-xl px-3 py-2.5">
            <Zap size={13} className="text-blue-500 shrink-0 mt-0.5" />
            <p className="text-[11px] text-blue-700 leading-relaxed">
              Your top {d.topVendorCount} of {d.totalVendorCount} vendors are{" "}
              <span className="font-bold">{d.topVendorPct}%</span> of all
              purchases — negotiate these first.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
