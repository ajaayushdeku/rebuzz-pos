"use client";

import { ArrowLeft, ChevronDown, Eye, EyeOff, FileText } from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  CREDIT_STATE_LABEL,
  formatDateLong,
  type CreditState,
} from "./creditDetailHelpers";

export default function CreditDetailTopBar({
  invoiceName,
  invoiceNo,
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
  return (
    <div className="sticky top-0 z-30 bg-white dark:bg-[#161d2e] border-b border-gray-200 px-6 md:px-10 py-4 pt-6 flex items-center justify-between dark:border-white/15">
      <div className="flex items-center gap-4">
        <button
          onClick={onBack}
          aria-label="Back"
          className="h-8 w-8 flex items-center justify-center rounded-lg bg-gray-100 text-gray-500 hover:bg-gray-200 transition-colors dark:hover:bg-white/15 dark:text-[#9aa6bd] dark:bg-white/10"
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
          <p className="text-xs text-gray-400 mt-0.5 dark:text-[#9aa6bd]">
            {CREDIT_STATE_LABEL[state]} · Created {formatDateLong(createdAt)}{" "}
            GMT+5:45
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {/* Sits left of More actions because it changes what the preview
            shows rather than doing something to the invoice. Pressed = the PAN
            is on the document, which is the default. */}
        <button
          type="button"
          onClick={onTogglePan}
          aria-pressed={showPan}
          title={
            showPan ? "Hide PAN on the document" : "Show PAN on the document"
          }
          className={`flex items-center gap-1.5 rounded-full border px-2 sm:px-3 py-1.5 text-xs font-semibold transition-colors ${
            showPan
              ? "border-blue-200 bg-blue-50 text-blue-600 hover:bg-blue-100 dark:hover:bg-blue-400/20 dark:border-blue-400/25 dark:text-blue-300 dark:bg-blue-400/10"
              : "border-gray-200 text-gray-500 hover:bg-gray-50 dark:hover:bg-white/5 dark:border-white/15 dark:text-[#9aa6bd]"
          }`}
        >
          {showPan ? <Eye size={15} /> : <EyeOff size={15} />}
          <span className="hidden lg:inline">PAN</span>
        </button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-1.5 border border-gray-200 rounded-full px-2 sm:px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50 transition-colors dark:hover:bg-white/5 dark:border-white/15 dark:text-[#c3ccdc]">
              <span>
                <ChevronDown size={15} />
              </span>
              <span className="hidden lg:inline">More actions</span>
            </button>
          </DropdownMenuTrigger>

          <DropdownMenuContent
            align="end"
            className="w-52 rounded-xl p-1 shadow-lg border-gray-200 dark:border-white/15"
          >
            {onEditInvoice && (
              <>
                <DropdownMenuItem
                  onClick={onEditInvoice}
                  className="flex items-center gap-2 px-3 py-2 cursor-pointer rounded-lg focus:bg-blue-50 focus:text-blue-600 text-sm dark:focus:text-[#a8c4ee] dark:focus:bg-blue-400/15"
                >
                  Edit invoice
                </DropdownMenuItem>
              </>
            )}

            <DropdownMenuItem
              onClick={onPreviewAsCustomer}
              className="flex items-center gap-2 px-3 py-2 cursor-pointer rounded-lg focus:bg-blue-50 focus:text-blue-600 text-sm dark:focus:text-[#a8c4ee] dark:focus:bg-blue-400/15"
            >
              Preview as Customer
            </DropdownMenuItem>

            <DropdownMenuSeparator className="my-1 bg-gray-100 dark:bg-white/10" />

            <DropdownMenuItem
              onClick={onExportPdf}
              className="flex items-center gap-2 px-3 py-2 cursor-pointer rounded-lg focus:bg-blue-50 focus:text-blue-600 text-sm dark:focus:text-[#a8c4ee] dark:focus:bg-blue-400/15"
            >
              Export as PDF
            </DropdownMenuItem>

            <DropdownMenuItem
              onClick={onPrint}
              className="flex items-center gap-2 px-3 py-2 cursor-pointer rounded-lg focus:bg-blue-50 focus:text-blue-600 text-sm dark:focus:text-[#a8c4ee] dark:focus:bg-blue-400/15"
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
                  className="flex items-center gap-2 px-3 py-2 cursor-pointer rounded-lg text-red-500 focus:bg-red-50 focus:text-red-600 text-sm dark:text-red-300 dark:hover:bg-red-400/10 dark:focus:text-red-300 dark:focus:bg-red-400/10"
                >
                  Delete credit
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>

        <button
          onClick={onOpenInvoice}
          className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 dark:hover:bg-blue-500 text-white text-xs font-semibold px-2 sm:px-4 py-1.5 rounded-full transition-colors dark:bg-[#244074]"
        >
          <FileText size={14} />
          <span className="hidden lg:inline">View invoice</span>
        </button>
      </div>
    </div>
  );
}
