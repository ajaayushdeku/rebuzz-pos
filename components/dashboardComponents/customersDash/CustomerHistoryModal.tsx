"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, ShoppingBag, ChevronLeft, ChevronRight } from "lucide-react";
import toast from "react-hot-toast";

import ModalShell from "@/components/ui/ModalShell";
import { useCurrency } from "@/providers/CurrencyContext";
import { formatCurrencySymbol } from "@/utils/helper";
import {
  statusStyles,
  paymentMethods,
  normalizePaymentMethod,
  paymentMethodStyle,
} from "@/lib/config/transaction";

// ── Types ────────────────────────────────────────────────────────────────────

type PurchaseHistoryItem = {
  grandTotal: number;
  paidAt?: string;
  createdAt?: string;
  isRefunded?: boolean;
  invoiceNo?: number;
  paymentMethod?: string;
  ticketName?: string;
  orderId?: string;
};

type PurchaseHistoryResponse = {
  status: string;
  customerPurchases: PurchaseHistoryItem[];
};

// ── Helpers ──────────────────────────────────────────────────────────────────

// Parse a Nepal-local timestamp into a Date (mirrors the customer detail page).
function parseNepalDate(rawDate: string): Date | null {
  if (!rawDate) return null;
  const normalized = rawDate.includes("T")
    ? rawDate.replace("Z", "")
    : rawDate.replace(" ", "T");
  const rawHour = parseInt(normalized.split("T")[1]?.split(":")[0] ?? "12", 10);
  let date: Date;
  if (rawHour >= 12) {
    date = new Date(normalized);
  } else {
    date = new Date(normalized + "+00:00");
    date.setMinutes(date.getMinutes() + 5 * 60 + 45);
  }
  return isNaN(date.getTime()) ? null : date;
}

// ── Component ────────────────────────────────────────────────────────────────

export default function CustomerHistoryModal({
  customerId,
  customerName,
  open,
  onClose,
}: {
  customerId: string | undefined;
  customerName: string;
  open: boolean;
  onClose: () => void;
}) {
  const router = useRouter();
  const { currency } = useCurrency();

  const [loading, setLoading] = useState(true);
  const [history, setHistory] = useState<PurchaseHistoryItem[]>([]);
  const [page, setPage] = useState(0);
  const pageSize = 5;

  // Reset page when modal opens
  useEffect(() => {
    if (open && customerId) {
      setPage(0);
    }
  }, [open, customerId]);

  // Fetch order history whenever the modal opens for a customer.
  useEffect(() => {
    if (!open || !customerId) return;

    let cancelled = false;

    const fetchHistory = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/customers/${customerId}/history`);
        if (!res.ok) throw new Error("Failed to fetch history");
        const json: PurchaseHistoryResponse = await res.json();
        if (!cancelled) setHistory(json.customerPurchases ?? []);
      } catch {
        if (!cancelled) {
          setHistory([]);
          toast.error("Failed to load order history");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchHistory();
    return () => {
      cancelled = true;
    };
  }, [open, customerId]);

  const totalPages = Math.max(1, Math.ceil(history.length / pageSize));
  const paged = history.slice(page * pageSize, (page + 1) * pageSize);

  return (
    <ModalShell
      open={open}
      onClose={onClose}
      title="Order history"
      subtitle={`${customerName} · ${history.length} ${
        history.length === 1 ? "order" : "orders"
      }`}
      icon={ShoppingBag}
      iconColor="text-blue-600"
      iconBgColor="bg-blue-50"
      maxWidth="max-w-5xl"
    >
      {loading ? (
        <div className="flex items-center justify-center gap-2 py-16 text-[13px] text-gray-400">
          <Loader2 size={15} className="animate-spin" />
          Loading order history
        </div>
      ) : history.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16">
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-gray-50">
            <ShoppingBag size={20} className="text-gray-300" />
          </div>
          <p className="text-[13px] text-gray-400">No order history found</p>
        </div>
      ) : (
        <>
          <div
            className="overflow-x-auto pb-2 scrollbar-hide"
            style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
          >
            <table className="w-full text-sm min-w-[760px]">
              <thead>
                <tr className="text-xs text-gray-400 border-b border-gray-100">
                  <th className="text-left pb-3 pt-3 px-3 font-medium w-10">
                    #
                  </th>
                  <th className="text-left pb-3 pt-3 px-3 font-medium">
                    Order ID
                  </th>
                  <th className="text-left pb-3 pt-3 px-3 font-medium">
                    Date / Time
                  </th>
                  <th className="text-left pb-3 pt-3 px-3 font-medium">
                    Invoice Name
                  </th>
                  <th className="text-center pb-3 pt-3 px-3 font-medium">
                    Payment
                  </th>
                  <th className="text-right pb-3 pt-3 px-3 font-medium">
                    Total
                  </th>
                  <th className="text-center pb-3 pt-3 px-3 font-medium">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody>
                {paged.map((purchase, idx) => {
                  const rawDate = purchase.paidAt ?? purchase.createdAt;
                  const date = rawDate ? parseNepalDate(rawDate) : null;

                  const isRefunded = !!purchase.isRefunded;
                  const status: "completed" | "refunded" = isRefunded
                    ? "refunded"
                    : "completed";
                  const s = statusStyles[status] ?? statusStyles["completed"];

                  // const paymentMethod = (purchase.paymentMethod ?? "Cash") as
                  //   | "Card"
                  //   | "Cash"
                  //   | "QR"
                  //   | "Loyalty";
                  // const p =
                  //   paymentMethods[paymentMethod] ?? paymentMethods["Cash"];

                  const paymentMethod = normalizePaymentMethod(
                    purchase.paymentMethod,
                  );
                  const p = paymentMethodStyle(purchase.paymentMethod);

                  return (
                    <tr
                      key={idx}
                      onClick={() => {
                        if (purchase.invoiceNo) {
                          onClose();
                          router.push(`/invoices/${purchase.invoiceNo}`);
                        }
                      }}
                      className="border-b border-gray-50 last:border-0 hover:bg-gray-50/50 transition-colors cursor-pointer"
                    >
                      <td className="py-3 px-3 text-gray-400 text-xs">
                        {page * pageSize + idx + 1}
                      </td>
                      <td className="py-3 px-3">
                        <span className="font-semibold text-gray-900 text-xs">
                          {purchase.invoiceNo
                            ? `ORD-${purchase.invoiceNo}`
                            : (purchase.orderId ?? "—")}
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        {date ? (
                          <div>
                            <span className="font-medium text-gray-800 text-xs block">
                              {date.toLocaleTimeString("en-US", {
                                hour: "2-digit",
                                minute: "2-digit",
                                hour12: false,
                              })}
                            </span>
                            <span className="text-[11px] text-gray-400">
                              {date.toLocaleDateString("en-US", {
                                month: "short",
                                day: "numeric",
                                year: "numeric",
                              })}
                            </span>
                          </div>
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </td>
                      <td className="py-3 px-3 text-xs text-gray-600">
                        {purchase.ticketName || "—"}
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span
                          className={`${p.badge} ${p.cell} text-xs font-medium px-2 py-0.5 rounded-full inline-block`}
                        >
                          {paymentMethod}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right text-xs font-semibold text-gray-900">
                        {formatCurrencySymbol(
                          purchase.grandTotal ?? 0,
                          currency.symbol,
                          currency.locale,
                        )}
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span
                          className={`${s.badge} ${s.cell} text-xs font-medium px-2 py-0.5 rounded-full inline-block`}
                        >
                          {status
                            ?.toLowerCase()
                            .replace(/\b\w/g, (char) => char.toUpperCase())}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-2 pt-3 border-t border-gray-100">
              <button
                onClick={() => setPage(Math.max(0, page - 1))}
                disabled={page === 0}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  page === 0
                    ? "text-gray-300 cursor-not-allowed"
                    : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                }`}
              >
                <ChevronLeft size={14} />
                Previous
              </button>
              <span className="text-xs text-gray-400 font-medium">
                Page {page + 1} of {totalPages}
              </span>
              <button
                onClick={() => setPage(Math.min(totalPages - 1, page + 1))}
                disabled={page >= totalPages - 1}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  page >= totalPages - 1
                    ? "text-gray-300 cursor-not-allowed"
                    : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                }`}
              >
                Next
                <ChevronRight size={14} />
              </button>
            </div>
          )}
        </>
      )}
    </ModalShell>
  );
}
