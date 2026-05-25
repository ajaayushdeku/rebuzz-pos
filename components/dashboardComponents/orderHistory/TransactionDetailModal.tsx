"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Transaction } from "./transaction-columns";
import { Loader2, Mail, Phone, User } from "lucide-react";
import { CurrencyConfig } from "@/lib/config/store";
import { formatCurrency } from "@/utils/helper";

type Props = {
  open: boolean;
  onClose: () => void;
  transaction: Transaction | null;
  isLoading: boolean;
  currency: CurrencyConfig;
};

export default function TransactionDetailModal({
  open,
  onClose,
  transaction,
  isLoading,
  currency,
}: Props) {
  const customer = transaction?.customer;
  const hasCustomer = !!(customer?.name || customer?.email || customer?.phone);

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Transaction Detail</DialogTitle>
        </DialogHeader>

        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
          </div>
        )}

        {!isLoading && transaction && (
          <div className="space-y-4 text-sm">
            {/* ── Business header ── */}
            <div className="text-center border-b pb-4">
              <h2 className="font-bold text-lg">
                {transaction.businessName ?? "—"}
              </h2>
              <p className="text-gray-500 text-xs">
                {transaction.date} at {transaction.timestamp}
              </p>
            </div>

            {/* ── Customer section ── */}
            <section className="space-y-2">
              <h3 className="font-semibold text-gray-500 uppercase text-xs">
                Customer
              </h3>
              <div className="bg-gray-50 rounded-lg px-3 py-3 space-y-2">
                {hasCustomer ? (
                  <>
                    {customer?.name && (
                      <div className="flex items-center gap-2">
                        <User className="h-3.5 w-3.5 text-gray-400 shrink-0" />
                        <span className="font-semibold text-gray-800">
                          {customer.name}
                        </span>
                      </div>
                    )}
                    {customer?.phone && (
                      <div className="flex items-center gap-2">
                        <Phone className="h-3.5 w-3.5 text-gray-400 shrink-0" />
                        <span className="text-gray-600">{customer.phone}</span>
                      </div>
                    )}
                    {customer?.email && (
                      <div className="flex items-center gap-2">
                        <Mail className="h-3.5 w-3.5 text-gray-400 shrink-0" />
                        <span className="text-gray-600">{customer.email}</span>
                      </div>
                    )}
                  </>
                ) : (
                  // No customer linked — show invoice/ticket name instead
                  <div className="flex items-center gap-2">
                    <User className="h-3.5 w-3.5 text-gray-400 shrink-0" />
                    <span className="font-semibold text-gray-800">
                      {transaction.invoiceName || "Walk-in Customer"}
                    </span>
                  </div>
                )}
              </div>
            </section>

            {/* ── Bill info ── */}
            <section>
              <div className="flex justify-between">
                <span className="font-medium text-right">
                  {transaction.invoiceName || "—"}
                </span>

                <span className="font-bold">
                  Bill no.
                  <span className="font-medium">
                    {transaction.billNo ?? "—"}
                  </span>
                </span>
              </div>
            </section>

            {/* ── Items ── */}
            <section>
              <h3 className="font-semibold text-gray-500 uppercase text-xs mb-2">
                Items
              </h3>
              {transaction.items.length === 0 ? (
                <p className="text-gray-400 italic text-xs">
                  No items available
                </p>
              ) : (
                <div className="rounded-md border overflow-hidden">
                  <div className="grid grid-cols-4 gap-2 px-3 py-2 bg-gray-50 text-xs font-semibold text-gray-500 uppercase">
                    <span className="col-span-2">Item</span>
                    <span className="text-center">Qty</span>
                    <span className="text-right">Rate</span>
                  </div>
                  {transaction.items.map((item, i) => (
                    <div
                      key={i}
                      className="grid grid-cols-4 gap-2 px-3 py-2 border-t text-sm"
                    >
                      <span className="col-span-2">{item.name}</span>
                      <span className="text-center text-gray-500">
                        {item.quantity}
                      </span>
                      <span className="text-right">
                        {formatCurrency(Number(item.unitPrice), currency)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* ── Bill totals ── */}
            <section className="border-t pt-4 space-y-1.5">
              <div className="flex justify-between text-gray-500">
                <span>Subtotal</span>
                <span>
                  {formatCurrency(
                    transaction.totalAmount ?? Number(transaction.amount),
                    currency,
                  )}
                </span>
              </div>
              {(transaction.discount ?? 0) > 0 && (
                <div className="flex justify-between text-red-500">
                  <span>Discount</span>
                  <span>
                    − {formatCurrency(Number(transaction.discount), currency)}
                  </span>
                </div>
              )}
              {(transaction.taxAmount ?? 0) > 0 && (
                <div className="flex justify-between text-blue-600">
                  <span>Tax</span>
                  <span>
                    + {formatCurrency(Number(transaction.taxAmount), currency)}
                  </span>
                </div>
              )}
              <div className="flex justify-between font-bold text-base border-t pt-2 mt-1">
                <span>Total</span>
                <span>
                  {formatCurrency(Number(transaction.amount), currency)}
                </span>
              </div>
            </section>

            {/* ── Payment ── */}
            <section className="space-y-1.5">
              <h3 className="font-semibold text-gray-500 uppercase text-xs mb-2">
                Payment
              </h3>
              <div className="grid grid-cols-2 gap-y-1.5">
                <span className="text-gray-500">Method</span>
                <span className="font-medium capitalize text-right">
                  {transaction.paymentMethod}
                </span>

                <span className="text-gray-500">Cashier</span>
                <span className="font-medium text-right">
                  {transaction.generatedBy ?? "—"}
                </span>

                {(transaction.cashAmount ?? 0) > 0 && (
                  <>
                    <span className="text-gray-500">Cash</span>
                    <span className="text-right">
                      {formatCurrency(Number(transaction.cashAmount), currency)}
                    </span>
                  </>
                )}

                {(transaction.qrAmount ?? 0) > 0 && (
                  <>
                    <span className="text-gray-500">QR</span>
                    <span className="text-right">
                      {formatCurrency(Number(transaction.qrAmount), currency)}
                    </span>
                  </>
                )}
                <span className="text-gray-500">Status</span>
                <span className="font-medium capitalize text-right">
                  {transaction.status}
                </span>
              </div>
            </section>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
