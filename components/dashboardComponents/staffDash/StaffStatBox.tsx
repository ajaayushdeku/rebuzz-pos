"use client";

import { useCurrency } from "@/providers/CurrencyContext";
import { formatCurrencySymbol } from "@/utils/helper";
import Link from "next/link";
import {
  Crown,
  User,
  ShoppingCart,
  TrendingUp,
  Clock,
  ArrowRight,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

export interface StaffBoxProps {
  staffId: string;
  staffName: string;
  staffPosition?: string;
  salesTaken: number;
  ordersTaken: number;
  amount: number;
  avgTime?: string;
  role?: "Basic" | "Staff" | "Owner";
}

const getInitials = (name: string): string =>
  name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

/**
 * Normalise the raw position string to a known role key.
 */
function resolveRole(
  position: string | undefined,
): "Owner" | "Staff" | "Basic" {
  if (!position) return "Basic";
  const p = position.toLowerCase().trim();
  if (p === "owner" || p === "admin") return "Owner";
  if (p === "staff") return "Staff";
  return "Basic";
}

// ── Role accents ───────────────────────────────────────────────────────
// One colour per role drives the avatar and the badge together, so a grid of
// cards can be scanned by role at a glance. Previously every avatar was blue
// regardless and only the badge carried the role.

const roleConfig = {
  Owner: {
    avatar: "bg-amber-500",
    badge:
      "border border-amber-200 bg-amber-50 text-amber-700 dark:bg-amber-400/10 dark:border-amber-400/25 dark:text-amber-300",
    label: "Owner",
    icon: Crown,
  },
  Staff: {
    avatar: "bg-blue-500",
    badge:
      "border border-blue-200 bg-blue-50 text-blue-700 dark:bg-blue-400/10 dark:border-blue-400/25 dark:text-[#a8c4ee]",
    label: "Staff",
    icon: User,
  },
  Basic: {
    avatar: "bg-indigo-500",
    badge:
      "border border-indigo-200 bg-indigo-50 text-indigo-700 dark:text-indigo-300 dark:bg-indigo-400/10 dark:border-indigo-400/25",
    label: "Basic",
    icon: User,
  },
};

/** One figure in the metrics row. */
function Metric({
  icon: Icon,
  value,
  label,
}: {
  icon: LucideIcon;
  value: string | number;
  label: string;
}) {
  return (
    <div className="flex min-w-0 flex-1 flex-col items-center gap-1 px-1">
      <Icon size={13} className="text-[#9aa0a6] dark:text-[#9aa6bd]" />
      <p className="truncate text-[15px] font-semibold tracking-tight tabular-nums text-[#3c4043] dark:text-[#e8ecf4]">
        {value}
      </p>
      <p className="text-[11px] text-[#9aa0a6] dark:text-[#9aa6bd]">{label}</p>
    </div>
  );
}

export default function StaffStatBox({
  staffId,
  staffName,
  staffPosition = "Basic",
  salesTaken,
  ordersTaken,
  amount,
  avgTime,
  role,
}: StaffBoxProps) {
  const roleKey = role ?? resolveRole(staffPosition);
  const rConfig = roleConfig[roleKey];
  const RoleIcon = rConfig.icon;
  const staffInitials = getInitials(staffName);
  const { currency } = useCurrency();

  return (
    // The whole card is the link to that employee's report: it can be opened
    // in a new tab or middle-clicked, Next prefetches it, and it still takes
    // focus from the keyboard — which is what the button it replaced was for.
    <Link
      href={`/records/employee/${staffId}`}
      className="group flex h-full w-full cursor-pointer flex-col rounded-2xl border border-[#e3e3e3] bg-white px-5 py-4 text-left transition-colors hover:border-[#dadce0] focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 dark:border-white/10 dark:bg-[#161d2e] dark:focus-visible:ring-offset-[#0f1420]"
    >
      {/* ── Identity + revenue ── */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <div className="relative shrink-0">
            <div
              className={`flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold text-white ${rConfig.avatar}`}
            >
              {staffInitials}
            </div>
            {roleKey === "Owner" && (
              <div className="absolute -right-1 -top-1 rounded-full bg-amber-400 p-0.5 shadow">
                <Crown size={10} className="text-white" />
              </div>
            )}
          </div>

          <div className="min-w-0">
            <p className="truncate text-[13px] font-medium leading-tight text-[#3c4043] dark:text-[#e8ecf4]">
              {staffName}
            </p>
            <span
              className={`mt-1.5 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] leading-tight ${rConfig.badge}`}
            >
              <RoleIcon size={10} />
              {rConfig.label}
            </span>
          </div>
        </div>

        <div className="flex shrink-0 flex-col items-end">
          <span className="text-[11px] text-[#9aa0a6] dark:text-[#9aa6bd]">
            Revenue
          </span>
          <p className="mt-0.5 max-w-[140px] truncate text-base font-semibold tracking-tight tabular-nums text-[#1e8e3e] dark:text-[#10b981]">
            {formatCurrencySymbol(amount, currency.symbol, currency.locale)}
          </p>
        </div>
      </div>

      {/* ── Metrics — ruled off, so the figures don't run into the name ──
          Staff see orders only; the other roles get the full breakdown. */}
      <div className="mt-4 flex items-stretch divide-x divide-[#e8eaed]  pt-3 border-[#e8eaed] dark:border-white/10">
        <Metric icon={ShoppingCart} value={ordersTaken} label="Orders" />
        {roleKey !== "Staff" && (
          <>
            <Metric icon={TrendingUp} value={salesTaken} label="Sales" />
            <Metric
              icon={Clock}
              value={avgTime && avgTime !== "—" ? avgTime : "—"}
              label="Avg Time"
            />
          </>
        )}
      </div>

      {/* Spacer to push the footer down */}
      <div className="flex-1" />

      {/* ── Footer ── */}
      <div className="mt-3 pt-3 border-[#e8eaed] dark:border-white/10">
        <div className="flex items-center justify-center gap-1.5 text-[11px] transition-colors group-hover:text-blue-700 text-[#5f6368] dark:text-[#a9b4c7] dark:group-hover:text-[#a8c4ee]">
          View full report
          <ArrowRight
            size={14}
            className="transition-transform group-hover:translate-x-0.5"
          />
        </div>
      </div>
    </Link>
  );
}
