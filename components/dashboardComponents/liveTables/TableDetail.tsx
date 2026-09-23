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
import { CHART_PALETTE } from "../chartCard";

type OrderRow = {
  name: string;
  qty: number;
  price: number;
  status: "served" | "pending" | "preparing";
};

const STATUS_BADGE: Record<string, string> = {
  occupied: "border border-blue-200 bg-blue-50 text-blue-700",
  free: "border border-green-200 bg-green-50 text-green-700",
};

const ITEM_STATUS_BADGE: Record<string, string> = {
  served: "border border-green-200 bg-green-50 text-green-700",
  pending: "border border-amber-200 bg-amber-50 text-amber-700",
  preparing: "border border-blue-200 bg-blue-50 text-blue-700",
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
              icon: <DollarSign size={15} />,
              iconClass: "bg-green-50 text-green-600",
              label: "Current bill",
              value: formatCurrencySymbol(
                currentBill,
                currency.symbol,
                currency.locale,
              ),
            },
            {
              icon: <Clock size={15} />,
              iconClass: "bg-blue-50 text-blue-600",
              label: "Time seated",
              value: fmtMinutes(seatedMinutes ?? 0),
            },
            {
              icon: <Users size={15} />,
              iconClass: "bg-violet-50 text-violet-600",
              label: "Seats",
              value: `${table.capacity}`,
            },
            {
              icon: <Sparkles size={15} />,
              iconClass: "bg-amber-50 text-amber-600",
              label: "Ticket",
              value: `ORD-${ticket?.invoice}` || "—",
            },
          ].map(({ icon, iconClass, label, value }) => (
            <div
              key={label}
              className="flex items-center gap-3 rounded-xl border px-3.5 py-3"
              style={{ borderColor: CHART_PALETTE.border }}
            >
              <span
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-current/20 ${iconClass}`}
              >
                {icon}
              </span>
              <div className="min-w-0">
                <p
                  className="text-[11px]"
                  style={{ color: CHART_PALETTE.subtitle }}
                >
                  {label}
                </p>
                <p
                  className="mt-0.5 truncate text-[13px] font-medium tabular-nums"
                  style={{ color: CHART_PALETTE.title }}
                >
                  {value}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Order details ── */}
      {isActive && ticketLoading && orders.length === 0 && (
        <div
          className="flex items-center justify-center gap-2 py-6 text-sm"
          style={{ color: CHART_PALETTE.subtitle }}
        >
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading order…
        </div>
      )}

      {orders.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="text-sm">📋</span>
              <p className="text-[13px]" style={{ color: CHART_PALETTE.title }}>
                Order details
              </p>
            </div>
            <p
              className="text-xs tabular-nums"
              style={{ color: CHART_PALETTE.subtitle }}
            >
              {totalItems} items
            </p>
          </div>

          <div className="space-y-2">
            {orders.map((item, i) => (
              <div
                key={i}
                className="flex items-center justify-between gap-2 border-b py-2.5 last:border-0"
                style={{ borderColor: CHART_PALETTE.grid }}
              >
                <div className="flex items-center gap-3">
                  <span
                    className="text-xs tabular-nums"
                    style={{ color: CHART_PALETTE.subtitle }}
                  >
                    {item.qty}×
                  </span>
                  <span
                    className="text-[13px]"
                    style={{ color: CHART_PALETTE.title }}
                  >
                    {item.name}
                  </span>
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] capitalize ${ITEM_STATUS_BADGE[item.status]}`}
                  >
                    {item.status}
                  </span>
                </div>
                <span
                  className="text-[13px] font-medium tabular-nums"
                  style={{ color: CHART_PALETTE.title }}
                >
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
          <div
            className="mt-1 space-y-1.5 border-t pt-3"
            style={{ borderColor: CHART_PALETTE.grid }}
          >
            {ticket && (
              <div className="flex items-center justify-between text-xs">
                <span style={{ color: CHART_PALETTE.axis }}>Tax</span>
                <span
                  className="tabular-nums"
                  style={{ color: CHART_PALETTE.title }}
                >
                  {formatCurrencySymbol(
                    taxAmount,
                    currency.symbol,
                    currency.locale,
                  )}
                </span>
              </div>
            )}
            <div className="flex items-center justify-between">
              <span
                className="text-[13px]"
                style={{ color: CHART_PALETTE.axis }}
              >
                Total
              </span>
              <span
                className="text-base font-semibold tabular-nums"
                style={{ color: CHART_PALETTE.good }}
              >
                {formatCurrencySymbol(total, currency.symbol, currency.locale)}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Empty state for non-active tables */}
      {!isActive && (
        <div className="flex flex-col items-center justify-center py-6">
          <div
            className="mb-3 flex h-16 w-16 items-center justify-center rounded-full"
            style={{ backgroundColor: CHART_PALETTE.hover }}
          >
            <Armchair size={24} style={{ color: CHART_PALETTE.subtitle }} />
          </div>
          <p className="text-sm" style={{ color: CHART_PALETTE.title }}>
            Free table
          </p>

          <p className="mt-1 text-xs" style={{ color: CHART_PALETTE.subtitle }}>
            {table.status === "free" && "This table is available for seating."}
          </p>
        </div>
      )}

      <div
        className="mt-2 flex items-center justify-between border-t pt-4"
        style={{ borderColor: CHART_PALETTE.grid }}
      >
        <span className="text-[13px]" style={{ color: CHART_PALETTE.axis }}>
          Table status
        </span>

        <span
          className={`rounded-full px-2.5 py-0.5 text-[11px] ${STATUS_BADGE[table.status]}`}
        >
          {statusLabel}
        </span>
      </div>
    </ModalShell>
  );
}
