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
import {
  CardInfo,
  CHART_PALETTE,
} from "@/components/dashboardComponents/chartCard";
import StatusPill from "@/components/ui/StatusPill";
import { OrderHistoryTableSkeleton } from "@/components/customer/CustomerDetailSkeletons";
import TablePagination from "@/components/ui/TablePagination";
import { DETAIL_CARD, CardHeader } from "./DetailCardShell";
import { nepalStamp, timeAgo } from "@/lib/nepalDate";
import { type PurchaseHistoryItem } from "./customerDetailHelpers";

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
        iconColor="text-blue-500"
        iconBg="bg-blue-50"
        action={
          <span className="shrink-0 rounded-full border border-[#dadce0] bg-white px-3 py-1 text-[11px] tabular-nums text-[#3c4043]">
            {history.length} {history.length === 1 ? "order" : "orders"}
          </span>
        }
      >
        <div className="min-w-0">
          <h3
            className="flex items-center gap-1.5 text-[15px] font-normal"
            style={{ color: CHART_PALETTE.title }}
          >
            Order History
            <CardInfo
              heading="Reading this table"
              label="Order History"
              // Rows open the invoice; times are Nepal time.
              body="Every order this customer has paid for, newest page first. Times are Nepal time, with the 12-hour reading beside them. Click a row to open its invoice."
            />
          </h3>
          <p
            className="mt-0.5 text-xs tracking-wide"
            style={{ color: CHART_PALETTE.subtitle }}
          >
            All orders placed by this customer
          </p>
        </div>
      </CardHeader>

      {loading ? (
        <OrderHistoryTableSkeleton />
      ) : history.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-[#f1f3f4]">
            <ShoppingBag size={24} className="text-gray-500" />
          </div>
          <p className="text-sm text-[#3c4043]">No orders yet</p>
          <p className="mt-1 text-xs text-[#9aa0a6]">
            This customer&apos;s orders will appear here
          </p>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <table className="w-full table-fixed min-w-[850px] text-sm">
              {/* `table-fixed` with declared widths: auto layout sized the columns
                  from whatever rows were on screen, so filtering, paging or a longer
                  name moved them. Invoice Name takes the slack. */}
              <colgroup>
                <col className="w-12" />
                <col className="w-32" />
                <col className="w-40" />
                <col />
                <col className="w-36" />
                <col className="w-28" />
                <col className="w-32" />
                <col className="w-28" />
              </colgroup>
              <thead>
                <tr
                  className="border-b text-[11px] tracking-wider"
                  style={{
                    borderColor: CHART_PALETTE.grid,
                    color: CHART_PALETTE.axis,
                  }}
                >
                  <th className="w-10 px-3 pb-2.5 pt-1 text-left font-normal">
                    S.No.
                  </th>
                  <th className="px-3 pb-2.5 pt-1 text-left font-normal">
                    Order ID
                  </th>
                  <th className="px-3 pb-2.5 pt-1 text-left font-normal">
                    Date / Time
                  </th>
                  <th className="px-3 pb-2.5 pt-1 text-left font-normal">
                    Invoice Name
                  </th>
                  <th className="px-3 pb-2.5 pt-1 text-left font-normal">
                    Customer
                  </th>
                  <th className="px-3 pb-2.5 pt-1 text-center font-normal">
                    Payment
                  </th>
                  <th className="px-3 pb-2.5 pt-1 text-right font-normal">
                    Total
                  </th>
                  <th className="px-3 pb-2.5 pt-1 text-center font-normal">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody>
                {paged.map((purchase, idx) => {
                  // Nepal time on every machine; see nepalStamp. The old
                  // parser shifted paidAt to Nepal time and the cell then
                  // formatted it in the viewer's zone, adding the 5h45m a
                  // second time in Nepal: a 1:55pm sale read as 19:40.
                  const stamp = nepalStamp(
                    purchase.paidAt ?? purchase.createdAt,
                  );

                  const statusKey: "completed" | "refunded" =
                    purchase.isRefunded ? "refunded" : "completed";

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
                      className="cursor-pointer border-b border-[#e8eaed] transition-colors last:border-0 hover:bg-[#f8f9fa]"
                    >
                      <td className="px-3 py-3 text-xs tabular-nums text-[#9aa0a6]">
                        {safePage * PAGE_SIZE + idx + 1}
                      </td>
                      <td className="px-3 py-3">
                        <span
                          className="block text-xs font-medium"
                          style={{ color: CHART_PALETTE.title }}
                        >
                          {purchase.invoiceNo
                            ? `ORD-${purchase.invoiceNo}`
                            : (purchase.orderId ?? "—")}
                        </span>
                        {stamp && (
                          <span
                            className="text-[11px] "
                            style={{ color: CHART_PALETTE.subtitle }}
                          >
                            {timeAgo(stamp.instant)}
                          </span>
                        )}
                      </td>
                      <td className="px-3 py-3">
                        {/* The same cell Order History and the invoice
                            table draw: 24-hour time with the 12-hour reading
                            beside it, the date under it. */}
                        {stamp ? (
                          <div>
                            <span
                              className="block text-xs  tracking-wide tabular-nums "
                              style={{ color: CHART_PALETTE.title }}
                            >
                              {stamp.time24}
                              <span
                                className="text-[10px] font-normal "
                                style={{ color: CHART_PALETTE.subtitle }}
                              >
                                {"  "}[ {stamp.time12} ]
                              </span>
                            </span>
                            <span
                              className="text-[11px] tabular-nums "
                              style={{ color: CHART_PALETTE.subtitle }}
                            >
                              {stamp.date}
                            </span>
                          </div>
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </td>
                      <td
                        className="px-3 py-3 text-[13px] text-[#5f6368]"
                        style={{ color: CHART_PALETTE.title }}
                      >
                        {purchase.ticketName || "—"}
                      </td>
                      <td
                        className="px-3 py-3 text-[13px] text-[#5f6368]"
                        style={{ color: CHART_PALETTE.title }}
                      >
                        {customerName || "—"}
                      </td>
                      <td className="px-3 py-3 text-center">
                        <span
                          className={`${p.badge} ${p.cell} inline-block rounded-full px-2 py-0.5 text-xs font-medium capitalize`}
                        >
                          {paymentMethod}
                        </span>
                      </td>
                      <td
                        className="px-3 py-3 text-right text-[13px] font-medium tabular-nums "
                        style={{ color: CHART_PALETTE.title }}
                      >
                        {formatCurrencySymbol(
                          purchase.grandTotal ?? 0,
                          currency.symbol,
                          currency.locale,
                        )}
                      </td>
                      <td className="px-3 py-3 text-center">
                        <StatusPill label={statusKey} />
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
