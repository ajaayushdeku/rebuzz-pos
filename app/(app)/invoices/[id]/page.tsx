"use client";

import toast from "react-hot-toast";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";

import {
  AlertTriangle,
  ArrowLeft,
  Bell,
  Check,
  ChevronDown,
  Circle,
  CreditCard,
  FileText,
  Mail,
  Plus,
  Send,
} from "lucide-react";

import { useBusiness } from "@/hooks/useBusiness";
import { getTicketByInvoice } from "@/services/apiTicket.client";
import {
  archiveCredit,
  deleteCreditPayment,
  moveInvoiceToCredit,
  sendCreditReminder,
  type CreditPayment,
} from "@/services/apiCredit.client";
import { useInvoiceCredit } from "@/components/invoice/modals/useInvoiceTicket";
import { getTransactionDetail } from "@/services/dashboardServices/apiTransactionClient";
import RefundModal from "@/components/dashboardComponents/orderHistory/RefundModal";
import type { Transaction } from "@/components/dashboardComponents/orderHistory/transaction-columns";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useCurrency } from "@/providers/CurrencyContext";
import InvoicePreview from "@/components/invoice/InvoicePreview";
import RecordPaymentModal from "@/components/invoice/modals/RecordPaymentModal";
import SendInvoiceModal from "@/components/invoice/modals/SendInvoiceModal";
import EmailInvoiceModal from "@/components/invoice/modals/EmailInvoiceModal";
import ExportPdfModal from "@/components/invoice/modals/ExportPdfModal";
import PrintInvoiceModal from "@/components/invoice/modals/PrintInvoiceModal";
import CustomerPreviewModal from "@/components/invoice/modals/CustomerPreviewModal";
import CreditPaymentModal from "@/components/credit/CreditPaymentModal";
import SendReminderModal from "@/components/invoice/modals/SendReminderModal";
import DeleteCreditModal from "@/components/invoice/modals/DeleteCreditModal";
import RemovePaymentModal from "@/components/invoice/modals/RemovePaymentModal";
import EditPaymentModal from "@/components/invoice/modals/EditPaymentModal";
import DeleteInvoiceModal from "@/components/invoice/modals/DeleteInvoiceModal";
import MoveToCreditModal from "@/components/invoice/modals/MoveToCreditModal";
import { formatCurrencySymbol } from "@/utils/helper";

type InvoiceTypeKey = "proforma" | "invoice" | "tax";

const INVOICE_TABS: Array<{ key: InvoiceTypeKey; label: string }> = [
  { key: "proforma", label: "Proforma" },
  { key: "invoice", label: "Regular Invoice" },
  { key: "tax", label: "Tax Invoice" },
];

const InvoiceDetailPage = () => {
  const { id } = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { currency } = useCurrency();
  const { data: business } = useBusiness();

  const [invoiceType, setInvoiceType] = useState<
    "proforma" | "invoice" | "tax"
  >("proforma");

  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isSendInvoiceModalOpen, setIsSendInvoiceModalOpen] = useState(false);
  const [isExportPdfOpen, setIsExportPdfOpen] = useState(false);
  const [isPrintOpen, setIsPrintOpen] = useState(false);
  const [isCustomerPreviewOpen, setIsCustomerPreviewOpen] = useState(false);
  const [isMoveToCreditOpen, setIsMoveToCreditOpen] = useState(false);
  const [movingToCredit, setMovingToCredit] = useState(false);
  const [isCreditPaymentOpen, setIsCreditPaymentOpen] = useState(false);
  const [isEmailInvoiceOpen, setIsEmailInvoiceOpen] = useState(false);
  const [isReminderOpen, setIsReminderOpen] = useState(false);
  const [reminderMessage, setReminderMessage] = useState("");
  const [sendingReminder, setSendingReminder] = useState(false);
  const [isRefundModalOpen, setIsRefundModalOpen] = useState(false);
  const [isRefunding, setIsRefunding] = useState(false);
  const [isArchiveModalOpen, setIsArchiveModalOpen] = useState(false);
  const [isArchiving, setIsArchiving] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deletingPaymentId, setDeletingPaymentId] = useState<string | null>(
    null,
  );
  const [paymentToRemove, setPaymentToRemove] = useState<{
    _id: string;
    paymentAmount?: number;
    paymentMethod?: string;
    paymentDate?: string;
  } | null>(null);
  const [paymentToEdit, setPaymentToEdit] = useState<CreditPayment | null>(
    null,
  );

  const tabRefs = useRef<Array<HTMLButtonElement | null>>([]);

  const { data, isLoading, error } = useQuery({
    queryKey: ["ticket", id],
    queryFn: () => getTicketByInvoice(id as string),
    enabled: !!id,
  });
  const invoice = data?.data?.Tickets;

  const { data: customerData, isLoading: isCustomerLoading } = useQuery({
    queryKey: ["customer-lookup", invoice?.phoneNumber, invoice?.customerEmail],
    queryFn: async () => {
      const identifier = invoice?.phoneNumber || invoice?.customerEmail;
      if (!identifier) return null;

      const query = invoice.phoneNumber
        ? `phone=${invoice.phoneNumber}`
        : `email=${invoice.customerEmail}`;
      const response = await fetch(`/api/customers/lookup?${query}`);
      const result = await response.json();
      return result?.data?.users?.[0] || null;
    },
    enabled: !!invoice,
  });

  const customerProfile = customerData;

  // Fetch bill/transaction data — works for paid invoices (404 for unpaid is handled silently)
  const { data: billDataQuery } = useQuery({
    queryKey: ["bill-detail", invoice?.invoice],
    queryFn: () => getTransactionDetail(invoice!.invoice),
    enabled: !!invoice?.invoice,
    retry: false,
  });
  const displayBillData = billDataQuery ?? null;

  // Detect whether this invoice was ever a credit invoice (ongoing OR since
  // fully paid) and load its full detail — independent of paidStatus or entry
  // point. Drives the amount due / payment sections, the payment history and
  // the Record Payment modal.
  const { detail: creditDetail } = useInvoiceCredit(
    invoice,
    invoice?.invoice != null,
  );
  const creditForInvoice = creditDetail?.credit ?? null;

  // ── Send Reminder (resend) — reused by the invoice list too ──────────────
  const handleResendInvoice = async (invoiceTypeToSend?: string) => {
    const ticketId = invoice.invoice;

    if (!ticketId) {
      toast.error("Invoice ID is missing");
      return;
    }

    const url = invoiceTypeToSend
      ? `/api/tickets/${ticketId}/send?type=${invoiceTypeToSend}`
      : `/api/tickets/${ticketId}/send`;

    const sendPromise = fetch(url, {
      method: "POST",
    }).then(async (res) => {
      const data = await res.json();
      if (!res.ok || data.status === "fail") {
        throw new Error(data.message || "Failed to send");
      }
      return data;
    });

    toast.promise(sendPromise, {
      loading: "Sending invoice reminder...",
      success: () => {
        queryClient.invalidateQueries({ queryKey: ["ticket", id] });
        return "Reminder sent successfully!";
      },
      error: (err) => `${err.message}`,
    });
  };

  // "Send reminder" — always opens the modal to compose the message, whether
  // the invoice is credited or not.
  const handleSendReminder = () => {
    const due = creditForInvoice
      ? (creditForInvoice.dueAmount ?? 0)
      : Number(invoice.grandTotal ?? 0);
    setReminderMessage(
      `Reminder: ${formatCurrencySymbol(due, currency.symbol, currency.locale)} Due Amount`,
    );
    setIsReminderOpen(true);
  };

  const handleSubmitReminder = async () => {
    if (!reminderMessage.trim()) {
      toast.error("Enter a reminder message");
      return;
    }

    // Credited invoices send a composed reminder via the credit API.
    if (creditForInvoice?._id) {
      setSendingReminder(true);
      try {
        await sendCreditReminder(creditForInvoice._id, {
          currencyType: currency.symbol,
          message: reminderMessage.trim(),
        });
        toast.success("Reminder sent successfully!");
        setIsReminderOpen(false);
      } catch (err) {
        toast.error(
          err instanceof Error ? err.message : "Failed to send reminder",
        );
      } finally {
        setSendingReminder(false);
      }
      return;
    }

    // Non-credited invoices fall back to the normal invoice resend.
    setSendingReminder(true);
    try {
      await handleResendInvoice();
      setIsReminderOpen(false);
    } finally {
      setSendingReminder(false);
    }
  };

  const handleChargeCard = () => {
    toast("Opening payment form...");
  };

  const handleEditInvoice = () => {
    router.push(`/invoices/${id}/edit`);
  };

  const handleDeleteInvoice = async () => {
    const ticketId = invoice.invoice;

    if (!ticketId) {
      toast.error("Invoice ID is missing");
      return;
    }

    setIsDeleting(true);
    try {
      const res = await fetch(`/api/tickets/${ticketId}/delete`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok || data.status === "fail") {
        throw new Error(data.message || "Failed to delete invoice");
      }
      toast.success("Invoice deleted successfully!");
      setIsDeleteModalOpen(false);
      router.push(`/invoices/`);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to delete invoice",
      );
      setIsDeleteModalOpen(false);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleRefundInvoice = async () => {
    const ticketId = invoice.invoice;

    if (!ticketId) {
      toast.error("Invoice ID is missing");
      return;
    }

    setIsRefunding(true);
    try {
      const res = await fetch(`/api/tickets/${ticketId}/refund`, {
        method: "POST",
      });
      const result = await res.json();

      if (!res.ok || result.status !== "success") {
        throw new Error(result.message || "Refund failed");
      }

      toast.success(
        `Order ${invoice.ticketName || "Invoice"} refunded successfully`,
      );
      setIsRefundModalOpen(false);
      queryClient.invalidateQueries({ queryKey: ["ticket", id] });
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to refund transaction",
      );
      setIsRefundModalOpen(false);
    } finally {
      setIsRefunding(false);
    }
  };

  const handleRemovePayment = async (paymentId: string) => {
    if (!creditForInvoice?._id) {
      toast.error("Credit not found for this invoice");
      return;
    }
    setPaymentToRemove(null);
    setDeletingPaymentId(paymentId);
    try {
      await deleteCreditPayment(creditForInvoice._id, paymentId);
      toast.success("Payment removed");
      queryClient.invalidateQueries({ queryKey: ["ticket", id] });
      queryClient.invalidateQueries({ queryKey: ["credits"] });
      queryClient.invalidateQueries({ queryKey: ["credits", "completed"] });
      queryClient.invalidateQueries({
        queryKey: ["credit-detail-by-id", creditForInvoice._id],
      });
      queryClient.invalidateQueries({
        queryKey: ["credit-payment-history", creditForInvoice._id],
      });
      router.refresh();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to remove payment",
      );
    } finally {
      setDeletingPaymentId(null);
    }
  };

  const handleArchiveCredit = async () => {
    if (!creditForInvoice?._id) {
      toast.error("Credit not found for this invoice");
      return;
    }

    setIsArchiving(true);
    try {
      await archiveCredit(creditForInvoice._id);
      toast.success("Credit deleted");
      queryClient.invalidateQueries({ queryKey: ["ticket", id] });
      queryClient.invalidateQueries({ queryKey: ["credits"] });
      queryClient.invalidateQueries({ queryKey: ["archived-invoices"] });
      setIsArchiveModalOpen(false);
      router.push("/records/credits");
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to delete credit",
      );
      setIsArchiveModalOpen(false);
    } finally {
      setIsArchiving(false);
    }
  };

  const handleMoveToCredit = async () => {
    const invoiceNo = invoice?.invoice;
    if (invoiceNo == null) {
      toast.error("Invoice ID is missing");
      return;
    }
    setMovingToCredit(true);
    try {
      await moveInvoiceToCredit(invoiceNo);
      toast.success(`Invoice ORD-${invoiceNo} moved to credit`);
      setIsMoveToCreditOpen(false);
      queryClient.invalidateQueries({ queryKey: ["invoice"] });
      queryClient.invalidateQueries({ queryKey: ["archived-invoices"] });
      queryClient.invalidateQueries({ queryKey: ["credits"] });
      router.push("/records/credits");
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to move to credit",
      );
    } finally {
      setMovingToCredit(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex items-center gap-2 text-gray-400 text-sm">
          <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          Loading invoice...
        </div>
      </div>
    );
  }

  if (error || !invoice) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-500 text-sm">Invoice not found.</p>
      </div>
    );
  }

  const handleSetInvoiceType = (type: "proforma" | "invoice" | "tax") => {
    setInvoiceType(type);
  };

  const handleInvoiceTabKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    const current = INVOICE_TABS.findIndex((t) => t.key === invoiceType);
    let next: number | null = null;

    if (e.key === "ArrowRight") next = (current + 1) % INVOICE_TABS.length;
    if (e.key === "ArrowLeft")
      next = (current - 1 + INVOICE_TABS.length) % INVOICE_TABS.length;
    if (e.key === "Home") next = 0;
    if (e.key === "End") next = INVOICE_TABS.length - 1;
    if (next === null) return;

    e.preventDefault();
    setInvoiceType(INVOICE_TABS[next].key);
    tabRefs.current[next]?.focus();
  };

  // ── Derived status ────────────────────────────────────────────────────────
  const isRefunded = displayBillData?.status === "refunded";
  const isPaid = invoice.paidStatus === "paid";
  const isCredited = invoice.paidStatus === "credited";
  const isCreditArchived = creditForInvoice?.status === "archived";

  const isOverdue = !isPaid && !isRefunded;

  // Build a Transaction-like object for the shared RefundModal.
  const refundTransaction: Transaction | null = isPaid
    ? {
        id: `ORD-${invoice.invoice}`,
        date: new Date(invoice.createdAt).toLocaleDateString("en-US"),
        timestamp: new Date(invoice.createdAt).toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
          hour12: true,
        }),
        invoiceName: invoice.ticketName || "Invoice",
        amount: String(invoice.grandTotal ?? 0),
        paymentMethod:
          (invoice.paymentMethod as Transaction["paymentMethod"]) || "Cash",
        items: [],
        status: "completed",
        invoiceNo: invoice.invoice,
      }
    : null;

  // ── Credit figures (when the invoice is credited) ──────────────────────────
  const creditDue = Number(creditDetail?.credit?.dueAmount ?? 0);
  const creditPaid = (creditDetail?.paymentHistory ?? []).reduce(
    (sum, p) => sum + (p.paymentAmount ?? 0),
    0,
  );
  // Amount due to display in the meta/payment sections.
  const amountDueDisplay = isCredited
    ? creditDue
    : Number(invoice.grandTotal ?? 0);

  // Credit payments, newest first, for the "Payments received" list.
  const creditPayments = [...(creditDetail?.paymentHistory ?? [])].sort(
    (a, b) => b.paymentDate.localeCompare(a.paymentDate),
  );
  const formatPaymentDate = (raw: string) => {
    const d = new Date(raw.replace(" ", "T"));
    return isNaN(d.getTime())
      ? raw
      : d.toLocaleDateString("en-US", {
          month: "long",
          day: "numeric",
          year: "numeric",
        });
  };

  const statusLabel = isRefunded ? "Refunded" : isPaid ? "Paid" : "Unpaid";
  const statusColor = isRefunded
    ? "bg-orange-100 text-orange-700 border-orange-200"
    : isPaid
      ? "bg-green-100 text-green-700 border-green-200"
      : "bg-red-100 text-red-700 border-red-200";

  return (
    <div className="min-h-screen ">
      {/* ── Top bar ── */}
      <div className="sticky top-0 z-30 bg-white border-b border-gray-200 px-6 md:px-10 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="h-8 w-8 flex items-center justify-center rounded-lg bg-gray-100 text-gray-500 hover:bg-gray-200 transition-colors"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <h1 className="text-base font-bold text-gray-900">
              {invoice.ticketName || "Invoice"} #{invoice?.invoice}
            </h1>
            <p className="text-xs text-gray-400 mt-0.5">
              {isCreditArchived
                ? "Credit Archived"
                : invoice.paidStatus === "paid"
                  ? "Paid"
                  : isCredited
                    ? "Credited"
                    : "Unpaid"}{" "}
              · Created{" "}
              {new Date(invoice.createdAt).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              })}{" "}
              GMT+5:45
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Online payments pill */}
          <div className="hidden sm:flex items-center gap-2 border border-gray-200 rounded-full px-3 py-1.5 text-xs font-medium text-gray-400 opacity-60 cursor-not-allowed">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
            Online Payments
            <span className="flex items-center gap-1 text-red-400">
              <Circle size={6} className="fill-red-400" /> OFF
            </span>
          </div>

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
              className="w-45 rounded-xl p-1 shadow-lg border-gray-200"
            >
              {(!!creditForInvoice || !isPaid) && (
                <DropdownMenuItem
                  onClick={handleEditInvoice}
                  className="flex items-center gap-2 px-3 py-2 cursor-pointer rounded-lg focus:bg-blue-50 focus:text-blue-600 text-sm"
                >
                  Edit invoice
                </DropdownMenuItem>
              )}

              <DropdownMenuItem
                onClick={() => setIsCustomerPreviewOpen(true)}
                className="flex items-center gap-2 px-3 py-2 cursor-pointer rounded-lg focus:bg-blue-50 focus:text-blue-600 text-sm"
              >
                Preview as Customer
              </DropdownMenuItem>

              <DropdownMenuSeparator className="my-1 bg-gray-100" />

              <DropdownMenuItem
                onClick={() => setIsExportPdfOpen(true)}
                className="flex items-center gap-2 px-3 py-2 cursor-pointer rounded-lg focus:bg-blue-50 focus:text-blue-600 text-sm"
              >
                Export as PDF
              </DropdownMenuItem>

              <DropdownMenuItem
                onClick={() => setIsPrintOpen(true)}
                className="flex items-center gap-2 px-3 py-2 cursor-pointer rounded-lg focus:bg-blue-50 focus:text-blue-600 text-sm"
              >
                Print options
              </DropdownMenuItem>

              <DropdownMenuSeparator className="my-1 bg-gray-100" />

              {!isCredited && !isCreditArchived && !isPaid && (
                <DropdownMenuItem
                  onClick={() => setIsMoveToCreditOpen(true)}
                  className="flex items-center gap-2 px-3 py-2 cursor-pointer rounded-lg focus:bg-violet-50 focus:text-violet-600 text-sm"
                >
                  Move to credit
                </DropdownMenuItem>
              )}

              {isPaid && (
                <DropdownMenuItem
                  onClick={() => setIsRefundModalOpen(true)}
                  className="flex items-center gap-2 px-3 py-2 cursor-pointer rounded-lg text-orange-600 focus:bg-orange-50 focus:text-orange-600 text-sm"
                >
                  Refund
                </DropdownMenuItem>
              )}

              {isCredited && !isCreditArchived && (
                <DropdownMenuItem
                  onClick={() => setIsArchiveModalOpen(true)}
                  className="flex items-center gap-2 px-3 py-2 cursor-pointer rounded-lg text-red-500 focus:bg-red-50 focus:text-red-600 text-sm"
                >
                  Delete Credited Invoice
                </DropdownMenuItem>
              )}

              {!isPaid && !isCredited && !isCreditArchived && (
                <DropdownMenuItem
                  onClick={() => setIsDeleteModalOpen(true)}
                  className="flex items-center gap-2 px-3 py-2 cursor-pointer rounded-lg text-red-500 focus:bg-red-50 focus:text-red-600 text-sm"
                >
                  Delete
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>

          <button
            onClick={() => router.push("/invoices/add")}
            className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-2 sm:px-4 py-1.5 rounded-full transition-colors"
          >
            <span className="lg:hidden">
              <Plus size={16} />
            </span>
            <span className="hidden lg:inline">Create another invoice</span>
          </button>
        </div>
      </div>

      {/* Body */}
      <div className="max-w-4xl mx-auto px-4 py-6">
        <div className="w-full max-w-4xl">
          {/* Invoice meta row */}
          <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
            <div className="flex items-center gap-6">
              <div>
                <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-1.5">
                  Status
                </p>

                {isCreditArchived ? (
                  <span
                    className="text-xs font-semibold px-2.5 py-1 rounded-md border border-gray-300 text-gray-700 relative overflow-hidden capitalize"
                    style={{
                      backgroundImage:
                        "repeating-linear-gradient(45deg, transparent, transparent 2px, rgba(156, 163, 175, 0.2) 2px, rgba(156, 163, 175, 0.2) 4px)",
                      backgroundColor: "rgba(156, 163, 175, 0.3)",
                    }}
                  >
                    Credit Archived
                  </span>
                ) : displayBillData &&
                  displayBillData?.status === "refunded" ? (
                  <span
                    className="text-xs font-semibold px-2.5 py-1 rounded-md border border-orange-300 text-orange-800 relative overflow-hidden capitalize"
                    style={{
                      backgroundImage:
                        "repeating-linear-gradient(45deg, transparent, transparent 2px, rgba(251, 146, 60, 0.15) 2px, rgba(251, 146, 60, 0.15) 4px)",
                      backgroundColor: "rgba(251, 146, 60, 0.25)",
                    }}
                  >
                    {displayBillData.status}
                  </span>
                ) : invoice.paidStatus === "credited" ? (
                  <span
                    className="text-xs font-semibold px-2.5 py-1 rounded-md border border-violet-300 text-violet-700 relative overflow-hidden capitalize"
                    style={{
                      backgroundImage:
                        "repeating-linear-gradient(45deg, transparent, transparent 2px, rgba(167, 139, 250, 0.2) 2px, rgba(167, 139, 250, 0.2) 4px)",
                      backgroundColor: "rgba(167, 139, 250, 0.25)",
                    }}
                  >
                    Credited
                  </span>
                ) : invoice.paidStatus === "unpaid" ? (
                  <span
                    className="text-xs font-semibold px-2.5 py-1 rounded-md border border-red-300 text-red-700 relative overflow-hidden capitalize"
                    style={{
                      backgroundImage:
                        "repeating-linear-gradient(45deg, transparent, transparent 2px, rgba(252, 165, 165, 0.2) 2px, rgba(252, 165, 165, 0.2) 4px)",
                      backgroundColor: "rgba(252, 165, 165, 0.3)",
                    }}
                  >
                    {invoice.paidStatus}
                  </span>
                ) : (
                  <span
                    className="text-xs font-semibold px-2.5 py-1 rounded-md border border-green-300 text-green-700 relative overflow-hidden capitalize"
                    style={{
                      backgroundImage:
                        "repeating-linear-gradient(45deg, transparent, transparent 2px, rgba(134, 239, 172, 0.2) 2px, rgba(134, 239, 172, 0.2) 4px)",
                      backgroundColor: "rgba(134, 239, 172, 0.3)",
                    }}
                  >
                    {invoice.paidStatus}
                  </span>
                )}
              </div>
              <div>
                <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-1.5">
                  Customer
                </p>
                {isCustomerLoading ? (
                  <div className="h-5 w-28 bg-gray-200 animate-pulse rounded" />
                ) : (
                  <div>
                    <div className="flex items-end justify-between gap-2">
                      <div className="flex items-center gap-1.5">
                        <span className="text-base font-bold text-blue-600">
                          {customerProfile?.name ||
                            invoice?.customerEmail ||
                            "Guest"}
                        </span>
                        {/* {customerProfile && (
                          <div className="w-4 h-4 rounded-full bg-blue-100 flex items-center justify-center">
                            <span className="text-[9px] text-blue-600 font-bold">
                              i
                            </span>
                          </div>
                        )} */}
                      </div>
                      {customerProfile?.loyaltyPoint > 0 && (
                        <p className="text-[10px] text-amber-500 font-medium whitespace-nowrap mb-0.5">
                          ★ {customerProfile.loyaltyPoint.toFixed(2)} Points
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
            <div className="flex flex-row justify-content gap-6">
              <div>
                <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-1.5">
                  Amount due
                </p>
                <p className="text-xl font-bold text-gray-800">
                  {displayBillData && displayBillData.status === "refunded" ? (
                    <span className="text-orange-600 font-semibold">
                      {currency.symbol} 0.00
                    </span>
                  ) : invoice.paidStatus === "paid" ? (
                    <span className="text-green-600 font-semibold">
                      {currency.symbol} 0.00
                    </span>
                  ) : (
                    <span className="text-600 font-semibold">
                      {formatCurrencySymbol(
                        amountDueDisplay,
                        currency.symbol,
                        currency.locale,
                      )}
                    </span>
                  )}
                </p>
              </div>
              {/* <div>
                <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-1.5">
                  Due
                </p>
                <p className="text-xl font-semibold text-gray-800">
                  0 days ago
                </p>
              </div> */}
            </div>
          </div>

          {/* Steps Section */}
          <div className="space-y-2">
            {/* Step 1: Created */}
            <div className="bg-white border border-gray-200 rounded-2xl p-5 mb-0">
              <div className="flex items-center gap-4">
                <div className="w-9 h-9 rounded-full border-2 border-blue-500 flex items-center justify-center text-blue-600 shrink-0">
                  <FileText size={16} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900">Create</p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    <span className="font-medium text-gray-700">Created:</span>{" "}
                    on{" "}
                    {new Date(invoice.createdAt).toLocaleDateString("en-US", {
                      month: "long",
                      day: "numeric",
                      year: "numeric",
                    })}{" "}
                    at{" "}
                    {new Date(invoice.createdAt).toLocaleTimeString("en-US", {
                      hour: "2-digit",
                      minute: "2-digit",
                      hour12: true,
                    })}{" "}
                    GMT+5:45
                  </p>
                </div>
                {(!!creditForInvoice || !isPaid) && !isCreditArchived && (
                  <button
                    onClick={handleEditInvoice}
                    className="text-xs font-semibold border border-blue-200 text-blue-600 hover:bg-blue-50 rounded-full px-4 py-1.5 transition-colors shrink-0"
                  >
                    Edit invoice
                  </button>
                )}
              </div>
            </div>

            {/* Connector */}
            <div className="w-[2px] h-4 bg-gray-600 mb-0 ml-[26px]" />

            {/* Step 2: Send & Reminders */}
            <div className="bg-white border border-gray-200 rounded-2xl p-5 mb-0">
              <div className="flex items-start gap-4">
                <div className="w-9 h-9 rounded-full border-2 border-blue-500 flex items-center justify-center text-blue-600 shrink-0">
                  {invoice.sentAt ? <Send size={16} /> : <Mail size={16} />}
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900">Send</p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    <span className="font-medium text-gray-700">
                      Last sent:
                    </span>{" "}
                    {invoice.sentAt
                      ? new Date(invoice.sentAt).toLocaleString([], {
                          dateStyle: "medium",
                          timeStyle: "short",
                        })
                      : "Never"}
                    {/* {invoice.sentAt ? (
                      <div className="flex flex-col">
                        <p className="text-sm text-gray-600 mt-0.5">
                          <span className="font-medium text-gray-900">
                            Sent to:
                          </span>{" "}
                          {invoice.customerEmail || "Customer"}
                        </p>
                        <p className="text-xs text-blue-600 font-medium mt-1">
                          Last sent:{" "}
                          {new Date(invoice.sentAt).toLocaleString([], {
                            dateStyle: "medium",
                            timeStyle: "short",
                          })}
                        </p>
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500 mt-0.5">
                        Not sent to the customer yet.
                      </p>
                    )} */}
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {/* <button className="text-xs font-semibold border border-gray-200 text-gray-600 hover:bg-gray-50 rounded-full px-3 py-1.5 transition-colors flex items-center gap-1.5">
                    <Check size={12} /> Mark as sent
                  </button> */}
                  <button
                    onClick={() => setIsSendInvoiceModalOpen(true)}
                    className="text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-full px-4 py-1.5 transition-colors"
                  >
                    {invoice.sentAt ? "Send again" : "Send Invoice"}
                  </button>
                </div>
              </div>

              {/* Reminders section */}
              <div className="mt-4 ml-13 border border-gray-100 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Bell size={13} className="text-gray-500" />
                  <p className="text-xs font-semibold text-gray-700">
                    Schedule automatic reminders
                  </p>
                </div>
                <div className="space-y-3">
                  <div>
                    <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-2">
                      Reminders after due date
                    </p>
                    <div className="flex flex-wrap gap-2 opacity-50">
                      {[
                        "On due date",
                        "3 days after",
                        "7 days after",
                        "14 days after",
                      ].map((label) => (
                        <label
                          key={label}
                          className="flex items-center gap-1.5 border border-gray-300 rounded-lg px-2.5 py-1.5 text-xs text-gray-500 cursor-not-allowed"
                        >
                          <input type="checkbox" className="rounded" disabled />
                          {label}
                        </label>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-2">
                      Reminders before due date
                    </p>
                    <div className="flex flex-wrap gap-2 opacity-50">
                      {["14 days before", "7 days before", "3 days before"].map(
                        (label) => (
                          <label
                            key={label}
                            className="flex items-center gap-1.5 border border-gray-300 rounded-lg px-2.5 py-1.5 text-xs text-gray-500 cursor-not-allowed"
                          >
                            <input
                              type="checkbox"
                              className="rounded"
                              disabled
                            />
                            {label}
                          </label>
                        ),
                      )}
                    </div>
                  </div>
                </div>

                {/* Send reminder quick action */}
                <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between">
                  <p className="text-xs text-gray-500">
                    Send an invoice reminder to the customer now
                  </p>
                  <button
                    onClick={handleSendReminder}
                    className="text-xs font-semibold bg-blue-50 text-blue-700 hover:bg-blue-100 px-3 py-1.5 rounded-lg transition-colors"
                  >
                    Send reminder
                  </button>
                </div>
              </div>
            </div>

            {/* Connector */}
            <div className="w-[2px] h-4 bg-gray-600 mb-0 ml-[26px]" />

            {/* Step 3: Manage payments */}
            <div
              className={`bg-white border rounded-2xl p-5  ${
                invoice.paidStatus === "paid"
                  ? "border-green-100 bg-green-50/30"
                  : "border-gray-200"
              }`}
            >
              <div className="flex items-start gap-4">
                <div
                  className={`w-9 h-9 rounded-full border-2 flex items-center justify-center shrink-0 ${
                    displayBillData && isRefunded
                      ? "border-orange-400 text-orange-500 bg-orange-50"
                      : invoice.paidStatus === "paid"
                        ? "border-green-500 text-green-600 bg-green-50"
                        : "border-blue-500 text-blue-600"
                  }`}
                >
                  {displayBillData && isRefunded ? (
                    <AlertTriangle size={16} />
                  ) : isPaid ? (
                    <Check size={16} />
                  ) : (
                    <CreditCard size={16} />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900">
                    {isCreditArchived
                      ? "Credit archived"
                      : displayBillData && isRefunded
                        ? "Payment refunded"
                        : isPaid
                          ? "Payment completed"
                          : "Manage payments"}
                  </p>

                  <p className="text-xs text-gray-500 mt-0.5">
                    {isCreditArchived ? (
                      <span className="text-gray-500">
                        Archived on{" "}
                        {creditForInvoice?.updatedAt &&
                          new Date(
                            creditForInvoice.updatedAt,
                          ).toLocaleDateString()}
                      </span>
                    ) : displayBillData && isRefunded ? (
                      <span className="text-orange-600">
                        Refunded on{" "}
                        {displayBillData?.updatedAt &&
                          new Date(
                            displayBillData.updatedAt,
                          ).toLocaleDateString()}
                      </span>
                    ) : isPaid ? (
                      <span className="text-green-600">
                        Paid via {invoice.paymentMethod || "cash"} on{" "}
                        {new Date(invoice.updatedAt).toLocaleDateString()}
                      </span>
                    ) : isCredited ? (
                      <span className="flex flex-row gap-1 ">
                        <p className="text-violet-600 font-semibold">
                          {" "}
                          {creditPaid > 0
                            ? `${formatCurrencySymbol(
                                creditPaid,
                                currency.symbol,
                                currency.locale,
                              )}  `
                            : ""}
                        </p>
                        <p> {creditPaid > 0 ? "paid so far ·" : ""}</p>
                        <p className="text-violet-600 font-semibold">
                          {formatCurrencySymbol(
                            creditDue,
                            currency.symbol,
                            currency.locale,
                          )}
                        </p>{" "}
                        remaining on credit
                      </span>
                    ) : null}
                  </p>
                </div>
                {!isPaid && !isRefunded && (
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={handleChargeCard}
                      disabled
                      className="text-xs font-semibold border border-gray-300 text-gray-500 rounded-full px-3 py-1.5 opacity-50 cursor-not-allowed flex items-center gap-1.5"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="12"
                        height="12"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <rect
                          width="18"
                          height="11"
                          x="3"
                          y="11"
                          rx="2"
                          ry="2"
                        />
                        <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                      </svg>
                      Charge a credit card
                    </button>

                    {!isCreditArchived && (
                      <button
                        onClick={() =>
                          isCredited
                            ? setIsCreditPaymentOpen(true)
                            : setIsPaymentModalOpen(true)
                        }
                        className="text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-full px-4 py-1.5 transition-colors"
                      >
                        Record a payment
                      </button>
                    )}
                  </div>
                )}
              </div>

              <div className="text-xs ml-13 mt-2 flex items-center justify-between">
                <p className="text-gray-600">
                  <span className="font-medium text-gray-700">Amount due:</span>{" "}
                  {displayBillData && isRefunded ? (
                    <span className="text-orange-600 font-bold">
                      {currency.symbol} 0.00
                    </span>
                  ) : isPaid ? (
                    <span className="text-green-600 font-bold">
                      {currency.symbol} 0.00
                    </span>
                  ) : (
                    <span className="font-semibold">
                      {" "}
                      {formatCurrencySymbol(
                        amountDueDisplay,
                        currency.symbol,
                        currency.locale,
                      )}
                    </span>
                  )}
                  {!isPaid && !isRefunded && !isCreditArchived && (
                    <>
                      {" — "}
                      <button
                        onClick={() =>
                          isCredited
                            ? setIsCreditPaymentOpen(true)
                            : setIsPaymentModalOpen(true)
                        }
                        className="text-blue-600 font-bold hover:underline font-medium"
                      >
                        Record a payment
                      </button>{" "}
                      manually.
                    </>
                  )}
                </p>

                <p className="text-gray-600">
                  <span className="font-medium">Status:</span>{" "}
                  {displayBillData && displayBillData.status === "refunded" ? (
                    <span className="text-orange-600 font-bold">Refunded</span>
                  ) : invoice.paidStatus === "paid" ? (
                    <span className="text-green-700 font-semibold">
                      This invoice has been fully paid
                    </span>
                  ) : isCreditArchived ? (
                    <span className="text-gray-700 font-semibold">
                      This invoice&lsquo;s credit has been archived
                    </span>
                  ) : isCredited ? (
                    <span className="text-violet-700 font-semibold">
                      This invoice is on credit
                    </span>
                  ) : (
                    "Your invoice is awaiting payment"
                  )}
                </p>
              </div>

              {/* Payments received — from the credit's payment history */}
              {creditPayments.length > 0 && (
                <div className="ml-13 mt-5 border-t border-gray-100 pt-4">
                  <p className="text-sm font-semibold text-gray-800 mb-3">
                    Payments received:
                  </p>
                  <div className="space-y-3">
                    {creditPayments.map((p) => (
                      <div key={p._id} className="text-xs">
                        <p className="text-gray-700">
                          {formatPaymentDate(p.paymentDate)} - A payment for{" "}
                          <span className="font-bold">
                            {formatCurrencySymbol(
                              p.paymentAmount ?? 0,
                              currency.symbol,
                              currency.locale,
                            )}
                          </span>{" "}
                          was made using a {p.paymentMethod || "cash"}.
                        </p>
                        <div className="flex items-center gap-1.5 mt-1 text-blue-600 font-semibold">
                          <button
                            onClick={() => setIsEmailInvoiceOpen(true)}
                            className="hover:underline"
                          >
                            Send a receipt
                          </button>

                          {!isCreditArchived && (
                            <>
                              <span className="text-gray-300">·</span>
                              <button
                                onClick={() => setPaymentToEdit(p)}
                                className="hover:underline"
                              >
                                Edit payment
                              </button>

                              <span className="text-gray-300">·</span>

                              <button
                                onClick={() =>
                                  setPaymentToRemove({
                                    _id: p._id,
                                    paymentAmount: p.paymentAmount,
                                    paymentMethod: p.paymentMethod,
                                    paymentDate: p.paymentDate,
                                  })
                                }
                                disabled={deletingPaymentId === p._id}
                                className="hover:underline disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                {deletingPaymentId === p._id
                                  ? "Removing..."
                                  : "Remove payment"}
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* ── Invoice Type Tabs ── */}
          <div className="relative flex justify-center mt-6 mb-6">
            <span
              aria-hidden="true"
              className="absolute inset-x-0 top-1/2 h-px bg-gray-200"
            />
            <div
              role="tablist"
              aria-label="Invoice document type"
              onKeyDown={handleInvoiceTabKeyDown}
              className="relative flex items-center gap-1 rounded-full bg-[#e4f2fe] p-1"
            >
              {INVOICE_TABS.map((tab, i) => {
                const selected = invoiceType === tab.key;

                return (
                  <button
                    key={tab.key}
                    ref={(el) => {
                      tabRefs.current[i] = el;
                    }}
                    type="button"
                    role="tab"
                    id={`invoice-type-tab-${tab.key}`}
                    aria-selected={selected}
                    aria-controls={`invoice-type-panel-${tab.key}`}
                    tabIndex={selected ? 0 : -1}
                    onClick={() => setInvoiceType(tab.key)}
                    className={`rounded-full px-5 py-2 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-[#e4f2fe] ${
                      selected
                        ? "bg-white font-bold text-blue-950 shadow-sm"
                        : "font-semibold text-blue-800 hover:text-blue-950"
                    }`}
                  >
                    {tab.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* ── Active invoice preview ── */}
          <div
            className={
              invoiceType === "proforma"
                ? "block"
                : "absolute -left-[99999px] top-0"
            }
          >
            <InvoicePreview
              type="proforma"
              invoice={invoice}
              customerProfile={customerProfile}
              businessProfile={business}
              billData={displayBillData}
              payments={creditDetail?.paymentHistory}
              credit={
                creditForInvoice
                  ? {
                      total: creditForInvoice.total,
                      grandTotal: creditForInvoice.grandTotal,
                      taxamt: creditForInvoice.taxamt,
                    }
                  : null
              }
              // withControls={true}
            />
          </div>

          <div
            className={
              invoiceType === "invoice"
                ? "block"
                : "absolute -left-[99999px] top-0"
            }
          >
            <InvoicePreview
              type="invoice"
              invoice={invoice}
              customerProfile={customerProfile}
              businessProfile={business}
              billData={displayBillData}
              payments={creditDetail?.paymentHistory}
              credit={
                creditForInvoice
                  ? {
                      total: creditForInvoice.total,
                      grandTotal: creditForInvoice.grandTotal,
                      taxamt: creditForInvoice.taxamt,
                    }
                  : null
              }
              // withControls={true}
            />
          </div>

          <div
            className={
              invoiceType === "tax" ? "block" : "absolute -left-[99999px] top-0"
            }
          >
            <InvoicePreview
              type="tax"
              invoice={invoice}
              customerProfile={customerProfile}
              businessProfile={business}
              billData={displayBillData}
              payments={creditDetail?.paymentHistory}
              credit={
                creditForInvoice
                  ? {
                      total: creditForInvoice.total,
                      grandTotal: creditForInvoice.grandTotal,
                      taxamt: creditForInvoice.taxamt,
                    }
                  : null
              }
              // withControls={true}
            />
          </div>
        </div>
      </div>

      {/* ── Modals (shared with the invoice list) ── */}
      <SendInvoiceModal
        open={isSendInvoiceModalOpen}
        onClose={() => setIsSendInvoiceModalOpen(false)}
        invoiceNo={id as string}
      />

      {/* Email receipt — opened from a payment's "Send a receipt" */}
      <EmailInvoiceModal
        open={isEmailInvoiceOpen}
        onClose={() => setIsEmailInvoiceOpen(false)}
        invoiceNo={id as string}
      />

      {/* Refund confirmation modal */}
      <RefundModal
        open={isRefundModalOpen}
        transaction={refundTransaction}
        onClose={() => setIsRefundModalOpen(false)}
        onConfirm={handleRefundInvoice}
        isRefunding={isRefunding}
      />

      {/* Credit reminder — compose the message before sending */}
      <SendReminderModal
        open={isReminderOpen}
        onClose={() => setIsReminderOpen(false)}
        credit={creditForInvoice}
        currency={currency}
        reminderMessage={reminderMessage}
        onMessageChange={setReminderMessage}
        sendingReminder={sendingReminder}
        onSubmit={handleSubmitReminder}
      />

      <RecordPaymentModal
        open={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        invoiceNo={id as string}
      />

      {/* Credit payment — used when the invoice is credited */}
      <CreditPaymentModal
        open={isCreditPaymentOpen}
        onClose={() => setIsCreditPaymentOpen(false)}
        credit={creditForInvoice}
        onSuccess={(fullyPaid) => {
          // A completed credit changes the ticket/bill server-side — reload so
          // the preview reflects the fully-paid document.
          if (fullyPaid) {
            window.location.reload();
            return;
          }
          queryClient.invalidateQueries({ queryKey: ["ticket", id] });
          queryClient.invalidateQueries({ queryKey: ["credits"] });
          queryClient.invalidateQueries({ queryKey: ["credits", "completed"] });
          queryClient.invalidateQueries({
            queryKey: ["credit-detail-by-id", creditForInvoice?._id],
          });
          router.refresh();
        }}
      />

      {/* Delete Credit (archive) confirmation */}
      <DeleteCreditModal
        open={isArchiveModalOpen}
        onClose={() => setIsArchiveModalOpen(false)}
        credit={creditForInvoice}
        isArchiving={isArchiving}
        onConfirm={handleArchiveCredit}
      />

      {/* Remove Payment Confirmation Modal */}
      <RemovePaymentModal
        payment={paymentToRemove}
        onClose={() => setPaymentToRemove(null)}
        currency={currency}
        deletingPaymentId={deletingPaymentId}
        onConfirm={handleRemovePayment}
      />

      {/* Edit Payment Modal */}
      <EditPaymentModal
        open={!!paymentToEdit}
        onClose={() => setPaymentToEdit(null)}
        creditId={creditForInvoice?._id ?? null}
        payment={paymentToEdit}
        maxAmount={(creditDue ?? 0) + (paymentToEdit?.paymentAmount ?? 0)}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ["ticket", id] });
          queryClient.invalidateQueries({ queryKey: ["credits"] });
          queryClient.invalidateQueries({ queryKey: ["credits", "completed"] });
          queryClient.invalidateQueries({
            queryKey: ["credit-detail-by-id", creditForInvoice?._id],
          });
          queryClient.invalidateQueries({
            queryKey: ["credit-payment-history", creditForInvoice?._id],
          });
          router.refresh();
        }}
      />

      <ExportPdfModal
        open={isExportPdfOpen}
        onClose={() => setIsExportPdfOpen(false)}
        invoiceNo={id as string}
      />

      <PrintInvoiceModal
        open={isPrintOpen}
        onClose={() => setIsPrintOpen(false)}
        invoiceNo={id as string}
      />

      <CustomerPreviewModal
        open={isCustomerPreviewOpen}
        onClose={() => setIsCustomerPreviewOpen(false)}
        invoiceNo={id as string}
      />

      {/* Delete Invoice Confirmation Modal */}
      <DeleteInvoiceModal
        open={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        invoiceNo={invoice?.invoice}
        isDeleting={isDeleting}
        onConfirm={handleDeleteInvoice}
      />

      {/* Move to Credit Confirmation Modal */}
      <MoveToCreditModal
        open={isMoveToCreditOpen}
        onClose={() => setIsMoveToCreditOpen(false)}
        invoiceNo={invoice?.invoice}
        movingToCredit={movingToCredit}
        onConfirm={handleMoveToCredit}
      />
    </div>
  );
};

export default InvoiceDetailPage;
