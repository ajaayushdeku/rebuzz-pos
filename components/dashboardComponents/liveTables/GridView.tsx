"use client";

import { Users, Clock, DollarSign, Sparkles } from "lucide-react";
import type { LiveTable } from "@/lib/mockData/mock-live-tables";
import { fmtMinutes, getStatusLabel } from "@/lib/mockData/mock-live-tables";
import { useCurrency } from "@/providers/CurrencyContext";
import { formatCurrencySymbol } from "@/utils/helper";

const STATUS_BADGE: Record<string, string> = {
  seated: "bg-blue-100 text-blue-700",
  open: "bg-green-100 text-green-700",
  reserved: "bg-amber-100 text-amber-700",
  cleaning: "bg-red-100 text-red-600",
  paying: "bg-purple-100 text-purple-700",
};

const STATUS_BORDER: Record<string, string> = {
  seated: "border-t-blue-500",
  open: "border-t-green-500",
  reserved: "border-t-amber-500",
  cleaning: "border-t-red-500",
  paying: "border-t-purple-500",
};

function TableCard({
  table,
  isSelected,
  onClick,
}: {
  table: LiveTable;
  isSelected: boolean;
  onClick: () => void;
}) {
  const { currency } = useCurrency();
  const isActive = table.status === "seated" || table.status === "paying";
  const borderTop = STATUS_BORDER[table.status] ?? "border-t-gray-200";

  return (
    <div
      onClick={onClick}
      className={`bg-white rounded-2xl border-t-4 border border-gray-100 shadow-sm p-4 cursor-pointer transition-all hover:shadow-md ${borderTop} ${
        isSelected ? "ring-2 ring-blue-400" : ""
      }`}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div>
          <p className="text-sm font-bold text-gray-900">Table {table.id}</p>
          <p className="text-[11px] text-gray-400">
            {table.zone === "indoor" ? "Indoor" : "Outdoor"} · cap{" "}
            {table.capacity}
          </p>
        </div>
        <span
          className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${STATUS_BADGE[table.status]}`}
        >
          {table.status === "cleaning"
            ? "Needs Cleaning"
            : table.status.charAt(0).toUpperCase() + table.status.slice(1)}
        </span>
      </div>

      {/* Stats */}
      {isActive ? (
        <div className="space-y-1.5 text-xs text-gray-600">
          <div className="flex items-center gap-2">
            <Users size={12} className="text-gray-400 shrink-0" />
            <span>
              Covers:{" "}
              <span className="font-semibold text-gray-900">
                {table.covers}/{table.capacity}
              </span>
            </span>
          </div>
          {table.server && (
            <div className="flex items-center gap-2">
              <Sparkles size={12} className="text-gray-400 shrink-0" />
              <span>
                Server:{" "}
                <span className="font-semibold text-gray-900">
                  {table.server}
                </span>
              </span>
            </div>
          )}
          {table.seatedMinutes != null && (
            <div className="flex items-center gap-2">
              <Clock size={12} className="text-gray-400 shrink-0" />
              <span>
                Seated:{" "}
                <span className="font-semibold text-gray-900">
                  {fmtMinutes(table.seatedMinutes)}
                </span>
              </span>
            </div>
          )}
          {table.bill != null && (
            <div className="flex items-center gap-2">
              <DollarSign size={12} className="text-gray-400 shrink-0" />
              <span>
                Bill:{" "}
                <span className="font-semibold text-green-600">
                  {formatCurrencySymbol(
                    table.bill,
                    currency.symbol,
                    currency.locale,
                  )}
                </span>
              </span>
            </div>
          )}
        </div>
      ) : table.status === "reserved" ? (
        <div className="space-y-1.5 text-xs text-gray-600">
          <div className="flex items-center gap-2">
            <Users size={12} className="text-gray-400" />
            <span>
              Covers:{" "}
              <span className="font-semibold text-gray-900">
                0/{table.capacity}
              </span>
            </span>
          </div>
          {table.server && (
            <div className="flex items-center gap-2">
              <Sparkles size={12} className="text-gray-400" />
              <span>
                Server:{" "}
                <span className="font-semibold text-gray-900">
                  {table.server}
                </span>
              </span>
            </div>
          )}
        </div>
      ) : (
        <div className="flex items-center gap-2 text-xs text-gray-400">
          <Users size={12} />
          <span>Covers: 0/{table.capacity}</span>
        </div>
      )}
    </div>
  );
}

interface GridViewProps {
  tables: LiveTable[];
  selectedTableId: number | null;
  onSelectTable: (table: LiveTable) => void;
}

export default function GridView({
  tables,
  selectedTableId,
  onSelectTable,
}: GridViewProps) {
  const indoor = tables.filter((t) => t.zone === "indoor");
  const outdoor = tables.filter((t) => t.zone === "outdoor");

  return (
    <div className="space-y-6">
      {/* Indoor */}
      <div>
        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">
          Indoor · {indoor.length} tables
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {indoor.map((t) => (
            <TableCard
              key={t.id}
              table={t}
              isSelected={selectedTableId === t.id}
              onClick={() => onSelectTable(t)}
            />
          ))}
        </div>
      </div>

      {/* Outdoor */}
      <div>
        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">
          Outdoor · {outdoor.length} tables
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {outdoor.map((t) => (
            <TableCard
              key={t.id}
              table={t}
              isSelected={selectedTableId === t.id}
              onClick={() => onSelectTable(t)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
