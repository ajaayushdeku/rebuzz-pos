"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Calendar, ShoppingBag } from "lucide-react";
import { useCurrency } from "@/providers/CurrencyContext";
import { formatCurrencySymbol } from "@/utils/helper";
import {
  normalizePaymentMethod,
  paymentMethodStyle,
} from "@/lib/config/transaction";
import { ComponentHeader } from "@/components/ComponentHeader";
import { OrderHistoryTableSkeleton } from "@/components/customer/CustomerDetailSkeletons";
import TablePagination from "@/components/ui/TablePagination";
import { DETAIL_CARD, CardHeader } from "./DetailCardShell";
import {
  ORDER_STATUS_STYLE,
  parseNepalDate,
  type PurchaseHistoryItem,
} from "./customerDetailHelpers";

const PAGE_SIZE = 5;

export default function OrderHistorySection({
  customerName,
  history,
  loading,
}: {
  customerName: string;
  history: PurchaseHistoryItem[];
  loading: boolean;
}) {
  const router = useRouter();
  const { currency } = useCurrency();
  const [page, setPage] = useState(0);

  const totalPages = Math.max(1, Math.ceil(history.length / PAGE_SIZE));
  // Clamped, so a shrinking list cannot leave the view on an empty page.
  const safePage = Math.min(page, totalPages - 1);
  const paged = history.slice(safePage * PAGE_SIZE, (safePage + 1) * PAGE_SIZE);

  return (
    <div className={`${DETAIL_CARD} mt-6`}>
      <CardHeader
        icon={Calendar}
        iconColor="text-purple-500"
        iconBg="bg-purple-50"
        action={
          <span className="shrink-0 text-xs font-medium tabular-nums text-gray-400">
            {history.length} {history.length === 1 ? "order" : "orders"}
          </span>
        }
      >
        <ComponentHeader
          title="Order History"
          subHeader="Customer's Order/Transaction History"
        />
      </CardHeader>

      {loading ? (
        <OrderHistoryTableSkeleton />
      ) : history.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <div className="mb-2 flex h-14 w-14 items-center justify-center rounded-full bg-gray-100">
            <ShoppingBag size={24} className="text-gray-500" />
          </div>
          <p className="text-sm font-medium text-gray-500">
            No order history data available
          </p>
          <p className="mt-1 text-xs text-gray-400">No order history found</p>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <table className="w-full min-w-[850px] text-sm">
              <thead>
                <tr className="border-b border-gray-100 text-xs text-gray-400">
                  <th className="w-10 px-3 pb-3 pt-3 text-left font-medium">
                    #
                  </th>
                  <th className="px-3 pb-3 pt-3 text-left font-medium">
                    Order ID
                  </th>
                  <th className="px-3 pb-3 pt-3 text-left font-medium">
                    Date / Time
                  </th>
                  <th className="px-3 pb-3 pt-3 text-left font-medium">
                    Invoice Name
                  </th>
                  <th className="px-3 pb-3 pt-3 text-left font-medium">
                    Customer
                  </th>
                  <th className="px-3 pb-3 pt-3 text-center font-medium">
                    Payment
                  </th>
                  <th className="px-3 pb-3 pt-3 text-right font-medium">
                    Total
                  </th>
                  <th className="px-3 pb-3 pt-3 text-center font-medium">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody>
                {paged.map((purchase, idx) => {
                  const rawDate = purchase.paidAt ?? purchase.createdAt;
                  const date = rawDate ? parseNepalDate(rawDate) : null;

                  const isRefunded = !!purchase.isRefunded;
                  const statusKey: "completed" | "refunded" = isRefunded
                    ? "refunded"
                    : "completed";
                  const orderStatusStyle =
                    ORDER_STATUS_STYLE[statusKey] ??
                    "bg-gray-50 text-gray-600 border-gray-200";

                  // Normalise rather than cast — the raw value is
                  // inconsistently cased, so a cast asserts a shape the data
                  // does not have and the style lookup misses.
                  const paymentMethod = normalizePaymentMethod(
                    purchase.paymentMethod,
                  );
                  const p = paymentMethodStyle(purchase.paymentMethod);

                  return (
                    <tr
                      key={purchase.invoiceNo ?? purchase.orderId ?? idx}
                      onClick={() =>
                        purchase.invoiceNo &&
                        router.push(`/invoices/${purchase.invoiceNo}`)
                      }
                      className="cursor-pointer border-b border-gray-50 transition-colors last:border-0 hover:bg-gray-50/50"
                    >
                      <td className="px-3 py-3 text-xs tabular-nums text-gray-400">
                        {safePage * PAGE_SIZE + idx + 1}
                      </td>
                      <td className="px-3 py-3">
                        <span className="text-xs font-semibold text-gray-900">
                          {purchase.invoiceNo
                            ? `ORD-${purchase.invoiceNo}`
                            : (purchase.orderId ?? "—")}
                        </span>
                      </td>
                      <td className="px-3 py-3">
                        {date ? (
                          <div>
                            <span className="block text-xs font-medium tabular-nums text-gray-800">
                              {date.toLocaleTimeString("en-US", {
                                hour: "2-digit",
                                minute: "2-digit",
                                hour12: false,
                              })}
                            </span>
                            <span className="text-[11px] tabular-nums text-gray-400">
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
                      <td className="px-3 py-3 text-xs text-gray-600">
                        {purchase.ticketName || "—"}
                      </td>
                      <td className="px-3 py-3 text-xs text-gray-600">
                        {customerName || "—"}
                      </td>
                      <td className="px-3 py-3 text-center">
                        <span
                          className={`${p.badge} ${p.cell} inline-block rounded-full px-2 py-0.5 text-xs font-medium capitalize`}
                        >
                          {paymentMethod}
                        </span>
                      </td>
                      <td className="px-3 py-3 text-right text-xs font-semibold tabular-nums text-gray-900">
                        {formatCurrencySymbol(
                          purchase.grandTotal ?? 0,
                          currency.symbol,
                          currency.locale,
                        )}
                      </td>
                      <td className="px-3 py-3 text-center">
                        <span
                          className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${orderStatusStyle}`}
                        >
                          {statusKey}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <TablePagination
              page={safePage}
              totalPages={totalPages}
              total={history.length}
              noun="orders"
              onPageChange={setPage}
            />
          )}
        </>
      )}
    </div>
  );
}
