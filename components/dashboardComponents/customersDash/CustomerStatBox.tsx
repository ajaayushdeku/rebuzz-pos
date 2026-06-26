import type { LucideIcon } from "lucide-react";

export interface StatBoxProps {
  key: string;
  label: string;
  value: number;
  icon: LucideIcon;
  iconColor?: string;
  bgColor?: string;
  format?: "currency" | "number" | "percent";
}

export default function CustomerStatBox({
  label,
  value,
  icon: Icon,
  iconColor,
  bgColor,
}: StatBoxProps) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-gray-400 font-medium">{label}</span>
        <div
          className={`w-7 h-7 rounded-lg ${bgColor ?? "bg-gray-50"} flex items-center justify-center shrink-0`}
        >
          <Icon size={16} className={iconColor ?? "text-gray-500"} />
        </div>
      </div>
      <p className="text-lg font-bold text-gray-900 truncate">
        {String(value)}
      </p>
    </div>
  );
}
