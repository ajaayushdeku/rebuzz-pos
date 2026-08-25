"use client";

import { ArrowLeft, ChevronDown, FileText } from "lucide-react";

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

/**
 * Sticky header for a credit.
 *
 * The action set is the invoice page's minus the ones a credit cannot take:
 * there is no "move to credit" (it is one), no refund (nothing was settled
 * through the POS) and no invoice delete — archiving the credit is the
 * equivalent, and it lives here instead.
 */
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
}) {
  return (
    <div className="sticky top-0 z-30 bg-white border-b border-gray-200 px-6 md:px-10 py-4 pt-6 flex items-center justify-between">
      <div className="flex items-center gap-4">
        <button
          onClick={onBack}
          aria-label="Back"
          className="h-8 w-8 flex items-center justify-center rounded-lg bg-gray-100 text-gray-500 hover:bg-gray-200 transition-colors"
        >
          <ArrowLeft size={18} />
        </button>
        <div>
          <h1 className="text-base font-bold text-gray-900">
            {invoiceName || customerName} ·
            {invoiceNo != null && (
              <span className="text-gray-400 font-semibold"> #{invoiceNo}</span>
            )}
          </h1>
          <p className="text-xs text-gray-400 mt-0.5">
            {CREDIT_STATE_LABEL[state]} · Created {formatDateLong(createdAt)}{" "}
            GMT+5:45
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-1.5 border border-gray-200 rounded-full px-2 sm:px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50 transition-colors">
              <span>
                <ChevronDown size={15} />
              </span>
              <span className="hidden lg:inline">More actions</span>
            </button>
          </DropdownMenuTrigger>

          <DropdownMenuContent
            align="end"
            className="w-52 rounded-xl p-1 shadow-lg border-gray-200"
          >
            {onEditInvoice && (
              <>
                <DropdownMenuItem
                  onClick={onEditInvoice}
                  className="flex items-center gap-2 px-3 py-2 cursor-pointer rounded-lg focus:bg-blue-50 focus:text-blue-600 text-sm"
                >
                  Edit invoice
                </DropdownMenuItem>
              </>
            )}

            <DropdownMenuItem
              onClick={onPreviewAsCustomer}
              className="flex items-center gap-2 px-3 py-2 cursor-pointer rounded-lg focus:bg-blue-50 focus:text-blue-600 text-sm"
            >
              Preview as Customer
            </DropdownMenuItem>

            <DropdownMenuSeparator className="my-1 bg-gray-100" />

            <DropdownMenuItem
              onClick={onExportPdf}
              className="flex items-center gap-2 px-3 py-2 cursor-pointer rounded-lg focus:bg-blue-50 focus:text-blue-600 text-sm"
            >
              Export as PDF
            </DropdownMenuItem>

            <DropdownMenuItem
              onClick={onPrint}
              className="flex items-center gap-2 px-3 py-2 cursor-pointer rounded-lg focus:bg-blue-50 focus:text-blue-600 text-sm"
            >
              Print options
            </DropdownMenuItem>

            <DropdownMenuSeparator className="my-1 bg-gray-100" />

            {/* <DropdownMenuItem
              onClick={onOpenInvoice}
              className="flex items-center gap-2 px-3 py-2 cursor-pointer rounded-lg focus:bg-blue-50 focus:text-blue-600 text-sm"
            >
              Open the invoice
            </DropdownMenuItem> */}

            {onDeleteCredit && (
              <>
                {/* <DropdownMenuSeparator className="my-1 bg-gray-100" /> */}
                <DropdownMenuItem
                  onClick={onDeleteCredit}
                  className="flex items-center gap-2 px-3 py-2 cursor-pointer rounded-lg text-red-500 focus:bg-red-50 focus:text-red-600 text-sm"
                >
                  Delete credit
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>

        <button
          onClick={onOpenInvoice}
          className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-2 sm:px-4 py-1.5 rounded-full transition-colors"
        >
          <FileText size={14} />
          <span className="hidden lg:inline">View invoice</span>
        </button>
      </div>
    </div>
  );
}
