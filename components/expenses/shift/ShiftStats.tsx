import type { ShiftStats } from "@/lib/types/shift";
import { formatCurrency } from "@/utils/helper";
import { useCurrency } from "@/providers/CurrencyContext";
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Wallet,
  Clock,
  User,
  Banknote,
} from "lucide-react";

const ICON_MAP: Record<string, React.ElementType> = {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Wallet,
  Banknote,
};

type StatCardProps = {
  label: string;
  value: number;
  iconName: string;
  iconColor?: string;
  compact?: boolean;
};

const StatCard = ({
  label,
  value,
  iconName,
  iconColor = "text-blue-600",
  compact = false,
}: StatCardProps) => {
  const { currency } = useCurrency();
  const Icon = ICON_MAP[iconName];

  return (
    <div className="border w-full rounded-lg shadow-sm hover:shadow-md transition duration-300">
      {compact ? (
        <div className="px-3 py-2.5 md:px-4 md:py-3">
          <div className="flex justify-between items-center mb-1">
            <p className="text-gray-500 text-[11px] md:text-xs leading-tight">
              {label}
            </p>
            <Icon size={13} className={`${iconColor} shrink-0`} />
          </div>
          <span className="font-bold text-sm md:text-base">
            {formatCurrency(value, currency)}
          </span>
        </div>
      ) : (
        <div className="px-4 py-3 md:px-5 md:py-4">
          <div className="flex justify-between items-end">
            <p className="text-gray-500 text-xs md:text-sm leading-tight">
              {label}
            </p>
            <Icon
              size={15}
              className={`${iconColor} mb-0.5 rounded-lg shrink-0`}
            />
          </div>
          <div className="pt-3">
            <span className="font-bold text-base md:text-xl">
              {formatCurrency(value, currency)}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default function ShiftStatsPanel({ shift }: { shift: ShiftStats }) {
  return (
    <div className="bg-white rounded-xl  md: mb-4">
      {/* ── Shift header info ── */}
      <div className="flex flex-wrap items-center justify-between gap-2 mb-4 pb-4 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
            <Clock size={15} className="text-blue-600" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold text-gray-900">
                Active Shift
              </h3>
              <span className="text-[10px] bg-green-100 text-green-700 font-medium px-2 py-0.5 rounded-full">
                Live
              </span>
            </div>
            <p className="text-[11px] text-gray-400 mt-0.5">
              Started at {shift.openingTime}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-gray-500 bg-gray-50 rounded-lg px-3 py-1.5">
          <User size={13} className="text-gray-400" />
          {shift.employeeName}
        </div>
      </div>

      {/* ── Highlighted transaction stats (larger cards) ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 md:gap-3 mb-3">
        <StatCard
          label="Pay In"
          value={shift.payIn}
          iconName="TrendingUp"
          iconColor="text-green-600"
        />
        <StatCard
          label="Pay Out"
          value={shift.payOut}
          iconName="TrendingDown"
          iconColor="text-red-600"
        />
        <StatCard
          label="Cash Sales"
          value={shift.cashSale}
          iconName="DollarSign"
          iconColor="text-blue-600"
        />
        <StatCard
          label="Total Sales"
          value={shift.totalSale}
          iconName="TrendingUp"
          iconColor="text-blue-700"
        />
      </div>

      {/* ── Secondary drawer stats (smaller compact cards) ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 md:gap-3">
        <StatCard
          label="Opening Amount"
          value={shift.openingCash}
          iconName="Banknote"
          iconColor="text-gray-600"
          compact
        />
        <StatCard
          label="Expected Drawer"
          value={shift.expectedAmount}
          iconName="Wallet"
          iconColor={
            shift.expectedAmount >= 0 ? "text-green-600" : "text-red-600"
          }
          compact
        />
        <StatCard
          label="Drawer Amount"
          value={shift.drawerAmount}
          iconName="Wallet"
          iconColor={
            shift.drawerAmount >= 0 ? "text-green-600" : "text-red-600"
          }
          compact
        />
        <StatCard
          label="Drawer Diff"
          value={shift.drawerAmount - shift.expectedAmount}
          iconName="TrendingUp"
          iconColor={
            shift.drawerAmount - shift.expectedAmount >= 0
              ? "text-green-600"
              : "text-red-600"
          }
          compact
        />
      </div>
    </div>
  );
}
