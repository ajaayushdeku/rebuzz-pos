"use client";

import { useCurrency } from "@/providers/CurrencyContext";
import { formatCurrencySymbol } from "@/utils/helper";
import { useRouter } from "next/navigation";

export interface StaffBoxProps {
  staffId: string;
  staffName: string;
  staffPosition?: string;
  ordersTaken: number;
  amount: number;
  avgTime?: string;
  colorIndex?: number;
}

const avatarColors = [
  "from-pink-500 to-pink-700",
  "from-blue-500 to-blue-700",
  "from-amber-500 to-amber-700",
  "from-emerald-500 to-emerald-700",
  "from-purple-500 to-purple-700",
  "from-orange-500 to-orange-700",
  "from-cyan-500 to-cyan-700",
];
const avatarBgColors = [
  "bg-pink-50",
  "bg-blue-50",
  "bg-amber-50",
  "bg-emerald-50",
  "bg-purple-50",
  "bg-orange-50",
  "bg-cyan-50",
];
const topBarColors = [
  "bg-gradient-to-r from-pink-500 to-pink-400",
  "bg-gradient-to-r from-blue-500 to-blue-400",
  "bg-gradient-to-r from-amber-500 to-amber-400",
  "bg-gradient-to-r from-emerald-500 to-emerald-400",
  "bg-gradient-to-r from-purple-500 to-purple-400",
  "bg-gradient-to-r from-orange-500 to-orange-400",
  "bg-gradient-to-r from-cyan-500 to-cyan-400",
];

const getInitials = (name: string): string =>
  name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

export default function StaffStatBox({
  staffId,
  staffName,
  staffPosition = "Basic",
  ordersTaken,
  amount,
  avgTime,
  colorIndex = 0,
}: StaffBoxProps) {
  const router = useRouter();
  const staffInitials = getInitials(staffName);

  const idx = colorIndex % avatarColors.length;
  // console.log("StaffStatBox colorIndex:", colorIndex, "mapped to idx:", idx);
  const avatarColor = avatarColors[idx];
  const avatarBg = avatarBgColors[idx];
  const barColor = topBarColors[idx];

  const { currency } = useCurrency();
  return (
    <div className="relative border border-gray-100 rounded-xl shadow-sm hover:shadow-md transition duration-300 bg-white overflow-hidden">
      {/* Top color bar */}
      {/* <div className={`h-1.5 w-full ${barColor}`} /> */}

      <div className="px-4 py-4">
        {/* Header: Avatar + Name + Revenue */}
        <div className="flex items-center gap-3">
          <div
            className={`rounded-full w-9 h-9 shrink-0 bg-gradient-to-br ${avatarColor} flex items-center text-white font-bold text-sm justify-center shadow-sm`}
          >
            {staffInitials}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-gray-900 font-semibold truncate text-sm">
              {staffName}
            </p>
            <div className="flex items-center gap-1 mt-0.5">
              {/* <span
                className={`inline-block w-1.5 h-1.5 rounded-full ${ordersTaken > 0 ? "bg-green-400" : "bg-gray-300"}`}
              /> */}
              <p className="text-gray-400 text-xs truncate">{staffPosition}</p>
            </div>
          </div>
        </div>

        {/* Metrics: vertical rows (same for desktop and mobile) */}
        <div className="mt-4 pt-3 border-t border-gray-50">
          <div className="flex flex-col gap-2.5">
            <div className="flex items-center justify-between">
              <p className="text-[10px] text-gray-400 uppercase tracking-wide font-medium">
                Orders
              </p>
              <p className="font-bold text-gray-900 text-sm">{ordersTaken}</p>
            </div>
            <div className="flex items-center justify-between">
              <p className="text-[10px] text-gray-400 uppercase tracking-wide font-medium">
                Avg Time
              </p>
              <p className="font-bold text-indigo-600 text-sm">
                {avgTime || "—"}
              </p>
            </div>
            <div className="flex items-center justify-between">
              <p className="text-[10px] text-gray-400 uppercase tracking-wide font-medium">
                Revenue
              </p>
              <p className="font-bold text-green-600 text-sm">
                {formatCurrencySymbol(amount, currency.symbol, currency.locale)}
              </p>
            </div>
          </div>

          <div
            onClick={() =>
              router.push(
                `/records/staff/${staffId}${avgTime ? `?avgTime=${encodeURIComponent(avgTime)}` : ""}`,
              )
            }
            className="mt-4 border-t border-gray-100 pt-3 flex items-center justify-between text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors cursor-pointer"
          >
            <span>View Details</span>
            <span>→</span>
          </div>
        </div>
      </div>
    </div>
  );
}
