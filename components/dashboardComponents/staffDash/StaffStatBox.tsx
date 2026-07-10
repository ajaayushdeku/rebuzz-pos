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
  DollarSign,
  ArrowRight,
} from "lucide-react";

export interface StaffBoxProps {
  staffId: string;
  staffName: string;
  staffPosition?: string;
  salesTaken: number;
  ordersTaken: number;
  amount: number;
  avgTime?: string;
  colorIndex?: number;
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

// ── Consistent card styling ───────────────────────────────────────────
// All cards share the same color for the left border and avatar;
// only the role badge uses distinct colors per role.

const cardColors = {
  borderLeft: "border-l-blue-400",
  avatar: "from-blue-400 to-blue-400",
  avatarRing: "ring-2 ring-blue-400 ring-offset-2",
};

// ── Role-based configuration (badge + label + icon only) ───────────────

const roleConfig = {
  Owner: {
    badge: "bg-amber-50 text-amber-700 border border-amber-200",
    label: "Owner",
    icon: Crown,
  },
  Staff: {
    badge: "bg-blue-50 text-blue-700 border border-blue-200",
    label: "Staff",
    icon: User,
  },
  Basic: {
    badge: "bg-indigo-50 text-indigo-700 border border-indigo-200",
    label: "Basic",
    icon: User,
  },
};

export default function StaffStatBox({
  staffId,
  staffName,
  staffPosition = "Basic",
  salesTaken,
  ordersTaken,
  amount,
  avgTime,
  colorIndex = 0,
  role,
}: StaffBoxProps) {
  const roleKey = role ?? resolveRole(staffPosition);
  const rConfig = roleConfig[roleKey];
  const RoleIcon = rConfig.icon;
  const router = useRouter();
  const staffInitials = getInitials(staffName);
  const { currency } = useCurrency();

  const colors = cardColors;

  return (
    <div
      className="relative rounded-xl bg-white overflow-hidden transition-all duration-300 cursor-pointer group
        border-t-4 border-t-blue-400 border border-gray-200 shadow-sm hover:shadow-md"
      onClick={() => router.push(`/records/employee/${staffId}`)}
    >
      <div className="p-4 flex flex-col h-full">
        {/* ── Header row with Revenue on the right ── */}
        <div className="flex items-start justify-between">
          {/* Avatar + Name + Role */}
          <div className="flex items-center gap-3">
            <div className="relative">
              <div
                className={`rounded-full w-10 h-10 shrink-0 bg-gradient-to-br ${colors.avatar} flex items-center text-white font-bold text-sm justify-center`}
              >
                {staffInitials}
              </div>
              {/* Role badge dot */}
              {roleKey === "Owner" && (
                <div className="absolute -top-1 -right-1 bg-amber-400 rounded-full p-0.5 shadow">
                  <Crown size={10} className="text-white" />
                </div>
              )}
            </div>

            {/* Name + Role badge */}
            <div className="min-w-0">
              <p className="text-gray-900 font-semibold text-sm truncate leading-tight">
                {staffName}
              </p>
              <div className="flex items-center gap-1.5 mt-1.5">
                <RoleIcon size={11} className="text-gray-400" />
                <span
                  className={`inline-block px-2 py-0.5 rounded text-[10px] font-semibold leading-tight ${rConfig.badge}`}
                >
                  {rConfig.label}
                </span>
              </div>
            </div>
          </div>

          {/* Revenue on top right */}
          <div className="flex flex-col items-end shrink-0">
            <div className="flex items-center gap-1">
              {/* <DollarSign size={12} className="text-green-500" /> */}
              <span className="text-[8px] text-gray-400 uppercase tracking-wider font-medium">
                Revenue
              </span>
            </div>
            <p className="text-sm font-bold text-green-500 leading-none mt-0.5 truncate max-w-[130px]">
              {formatCurrencySymbol(amount, currency.symbol, currency.locale)}
            </p>
          </div>
        </div>

        {/* ── Metrics grid ── */}
        {roleKey === "Staff" ? (
          <div className="mt-4 grid grid-cols-1 gap-1.5">
            <div className="p-1.5 text-center">
              <ShoppingCart size={12} className="mx-auto mb-1 text-gray-500" />
              <p className="text-xs font-bold text-gray-900 leading-none">
                {ordersTaken}
              </p>
              <p className="text-[8px] text-gray-400 uppercase tracking-wider mt-0.5 font-medium">
                Orders
              </p>
            </div>
          </div>
        ) : (
          <div className="mt-4 grid grid-cols-3 gap-1.5">
            {/* Orders */}
            <div className="p-1.5 text-center">
              <ShoppingCart size={12} className="mx-auto mb-1 text-gray-500" />
              <p className="text-xs font-bold text-gray-900 leading-none">
                {ordersTaken}
              </p>
              <p className="text-[8px] text-gray-400 uppercase tracking-wider mt-0.5 font-medium">
                Orders
              </p>
            </div>

            {/* Sales */}
            <div className="p-1.5 text-center">
              <TrendingUp size={12} className="mx-auto mb-1 text-gray-500" />
              <p className="text-xs font-bold text-gray-900 leading-none">
                {salesTaken}
              </p>
              <p className="text-[8px] text-gray-400 uppercase tracking-wider mt-0.5 font-medium">
                Sales
              </p>
            </div>

            {/* Avg Time */}
            <div className="p-1.5 text-center">
              <Clock size={12} className="mx-auto mb-1 text-gray-500" />
              <p className="text-xs font-bold text-gray-900 leading-none">
                {avgTime && avgTime !== "—" ? avgTime : "—"}
              </p>
              <p className="text-[8px] text-gray-400 uppercase tracking-wider mt-0.5 font-medium">
                Avg Time
              </p>
            </div>
          </div>
        )}

        {/* Spacer to push footer down */}
        <div className="flex-1" />

        {/* ── "View full report" footer ── */}
        <div className="mt-3 pt-3 border-t border-gray-100">
          <div className="flex items-center justify-center gap-1.5 text-[11px] font-medium text-gray-600 group-hover:text-blue-700 transition-colors">
            View full report
            <ArrowRight
              size={14}
              className="group-hover:translate-x-0.5 transition-transform"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
