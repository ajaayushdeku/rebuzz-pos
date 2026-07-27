"use client";

import { DollarSign, Clock, Users, Sparkles } from "lucide-react";
import type { LiveTable } from "@/lib/mockData/mock-live-tables";
import { fmtMinutes } from "@/lib/mockData/mock-live-tables";
import { useCurrency } from "@/providers/CurrencyContext";
import { formatCurrencySymbol } from "@/utils/helper";

const STATUS_BADGE: Record<string, string> = {
  seated: "bg-blue-600 text-white",
  open: "bg-green-500 text-white",
  reserved: "bg-amber-500 text-white",
  cleaning: "bg-red-500 text-white",
  paying: "bg-purple-600 text-white",
};

const ITEM_STATUS_BADGE: Record<string, string> = {
  served: "bg-green-100 text-green-700",
  pending: "bg-amber-100 text-amber-700",
  preparing: "bg-blue-100 text-blue-700",
};

interface TableDetailProps {
  table: LiveTable;
}

export default function TableDetail({ table }: TableDetailProps) {
  const { currency } = useCurrency();
  const statusLabel =
    table.status.charAt(0).toUpperCase() + table.status.slice(1);
  const isActive = table.status === "seated" || table.status === "paying";
  const total = (table.orders ?? []).reduce((s, o) => s + o.price * o.qty, 0);

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
      {/* Header */}
      <div className="flex items-start justify-between mb-2">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Table {table.id}</h2>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-xs text-gray-500 capitalize">
              {table.shape}
            </span>
            <span className="text-gray-300">·</span>
            <span className="text-xs text-gray-500 capitalize">
              {table.zone}
            </span>
            {table.status === "paying" && (
              <>
                <span className="text-gray-300">·</span>
                <span className="text-xs text-purple-600 font-semibold">
                  Paying
                </span>
              </>
            )}
          </div>
        </div>
        <span
          className={`text-xs font-bold px-3 py-1.5 rounded-full ${STATUS_BADGE[table.status]}`}
        >
          {statusLabel}
        </span>
      </div>

      {/* ── 4 stat cards ── */}
      {isActive && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 my-4">
          {[
            {
              icon: <DollarSign size={18} className="text-green-500" />,
              bg: "bg-green-50",
              label: "Current Bill",
              value: formatCurrencySymbol(
                table.bill ?? 0,
                currency.symbol,
                currency.locale,
              ),
            },
            {
              icon: <Clock size={18} className="text-blue-500" />,
              bg: "bg-blue-50",
              label: "Time Seated",
              value: fmtMinutes(table.seatedMinutes ?? 0),
            },
            {
              icon: <Users size={18} className="text-violet-500" />,
              bg: "bg-violet-50",
              label: "Covers",
              value: `${table.covers} / ${table.capacity}`,
            },
            {
              icon: <Sparkles size={18} className="text-amber-500" />,
              bg: "bg-amber-50",
              label: "Server",
              value: table.server ?? "—",
            },
          ].map(({ icon, bg, label, value }) => (
            <div
              key={label}
              className={`flex items-center gap-3 ${bg} rounded-xl p-3.5`}
            >
              {icon}
              <div>
                <p className="text-[10px] text-gray-500 uppercase tracking-wide">
                  {label}
                </p>
                <p className="text-sm font-bold text-gray-900 mt-0.5">
                  {value}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Order details ── */}
      {(table.orders ?? []).length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="text-sm">📋</span>
              <p className="text-sm font-semibold text-gray-900">
                Order Details
              </p>
            </div>
            <p className="text-xs text-gray-400">
              {table.orders!.length} items
            </p>
          </div>

          <div className="space-y-2">
            {table.orders!.map((item, i) => (
              <div
                key={i}
                className="flex items-center justify-between py-2.5 border-b border-gray-50 last:border-0"
              >
                <div className="flex items-center gap-3">
                  <span className="text-xs text-gray-400 font-mono">
                    {item.qty}×
                  </span>
                  <span className="text-sm text-gray-800">{item.name}</span>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${ITEM_STATUS_BADGE[item.status]}`}
                  >
                    {item.status}
                  </span>
                </div>
                <span className="text-sm text-gray-700 font-semibold">
                  {formatCurrencySymbol(
                    item.price * item.qty,
                    currency.symbol,
                    currency.locale,
                  )}
                </span>
              </div>
            ))}
          </div>

          {/* Total */}
          <div className="flex items-center justify-between pt-3 mt-1 border-t border-gray-100">
            <span className="text-sm font-semibold text-gray-700">Total</span>
            <span className="text-base font-bold text-green-600">
              {formatCurrencySymbol(total, currency.symbol, currency.locale)}
            </span>
          </div>
        </div>
      )}

      {/* Empty state for non-active tables */}
      {!isActive && (
        <div className="py-6 text-center text-gray-400 text-sm">
          {table.status === "open" && "This table is available for seating."}
          {table.status === "reserved" && "This table has a reservation."}
          {table.status === "cleaning" &&
            "This table needs cleaning before it can be seated."}
        </div>
      )}
    </div>
  );
}
