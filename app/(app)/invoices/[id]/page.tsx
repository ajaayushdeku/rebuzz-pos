"use client";

import toast from "react-hot-toast";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useParams, useRouter } from "next/navigation";

import {
  AlertTriangle,
  ArrowLeft,
  Bell,
  Check,
  ChevronDown,
  CreditCard,
  FileCog,
  FileEdit,
  FileText,
  Mail,
  Send,
  Trash2,
} from "lucide-react";

import { useBusiness } from "@/hooks/useBusiness";
import { getTicketByInvoice } from "@/services/apiTicket.client";
import { getTransactionDetail } from "@/services/dashboardServices/apiTransactionClient";

import { Button } from "@/components/ui/button";
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
import { formatCurrencySymbol } from "@/utils/helper";

export default function InvoiceDetailPage() {
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

    const sendPromise = fetch(`/api/tickets/${ticketId}/delete`, {
      method: "DELETE",
    }).then(async (res) => {
      const data = await res.json();
      if (!res.ok || data.status === "fail") {
        throw new Error(data.message || "Failed to send");
      }
      return data;
    });

    toast.promise(sendPromise, {
      loading: "Deleting invoice ...",
      success: () => {
        return "Invoice deleted successfully!";
      },
      error: (err) => `${err.message}`,
    });
    router.push(`/invoices/`);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-500">Loading invoice...</p>
      </div>
    );
  }

  if (error || !invoice) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-500">Invoice not found.</p>
      </div>
    );
  }

  const handleSetInvoiceType = (type: "proforma" | "invoice" | "tax") => {
    setInvoiceType(type);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top bar */}
      <div className="sticky top-0 z-30 bg-white/95  pb-4 border-b border-gray-200 px-8 py-4.5 flex items-center justify-between s">
        <div className="flex items-center gap-5">
          <button
            onClick={() => router.back()}
            className="h-9 w-9 flex items-center justify-center rounded-xl bg-gray-100 text-gray-500 hover:bg-gray-200 hover:text-gray-700 transition-all"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <h1 className="text-xl font-bold text-gray-900">
              Invoice #{invoice?.invoice}
            </h1>
            <p className="text-xs text-gray-400 mt-0.5">
              {invoice.paidStatus === "paid" ? "Paid" : "Unpaid"} · Created{" "}
              {new Date(invoice.createdAt).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              })}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <DropdownMenu>
            <DropdownMenuTrigger className="flex items-center gap-2 border border-blue-200 rounded-xl px-4 py-2.5 text-sm font-semibold hover:bg-blue-50 text-blue-600 transition-all focus:outline-none focus:ring-2 focus:ring-blue-100">
              More actions <ChevronDown size={14} />
            </DropdownMenuTrigger>

            <DropdownMenuContent
              align="end"
              className="w-48 rounded-xl p-1 shadow-lg border-gray-200"
            >
              {invoice.paidStatus === "unpaid" && (
                <DropdownMenuItem
                  onClick={handleEditInvoice}
                  className="flex items-center gap-2 px-3 py-2 cursor-pointer rounded-lg focus:bg-blue-50 focus:text-blue-600"
                >
                  <FileEdit size={14} />
                  <span>Edit invoice</span>
                </DropdownMenuItem>
              )}

              <DropdownMenuItem
                onClick={handleDeleteInvoice}
                className="flex items-center gap-2 px-3 py-2 cursor-pointer rounded-lg text-red-500 focus:bg-red-50 focus:text-red-600"
              >
                <Trash2 size={14} />
                <span>Delete invoice</span>
              </DropdownMenuItem>

              <DropdownMenuSeparator className="my-1 bg-gray-100" />
              {invoiceType !== "proforma" && (
                <DropdownMenuItem
                  onClick={() => handleSetInvoiceType("proforma")}
                  className="flex items-center gap-2 px-3 py-2 cursor-pointer rounded-lg focus:bg-blue-50 focus:text-blue-600"
                >
                  <FileCog size={14} />
                  <span>Set as Proforma Invoice</span>
                </DropdownMenuItem>
              )}

              {invoiceType !== "invoice" && (
                <DropdownMenuItem
                  onClick={() => handleSetInvoiceType("invoice")}
                  className="flex items-center gap-2 px-3 py-2 cursor-pointer rounded-lg focus:bg-blue-50 focus:text-blue-600"
                >
                  <FileCog size={14} />
                  <span>Set as Regular Invoice</span>
                </DropdownMenuItem>
              )}

              {invoiceType !== "tax" && (
                <DropdownMenuItem
                  onClick={() => handleSetInvoiceType("tax")}
                  className="flex items-center gap-2 px-3 py-2 cursor-pointer rounded-lg focus:bg-blue-50 focus:text-blue-600"
                >
                  <FileCog size={14} />
                  <span>Set as Tax Invoice</span>
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>

          <Button
            onClick={() => router.push("/invoices/add")}
            className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center gap-2"
          >
            Create Another Invoice
          </Button>
        </div>
      </div>

      {/* Body */}
      <div className="py-6 flex justify-center bg-white">
        <div className="w-full max-w-2xl">
          {/* Invoice meta row */}
          <div className="flex justify-between items-start mb-8">
            <div className="flex gap-8">
              <div>
                <p className="text-xs text-gray-500 font-bold uppercase tracking-wide mb-1">
                  Status
                </p>

                {displayBillData && displayBillData?.status === "refunded" ? (
                  <span className="rounded-md font-semibold capitalize text-xl px-1 py-1 bg-orange-400 text-orange-800">
                    {displayBillData.status}
                  </span>
                ) : invoice.paidStatus === "unpaid" ? (
                  <span className="rounded-md font-semibold capitalize text-xl px-1 py-1 bg-red-400 text-red-700">
                    {invoice.paidStatus}
                  </span>
                ) : (
                  <span className="rounded-md font-semibold capitalize text-xl px-1 py-1 bg-green-400 text-green-700">
                    {invoice.paidStatus}
                  </span>
                )}
              </div>
              <div>
                <p className="text-xs text-gray-500 font-bold uppercase tracking-wide mb-1">
                  Customer
                </p>
                {isCustomerLoading ? (
                  <div className="h-5 w-32 bg-gray-200 animate-pulse rounded" />
                ) : (
                  <>
                    <span className="text-blue-600 rounded-md font-semibold capitalize text-2xl">
                      {customerProfile?.name ||
                        invoice?.customerEmail ||
                        "Guest"}
                    </span>
                    {customerProfile?.loyaltyPoint > 0 && (
                      <p className="text-[10px] text-orange-500 font-medium flex items-center gap-1">
                        ★ {customerProfile.loyaltyPoint.toFixed(2)} Points
                      </p>
                    )}
                  </>
                )}
              </div>
            </div>
            <div className="flex gap-8 text-right">
              <div>
                <p className="text-xs text-gray-500 font-bold uppercase tracking-wide mb-1">
                  Amount due
                </p>
                <p className="text-2xl font-semibold text-gray-800">
                  {displayBillData && displayBillData.status === "refunded" ? (
                    <span className="text-orange-600 font-bold">
                      {currency.symbol} 0.00
                    </span>
                  ) : invoice.paidStatus === "paid" ? (
                    <span className="text-green-600 font-bold">
                      {currency.symbol} 0.00
                    </span>
                  ) : (
                    <span className="text-600 font-bold">
                      {formatCurrencySymbol(
                        invoice.grandTotal.toFixed(2),
                        currency.symbol,
                        currency.locale,
                      )}
                    </span>
                  )}
                </p>
              </div>
            </div>
          </div>

          {/* Steps Section */}
          <div className="flex flex-col gap-3 mb-4">
            {/* Step 1: Created */}
            {invoice.paidStatus === "unpaid" && (
              <div className="bg-white border border-gray-200 rounded-2xl p-5 flex items-start gap-4 shadow-md hover:shadow-lg transition duration-300">
                <div className="w-10 h-10 rounded-full border-2 border-blue-500 flex items-center justify-center text-blue-600 shrink-0">
                  <FileText size={18} />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-800 text-lg">
                    Created
                  </h3>
                  <p className="text-sm text-gray-500 mt-0.5">
                    <span className="font-medium text-gray-700">Created:</span>{" "}
                    {new Date(invoice.createdAt).toLocaleString()}
                  </p>
                </div>
                <Button
                  onClick={handleEditInvoice}
                  className="text-sm border border-blue-600 rounded-full px-4 py-1.5 text-blue-600 bg-white hover:bg-blue-100 transition-colors"
                >
                  Edit invoice
                </Button>
              </div>
            )}

            <div className="w-px h-2 rounded-2xl bg-gray-200 ml-9" />

            {/* Step 2: Send & Reminders */}
            <div
              className={`bg-white border rounded-2xl p-5 flex flex-col gap-3 shadow-md transition duration-300 ${
                invoice.sentAt
                  ? "border-blue-100 bg-blue-50/20"
                  : "border-gray-200"
              }`}
            >
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full border-2 flex items-center justify-center shrink-0 border-blue-500 text-blue-600">
                  {invoice.sentAt ? <Send size={18} /> : <Mail size={18} />}
                </div>

                <div className="flex-1">
                  <h3 className="font-semibold text-gray-800 text-lg">
                    Send Invoice
                  </h3>

                  {invoice.sentAt ? (
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
                  )}
                </div>

                <Button
                  onClick={() => setIsSendInvoiceModalOpen(true)}
                  variant={invoice.sentAt ? "outline" : "default"}
                  className={`rounded-full px-6 ${
                    !invoice.sentAt
                      ? "bg-blue-600 hover:bg-blue-700 text-white"
                      : "border-blue-200 text-blue-600 hover:bg-blue-50"
                  }`}
                >
                  {invoice.sentAt ? "Send again" : "Send now"}
                </Button>
              </div>

              {/* Reminder Alert Box */}
              <div className="flex items-center justify-between bg-white border border-blue-100 rounded-xl px-4 py-3 ml-14 shadow-sm">
                <div className="flex items-start gap-3">
                  <Bell size={16} className="text-blue-600 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-sm text-gray-700 font-medium">
                      Send Reminder
                    </p>
                    <p className="text-xs text-gray-500">
                      Send an invoice reminder to the customer.
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => handleResendInvoice()}
                  className="text-xs bg-blue-50 text-blue-700 font-bold px-3 py-1.5 rounded-lg hover:bg-blue-100 transition-colors"
                >
                  Send Reminder
                </button>
              </div>
            </div>

            <div className="w-px h-2 rounded-2xl bg-gray-200 ml-9" />

            {/* Step 3: Manage payments */}
            <div
              className={`bg-white border rounded-2xl p-5 flex flex-col gap-4 shadow-md transition duration-300 ${
                invoice.paidStatus === "paid"
                  ? "border-green-100 bg-green-50/30"
                  : "border-gray-200"
              }`}
            >
              <div className="flex items-start gap-4">
                <div
                  className={`w-10 h-10 rounded-full border-2 flex items-center justify-center shrink-0 ${
                    displayBillData && displayBillData?.status === "refunded"
                      ? "border-orange-500 text-orange-600 bg-orange-50"
                      : invoice.paidStatus === "paid"
                        ? "border-green-500 text-green-600 bg-green-50"
                        : "border-blue-500 text-blue-600"
                  }`}
                >
                  {displayBillData && displayBillData?.status === "refunded" ? (
                    <AlertTriangle size={18} />
                  ) : invoice.paidStatus === "paid" ? (
                    <Check size={18} />
                  ) : (
                    <CreditCard size={18} />
                  )}
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-800 text-lg">
                    {displayBillData && displayBillData?.status === "refunded"
                      ? "Payment refunded"
                      : invoice.paidStatus === "paid"
                        ? "Payment completed"
                        : "Manage payments"}
                  </h3>
                  {displayBillData && displayBillData?.status === "refunded" ? (
                    <p className="text-sm text-orange-600 font-medium">
                      This payment was refunded on{" "}
                      {displayBillData?.updatedAt &&
                        new Date(
                          displayBillData.updatedAt,
                        ).toLocaleDateString()}
                    </p>
                  ) : (
                    invoice.paidStatus === "paid" && (
                      <p className="text-sm text-green-600 font-medium">
                        Paid via {invoice.paymentMethod || "cash"} on{" "}
                        {new Date(invoice.updatedAt).toLocaleDateString()}
                      </p>
                    )
                  )}
                </div>
                {invoice.paidStatus !== "paid" && (
                  <div className="flex items-center gap-2">
                    <Button
                      onClick={handleChargeCard}
                      className="bg-blue-600 hover:bg-blue-700 text-white rounded-full px-6"
                    >
                      Charge a credit card
                    </Button>
                    <Button
                      onClick={() => setIsPaymentModalOpen(true)}
                      className="text-sm border border-blue-600 rounded-full px-4 py-2 text-blue-600 bg-white hover:bg-blue-100 transition-colors font-medium"
                    >
                      Record a payment
                    </Button>
                  </div>
                )}
              </div>

              <div className="ml-14 flex items-center justify-between text-sm">
                <p className="text-gray-600">
                  <span className="font-medium">Amount due:</span>{" "}
                  {displayBillData && displayBillData.status === "refunded" ? (
                    <span className="text-orange-600 font-bold">
                      {currency.symbol} 0.00
                    </span>
                  ) : invoice.paidStatus === "paid" ? (
                    <span className="text-green-600 font-bold">
                      {currency.symbol} 0.00
                    </span>
                  ) : (
                    ` ${formatCurrencySymbol(invoice.grandTotal.toFixed(2), currency.symbol, currency.locale)}`
                  )}
                  {invoice.paidStatus !== "paid" && (
                    <>
                      {" — "}
                      <button
                        onClick={() => setIsPaymentModalOpen(true)}
                        className="text-blue-600 hover:underline font-medium"
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
                    <span className="text-green-700 font-bold">
                      This invoice has been fully paid
                    </span>
                  ) : (
                    "Your invoice is awaiting payment"
                  )}
                </p>
              </div>
            </div>
          </div>

          {/* ── Invoice Type Tabs ── */}
          <div className="mb-6">
            <div className="flex border-b border-gray-200 gap-1">
              {(["proforma", "invoice", "tax"] as const).map((tab) => {
                const label =
                  tab === "proforma"
                    ? "Proforma"
                    : tab === "invoice"
                      ? "Regular Invoice"
                      : "Tax Invoice";
                const isActive = invoiceType === tab;
                return (
                  <button
                    key={tab}
                    onClick={() => setInvoiceType(tab)}
                    className={`px-6 py-3 text-sm font-semibold rounded-t-lg transition-all ${
                      isActive
                        ? "bg-white text-blue-600 border border-b-white border-gray-200 -mb-px"
                        : "bg-gray-50 text-gray-500 hover:text-gray-700 border border-transparent"
                    }`}
                  >
                    {label}
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

      <RecordPaymentModal
        open={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        invoiceNo={id as string}
      />
    </div>
  );
}
