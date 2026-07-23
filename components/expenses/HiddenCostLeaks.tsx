"use client";

import { mockHiddenCostLeaksData } from "@/lib/mockData/mock-expense-data";
import { useCurrency } from "@/providers/CurrencyContext";
import { formatCurrencySymbol } from "@/utils/helper";
import { Info } from "lucide-react";
import LockDimFeactureOverlay from "../LockDimFeactureOverlay";
import { ComponentHeader } from "../ComponentHeader";

// ── Simple sparkline ───────────────────────────────────────────────────────
function Sparkline({ up }: { up: boolean }) {
  const d = up
    ? "M0,20 C20,18 40,10 60,6 S90,2 110,0"
    : "M0,4  C20,6  40,12 60,14 S90,18 110,20";
  return (
    <svg width="110" height="24" viewBox="0 0 110 24" fill="none">
      <path d={d} stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

export default function HiddenCostLeaks() {
  const { currency } = useCurrency();
  const d = mockHiddenCostLeaksData;

  const fmtRs = (v: number) => {
    return formatCurrencySymbol(v, currency.symbol, currency.locale);
  };

  return (
    <div className="flex flex-col gap-5">
      {/* Section header */}
      <ComponentHeader
        title="Where money quietly leaks"
        subHeader="Costs most shops never track"
      />

      {/* ── Top 3 cards ── */}
      <div className="relative grid grid-cols-1 md:grid-cols-3 gap-4">
        <LockDimFeactureOverlay component_name="Hidden Cost Leaks" />
        {/* Delivery commission */}
        <div className=" bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex flex-col gap-4">
          <div className="flex items-center gap-2">
            <span className="text-lg">🛵</span>

            <ComponentHeader title="Delivery commission" subHeader="" />
          </div>
          <div>
            <p className="text-2xl font-bold text-red-500">
              {fmtRs(d.delivery.totalCommission)}
            </p>
            <p className="text-xs text-gray-400 mt-0.5">
              {d.delivery.blendedCutPct}% blended cut ·{" "}
              {fmtRs(d.delivery.totalReached)} reached you
            </p>
          </div>
          <div className="space-y-2">
            {d.delivery.platforms.map((p) => (
              <div
                key={p.name}
                className="flex items-center justify-between bg-gray-50 rounded-xl px-3 py-2.5"
              >
                <div className="flex items-center gap-2">
                  <span
                    className="w-3 h-3 rounded-full shrink-0"
                    style={{ backgroundColor: p.color }}
                  />
                  <div>
                    <p className="text-xs font-semibold text-gray-800">
                      {p.name}
                    </p>
                    <p className="text-[10px] text-gray-400">
                      Gross {fmtRs(p.grossRevenue)}
                    </p>
                  </div>
                </div>
                <span className="text-xs font-bold text-red-500">
                  −{fmtRs(p.commission)} ({p.commissionPct}%)
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Wastage & spoilage */}
        <div className=" bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex flex-col gap-4">
          <div className="flex items-center gap-2">
            <span className="text-lg">🗑️</span>

            <ComponentHeader title="  Wastage & spoilaged" subHeader="" />
          </div>
          <div>
            <p className="text-2xl font-bold text-red-500">
              {fmtRs(d.wastage.total)}
            </p>
            <p className="text-xs text-gray-400 mt-0.5">
              {d.wastage.foodCostPct}% of food cost · target under{" "}
              {d.wastage.targetPct}%
            </p>
          </div>
          <div className="space-y-2">
            {d.wastage.items.map((item) => (
              <div
                key={item.label}
                className="flex justify-between py-1.5 border-b border-gray-50 last:border-0"
              >
                <span className="text-sm text-gray-700">{item.label}</span>
                <span className="text-sm font-semibold text-gray-900">
                  {fmtRs(item.amount)}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* LPG / gas spend */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex flex-col gap-4">
          <div className="flex items-center gap-2">
            <span className="text-lg">🔥</span>

            <ComponentHeader title=" LPG / gas spend" subHeader="" />
          </div>
          <div>
            <p className="text-2xl font-bold text-red-500">
              {fmtRs(d.lpgGas.total)}
            </p>
            <p
              className={`text-xs font-semibold mt-0.5 ${d.lpgGas.changeDir === "up" ? "text-red-500" : "text-green-500"}`}
            >
              {d.lpgGas.changeDir === "up" ? "↑" : "↓"} {d.lpgGas.changePct}%{" "}
              <span className="text-gray-400 font-normal">vs last month</span>
            </p>
          </div>
          <Sparkline up={d.lpgGas.changeDir === "up"} />
        </div>
      </div>

      {/* Section divider */}
      <div>
        <div className="mb-4">
          <ComponentHeader
            title=" Connects to your tax dashboard"
            subHeader="Two expense items that change what you owe"
          />
        </div>

        <div className="relative grid grid-cols-1 md:grid-cols-2 gap-4">
          <LockDimFeactureOverlay component_name="Connection to Tax Dashboard" />

          {/* VAT input credit */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <span className="text-lg">📋</span>

              <ComponentHeader
                title=" VAT input credit (recoverable)"
                subHeader=""
              />
            </div>
            <p className="text-2xl font-bold text-blue-600">
              {fmtRs(d.vatInputCredit.amount)}
            </p>
            <p className="text-xs text-gray-400">
              {d.vatInputCredit.vatRate}% VAT on{" "}
              {fmtRs(d.vatInputCredit.vatPaidPurchases)} of VAT-paid purchases
            </p>
            <div className="flex items-start gap-2 bg-blue-50 border border-blue-100 rounded-xl px-3 py-2.5">
              <span className="text-blue-400 text-sm shrink-0">↙</span>
              <p className="text-[11px] text-blue-700 leading-relaxed">
                Subtract this from the VAT you collected to get your Net VAT
                payable to IRD —{" "}
                <span className="font-semibold">
                  it&squo;s money back, not a cost.
                </span>
              </p>
            </div>
          </div>

          {/* Service charge */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <span className="text-lg">💰</span>
              <h3 className="text-sm font-bold text-gray-900">
                Service charge → staff payout
              </h3>
            </div>
            <p className="text-xs text-gray-500">
              {d.serviceCharge.rate}% service charge collected:{" "}
              <span className="font-semibold text-gray-800">
                {fmtRs(d.serviceCharge.collected)}
              </span>
            </p>

            {/* Stacked bar */}
            <div className="flex h-3 rounded-full overflow-hidden">
              <div
                className="bg-green-500 transition-all duration-500"
                style={{ width: `${d.serviceCharge.staffPct}%` }}
              />
              <div
                className="bg-gray-300 transition-all duration-500"
                style={{ width: `${d.serviceCharge.mgmtPct}%` }}
              />
            </div>

            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-green-500" />
                <span className="text-gray-600 font-medium">
                  Staff {d.serviceCharge.staffPct}%
                </span>
                <span className="text-gray-400">
                  {fmtRs(d.serviceCharge.staffAmount)}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-gray-300" />
                <span className="text-gray-600 font-medium">
                  Mgmt {d.serviceCharge.mgmtPct}%
                </span>
                <span className="text-gray-400">
                  {fmtRs(d.serviceCharge.mgmtAmount)}
                </span>
              </div>
            </div>

            <div className="flex items-start gap-2 bg-blue-50 border border-blue-100 rounded-xl px-3 py-2.5">
              <Info size={13} className="text-blue-400 shrink-0 mt-0.5" />
              <p className="text-[11px] text-blue-700 leading-relaxed">
                The staff share is a real labour cost (part of your 26%).
                Service charge itself is revenue — not a tax.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
