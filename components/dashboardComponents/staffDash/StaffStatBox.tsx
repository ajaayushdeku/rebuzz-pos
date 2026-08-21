"use client";

import { useCurrency } from "@/providers/CurrencyContext";
import { formatCurrencySymbol } from "@/utils/helper";
import { useRouter } from "next/navigation";
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
    badge: "bg-amber-50 text-amber-700 ring-amber-200",
    label: "Owner",
    icon: Crown,
  },
  Staff: {
    avatar: "bg-blue-500",
    badge: "bg-blue-50 text-blue-700 ring-blue-200",
    label: "Staff",
    icon: User,
  },
  Basic: {
    avatar: "bg-indigo-500",
    badge: "bg-indigo-50 text-indigo-700 ring-indigo-200",
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
      <Icon size={13} className="text-gray-400" />
      <p className="truncate text-sm font-bold leading-none text-gray-900 tabular-nums">
        {value}
      </p>
      <p className="text-[10px] font-medium uppercase tracking-wide text-gray-400">
        {label}
      </p>
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
  const router = useRouter();
  const staffInitials = getInitials(staffName);
  const { currency } = useCurrency();

  return (
    // A real button: the card was a div with onClick, so it could not be
    // reached or activated from the keyboard.
    <button
      type="button"
      onClick={() => router.push(`/records/employee/${staffId}`)}
      className="group bg-surface-card border-surface-border flex h-full w-full flex-col rounded-xl border p-4 text-left shadow-sm transition-shadow duration-200 hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
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
            <p className="truncate text-sm font-semibold leading-tight text-gray-900">
              {staffName}
            </p>
            <span
              className={`mt-1.5 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold leading-tight ring-1 ${rConfig.badge}`}
            >
              <RoleIcon size={10} />
              {rConfig.label}
            </span>
          </div>
        </div>

        <div className="flex shrink-0 flex-col items-end">
          <span className="text-[10px] font-medium uppercase tracking-wide text-gray-400">
            Revenue
          </span>
          <p className="mt-0.5 max-w-[140px] truncate text-base font-bold leading-tight text-green-700 tabular-nums">
            {formatCurrencySymbol(amount, currency.symbol, currency.locale)}
          </p>
        </div>
      </div>

      {/* ── Metrics — ruled off, so the figures don't run into the name ──
          Staff see orders only; the other roles get the full breakdown. */}
      <div className="mt-4 flex items-stretch divide-x divide-gray-100 border-t border-gray-100 pt-3">
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
      <div className="mt-3 border-t border-gray-100 pt-3 cursor-pointer">
        <div className="flex items-center justify-center gap-1.5 text-[11px] font-medium text-gray-500 transition-colors group-hover:text-blue-700">
          View full report
          <ArrowRight
            size={14}
            className="transition-transform group-hover:translate-x-0.5"
          />
        </div>
      </div>
    </button>
  );
}
