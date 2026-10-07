"use client";

import { useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Edit3,
  Gift,
  Loader2,
  Trash2,
} from "lucide-react";

import type { Offer } from "@/services/apiOffers.client";
import { useCurrency } from "@/providers/CurrencyContext";
import {
  TYPE_LABEL,
  dealAmount,
  limitLine,
  scheduleLines,
} from "./offerDisplay";

const PAGE_SIZE = 5;

/**
 * Every offer the business has, with the two actions that act on one.
 *
 * Laid out like the other settings tables — fixed columns, five to a page — so
 * the offers list is read the same way as categories and taxes. Status is a
 * button rather than a label because enabling and disabling is the one change
 * worth making without opening anything.
 */
const OfferTable = ({
  offers,
  search,
  onEdit,
  onDelete,
  onToggle,
  loading = false,
  togglingId,
}: {
  offers: Offer[];
  search: string;
  onEdit: (offer: Offer) => void;
  onDelete: (id: string) => void;
  onToggle: (offer: Offer) => void;
  loading?: boolean;
  /** The offer whose switch is mid-flight, so only that row shows a spinner. */
  togglingId?: string | null;
}) => {
  const { currency } = useCurrency();
  const [page, setPage] = useState(0);

  // The code is searched as well as the name: a merchant looking for an offer
  // usually has the code in front of them, off a receipt or a poster.
  const needle = search.trim().toLowerCase();
  const filtered = needle
    ? offers.filter(
        (offer) =>
          offer.name.toLowerCase().includes(needle) ||
          (offer.code ?? "").toLowerCase().includes(needle),
      )
    : offers;

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const effectivePage =
    page >= totalPages && totalPages > 0 ? totalPages - 1 : page;
  const paged = filtered.slice(
    effectivePage * PAGE_SIZE,
    (effectivePage + 1) * PAGE_SIZE,
  );

  return (
    <>
      {/* Scrolls sideways below ~760px rather than wrapping: a schedule broken
          over four lines stops being readable as a schedule. */}
      <div className="-mx-5 overflow-x-auto scrollbar-hide px-5">
        <table className="w-full min-w-[760px] table-fixed text-sm">
          <colgroup>
            <col className="w-12" />
            <col />
            <col className="w-40" />
            <col className="w-52" />
            <col className="w-28" />
            <col className="w-24" />
          </colgroup>
          <thead>
            <tr className="border-b border-[#e8eaed] text-[11px] tracking-wider text-[#5f6368] dark:border-white/10 dark:text-[#9aa6bd]">
              <th className="pb-2.5 text-left font-normal">S.No.</th>
              <th className="pb-2.5 text-left font-normal">Offer</th>
              <th className="pb-2.5 text-left font-normal">Deal</th>
              <th className="pb-2.5 text-left font-normal">Runs</th>
              <th className="pb-2.5 text-left font-normal">Status</th>
              <th className="pb-2.5 text-right font-normal">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} className="py-10 text-center">
                  <div className="flex items-center justify-center gap-2 text-gray-400 dark:text-[#7b869b]">
                    <Loader2 className="h-5 w-5 animate-spin text-blue-500" />
                    <span className="text-sm">Loading offers...</span>
                  </div>
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-2 text-center">
                  <div className="flex flex-col items-center justify-center py-12">
                    <div className="mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100 dark:bg-white/10">
                      <Gift
                        size={24}
                        className="text-gray-500 dark:text-[#9aa6bd]"
                      />
                    </div>
                    <p className="text-sm font-medium text-gray-500 dark:text-[#c3ccdc]">
                      {needle ? "No offers match that" : "No offers yet"}
                    </p>
                    <p className="mt-1 text-xs text-gray-400 dark:text-[#7b869b]">
                      {needle
                        ? "Try the offer name or its promo code."
                        : "Build one and it will show up here."}
                    </p>
                  </div>
                </td>
              </tr>
            ) : (
              paged.map((offer, idx) => {
                const amount = dealAmount(
                  offer,
                  currency.symbol,
                  currency.locale,
                );
                const limits = limitLine(
                  offer,
                  currency.symbol,
                  currency.locale,
                );
                const schedule = scheduleLines(offer);
                const busy = togglingId === offer._id;

                return (
                  <tr
                    key={offer._id}
                    className="border-b border-gray-50 transition-colors last:border-0 hover:bg-gray-50/50 dark:border-white/10 dark:hover:bg-white/5"
                  >
                    <td className="py-3 text-[11px] font-medium text-gray-400 dark:text-[#7b869b]">
                      #{effectivePage * PAGE_SIZE + idx + 1}
                    </td>

                    <td className="py-3 pr-3">
                      <p className="truncate text-[13px] font-medium text-[#3c4043] dark:text-[#e8ecf4]">
                        {offer.name}
                      </p>
                      <div className="mt-0.5 flex items-center gap-2">
                        {offer.code && (
                          <span className="rounded bg-gray-900 px-1.5 py-0.5 font-mono text-[10px] font-bold tracking-wider text-white dark:bg-white/15">
                            {offer.code}
                          </span>
                        )}
                        {limits && (
                          <span className="truncate text-[11px] text-gray-400 dark:text-[#7b869b]">
                            {limits}
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="py-3 pr-3">
                      <p className="truncate text-[12px] text-[#3c4043] dark:text-[#e8ecf4]">
                        {TYPE_LABEL[offer.type]}
                      </p>
                      {amount && (
                        <p className="mt-0.5 text-[11px] font-medium text-emerald-600 dark:text-emerald-300">
                          {amount}
                        </p>
                      )}
                    </td>

                    <td className="py-3 pr-3">
                      {schedule.length === 0 ? (
                        <span className="text-[12px] text-gray-400 dark:text-[#7b869b]">
                          Always on
                        </span>
                      ) : (
                        schedule.map((line, i) => (
                          <div key={line.text}>
                            <p
                              className={
                                i === 0
                                  ? "truncate text-[12px] text-[#3c4043] dark:text-[#e8ecf4]"
                                  : "truncate text-[11px] text-gray-400 dark:text-[#7b869b]"
                              }
                            >
                              {line.text}
                            </p>
                            {/* The same dates in the Gregorian calendar, under
                                the BS ones they were set against. */}
                            {line.note && (
                              <p className="truncate text-[11px] text-gray-400 dark:text-[#7b869b]">
                                {line.note}
                              </p>
                            )}
                          </div>
                        ))
                      )}
                    </td>

                    <td className="py-3">
                      <button
                        type="button"
                        onClick={() => onToggle(offer)}
                        disabled={busy}
                        title={
                          offer.enabled
                            ? "Disable this offer"
                            : "Enable this offer"
                        }
                        className={`inline-flex cursor-pointer items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${
                          offer.enabled
                            ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-400/15 dark:text-emerald-300 dark:hover:bg-emerald-400/25"
                            : "bg-gray-100 text-gray-500 hover:bg-gray-200 dark:bg-white/10 dark:text-[#9aa6bd] dark:hover:bg-white/15"
                        }`}
                      >
                        {busy && <Loader2 size={11} className="animate-spin" />}
                        <span
                          aria-hidden
                          className={`h-1.5 w-1.5 rounded-full ${
                            busy
                              ? "hidden"
                              : offer.enabled
                                ? "bg-emerald-500"
                                : "bg-gray-400"
                          }`}
                        />
                        {offer.enabled ? "Live" : "Off"}
                      </button>
                    </td>

                    <td className="py-3">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          aria-label={`Edit ${offer.name}`}
                          onClick={() => onEdit(offer)}
                          className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-blue-50 hover:text-blue-600 dark:text-[#7b869b] dark:hover:bg-blue-400/15 dark:hover:text-[#7ba2e3]"
                        >
                          <Edit3 size={13} />
                        </button>
                        <button
                          type="button"
                          aria-label={`Delete ${offer.name}`}
                          onClick={() => onDelete(offer._id)}
                          className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-red-50 hover:text-red-500 dark:text-[#7b869b] dark:hover:bg-red-400/15 dark:hover:text-[#f87171]"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {filtered.length > PAGE_SIZE && (
        <div className="mt-4 flex items-center justify-between border-t border-gray-100 pt-3 dark:border-white/10">
          <button
            onClick={() => setPage(Math.max(0, effectivePage - 1))}
            disabled={effectivePage === 0}
            className={`flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
              effectivePage === 0
                ? "cursor-not-allowed text-gray-300 dark:text-[#4a5468]"
                : "text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-[#9aa6bd] dark:hover:bg-white/10 dark:hover:text-white"
            }`}
          >
            <ChevronLeft size={14} />
            Previous
          </button>
          <span className="text-xs font-medium text-gray-400 dark:text-[#7b869b]">
            Page {effectivePage + 1} of {totalPages} · {filtered.length} offers
          </span>
          <button
            onClick={() => setPage(Math.min(totalPages - 1, effectivePage + 1))}
            disabled={effectivePage >= totalPages - 1}
            className={`flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
              effectivePage >= totalPages - 1
                ? "cursor-not-allowed text-gray-300 dark:text-[#4a5468]"
                : "text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-[#9aa6bd] dark:hover:bg-white/10 dark:hover:text-white"
            }`}
          >
            Next
            <ChevronRight size={14} />
          </button>
        </div>
      )}
    </>
  );
};

export default OfferTable;
