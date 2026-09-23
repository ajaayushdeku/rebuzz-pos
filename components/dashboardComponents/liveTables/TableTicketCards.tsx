"use client";

import { useEffect, useRef, useState } from "react";
import { Armchair, Loader2, Receipt } from "lucide-react";

import type { LiveTable } from "@/lib/mockData/mock-live-tables";
import { fmtMinutes } from "@/lib/mockData/mock-live-tables";
import { useCurrency } from "@/providers/CurrencyContext";
import { formatCurrencySymbol } from "@/utils/helper";
import { useTableTicket } from "@/hooks/useTableTicket";
import { CHART_PALETTE } from "../chartCard";

type TicketLine = {
  name: string;
  qty: number;
  unitPrice: number;
};

/**
 * One table's open ticket, read-only.
 *
 * Its own component rather than a render function because each card runs
 * `useTableTicket` — a hook can't be called from inside a `.map()` in the
 * parent.
 */
function TableTicketCard({
  table,
  isSelected,
}: {
  table: LiveTable;
  isSelected: boolean;
}) {
  const { currency } = useCurrency();
  const cardRef = useRef<HTMLDivElement>(null);

  // Selecting a table on the floor plan or in the grid can highlight a card
  // that is scrolled out of view, so bring it back into the strip.
  useEffect(() => {
    if (!isSelected) return;
    cardRef.current?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [isSelected]);

  const { data: ticket, isLoading } = useTableTicket(
    table.currentTicket?.invoice ?? null,
  );

  // Captured once at mount via a lazy initializer so render stays pure.
  const [nowMs] = useState(() => Date.now());

  const money = (n: number) =>
    formatCurrencySymbol(n, currency.symbol, currency.locale);

  // The API nests each line under a group; flatten to a plain list of lines.
  const lines: TicketLine[] = (ticket?.items ?? []).flatMap((group) =>
    (group.item ?? []).map((i) => ({
      name: i.productName,
      qty: i.quantity,
      unitPrice: i.unitPrice,
    })),
  );

  // Sum of quantities, not of distinct products — "4 items" means four things
  // on the table, not four rows.
  const itemCount = lines.reduce((sum, l) => sum + l.qty, 0);

  const total = ticket?.grandTotal ?? table.bill ?? 0;

  const seatedMinutes = ticket?.createdAt
    ? Math.max(
        0,
        Math.round((nowMs - new Date(ticket.createdAt).getTime()) / 60000),
      )
    : table.seatedMinutes;

  const tableName = table.name || `Table ${table.id}`;

  return (
    <div
      ref={cardRef}
      aria-current={isSelected ? "true" : undefined}
      className={`flex flex-col rounded-2xl border bg-white px-5 py-4 transition-colors ${
        isSelected
          ? "border-blue-400 ring-2 ring-blue-400 ring-offset-1"
          : "border-[#e3e3e3] hover:border-[#dadce0]"
      }`}
    >
      {/* ── Header ── */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-current/20 bg-emerald-50 text-[13px] font-medium text-emerald-700">
            {tableName.charAt(0).toUpperCase()}
          </span>
          <div className="min-w-0">
            <p
              className="truncate text-[15px] font-medium"
              style={{ color: CHART_PALETTE.title }}
            >
              {tableName}
            </p>
            <p
              className="mt-0.5 text-[11px]"
              style={{ color: CHART_PALETTE.subtitle }}
            >
              {seatedMinutes != null && <>{fmtMinutes(seatedMinutes)} ago · </>}
              {itemCount} {itemCount === 1 ? "item" : "items"}
            </p>
          </div>
        </div>

        <div className="shrink-0 text-right">
          <p className="text-[11px]" style={{ color: CHART_PALETTE.subtitle }}>
            Total
          </p>
          <p
            className="text-[17px] font-semibold tracking-tight tabular-nums"
            style={{ color: CHART_PALETTE.good }}
          >
            {money(total)}
          </p>
        </div>
      </div>

      {/* ── Table badge ── */}
      <span className="mt-3 inline-flex w-fit items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[11px] text-emerald-700">
        <Armchair size={12} />
        {tableName}
      </span>

      {/* ── Ticket lines ── */}
      <div className="mt-4 flex-1">
        {isLoading && lines.length === 0 ? (
          <div
            className="flex items-center justify-center gap-2 py-6 text-xs"
            style={{ color: CHART_PALETTE.subtitle }}
          >
            <Loader2 size={14} className="animate-spin" />
            Loading ticket
          </div>
        ) : lines.length === 0 ? (
          <p
            className="py-6 text-center text-xs"
            style={{ color: CHART_PALETTE.subtitle }}
          >
            No items on this ticket yet.
          </p>
        ) : (
          <div className="space-y-3">
            {lines.map((line, i) => (
              <div
                key={`${line.name}-${i}`}
                className="flex items-start justify-between gap-3"
              >
                <div className="flex min-w-0 items-start gap-2.5">
                  <span
                    className="mt-0.5 shrink-0 rounded-md px-1.5 py-0.5 text-[11px] tabular-nums"
                    style={{
                      backgroundColor: CHART_PALETTE.hover,
                      color: CHART_PALETTE.axis,
                    }}
                  >
                    x{line.qty}
                  </span>
                  <div className="min-w-0">
                    <p
                      className="truncate text-[13px]"
                      style={{ color: CHART_PALETTE.title }}
                    >
                      {line.name}
                    </p>
                    <p
                      className="mt-0.5 text-[11px] tabular-nums"
                      style={{ color: CHART_PALETTE.subtitle }}
                    >
                      {money(line.unitPrice)} each
                    </p>
                  </div>
                </div>

                <span
                  className="shrink-0 text-[13px] font-medium tabular-nums"
                  style={{ color: CHART_PALETTE.title }}
                >
                  {money(line.unitPrice * line.qty)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

interface TableTicketCardsProps {
  tables: LiveTable[];
  /** Table selected in the grid / floor plan, so its card can be highlighted. */
  selectedTableId?: number | null;
  /**
   * Height of the scrollable strip. Cards vary in height with their line count,
   * so this caps the strip rather than counting rows — anything past it
   * scrolls.
   */
  maxHeightClass?: string;
}

/**
 * Read-only ticket breakdown for every table that currently has one assigned.
 *
 * Deliberately has no "Update items" / "Proceed to pay" actions — this is a
 * summary strip, and those flows live on the ticket itself.
 */
export default function TableTicketCards({
  tables,
  selectedTableId = null,
  maxHeightClass = "max-h-[34rem]",
}: TableTicketCardsProps) {
  // "Has a ticket assigned" is the `currentTicket` ref, not the coarse
  // `status` field — GridView's card treats it the same way.
  const ticketed = tables.filter((t) => !!t.currentTicket);

  if (ticketed.length === 0) return null;

  return (
    <div>
      <h3 className="flex flex-row items-center gap-2 text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">
        <Receipt size={14} style={{ color: CHART_PALETTE.subtitle }} />
        Assigned tickets · {ticketed.length}{" "}
        {ticketed.length === 1 ? "table" : "tables"}
      </h3>

      {/* p-1 gives the selected card's ring-offset room to draw instead of
          being clipped by the scroll container; items-start stops the grid
          stretching short cards to the tallest row. */}
      <div
        className={`${maxHeightClass} overflow-y-auto p-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden`}
      >
        <div className="grid grid-cols-2 items-start gap-3 md:grid-cols-2 xl:grid-cols-3">
          {ticketed.map((t) => (
            <TableTicketCard
              key={t.id}
              table={t}
              isSelected={selectedTableId === t.id}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
