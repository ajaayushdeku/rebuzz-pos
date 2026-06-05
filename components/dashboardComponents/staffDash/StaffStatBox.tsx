"use client";

import { ShoppingCart } from "lucide-react";
import { useCurrency } from "@/providers/CurrencyContext";
import { formatCurrency } from "@/utils/helper";

export interface StaffBoxProps {
  staffName: string;
  staffPosition?: string;
  ordersTaken: number;
  amount: number;
}

const avatarColors = [
  "bg-green-600",
  "bg-blue-600",
  "bg-purple-600",
  "bg-rose-600",
  "bg-orange-600",
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
}: StaffBoxProps) {
  const staffInitials = getInitials(staffName);

  const colorIndex = staffInitials.charCodeAt(0) % avatarColors.length;
  const avatarColor = avatarColors[colorIndex];

  const { currency } = useCurrency();
  return (
    <div className="border px-5 py-5 rounded-xl shadow-sm hover:shadow-md transition duration-300 bg-white">
      {/* Header: Avatar + Name + Revenue */}
      <div className="flex items-center gap-3">
        <div
          className={`rounded-full w-10 h-10 shrink-0 ${avatarColor} flex items-center text-white font-semibold text-sm justify-center`}
        >
          {staffInitials}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-gray-900 font-semibold truncate text-sm">
            {staffName}
          </p>
          <p className="text-gray-400 text-xs truncate">{staffPosition}</p>
        </div>
        <span className="text-green-500 font-semibold text-sm whitespace-nowrap">
          {formatCurrency(amount, currency)}
        </span>
      </div>

      {/* Divider */}
      <div className="border-t border-gray-50 my-3" />

      {/* Orders row */}
      <div className="flex items-center gap-1.5 text-gray-500">
        <ShoppingCart size={13} className="text-gray-400 shrink-0" />
        <span className="text-xs">Orders:</span>
        <span className="font-bold text-gray-900 text-sm">{ordersTaken}</span>
      </div>
    </div>
  );
}
