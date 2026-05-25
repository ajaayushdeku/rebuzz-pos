"use client";

import { Clock, ShoppingCart, Star } from "lucide-react";
import { formatDuration } from "@/lib/utils";
import { useCurrency } from "@/providers/CurrencyContext";
import { formatCurrency } from "@/utils/helper";

export interface StaffBoxProps {
  staffName: string;
  staffPosition: string;
  ordersTaken: number;
  avgTime?: number;
  rating?: number;
  shiftTime: string;
  amount: number;
}

const shiftStyles: Record<string, string> = {
  Morning: "bg-amber-100 text-amber-600",
  Afternoon: "bg-blue-100 text-blue-600",
  Evening: "bg-indigo-100 text-indigo-600",
};

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
  staffPosition,
  ordersTaken,
  avgTime,
  rating,

  shiftTime,
  amount,
}: StaffBoxProps) {
  const shiftClass = shiftStyles[shiftTime] ?? "bg-gray-100 text-gray-600";

  const staffInitials = getInitials(staffName);

  const colorIndex = staffInitials.charCodeAt(0) % avatarColors.length;
  const avatarColor = avatarColors[colorIndex];

  const { currency } = useCurrency();
  return (
    <div className="border px-6 py-6  rounded-lg shadow-md hover:shadow-lg transition duration-300">
      {/* TOTAL SALES */}
      <div className="flex items-center px-2 gap-3 ">
        <div
          className={`rounded-full w-10 h-10 shrink-0 ${avatarColor} flex items-center text-gray-100 font-semibold justify-center`}
        >
          {/* Replace later with images */}
          {staffInitials}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-gray-900 font-semibold truncate">{staffName}</p>
          <p className="text-gray-500 text-sm truncate">{staffPosition}</p>
        </div>
      </div>
      <div className="py-4 mt-2 flex items-center justify-between">
        {/* Order number */}
        <div className="flex flex-col items-center justify-center">
          <ShoppingCart size={14} className="text-gray-400" />
          <p className="font-bold text-[16px] ">{ordersTaken}</p>
          <p className="text-[12px] text-gray-400">Orders</p>
        </div>
        {/* Average Time */}
        <div className="flex flex-col items-center justify-center">
          <Clock size={14} className="text-gray-400" />

          <p className="font-bold text-[16px] ">
            {avgTime != null ? formatDuration(avgTime) : "—"}
          </p>
          <p className="text-[12px] text-gray-400">Avg Time</p>
        </div>
        {/* Rating */}
        <div className="flex flex-col items-center justify-center">
          <Star size={14} className="text-amber-300" />

          <p className="font-bold text-[16px] ">
            {rating != null ? rating : "—"}
          </p>
          <p className="text-[12px] text-gray-400">Rating</p>
        </div>
      </div>
      <div className="flex items-center justify-between">
        <div className=" w-11">
          <span className={`text-[10px] rounded-lg p-1 ${shiftClass}`}>
            {shiftTime}
          </span>
        </div>
        <span className="text-green-500 font-semibold">
          {formatCurrency(amount as number, currency)}
        </span>
      </div>
    </div>
  );
}
