"use client";

import { useState } from "react";
import {
  DollarSign,
  Clock,
  Users,
  Sparkles,
  Loader2,
  Armchair,
} from "lucide-react";
import ModalShell from "@/components/ui/ModalShell";
import type { LiveTable } from "@/lib/mockData/mock-live-tables";
import { fmtMinutes } from "@/lib/mockData/mock-live-tables";
import { useCurrency } from "@/providers/CurrencyContext";
import { formatCurrencySymbol } from "@/utils/helper";
import { useTableTicket } from "@/hooks/useTableTicket";

type OrderRow = {
  name: string;
  qty: number;
  price: number;
  status: "served" | "pending" | "preparing";
};

const STATUS_BADGE: Record<string, string> = {
  occupied: "bg-blue-200 text-blue-700",
  free: "bg-green-100 text-green-700",
};

const ITEM_STATUS_BADGE: Record<string, string> = {
  served: "bg-green-100 text-green-700",
  pending: "bg-amber-100 text-amber-700",
  preparing: "bg-blue-100 text-blue-700",
};

interface TableDetailProps {
  /** Null closes the modal — the page holds the "which table" state. */
  table: LiveTable | null;
  open: boolean;
  onClose: () => void;
}

export default function TableDetail({
  table,
  open,
  onClose,
}: TableDetailProps) {
  const { currency } = useCurrency();

  // Occupied tables carry an open ticket — fetch its live details.
  const invoiceNo = table?.currentTicket?.invoice ?? null;
  const { data: ticket, isLoading: ticketLoading } = useTableTicket(invoiceNo);

  // Capture "now" once at mount via a lazy initializer so render stays pure.
  const [nowMs] = useState(() => Date.now());

  // Hooks must run before this — the early return has to come after them.
  if (!table) return null;

  const statusLabel =
    table.status.charAt(0).toUpperCase() + table.status.slice(1);
  // Treat any table with an open ticket as active so its live stats (bill, time
  // seated, order) render — matching what the floor-plan nodes already show.
  const isActive = table.status === "occupied" || !!table.currentTicket;

  // Prefer live ticket data; fall back to the table's own (derived) values.
  const ticketOrders: OrderRow[] = (ticket?.items ?? []).flatMap((group) =>
    (group.item ?? []).map((i) => ({
      name: i.productName,
      qty: i.quantity,
      price: i.unitPrice,
      status: "pending" as const,
    })),
  );
  const orders: OrderRow[] = ticket ? ticketOrders : (table.orders ?? []);

  const currentBill = ticket?.grandTotal ?? table.bill ?? 0;
  const lineTotal = orders.reduce((s, o) => s + o.price * o.qty, 0);
  const total = ticket ? currentBill : lineTotal;
  // Total number of products across the order (sum of quantities, not types).
  const totalItems = orders.reduce((s, o) => s + o.qty, 0);

  // Tax: each item's `taxAmount` is per single unit, so multiply by quantity
  // and sum across every taxable item in the ticket.
  const taxAmount = (ticket?.items ?? []).reduce(
    (groupSum, group) =>
      groupSum +
      (group.item ?? []).reduce(
        (sum, i) => sum + (i.taxApplied ? i.taxAmount * i.quantity : 0),
        0,
      ),
    0,
  );

  const seatedMinutes = ticket?.createdAt
    ? Math.max(
        0,
        Math.round((nowMs - new Date(ticket.createdAt).getTime()) / 60000),
      )
    : table.seatedMinutes;

  return (
    <ModalShell
      open={open}
      onClose={onClose}
      title={table.name || `Table ${table.id}`}
      subtitle={`${table.shape} · ${table.zone} · ${table.capacity} seats`}
      icon={Armchair}
      iconColor="text-blue-600"
      iconBgColor="bg-blue-50"
      maxWidth="max-w-2xl"
    >
      {/* ── 4 stat cards ── */}
      {isActive && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
          {[
            {
              icon: <DollarSign size={18} className="text-green-500" />,
              bg: "bg-green-50",
              label: "Current Bill",
              value: formatCurrencySymbol(
                currentBill,
                currency.symbol,
                currency.locale,
              ),
            },
            {
              icon: <Clock size={18} className="text-blue-500" />,
              bg: "bg-blue-50",
              label: "Time Seated",
              value: fmtMinutes(seatedMinutes ?? 0),
            },
            {
              icon: <Users size={18} className="text-violet-500" />,
              bg: "bg-violet-50",
              label: "Seats",
              value: `${table.capacity}`,
            },
            {
              icon: <Sparkles size={18} className="text-amber-500" />,
              bg: "bg-amber-50",
              label: "Ticket",
              value: `ORD-${ticket?.invoice}` || "—",
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
      {isActive && ticketLoading && orders.length === 0 && (
        <div className="flex items-center justify-center gap-2 py-6 text-gray-400 text-sm">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading order…
        </div>
      )}

      {orders.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="text-sm">📋</span>
              <p className="text-sm font-semibold text-gray-900">
                Order Details{" "}
              </p>
            </div>
            <p className="text-xs text-gray-400">{totalItems} items</p>
          </div>

          <div className="space-y-2">
            {orders.map((item, i) => (
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

          {/* Tax + Total */}
          <div className="pt-3 mt-1 border-t border-gray-100 space-y-1.5">
            {ticket && (
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-500">Tax</span>
                <span className="font-medium text-gray-700">
                  {formatCurrencySymbol(
                    taxAmount,
                    currency.symbol,
                    currency.locale,
                  )}
                </span>
              </div>
            )}
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-gray-700">Total</span>
              <span className="text-base font-bold text-green-600">
                {formatCurrencySymbol(total, currency.symbol, currency.locale)}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Empty state for non-active tables */}
      {!isActive && (
        <div className="flex flex-col items-center justify-center py-6">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-3">
            <Armchair size={24} className="text-gray-500" />
          </div>
          <p className="text-sm font-medium text-gray-500">Free Table</p>

          <p className="text-xs text-gray-400 mt-1">
            {table.status === "free" && "This table is available for seating."}
          </p>
        </div>
      )}

      <div className="flex items-center justify-between mt-2 pt-4  border-t-1 border-gray-300">
        <span className="text-sm font-semibold text-gray-700">
          Table Status
        </span>

        <span
          className={`rounded-full px-3 py-1.5 text-xs font-bold ${STATUS_BADGE[table.status]}`}
        >
          {statusLabel}
        </span>
      </div>
    </ModalShell>
  );
}
