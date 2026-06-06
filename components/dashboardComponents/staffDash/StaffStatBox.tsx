"use client";

import { ShoppingCart } from "lucide-react";
import { useCurrency } from "@/providers/CurrencyContext";
import { formatCurrency } from "@/utils/helper";

export interface StaffBoxProps {
  staffName: string;
  staffPosition?: string;
  ordersTaken: number;
  amount: number;
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
  staffName,
  staffPosition = "Basic",
  ordersTaken,
  amount,
  colorIndex = 0,
}: StaffBoxProps) {
  const staffInitials = getInitials(staffName);

  const idx = colorIndex % avatarColors.length;
  console.log("StaffStatBox colorIndex:", colorIndex, "mapped to idx:", idx);
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

        {/* Metrics row */}
        <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-50">
          {/* Orders */}
          <div className="flex items-center gap-2">
            <div className={`rounded-lg p-1.5 ${avatarBg}`}>
              <ShoppingCart
                size={14}
                className={`${avatarColor.replace("from-", "text-").split(" ")[0]}`}
              />
            </div>
            <div>
              <p className="text-[10px] text-gray-400 uppercase tracking-wide font-medium">
                Orders
              </p>
              <p className="font-bold text-gray-900 text-sm">{ordersTaken}</p>
            </div>
          </div>

          {/* Revenue */}
          <div className="flex items-center gap-2">
            {/* <div className={`rounded-lg p-1.5 ${avatarBg}`}>
              <TrendingUp
                size={14}
                className={`${avatarColor.replace("from-", "text-").split(" ")[0]}`}
              />
            </div> */}
            <div className="text-right">
              <p className="text-[10px] text-gray-400 uppercase tracking-wide font-medium">
                Revenue
              </p>
              <p className="font-bold text-green-600 text-sm">
                {formatCurrency(amount, currency)}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
