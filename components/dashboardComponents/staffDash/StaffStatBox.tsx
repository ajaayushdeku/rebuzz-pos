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
  ChevronRight,
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

// ── Color-scheme per index (tied to avatarColors) ─────────────────────
// Each entry: [border-left, full-border, bg-tint, accent-text, avatar-gradient, avatar-ring]

const cardColorSchemes = [
  {
    borderLeft: "border-l-pink-500",
    border: "border-pink-200",
    bgTint: "bg-pink-50/60",
    accentText: "text-pink-600",
    avatar: "from-pink-500 to-pink-700",
    avatarRing: "ring-2 ring-pink-300 ring-offset-2",
  },
  {
    borderLeft: "border-l-blue-500",
    border: "border-blue-200",
    bgTint: "bg-blue-50/60",
    accentText: "text-blue-600",
    avatar: "from-blue-500 to-blue-700",
    avatarRing: "ring-2 ring-blue-300 ring-offset-2",
  },
  {
    borderLeft: "border-l-amber-500",
    border: "border-amber-200",
    bgTint: "bg-amber-50/60",
    accentText: "text-amber-600",
    avatar: "from-amber-500 to-amber-700",
    avatarRing: "ring-2 ring-amber-300 ring-offset-2",
  },
  {
    borderLeft: "border-l-emerald-500",
    border: "border-emerald-200",
    bgTint: "bg-emerald-50/60",
    accentText: "text-emerald-600",
    avatar: "from-emerald-500 to-emerald-700",
    avatarRing: "ring-2 ring-emerald-300 ring-offset-2",
  },
  {
    borderLeft: "border-l-purple-500",
    border: "border-purple-200",
    bgTint: "bg-purple-50/60",
    accentText: "text-purple-600",
    avatar: "from-purple-500 to-purple-700",
    avatarRing: "ring-2 ring-purple-300 ring-offset-2",
  },
  {
    borderLeft: "border-l-orange-500",
    border: "border-orange-200",
    bgTint: "bg-orange-50/60",
    accentText: "text-orange-600",
    avatar: "from-orange-500 to-orange-700",
    avatarRing: "ring-2 ring-orange-300 ring-offset-2",
  },
  {
    borderLeft: "border-l-cyan-500",
    border: "border-cyan-200",
    bgTint: "bg-cyan-50/60",
    accentText: "text-cyan-600",
    avatar: "from-cyan-500 to-cyan-700",
    avatarRing: "ring-2 ring-cyan-300 ring-offset-2",
  },
];

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

  const idx = colorIndex % cardColorSchemes.length;
  const colors = cardColorSchemes[idx];

  return (
    <div
      className={`relative rounded-xl bg-white overflow-hidden transition-all duration-300 cursor-pointer group
        border-l-4 ${colors.borderLeft} border-t border-r border-b  shadow-sm hover:shadow-md`}
      onClick={() => router.push(`/records/employee/${staffId}`)}
    >
      <div className="p-4">
        {/* ── Header row ── */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Avatar */}
            <div className="relative">
              <div
                className={`rounded-full w-10 h-10 shrink-0 bg-gradient-to-br ${colors.avatar} flex items-center text-white font-bold text-sm justify-center ${colors.avatarRing}`}
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
                <RoleIcon size={11} className={colors.accentText} />
                <span
                  className={`inline-block px-2 py-0.5 rounded text-[10px] font-semibold leading-tight ${rConfig.badge}`}
                >
                  {rConfig.label}
                </span>
              </div>
            </div>
          </div>

          {/* Rank indicator arrow */}
          <ChevronRight
            size={16}
            className="text-gray-300 group-hover:text-gray-500 group-hover:translate-x-0.5 transition-all shrink-0"
          />
        </div>

        {/* ── Metrics grid ── */}
        {roleKey === "Staff" ? (
          /* Staff: only show Orders, but keep 2x2 grid height */
          <div className="mt-3 grid grid-cols-1 gap-1.5">
            <div className={`rounded-md p-1.5 text-center ${colors.bgTint}`}>
              <ShoppingCart
                size={12}
                className={`mx-auto mb-1 ${colors.accentText}`}
              />
              <p className="text-xs font-bold text-gray-900 leading-none">
                {ordersTaken}
              </p>
              <p className="text-[8px] text-gray-400 uppercase tracking-wider mt-0.5 font-medium">
                Orders
              </p>
            </div>
          </div>
        ) : (
          /* Owner / Basic: full metrics grid */
          <div className="mt-3 grid grid-cols-4 gap-1.5">
            {/* Orders */}
            <div className={`rounded-md p-1.5 text-center ${colors.bgTint}`}>
              <ShoppingCart
                size={12}
                className={`mx-auto mb-1 ${colors.accentText}`}
              />
              <p className="text-xs font-bold text-gray-900 leading-none">
                {ordersTaken}
              </p>
              <p className="text-[8px] text-gray-400 uppercase tracking-wider mt-0.5 font-medium">
                Orders
              </p>
            </div>

            {/* Sales */}
            <div className={`rounded-md p-1.5 text-center ${colors.bgTint}`}>
              <TrendingUp
                size={12}
                className={`mx-auto mb-1 ${colors.accentText}`}
              />
              <p className="text-xs font-bold text-gray-900 leading-none">
                {salesTaken}
              </p>
              <p className="text-[8px] text-gray-400 uppercase tracking-wider mt-0.5 font-medium">
                Sales
              </p>
            </div>

            {/* Revenue (wider column) */}
            <div className="rounded-md p-1.5 text-center bg-emerald-50/60">
              <DollarSign size={12} className="mx-auto mb-1 text-emerald-600" />
              <p className="text-xs font-bold text-gray-900 leading-none truncate">
                {formatCurrencySymbol(amount, currency.symbol, currency.locale)}
              </p>
              <p className="text-[8px] text-gray-400 uppercase tracking-wider mt-0.5 font-medium">
                Revenue
              </p>
            </div>

            {/* Avg Time */}
            <div className={`rounded-md p-1.5 text-center ${colors.bgTint}`}>
              <Clock
                size={12}
                className={`mx-auto mb-1 ${colors.accentText}`}
              />
              <p className="text-xs font-bold text-gray-900 leading-none">
                {avgTime && avgTime !== "—" ? avgTime : "—"}
              </p>
              <p className="text-[8px] text-gray-400 uppercase tracking-wider mt-0.5 font-medium">
                Avg Time
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
