"use client";

import { useState, useMemo, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import {
  Search,
  ChevronDown,
  ChevronUp,
  ArrowUpDown,
  // Eye,
  // Pencil,
  // Copy,
  // Send,
  // FileText,
  // Printer,
  ChevronLeft,
  ChevronRight,
  FileText,
} from "lucide-react";
import { Invoice } from "@/lib/types/invoice";
import { LoyaltyTier } from "@/lib/types/customer";
import { useCurrency } from "@/providers/CurrencyContext";
import { formatCurrencySymbol, formatDatetime } from "@/utils/helper";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import RecordPaymentModal from "@/components/invoice/modals/RecordPaymentModal";
import ExportPdfModal from "@/components/invoice/modals/ExportPdfModal";
import PrintInvoiceModal from "@/components/invoice/modals/PrintInvoiceModal";
import EmailInvoiceModal from "@/components/invoice/modals/EmailInvoiceModal";
import DeleteInvoiceModal from "@/components/invoice/modals/DeleteInvoiceModal";
import MoveToCreditModal from "@/components/invoice/modals/MoveToCreditModal";
import LoadingState from "@/components/ui/LoadingState";
import toast from "react-hot-toast";
import { parseNepalDateTime } from "../dashboardComponents/staffDash/staffDetail/staffDetailHelpers";
import { moveInvoiceToCredit } from "@/services/apiCredit.client";
import { getTicketByInvoice } from "@/services/apiTicket.client";
import { useDuplicateInvoiceStore } from "@/stores/useDuplicateInvoiceStore";

type SortConfig = { key: string; direction: "asc" | "desc" } | null;

const STATUS_STYLES: Record<string, string> = {
  paid: "bg-green-100 text-green-700 border-green-200",
  unpaid: "bg-red-100 text-red-700 border-red-200",
  draft: "bg-gray-100 text-gray-600 border-gray-200",
  overdue: "bg-orange-100 text-orange-700 border-orange-200",
};

const STATUS_FILTER_OPTIONS = ["paid", "unpaid"];

/** Relative "time ago" label: moments / min / hours / days ago. */
function timeAgo(date: Date): string {
  const diffMs = Date.now() - date.getTime();
  const sec = Math.floor(diffMs / 1000);
  if (sec < 60) return "moments ago";
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min} min ago`;
  const hours = Math.floor(min / 60);
  if (hours < 24) return `${hours} ${hours === 1 ? "hour" : "hours"} ago`;
  const days = Math.floor(hours / 24);
  return `${days} ${days === 1 ? "day" : "days"} ago`;
}

export default function InvoiceTable({
  invoices,
  isLoading = false,
}: {
  invoices: Invoice[];
  isLoading?: boolean;
}) {
  const { currency } = useCurrency();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortConfig, setSortConfig] = useState<SortConfig>(null);
  const [page, setPage] = useState(0);
  const [deleteTarget, setDeleteTarget] = useState<Invoice | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [paymentTarget, setPaymentTarget] = useState<Invoice | null>(null);
  const [exportTarget, setExportTarget] = useState<Invoice | null>(null);
  const [printTarget, setPrintTarget] = useState<Invoice | null>(null);
  const [emailTarget, setEmailTarget] = useState<Invoice | null>(null);
  const [moveTarget, setMoveTarget] = useState<Invoice | null>(null);
  const [moving, setMoving] = useState(false);
  const [statusOpen, setStatusOpen] = useState(false);
  const setDuplicate = useDuplicateInvoiceStore((s) => s.setDuplicate);
  const statusRef = useRef<HTMLDivElement | null>(null);
  const pageSize = 10;

  // Close the status dropdown on outside click / Escape
  useEffect(() => {
    const onClickOutside = (e: MouseEvent) => {
      if (statusRef.current && !statusRef.current.contains(e.target as Node)) {
        setStatusOpen(false);
      }
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setStatusOpen(false);
    };
    document.addEventListener("mousedown", onClickOutside);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onClickOutside);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, []);

  // Lifted out of the old inline modal's onClick so DeleteInvoiceModal can be
  // handed a plain onConfirm.
  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/invoices/${deleteTarget.invoice}/archive`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(
          (data as { error?: string }).error || "Failed to delete invoice",
        );
      }
      toast.success("Invoice deleted successfully");
      setDeleteTarget(null);
      window.location.reload();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to delete invoice",
      );
    } finally {
      setDeleting(false);
    }
  };

  const handleMoveToCredit = async () => {
    const invoiceNo = moveTarget?.invoice;
    if (invoiceNo == null) return;
    setMoving(true);
    try {
      await moveInvoiceToCredit(invoiceNo);
      toast.success(`Invoice ORD-${invoiceNo} moved to credit`);
      setMoveTarget(null);
      // Refresh the invoice list (it should drop the moved invoice) + credits.
      queryClient.invalidateQueries({ queryKey: ["invoice"] });
      queryClient.invalidateQueries({ queryKey: ["archived-invoices"] });
      queryClient.invalidateQueries({ queryKey: ["credits"] });
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to move to credit",
      );
    } finally {
      setMoving(false);
    }
  };

  const filtered = useMemo(() => {
    return invoices.filter((inv) => {
      const q = search.toLowerCase();
      const matchSearch =
        !search ||
        String(inv.invoice).includes(q) ||
        (inv.customer_name ?? "").toLowerCase().includes(q) ||
        (inv.ticket_name ?? "").toLowerCase().includes(q);
      const matchStatus =
        statusFilter === "all" ||
        (inv.status ?? "").toLowerCase() === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [invoices, search, statusFilter]);

  const sorted = useMemo(() => {
    if (!sortConfig) return filtered;
    return [...filtered].sort((a, b) => {
      const aVal = String(
        (a as unknown as Record<string, unknown>)[sortConfig.key] ?? "",
      );
      const bVal = String(
        (b as unknown as Record<string, unknown>)[sortConfig.key] ?? "",
      );
      const cmp = aVal.localeCompare(bVal, undefined, { numeric: true });
      return sortConfig.direction === "asc" ? cmp : -cmp;
    });
  }, [filtered, sortConfig]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize));
  const paged = sorted.slice(page * pageSize, (page + 1) * pageSize);

  const toggleSort = (key: string) => {
    setSortConfig((prev) =>
      prev?.key === key && prev.direction === "asc"
        ? { key, direction: "desc" }
        : { key, direction: "asc" },
    );
  };

  const SortIcon = ({ colKey }: { colKey: string }) =>
    sortConfig?.key === colKey ? (
      sortConfig.direction === "asc" ? (
        <ChevronUp className="h-3 w-3" />
      ) : (
        <ChevronDown className="h-3 w-3" />
      )
    ) : (
      <ArrowUpDown className="h-3 w-3 opacity-30" />
    );

  return (
    <>
      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        {/* Hide scrollbar styles */}
        <style jsx global>{`
          .scrollbar-hide {
            scrollbar-width: none;
          }
          .scrollbar-hide::-webkit-scrollbar {
            display: none;
          }
        `}</style>
        <div className="relative flex-1">
          <Search
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
          />
          <input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(0);
            }}
            placeholder="Search invoice # or customer..."
            className="w-full pl-9 pr-4 py-2.5 text-[13px] border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
          />
        </div>
        <div ref={statusRef} className="relative w-full sm:w-[150px]">
          <button
            type="button"
            onClick={() => setStatusOpen((o) => !o)}
            className="w-full flex items-center justify-between gap-2 pl-3 pr-2.5 py-2.5 text-[13px] border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-600 cursor-pointer transition capitalize"
          >
            <span>{statusFilter === "all" ? "All Status" : statusFilter}</span>
            <ChevronDown
              size={14}
              className={`text-gray-400 transition-transform duration-200 ${
                statusOpen ? "rotate-180" : ""
              }`}
            />
          </button>

          <div
            className={`absolute z-30 mt-1.5 w-full origin-top rounded-md border border-gray-200 bg-white shadow-lg p-1 transition-all duration-200 ${
              statusOpen
                ? "opacity-100 scale-100 translate-y-0 pointer-events-auto"
                : "opacity-0 scale-95 -translate-y-1 pointer-events-none"
            }`}
          >
            {[
              { value: "all", label: "All Status" },
              ...STATUS_FILTER_OPTIONS.map((s) => ({ value: s, label: s })),
            ].map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => {
                  setStatusFilter(opt.value);
                  setPage(0);
                  setStatusOpen(false);
                }}
                className={`w-full text-left px-3 py-1.5 text-[13px] rounded-md transition-colors cursor-pointer capitalize ${
                  statusFilter === opt.value
                    ? "bg-blue-50 text-blue-700 font-medium"
                    : "text-gray-600 hover:bg-gray-100"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Table — horizontally scrollable on mobile */}
      {/* <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-x-auto"> */}
      <div className="bg-white overflow-x-auto scrollbar-hide">
        <table className="w-full text-sm min-w-[1000px]">
          <thead>
            <tr className="text-xs text-gray-400 border-b border-gray-100">
              <th className="text-left pb-3 pt-3 px-4 font-medium w-12">
                S.No
              </th>
              <th
                className="text-left pb-3 pt-3 px-4 font-medium cursor-pointer select-none hover:text-gray-600"
                onClick={() => toggleSort("invoice")}
              >
                <span className="flex items-center gap-1">
                  Invoice # {SortIcon({ colKey: "invoice" })}
                </span>
              </th>
              <th className="text-left pb-3 pt-3 px-4 font-medium">
                Invoice Name
              </th>
              <th className="text-left pb-3 pt-3 px-4 font-medium">Customer</th>
              <th
                className="flex items-center pb-3 pt-3 px-4 font-medium cursor-pointer select-none hover:text-gray-600"
                onClick={() => toggleSort("amount")}
              >
                <span className="flex items-center justify-end gap-1">
                  Amount {SortIcon({ colKey: "amount" })}
                </span>
              </th>
              <th
                className="text-left pb-3 pt-3 px-4 font-medium cursor-pointer select-none hover:text-gray-600"
                onClick={() => toggleSort("created_at")}
              >
                <span className="flex items-center gap-1">
                  Date {SortIcon({ colKey: "created_at" })}
                </span>
              </th>
              <th className="text-center pb-3 pt-3 px-4 font-medium">Status</th>
              <th className="text-right pb-3 pt-3 px-4 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {/* Loading lives in the tbody so the header row and the
                controls above stay visible, matching the settings
                tables. */}
            {isLoading ? (
              <tr>
                <td colSpan={9}>
                  <LoadingState message="Loading invoices..." />
                </td>
              </tr>
            ) : paged.length === 0 ? (
              <tr>
                <td
                  colSpan={9}
                  className="text-center py-2 text-sm text-gray-400"
                >
                  <div className="flex flex-col items-center justify-center py-12">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-3">
                      <FileText size={24} className="text-gray-500" />
                    </div>
                    <p className="text-sm font-medium text-gray-500">
                      No invoice found
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      All recently created invoice will appear here
                    </p>
                  </div>
                </td>
              </tr>
            ) : (
              paged.map((inv, idx) => {
                const status = (inv.status ?? "").toLowerCase();
                const invoiceDate = parseNepalDateTime(inv.created_at);
                return (
                  <tr
                    key={inv.invoice}
                    onClick={() => router.push(`/invoices/${inv.invoice}`)}
                    className="border-b border-gray-50 last:border-0 cursor-pointer hover:bg-gray-50 transition-colors"
                  >
                    <td className="py-3 px-4 text-gray-400 text-xs">
                      {page * pageSize + idx + 1}
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-medium text-xs text-gray-900 block">
                        ORD-{inv.invoice}
                      </span>
                      {inv.created_at && (
                        <span className="text-[11px] text-gray-400">
                          {timeAgo(
                            inv.created_at
                              ? new Date(inv.created_at)
                              : new Date(),
                          )}
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-xs text-gray-600">
                      {inv.ticket_name || "—"}
                    </td>
                    <td className="py-3 px-4 text-xs text-gray-600">
                      {inv.customer_name ?? "—"}
                    </td>

                    <td className="py-3 px-4 text-xs text-left font-semibold text-gray-900">
                      {/* {formatCurrency(Number(inv.amount), currency)} */}
                      {formatCurrencySymbol(
                        Number(inv.amount),
                        currency.symbol,
                        currency.locale,
                      )}
                    </td>

                    <td className="py-3 px-4">
                      {invoiceDate ? (
                        <div>
                          <span className="font-medium text-gray-800 text-xs block">
                            {/* {invoiceDate.toLocaleTimeString("en-US", {
                              hour: "2-digit",
                              minute: "2-digit",
                              hour12: false,
                            })}{" "} */}
                            {new Date(inv.created_at).toLocaleString(
                              undefined,
                              {
                                hour: "2-digit",
                                minute: "2-digit",
                                hour12: false,
                              },
                            )}{" "}
                            <span className="text-[10px] font-normal text-gray-400">
                              {"  "}[{" "}
                              {new Date(inv.created_at).toLocaleString(
                                undefined,
                                {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                },
                              )}{" "}
                              ]
                            </span>
                          </span>
                          <span className="text-[11px] text-gray-400">
                            {invoiceDate.toLocaleDateString("en-US", {
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

                    <td className="py-3 px-4  text-center">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border capitalize ${STATUS_STYLES[status] ?? "bg-gray-100 text-gray-600 border-gray-200"}`}
                      >
                        {inv.status ?? "—"}
                      </span>
                    </td>
                    <td
                      className="py-3 px-4"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="flex items-center justify-end">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button
                              onClick={(e) => e.stopPropagation()}
                              title="Actions"
                              className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-blue-500 hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                            >
                              <ChevronDown className="h-4 w-4" />
                            </button>
                          </DropdownMenuTrigger>

                          <DropdownMenuContent
                            align="end"
                            className="w-48 rounded-xl p-1.5"
                          >
                            <DropdownMenuItem
                              className="rounded-lg cursor-pointer"
                              onSelect={() =>
                                router.push(`/invoices/${inv.invoice}`)
                              }
                            >
                              {/* <Eye className="h-4 w-4" /> */}
                              View
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="rounded-lg cursor-pointer"
                              onSelect={() =>
                                router.push(`/invoices/${inv.invoice}/edit`)
                              }
                            >
                              {/* <Pencil className="h-4 w-4" /> */}
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="rounded-lg cursor-pointer"
                              onSelect={async () => {
                                try {
                                  const res = await getTicketByInvoice(
                                    String(inv.invoice),
                                  );
                                  const ticket = res?.data?.Tickets;
                                  if (!ticket) {
                                    toast.error(
                                      "Could not load invoice details for duplication",
                                    );
                                    return;
                                  }

                                  // ── Look up customer by phone/email ──
                                  let customer = null;
                                  const identifier =
                                    ticket.phoneNumber || ticket.customerEmail;
                                  if (identifier) {
                                    const query = ticket.phoneNumber
                                      ? `phone=${ticket.phoneNumber}`
                                      : `email=${ticket.customerEmail}`;
                                    try {
                                      const custRes = await fetch(
                                        `/api/customers/lookup?${query}`,
                                      );
                                      const custData = await custRes.json();
                                      const raw = custData?.data?.users?.[0];
                                      if (raw) {
                                        customer = {
                                          id: raw._id,
                                          name: raw.name,
                                          email: raw.email,
                                          phone: raw.phone,
                                          loyaltyPoint: raw.loyaltyPoint ?? 0,
                                          loyaltyStatus:
                                            "Bronze" as LoyaltyTier,
                                          customerPan: raw.customerPan ?? null,
                                          image: raw.image ?? null,
                                        };
                                      }
                                    } catch {
                                      // fallback: build a partial customer
                                    }
                                  }

                                  // If lookup failed, build a minimal customer
                                  if (!customer) {
                                    customer = {
                                      id: "",
                                      name:
                                        ticket.customerName ??
                                        ticket.ticketName ??
                                        "",
                                      email: ticket.customerEmail ?? "",
                                      phone: ticket.phoneNumber ?? "",
                                      loyaltyPoint: 0,
                                      loyaltyStatus: "Bronze" as LoyaltyTier,
                                      customerPan: null,
                                      image: null,
                                    };
                                  }

                                  // ── Map items ──
                                  //
                                  // Everything here comes off the ticket's own
                                  // items rather than being looked up against
                                  // the inventory: a duplicate should reproduce
                                  // the invoice that was raised, including the
                                  // discounts and taxability it was raised
                                  // with, even if the product has been changed
                                  // since.
                                  //
                                  // `items` is an array of GROUPS, each holding
                                  // an `item` array — reading only `[0]` lost
                                  // every line after the first product group.
                                  const rawItems = (
                                    (ticket.items as Array<
                                      Record<string, unknown>
                                    >) ?? []
                                  ).flatMap(
                                    (group) =>
                                      (group?.item as Array<
                                        Record<string, unknown>
                                      >) ?? [],
                                  );

                                  const mappedItems = rawItems.map(
                                    (item: Record<string, unknown>) => ({
                                      id: crypto.randomUUID(),
                                      productId: (item.product as string) ?? "",
                                      name: (item.productName as string) ?? "",
                                      description:
                                        (item.description as string) ?? "",
                                      quantity: (item.quantity as number) ?? 1,
                                      price: (item.unitPrice as number) ?? 0,
                                      // A stored discount is a subdocument:
                                      // `_id` is its own id and `discount`
                                      // holds the master id the picker is
                                      // keyed by. Taking `_id` meant no
                                      // duplicated discount ever matched, so
                                      // they vanished from the row and from
                                      // the payload.
                                      discounts: (
                                        (item.discounts as Array<
                                          Record<string, unknown>
                                        >) ?? []
                                      )
                                        .map((d) =>
                                          typeof d === "string"
                                            ? d
                                            : ((d?.discount ??
                                                d?._id) as string),
                                        )
                                        .filter(Boolean),
                                      taxes: [],
                                      isTaxable:
                                        (item.isTaxable as boolean) ?? false,
                                    }),
                                  );

                                  // If there are no items, add a blank one
                                  if (mappedItems.length === 0) {
                                    mappedItems.push({
                                      id: crypto.randomUUID(),
                                      productId: "",
                                      name: "",
                                      description: "",
                                      quantity: 1,
                                      price: 0,
                                      discounts: [],
                                      taxes: [],
                                      isTaxable: false,
                                    });
                                  }

                                  // ── Notes (strip any appended invoice ref) ──
                                  const notes = ticket.note
                                    ? (ticket.note
                                        .split("|Invoice:")[0]
                                        ?.trim() ?? "")
                                    : "";

                                  // ── Preserve discount amount ──
                                  const discountAmount = ticket.discount ?? 0;

                                  // ── Invoice title with " COPY" appended ──
                                  const invoiceTitle = ticket.ticketName
                                    ? `${ticket.ticketName} COPY`
                                    : "";

                                  setDuplicate({
                                    customer,
                                    invoiceTitle,
                                    items: mappedItems,
                                    notes,
                                    discountAmount,
                                  });

                                  router.push("/invoices/add");
                                } catch (err) {
                                  toast.error(
                                    err instanceof Error
                                      ? err.message
                                      : "Failed to duplicate invoice",
                                  );
                                }
                              }}
                            >
                              Duplicate
                            </DropdownMenuItem>

                            <DropdownMenuSeparator />

                            <DropdownMenuItem
                              className="rounded-lg cursor-pointer"
                              onSelect={() => setPaymentTarget(inv)}
                            >
                              {/* <Wallet className="h-4 w-4" /> */}
                              Record payment
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="rounded-lg cursor-pointer"
                              onSelect={() => setEmailTarget(inv)}
                            >
                              {/* <Send className="h-4 w-4" /> */}
                              Resend invoice
                            </DropdownMenuItem>

                            <DropdownMenuSeparator />

                            <DropdownMenuItem
                              className="rounded-lg cursor-pointer"
                              onSelect={() => setExportTarget(inv)}
                            >
                              {/* <FileText className="h-4 w-4" /> */}
                              Export as PDF
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="rounded-lg cursor-pointer"
                              onSelect={() => setPrintTarget(inv)}
                            >
                              {/* <Printer className="h-4 w-4" /> */}
                              Print
                            </DropdownMenuItem>

                            <DropdownMenuSeparator />

                            <DropdownMenuItem
                              className="rounded-lg cursor-pointer"
                              onSelect={() => setMoveTarget(inv)}
                            >
                              Move to credit
                            </DropdownMenuItem>

                            <DropdownMenuItem
                              className="rounded-lg text-red-600 focus:bg-red-50 focus:text-red-600 cursor-pointer"
                              onSelect={() => setDeleteTarget(inv)}
                            >
                              {/* <Trash2 className="h-4 w-4 text-red-600" /> */}
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
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
      <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-100">
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
          Page {page + 1} of {totalPages} · {sorted.length} invoices
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

      {/* Delete Confirmation Modal */}
      <DeleteInvoiceModal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        invoiceNo={deleteTarget?.invoice}
        isDeleting={deleting}
        onConfirm={handleDelete}
      />

      {/* Record Payment Modal */}
      <RecordPaymentModal
        open={!!paymentTarget}
        onClose={() => setPaymentTarget(null)}
        invoiceNo={paymentTarget?.invoice}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ["invoice"] });
          queryClient.invalidateQueries({ queryKey: ["archived-invoices"] });
        }}
      />

      {/* Export as PDF Modal */}
      <ExportPdfModal
        open={!!exportTarget}
        onClose={() => setExportTarget(null)}
        invoiceNo={exportTarget?.invoice}
      />

      {/* Print Invoice Modal */}
      <PrintInvoiceModal
        open={!!printTarget}
        onClose={() => setPrintTarget(null)}
        invoiceNo={printTarget?.invoice}
      />

      {/* Email Invoice Modal (Resend invoice) */}
      <EmailInvoiceModal
        open={!!emailTarget}
        onClose={() => setEmailTarget(null)}
        invoiceNo={emailTarget?.invoice}
      />

      {/* Move to Credit Confirmation Modal */}
      <MoveToCreditModal
        open={!!moveTarget}
        onClose={() => setMoveTarget(null)}
        invoiceNo={moveTarget?.invoice}
        movingToCredit={moving}
        onConfirm={handleMoveToCredit}
      />
    </>
  );
}
