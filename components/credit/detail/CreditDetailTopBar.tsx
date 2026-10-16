"use client";

import {
  ArrowLeft,
  ChevronDown,
  Eye,
  EyeOff,
  FileText,
  MoreHorizontal,
  X,
} from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  CREDIT_STATE_LABEL,
  // formatDateLong,
  type CreditState,
} from "./creditDetailHelpers";
import { daysFromNepalToday, nepalDateString } from "@/lib/nepalDate";
import { useState } from "react";

export default function CreditDetailTopBar({
  invoiceName,
  invoiceNo,
  invoiceStatus,
  invoiceDueDate,
  customerName,
  state,
  createdAt,
  onBack,
  onEditInvoice,
  onPreviewAsCustomer,
  onExportPdf,
  onPrint,
  onOpenInvoice,
  onDeleteCredit,
  showPan,
  onTogglePan,
}: {
  invoiceName?: string;
  invoiceNo: number | undefined;
  invoiceStatus: string;
  invoiceDueDate?: string;
  customerName: string;
  state: CreditState;
  createdAt: string | undefined;
  onBack: () => void;
  /** Absent while the credit is archived — nothing about it may change. */
  onEditInvoice?: () => void;
  onPreviewAsCustomer: () => void;
  onExportPdf: () => void;
  onPrint: () => void;
  onOpenInvoice: () => void;
  /** Absent once archived — a credit archives only once. */
  onDeleteCredit?: () => void;
  /** Whether the business PAN is currently printed on the documents. */
  showPan: boolean;
  onTogglePan: () => void;
}) {
  const [showMobileActions, setShowMobileActions] = useState(false);

  const dueDateRaw: string | null = nepalDateString(invoiceDueDate);

  const daysUntilDue = daysFromNepalToday(dueDateRaw);

  const isPaid = invoiceStatus === "completed";
  const isArchived = invoiceStatus === "archived";
  // const isOngoing = invoiceStatus === "ongoing";

  const isSettled = isPaid || isArchived;

  const formatDueDate = (iso: string) => {
    const [y, m, d] = iso.split("-").map(Number);
    if (!y || !m || !d) return iso;
    return new Date(y, m - 1, d).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  return (
    <div className="sticky top-0 z-30 flex items-center justify-between gap-2 border-b border-gray-200 bg-white px-3 py-3 dark:border-white/15 dark:bg-[#161d2e] sm:px-6 sm:py-4 md:px-10 md:pt-6">
      <div className="flex items-center gap-4">
        <button
          onClick={onBack}
          aria-label="Back"
          className="h-8 w-8 hidden sm:flex items-center justify-center rounded-lg bg-gray-100 text-gray-500 hover:bg-gray-200 transition-colors dark:hover:bg-white/15 dark:text-[#9aa6bd] dark:bg-white/10"
        >
          <ArrowLeft size={18} />
        </button>
        <div>
          <h1 className="text-base font-bold text-gray-900 dark:text-[#e8ecf4]">
            {invoiceName || customerName} ·
            {invoiceNo != null && (
              <span className="text-gray-400 font-semibold dark:text-[#9aa6bd]">
                {" "}
                #{invoiceNo}
              </span>
            )}
          </h1>
          <p className="text-[10px] sm:text-xs text-gray-400 mt-0.5 dark:text-[#9aa6bd]">
            {CREDIT_STATE_LABEL[state]} · Created{" "}
            {createdAt
              ? new Date(createdAt).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })
              : "—"}{" "}
            {/* {formatDateLong(createdAt)}{" "} */}
            GMT+5:45
            {/* Only once one is set, and only while something is still owed —
                  on a settled invoice a due date is history, not a deadline. */}
            {dueDateRaw && !isSettled && (
              <>
                {" · "}
                <span
                  className={
                    !isPaid && (daysUntilDue ?? 0) < 0
                      ? "font-semibold text-red-500 dark:text-red-300"
                      : "font-medium text-gray-500 dark:text-[#9aa6bd]"
                  }
                >
                  Due {formatDueDate(dueDateRaw)}
                </span>
              </>
            )}
          </p>
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-2">
        {showMobileActions && (
          <div className=" h-5.5 w-px bg-[#dadce0] dark:bg-white/15" />
        )}

        {/* Mobile expand/collapse toggle */}
        <button
          type="button"
          onClick={() => setShowMobileActions((prev) => !prev)}
          aria-label={showMobileActions ? "Hide actions" : "Show actions"}
          aria-expanded={showMobileActions}
          className={`flex  shrink-0 items-center justify-center rounded-full border transition-colors hover:bg-gray-50 dark:hover:bg-white/10 sm:hidden ${
            showMobileActions
              ? "h-5.5 w-5.5 border-red-200 bg-red-50 text-red-600 hover:bg-red-100 dark:border-red-400/25 dark:bg-red-400/10 dark:text-red-300 dark:hover:bg-red-400/20"
              : "h-7 w-7 border-gray-200 bg-white text-gray-600   dark:bg-white/5 dark:border-white/15 dark:text-[#c3ccdc]"
          }`}
        >
          <span
            className={`transition-transform duration-300 ease-in-out ${
              showMobileActions ? "rotate-90" : "rotate-0"
            }`}
          >
            {showMobileActions ? <X size={12} /> : <MoreHorizontal size={14} />}
          </span>
        </button>

        {/* Animated action container */}
        <div
          className={`grid transition-[grid-template-columns,opacity] duration-300 ease-in-out sm:!grid-cols-[1fr] sm:!opacity-100 ${
            showMobileActions
              ? "grid-cols-[1fr] opacity-100"
              : "grid-cols-[0fr] opacity-0"
          }`}
        >
          <div
            className={`flex min-w-0 items-center gap-1.5 overflow-hidden transition-transform duration-300 ease-in-out sm:!translate-x-0 sm:!gap-2 ${
              showMobileActions ? "translate-x-0" : "translate-x-2"
            }`}
          >
            <button
              type="button"
              onClick={onTogglePan}
              aria-pressed={showPan}
              title={
                showPan
                  ? "Hide PAN on the document"
                  : "Show PAN on the document"
              }
              className={`flex shrink-0 items-center justify-center gap-1.5 rounded-full border p-2 sm:px-3 sm:py-1.5 text-xs font-semibold transition-colors ${
                showPan
                  ? "border-blue-200 bg-blue-50 text-blue-600 hover:bg-blue-100 dark:hover:bg-blue-400/20 dark:border-blue-400/25 dark:text-blue-300 dark:bg-blue-400/10"
                  : "border-gray-200 text-gray-500 hover:bg-gray-50 dark:hover:bg-white/5 dark:border-white/15 dark:text-[#9aa6bd]"
              }`}
            >
              {showPan ? (
                <Eye className="h-3.5 w-3.5 sm:h-[15px] sm:w-[15px]" />
              ) : (
                <EyeOff className="h-3.5 w-3.5 sm:h-[15px] sm:w-[15px]" />
              )}
              <span className="hidden lg:inline">PAN</span>
            </button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  title="More actions"
                  aria-label="More actions"
                  className="flex shrink-0 items-center justify-center gap-1.5 rounded-full border border-gray-200 p-2 text-xs font-semibold text-gray-700 transition-colors hover:bg-gray-50 dark:border-white/15 dark:text-[#c3ccdc] dark:hover:bg-white/5 sm:px-3 sm:py-1.5"
                >
                  <ChevronDown className="h-4 w-4" />
                  <span className="hidden lg:inline">More actions</span>
                </button>
              </DropdownMenuTrigger>

              <DropdownMenuContent
                align="end"
                className="w-45 rounded-xl p-1 shadow-lg border-gray-200 dark:border-white/15"
              >
                {onEditInvoice && (
                  <>
                    <DropdownMenuItem
                      onClick={onEditInvoice}
                      className="flex items-center gap-2 px-3 py-2 cursor-pointer rounded-lg focus:bg-blue-50 focus:text-blue-600 text-[13px] sm:text-sm dark:focus:text-[#a8c4ee] dark:focus:bg-blue-400/15"
                    >
                      Edit invoice
                    </DropdownMenuItem>
                  </>
                )}

                <DropdownMenuItem
                  onClick={onPreviewAsCustomer}
                  className="flex items-center gap-2 px-3 py-2 cursor-pointer rounded-lg focus:bg-blue-50 focus:text-blue-600 text-[13px] sm:text-sm dark:focus:text-[#a8c4ee] dark:focus:bg-blue-400/15"
                >
                  Preview as Customer
                </DropdownMenuItem>

                <DropdownMenuSeparator className="my-1 bg-gray-100 dark:bg-white/10" />

                <DropdownMenuItem
                  onClick={onExportPdf}
                  className="flex items-center gap-2 px-3 py-2 cursor-pointer rounded-lg focus:bg-blue-50 focus:text-blue-600 text-[13px] sm:text-sm dark:focus:text-[#a8c4ee] dark:focus:bg-blue-400/15"
                >
                  Export as PDF
                </DropdownMenuItem>

                <DropdownMenuItem
                  onClick={onPrint}
                  className="flex items-center gap-2 px-3 py-2 cursor-pointer rounded-lg focus:bg-blue-50 focus:text-blue-600 text-[13px] sm:text-sm dark:focus:text-[#a8c4ee] dark:focus:bg-blue-400/15"
                >
                  Print options
                </DropdownMenuItem>

                <DropdownMenuSeparator className="my-1 bg-gray-100 dark:bg-white/10" />

                {/* <DropdownMenuItem
              onClick={onOpenInvoice}
              className="flex items-center gap-2 px-3 py-2 cursor-pointer rounded-lg focus:bg-blue-50 focus:text-blue-600 text-sm dark:focus:text-[#a8c4ee] dark:focus:bg-blue-400/15"
            >
              Open the invoice
            </DropdownMenuItem> */}

                {onDeleteCredit && (
                  <>
                    {/* <DropdownMenuSeparator className="my-1 bg-gray-100 dark:bg-white/10" /> */}
                    <DropdownMenuItem
                      onClick={onDeleteCredit}
                      className="flex items-center gap-2 px-3 py-2 cursor-pointer rounded-lg text-red-500 focus:bg-red-50 focus:text-red-600 text-[13px] sm:text-sm dark:text-red-300 dark:hover:bg-red-400/10 dark:focus:text-red-300 dark:focus:bg-red-400/10"
                    >
                      Delete credit
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>

            <button
              type="button"
              onClick={onOpenInvoice}
              title="View invoice"
              aria-label="View invoice"
              className="flex shrink-0 items-center justify-center gap-1.5 rounded-full border border-blue-600 bg-blue-600 p-2 text-xs font-semibold text-white transition-colors hover:bg-blue-700 dark:border-blue-400/25 dark:bg-[#244074] dark:hover:bg-blue-500 sm:px-3 sm:py-1.5"
            >
              <FileText className="h-4 w-4" />
              <span className="hidden lg:inline">View invoice</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
