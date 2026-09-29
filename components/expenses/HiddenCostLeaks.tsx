"use client";

import type { ReactNode } from "react";
import { mockHiddenCostLeaksData } from "@/lib/mockData/mock-expense-data";
import { useCurrency } from "@/providers/CurrencyContext";
import { formatCurrencySymbol } from "@/utils/helper";
import { Info, Droplets, Link2 } from "lucide-react";
import LockDimFeactureOverlay from "../LockDimFeactureOverlay";
import { CHART_PALETTE } from "../dashboardComponents/chartCard";

// ── Simple sparkline ───────────────────────────────────────────────────────
function Sparkline({ up }: { up: boolean }) {
  const d = up
    ? "M0,20 C20,18 40,10 60,6 S90,2 110,0"
    : "M0,4  C20,6  40,12 60,14 S90,18 110,20";
  return (
    <svg width="110" height="24" viewBox="0 0 110 24" fill="none">
      <path
        d={d}
        stroke={CHART_PALETTE.warn}
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

/**
 * A section heading: the ChartCard header, over a grid of cards rather than
 * inside one.
 */
function SectionHeader({
  icon,
  iconColor,
  iconBorder,
  iconBg,
  title,
  subtitle,
}: {
  icon: ReactNode;
  iconColor: string;
  iconBorder: string;
  iconBg: string;
  title: string;
  subtitle: string;
}) {
  return (
    <div className="flex min-w-0 items-center gap-3">
      <div
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border dark:border-white/10! dark:bg-white/5!"
        style={{
          borderColor: iconBorder,
          backgroundColor: iconBg,
          color: iconColor,
        }}
      >
        {icon}
      </div>
      <div className="min-w-0">
        <h3 className="text-[15px] font-normal text-[#3c4043] dark:text-[#e8ecf4]">
          {title}
        </h3>
        <p className="mt-0.5 text-xs tracking-wide text-[#9aa0a6] dark:text-[#9aa6bd]">
          {subtitle}
        </p>
      </div>
    </div>
  );
}

/** One card in either grid: the shared frame, with an emoji for a title. */
function LeakCard({
  emoji,
  title,
  children,
}: {
  emoji: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-4 rounded-2xl border bg-white dark:bg-[#161d2e] px-5 py-4 border-[#e3e3e3] dark:border-white/10">
      <div className="flex items-center gap-2">
        <span className="text-lg">{emoji}</span>
        <h4 className="text-[13px] text-[#3c4043] dark:text-[#e8ecf4]">
          {title}
        </h4>
      </div>
      {children}
    </div>
  );
}

export default function HiddenCostLeaks() {
  const { currency } = useCurrency();
  const d = mockHiddenCostLeaksData;

  const fmtRs = (v: number) => {
    return formatCurrencySymbol(v, currency.symbol, currency.locale);
  };

  return (
    <div className="mt-4 flex flex-col gap-5">
      {/* Section header */}
      <SectionHeader
        icon={<Droplets size={16} />}
        iconColor="#0891b2"
        iconBorder="#a5f3fc"
        iconBg="#ecfeff"
        title="Where money quietly leaks"
        subtitle="Costs most shops never track"
      />

      {/* ── Top 3 cards ── */}
      <div className="relative grid grid-cols-1 gap-4 overflow-hidden rounded-2xl md:grid-cols-3">
        <LockDimFeactureOverlay component_name="Hidden Cost Leaks" />

        {/* Delivery commission */}
        <LeakCard emoji="🛵" title="Delivery commission">
          <div>
            <p className="text-2xl font-semibold tracking-tight tabular-nums text-[#d93025] dark:text-[#f87171]">
              {fmtRs(d.delivery.totalCommission)}
            </p>
            <p className="mt-0.5 text-[11px] text-[#9aa0a6] dark:text-[#9aa6bd]">
              {d.delivery.blendedCutPct}% blended cut ·{" "}
              {fmtRs(d.delivery.totalReached)} reached you
            </p>
          </div>
          <div className="space-y-2">
            {d.delivery.platforms.map((p) => (
              <div
                key={p.name}
                className="flex items-center justify-between gap-2 rounded-xl border px-3 py-2.5 border-[#e3e3e3] dark:border-white/10"
              >
                <div className="flex min-w-0 items-center gap-2">
                  <span
                    className="h-2.5 w-2.5 shrink-0 rounded-full"
                    style={{ backgroundColor: p.color }}
                  />
                  <div className="min-w-0">
                    <p className="truncate text-xs text-[#3c4043] dark:text-[#e8ecf4]">
                      {p.name}
                    </p>
                    <p className="text-[11px] tabular-nums text-[#9aa0a6] dark:text-[#9aa6bd]">
                      Gross {fmtRs(p.grossRevenue)}
                    </p>
                  </div>
                </div>
                <span className="shrink-0 text-xs tabular-nums text-[#d93025] dark:text-[#f87171]">
                  −{fmtRs(p.commission)} ({p.commissionPct}%)
                </span>
              </div>
            ))}
          </div>
        </LeakCard>

        {/* Wastage & spoilage */}
        <LeakCard emoji="🗑️" title="Wastage & spoilage">
          <div>
            <p className="text-2xl font-semibold tracking-tight tabular-nums text-[#d93025] dark:text-[#f87171]">
              {fmtRs(d.wastage.total)}
            </p>
            <p className="mt-0.5 text-[11px] text-[#9aa0a6] dark:text-[#9aa6bd]">
              {d.wastage.foodCostPct}% of food cost · target under{" "}
              {d.wastage.targetPct}%
            </p>
          </div>
          <div>
            {d.wastage.items.map((item) => (
              <div
                key={item.label}
                className="flex justify-between gap-2 border-b py-2 last:border-0 border-[#e8eaed] dark:border-white/10"
              >
                <span className="text-[13px] text-[#5f6368] dark:text-[#a9b4c7]">
                  {item.label}
                </span>
                <span className="text-[13px] font-medium tabular-nums text-[#3c4043] dark:text-[#e8ecf4]">
                  {fmtRs(item.amount)}
                </span>
              </div>
            ))}
          </div>
        </LeakCard>

        {/* LPG / gas spend */}
        <LeakCard emoji="🔥" title="LPG / gas spend">
          <div>
            <p className="text-2xl font-semibold tracking-tight tabular-nums text-[#d93025] dark:text-[#f87171]">
              {fmtRs(d.lpgGas.total)}
            </p>
            <p className="mt-0.5 text-[11px]">
              <span
                className={`tabular-nums ${
                  d.lpgGas.changeDir === "up"
                    ? "text-[#d93025] dark:text-[#f87171]"
                    : "text-[#1e8e3e] dark:text-[#10b981]"
                }`}
              >
                {d.lpgGas.changeDir === "up" ? "↑" : "↓"} {d.lpgGas.changePct}%
              </span>{" "}
              <span className="text-[#9aa0a6] dark:text-[#9aa6bd]">
                vs last month
              </span>
            </p>
          </div>
          <Sparkline up={d.lpgGas.changeDir === "up"} />
        </LeakCard>
      </div>

      {/* Section divider */}
      <div>
        <div className="mb-4">
          <SectionHeader
            icon={<Link2 size={16} />}
            iconColor="#1a73e8"
            iconBorder="#dbeafe"
            iconBg="#eff6ff"
            title="Connects to your tax dashboard"
            subtitle="Two expense items that change what you owe"
          />
        </div>

        <div className="relative grid grid-cols-1 gap-4 overflow-hidden rounded-2xl md:grid-cols-2">
          <LockDimFeactureOverlay component_name="Connection to Tax Dashboard" />

          {/* VAT input credit */}
          <LeakCard emoji="📋" title="VAT input credit (recoverable)">
            <div>
              <p className="text-2xl font-semibold tracking-tight tabular-nums text-[#1a73e8] dark:text-[#7ba2e3]">
                {fmtRs(d.vatInputCredit.amount)}
              </p>
              <p className="mt-0.5 text-[11px] text-[#9aa0a6] dark:text-[#9aa6bd]">
                {d.vatInputCredit.vatRate}% VAT on{" "}
                {fmtRs(d.vatInputCredit.vatPaidPurchases)} of VAT-paid purchases
              </p>
            </div>
            <div className="flex items-start gap-2 rounded-xl border px-3 py-2.5 border-[#e3e3e3] dark:border-white/10">
              <Info
                size={13}
                className="mt-0.5 shrink-0 text-[#9aa0a6] dark:text-[#9aa6bd]"
              />
              <p className="text-[11px] leading-relaxed text-[#5f6368] dark:text-[#a9b4c7]">
                Subtract this from the VAT you collected to get your Net VAT
                payable to IRD —{" "}
                <span className="text-[#3c4043] dark:text-[#e8ecf4]">
                  it&rsquo;s money back, not a cost.
                </span>
              </p>
            </div>
          </LeakCard>

          {/* Service charge */}
          <LeakCard emoji="💰" title="Service charge → staff payout">
            <p className="text-[11px] text-[#9aa0a6] dark:text-[#9aa6bd]">
              {d.serviceCharge.rate}% service charge collected:{" "}
              <span className="tabular-nums text-[#3c4043] dark:text-[#e8ecf4]">
                {fmtRs(d.serviceCharge.collected)}
              </span>
            </p>

            {/* Stacked bar */}
            <div className="flex h-2.5 overflow-hidden rounded-full">
              <div
                className="bg-[#1e8e3e] transition-all duration-500 dark:bg-[#10b981]"
                style={{ width: `${d.serviceCharge.staffPct}%` }}
              />
              <div
                className="bg-[#dadce0] transition-all duration-500 dark:bg-white/20"
                style={{ width: `${d.serviceCharge.mgmtPct}%` }}
              />
            </div>

            <div className="flex items-center justify-between gap-2 text-[11px]">
              <div className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-[#1e8e3e] dark:bg-[#10b981]" />
                <span className="text-[#3c4043] dark:text-[#e8ecf4]">
                  Staff {d.serviceCharge.staffPct}%
                </span>
                <span className="tabular-nums text-[#9aa0a6] dark:text-[#9aa6bd]">
                  {fmtRs(d.serviceCharge.staffAmount)}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-[#dadce0] dark:bg-white/15" />
                <span className="text-[#3c4043] dark:text-[#e8ecf4]">
                  Mgmt {d.serviceCharge.mgmtPct}%
                </span>
                <span className="tabular-nums text-[#9aa0a6] dark:text-[#9aa6bd]">
                  {fmtRs(d.serviceCharge.mgmtAmount)}
                </span>
              </div>
            </div>

            <div className="flex items-start gap-2 rounded-xl border px-3 py-2.5 border-[#e3e3e3] dark:border-white/10">
              <Info
                size={13}
                className="mt-0.5 shrink-0 text-[#9aa0a6] dark:text-[#9aa6bd]"
              />
              <p className="text-[11px] leading-relaxed text-[#5f6368] dark:text-[#a9b4c7]">
                The staff share is a real labor cost (part of your 26%). Service
                charge itself is revenue — not a tax.
              </p>
            </div>
          </LeakCard>
        </div>
      </div>
    </div>
  );
}
