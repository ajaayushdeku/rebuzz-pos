"use client";
import { ICON_MAP } from "@/lib/config/dashboard";
import { useCurrency } from "@/providers/CurrencyContext";
import { StatBoxProps } from "../StatBox";
import { formatCurrencySymbol } from "@/utils/helper";
import RangeTag from "@/components/ui/RangeTag";

/**
 * A stat tile in the ChartCard look: hairline border, no shadow, a bordered
 * icon tile. Shared by the Profit stats and the Expense stats rows.
 */
export default function StatBox({
  label,
  value,
  iconName,
  iconColor,
  bgColor,
  format = "number",
}: StatBoxProps) {
  const { currency } = useCurrency();

  const formatValue = (val: number) => {
    if (format === "currency") {
      return formatCurrencySymbol(val, currency.symbol, currency.locale);
    }
    if (format === "percent") {
      return `${val}%`;
    }
    return val.toLocaleString();
  };

  const Icon = ICON_MAP[iconName];

  return (
    <div className="rounded-2xl border bg-white px-5 py-4 border-[#e3e3e3] dark:border-white/10 dark:bg-white/5">
      <div className="mb-3 flex items-center justify-between gap-2">
        <span className="truncate text-[13px] font-medium text-[#5f6368] dark:text-[#a9b4c7]">
          {label}
        </span>
        {/* The tile takes the icon's colour, so `border-current/20` gives a
            border in the same hue — as ChartCard's icon border does. */}
        <div
          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-current/20 ${bgColor ?? "bg-gray-50"} ${iconColor ?? "text-gray-500"}`}
        >
          <Icon size={16} />
        </div>
      </div>
      {/* The tag rides the value row rather than competing with the label for
          the top row's width — the same placement as the inventory summary
          tiles, so a range-scoped figure looks the same wherever it appears. */}
      <div className="flex items-baseline justify-between gap-2">
        <p className="truncate text-2xl font-semibold tracking-tight tabular-nums text-[#3c4043] dark:text-[#e8ecf4]">
          {formatValue(value)}
        </p>
        <RangeTag />
      </div>
    </div>
  );
}
