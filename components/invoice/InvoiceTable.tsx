"use client";

import { useState, useMemo, useRef, useEffect } from "react";
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
import { formatCurrencySymbol } from "@/utils/helper";
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
import DueDateCell from "@/components/ui/DueDateCell";
import StatusPill from "@/components/ui/StatusPill";
import toast from "react-hot-toast";
import { parseNepalDateTime } from "../dashboardComponents/staffDash/staffDetail/staffDetailHelpers";
import { moveInvoiceToCredit } from "@/services/apiCredit.client";
import {
  getTicketByInvoice,
  updateReminderSettings,
} from "@/services/apiTicket.client";
import DueDateModal from "@/components/invoice/modals/DueDateModal";
import { nepalDateString } from "@/lib/nepalDate";
import {
  DUE_DATE_FILTER_OPTIONS,
  matchesDueDateFilter,
  type DueDateFilter,
} from "@/lib/dueDateFilter";
import { FilterSelect } from "@/components/ui/FilterSelect";
import ColumnPicker, {
  readStoredColumns,
  storeColumns,
  type TableColumn,
} from "@/components/ui/ColumnPicker";
import { useDuplicateInvoiceStore } from "@/stores/useDuplicateInvoiceStore";
import { CHART_PALETTE } from "../dashboardComponents/chartCard";

type SortConfig = { key: string; direction: "asc" | "desc" } | null;

const STATUS_FILTER_OPTIONS = ["paid", "unpaid"];

/**
 * Keys match the sort keys, so hiding a column and sorting by it are talking
 * about the same thing. Actions is locked: it is the row menu, and taking it
 * away removes what a row can do rather than what it shows.
 */
const INVOICE_COLUMNS: TableColumn[] = [
  { key: "status", label: "Status" },
  { key: "due_date", label: "Due date" },
  { key: "invoice", label: "Invoice #" },
  { key: "ticket_name", label: "Invoice Name" },
  { key: "customer", label: "Customer" },
  { key: "amount", label: "Amount" },
  { key: "created_at", label: "Date" },
  { key: "actions", label: "Actions", locked: true },
];

const COLUMNS_STORAGE_KEY = "rebuzz-invoice-table-columns";
const MIN_COLUMNS = 3;

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
  showStatusFilter = true,
}: {
  invoices: Invoice[];
  isLoading?: boolean;
  /** Matches CreditsTable's prop of the same name. */
  showStatusFilter?: boolean;
}) {
  const { currency } = useCurrency();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dueDateFilter, setDueDateFilter] = useState<DueDateFilter>("all");
  const [sortConfig, setSortConfig] = useState<SortConfig>(null);

  // Initialiser, not an effect: reading storage in an effect renders one frame
  // with the wrong columns, and this repo's lint rules forbid it besides.
  const [visibleColumns, setVisibleColumns] = useState<string[]>(() =>
    readStoredColumns(COLUMNS_STORAGE_KEY, INVOICE_COLUMNS, MIN_COLUMNS),
  );
  const [page, setPage] = useState(0);
  const [deleteTarget, setDeleteTarget] = useState<Invoice | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [paymentTarget, setPaymentTarget] = useState<Invoice | null>(null);
  const [exportTarget, setExportTarget] = useState<Invoice | null>(null);
  const [printTarget, setPrintTarget] = useState<Invoice | null>(null);
  const [emailTarget, setEmailTarget] = useState<Invoice | null>(null);
  const [moveTarget, setMoveTarget] = useState<Invoice | null>(null);
  const [moving, setMoving] = useState(false);
  const [dueDateTarget, setDueDateTarget] = useState<Invoice | null>(null);
  const [savingDueDate, setSavingDueDate] = useState(false);
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

  const openDueDate = (invoice: Invoice) => setDueDateTarget(invoice);

  const handleSaveDueDate = async (settings: {
    dueDate: string;
    reminderSchedule: number[];
  }) => {
    const invoiceNo = dueDateTarget?.invoice;
    if (invoiceNo == null) return;

    setSavingDueDate(true);
    try {
      await updateReminderSettings(invoiceNo, settings);
      toast.success("Due date saved");
      setDueDateTarget(null);
      queryClient.invalidateQueries({ queryKey: ["invoice"] });
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to save the due date",
      );
    } finally {
      setSavingDueDate(false);
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
      const matchDueDate = matchesDueDateFilter(inv.due_date, dueDateFilter);
      return matchSearch && matchStatus && matchDueDate;
    });
  }, [invoices, search, statusFilter, dueDateFilter]);

  const sorted = useMemo(() => {
    if (!sortConfig) return filtered;
    return [...filtered].sort((a, b) => {
      const read = (row: Invoice) =>
        (row as unknown as Record<string, unknown>)[sortConfig.key];

      const aRaw = read(a);
      const bRaw = read(b);

      // Rows missing the value sink to the bottom whichever way the column is
      // sorted. Coerced to "" they would lead an ascending sort, which is
      // where the eye goes first and exactly where an invoice with no due date
      // does not belong.
      const aEmpty = aRaw === null || aRaw === undefined || aRaw === "";
      const bEmpty = bRaw === null || bRaw === undefined || bRaw === "";
      if (aEmpty && bEmpty) return 0;
      if (aEmpty) return 1;
      if (bEmpty) return -1;

      const cmp = String(aRaw).localeCompare(String(bRaw), undefined, {
        numeric: true,
      });
      return sortConfig.direction === "asc" ? cmp : -cmp;
    });
  }, [filtered, sortConfig]);

  const shownColumns = new Set(visibleColumns);
  const showColumn = (key: string) =>
    shownColumns.has(key) ||
    INVOICE_COLUMNS.some((c) => c.key === key && c.locked);

  const columnCount = INVOICE_COLUMNS.filter((c) => showColumn(c.key)).length;

  const handleColumnsChange = (next: string[]) => {
    setVisibleColumns(next);
    storeColumns(COLUMNS_STORAGE_KEY, next);
    // Sorting by a column you can no longer see leaves the rows in an order
    // with nothing on screen to explain it.
    setSortConfig((prev) => (prev && !next.includes(prev.key) ? null : prev));
  };

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
        <FilterSelect
          value={dueDateFilter}
          options={DUE_DATE_FILTER_OPTIONS}
          onChange={(v) => {
            setDueDateFilter(v as DueDateFilter);
            // Otherwise a narrower result set leaves you on a page that no
            // longer exists, looking at an empty table.
            setPage(0);
          }}
          className="w-full sm:w-[170px]"
        />

        {/* Hidden where the page already splits invoices into its own tabs —
            a second filter there just gives two ways to narrow the same list
            and two states that can disagree. */}
        <div
          ref={statusRef}
          className={`relative w-full sm:w-[150px] ${showStatusFilter ? "" : "hidden"}`}
        >
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

        <ColumnPicker
          columns={INVOICE_COLUMNS}
          visible={visibleColumns}
          onChange={handleColumnsChange}
          minVisible={MIN_COLUMNS}
          className="w-full sm:w-[150px]"
        />
      </div>

      {/* Table — horizontally scrollable on mobile */}
      {/* <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-x-auto"> */}
      <div className="bg-white overflow-x-auto scrollbar-hide">
        <table
          className="w-full text-sm"
          // Scales with what is actually shown. A fixed floor sized for every
          // column left a horizontal scrollbar over empty space once a few
          // were hidden.
          style={{ minWidth: `${Math.max(640, columnCount * 150)}px` }}
        >
          <thead>
            <tr
              className="border-b text-[11px] tracking-wider"
              style={{
                borderColor: CHART_PALETTE.grid,
                color: CHART_PALETTE.axis,
              }}
            >
              {/* <th className="text-left pb-3 pt-3 px-4 font-medium w-12">
                S.No
              </th> */}
              {showColumn("status") && (
                <th className="text-left pb-3 pt-3 px-4 font-medium">Status</th>
              )}
              {showColumn("due_date") && (
                <th
                  className="text-left pb-3 pt-3 px-4 font-medium cursor-pointer select-none hover:text-gray-600"
                  onClick={() => toggleSort("due_date")}
                >
                  <span className="flex items-center gap-1">
                    Due date {SortIcon({ colKey: "due_date" })}
                  </span>
                </th>
              )}
              {showColumn("invoice") && (
                <th
                  className="text-left pb-3 pt-3 px-4 font-medium cursor-pointer select-none hover:text-gray-600"
                  onClick={() => toggleSort("invoice")}
                >
                  <span className="flex items-center gap-1">
                    Invoice # {SortIcon({ colKey: "invoice" })}
                  </span>
                </th>
              )}
              {showColumn("ticket_name") && (
                <th className="text-left pb-3 pt-3 px-4 font-medium">
                  Invoice Name
                </th>
              )}
              {showColumn("customer") && (
                <th className="text-left pb-3 pt-3 px-4 font-medium">
                  Customer
                </th>
              )}
              {showColumn("amount") && (
                <th
                  className="text-right pb-3 pt-3 px-4 font-medium cursor-pointer select-none hover:text-gray-600"
                  onClick={() => toggleSort("amount")}
                >
                  <span className="flex items-center justify-end gap-1">
                    Amount {SortIcon({ colKey: "amount" })}
                  </span>
                </th>
              )}
              {showColumn("created_at") && (
                <th
                  className="text-right pb-3 pt-3 px-4 font-medium cursor-pointer select-none hover:text-gray-600"
                  onClick={() => toggleSort("created_at")}
                >
                  <span className="flex items-center justify-end gap-1">
                    Date / Time {SortIcon({ colKey: "created_at" })}
                  </span>
                </th>
              )}
              <th className="text-right pb-3 pt-3 px-4 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {/* Loading lives in the tbody so the header row and the
                controls above stay visible, matching the settings
                tables. */}
            {isLoading ? (
              <tr>
                <td colSpan={columnCount}>
                  <LoadingState message="Loading invoices..." />
                </td>
              </tr>
            ) : paged.length === 0 ? (
              <tr>
                <td
                  colSpan={columnCount}
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
              paged.map((inv) => {
                const status = (inv.status ?? "").toLowerCase();
                const invoiceDate = parseNepalDateTime(inv.created_at);
                return (
                  <tr
                    key={inv.invoice}
                    onClick={() => router.push(`/invoices/${inv.invoice}`)}
                    className="border-b border-gray-50 last:border-0 cursor-pointer hover:bg-gray-50 transition-colors"
                  >
                    {/* <td className="py-3 px-4 text-gray-400 text-xs">
                      {page * pageSize + idx + 1}
                    </td> */}
                    {showColumn("status") && (
                      <td className="py-3 px-4">
                        <StatusPill label={inv.status ?? "—"} />
                      </td>
                    )}
                    {showColumn("due_date") && (
                      <td className="py-3 px-4">
                        <DueDateCell
                          dueDate={inv.due_date}
                          // A paid or refunded invoice owes nothing, so its
                          // date is a record rather than a deadline.
                          settled={status === "paid" || status === "refunded"}
                        />
                      </td>
                    )}
                    {showColumn("invoice") && (
                      <td className="py-3 px-4">
                        <span
                          className="font-medium text-xs block"
                          style={{ color: CHART_PALETTE.title }}
                        >
                          ORD-{inv.invoice}
                        </span>
                        {inv.created_at && (
                          <span
                            className="text-[11px]"
                            style={{ color: CHART_PALETTE.subtitle }}
                          >
                            {timeAgo(
                              inv.created_at
                                ? new Date(inv.created_at)
                                : new Date(),
                            )}
                          </span>
                        )}
                      </td>
                    )}
                    {showColumn("ticket_name") && (
                      <td
                        className="py-3 px-4 text-[13px]"
                        style={{ color: CHART_PALETTE.title }}
                      >
                        {inv.ticket_name || "—"}
                      </td>
                    )}
                    {showColumn("customer") && (
                      <td
                        className="py-3 px-4 text-[13px]"
                        style={{ color: CHART_PALETTE.title }}
                      >
                        {inv.customer_name ?? "—"}
                      </td>
                    )}

                    {showColumn("amount") && (
                      <td
                        className="py-3 px-4 text-[13px] text-right tracking-wide tabular-nums font-medium"
                        style={{ color: CHART_PALETTE.title }}
                      >
                        {formatCurrencySymbol(
                          Number(inv.amount),
                          currency.symbol,
                          currency.locale,
                        )}
                      </td>
                    )}

                    {showColumn("created_at") && (
                      <td className="py-3 px-4 text-right">
                        {invoiceDate ? (
                          <div>
                            <span
                              className=" text-gray-800 text-xs tracking-wide block"
                              style={{ color: CHART_PALETTE.title }}
                            >
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
                              <span
                                className="text-[10px] font-normal"
                                style={{ color: CHART_PALETTE.subtitle }}
                              >
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
                            <span
                              className="text-[11px]"
                              style={{ color: CHART_PALETTE.subtitle }}
                            >
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
                    )}

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
                              onSelect={() => openDueDate(inv)}
                            >
                              {inv.due_date ? "Edit due date" : "Set due date"}
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

      {/* Mounted on demand so the form always opens on the row's own saved
          values — see the note in the modal. */}
      {dueDateTarget && (
        <DueDateModal
          onClose={() => setDueDateTarget(null)}
          invoiceNo={dueDateTarget.invoice}
          dueDate={nepalDateString(dueDateTarget.due_date)}
          reminderSchedule={dueDateTarget.reminder_schedule ?? []}
          isSaving={savingDueDate}
          onSubmit={handleSaveDueDate}
        />
      )}
    </>
  );
}
