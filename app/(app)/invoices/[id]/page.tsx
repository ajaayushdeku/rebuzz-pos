"use client";

import jsPDF from "jspdf";
import toast from "react-hot-toast";
import { toPng } from "html-to-image";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useRef, useState } from "react";
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
  Link,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCurrency } from "@/providers/CurrencyContext";
import {
  fetchLoyaltyPointSettings,
  LoyaltyPointSettings,
} from "@/services/apiLoyaltyPoint";
import { sendInvoiceScreenshot } from "@/services/sendInvoiceScreenshot";
import InvoicePreview from "@/components/invoice/InvoicePreview";

type InvoiceStatus = "draft" | "sent" | "paid" | "overdue";

export default function InvoiceDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { currency } = useCurrency();
  const { data: business } = useBusiness();

  const [invoiceType, setInvoiceType] = useState<
    "proforma" | "invoice" | "tax"
  >("proforma");
  const proformaRef = useRef<HTMLDivElement | null>(null);
  const regularRef = useRef<HTMLDivElement | null>(null);
  const taxRef = useRef<HTMLDivElement | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatingFor, setGeneratingFor] = useState<string | null>(null);

  const [loyaltySettings, setLoyaltySettings] =
    useState<LoyaltyPointSettings | null>(null);
  const [redeemEnabled, setRedeemEnabled] = useState(false);
  const [redeemPoints, setRedeemPoints] = useState<number>(0);
  const [redeemError, setRedeemError] = useState("");
  const [discountType, setDiscountType] = useState<"fixed" | "percentage">(
    "fixed",
  );
  const [discountError, setDiscountError] = useState("");
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [isRecordingPayment, setIsRecordingPayment] = useState(false);

  const handleDownloadPDF = async (
    ref: React.RefObject<HTMLDivElement | null>,
    suffix: string,
  ) => {
    if (!ref.current) return;

    try {
      setGeneratingFor(suffix);
      setIsGenerating(true);

      const dataUrl = await toPng(ref.current, {
        cacheBust: true,
        pixelRatio: 2,
        backgroundColor: "#ffffff",
      });

      const pdf = new jsPDF("p", "mm", "a4");

      const pageWidth = 210;
      const pageHeight = 297;

      const imgProps = pdf.getImageProperties(dataUrl);

      const imgWidth = pageWidth;

      const imgHeight = (imgProps.height * imgWidth) / imgProps.width;

      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(dataUrl, "PNG", 0, position, imgWidth, imgHeight);

      heightLeft -= pageHeight;

      while (heightLeft > 0) {
        position = heightLeft - imgHeight;

        pdf.addPage();

        pdf.addImage(dataUrl, "PNG", 0, position, imgWidth, imgHeight);

        heightLeft -= pageHeight;
      }

      pdf.save(`Invoice-${invoice.invoice}-${suffix}.pdf`);
    } catch (err) {
      console.error("PDF Generation Error:", err);
    } finally {
      setIsGenerating(false);
      setGeneratingFor(null);
    }
  };

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
      // console.log(result);
      return result?.data?.users?.[0] || null;
    },
    enabled: !!invoice,
  });

  const customerProfile = customerData;
  // console.log("CUstomer Profile:", customerProfile);

  // Fetch bill/transaction data — works for paid invoices (404 for unpaid is handled silently)
  const { data: billDataQuery } = useQuery({
    queryKey: ["bill-detail", invoice?.invoice],
    queryFn: () => getTransactionDetail(invoice!.invoice),
    enabled: !!invoice?.invoice,
    retry: false,
  });

  // console.log("Fetched Bill Data:", billDataQuery);

  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [billData, setBillData] = useState<null | Awaited<
    ReturnType<typeof getTransactionDetail>
  >>(null);
  const displayBillData = billData ?? billDataQuery ?? null;

  const [isSendInvoiceModalOpen, setIsSendInvoiceModalOpen] = useState(false);

  const [paymentData, setPaymentData] = useState({
    amount: invoice?.grandTotal || 0,
    discount: 0,
    method: "cash",
  });

  // ── Derived calculations ──────────────────────────────────────────────────

  const subtotalBeforeTax = invoice?.total ?? 0;

  // ✅ Correct — sum each item's actual taxAmount × quantity
  type ProductForTax = {
    taxApplied?: boolean;
    taxAmount?: number;
    quantity?: number;
  };

  type ItemGroupForTax = {
    item?: ProductForTax[];
  };

  const taxAmount =
    invoice?.items?.reduce((groupSum: number, group: ItemGroupForTax) => {
      const groupTax =
        group.item?.reduce((sum: number, product: ProductForTax) => {
          return (
            sum +
            (product.taxApplied
              ? (product.taxAmount ?? 0) * (product.quantity ?? 0)
              : 0)
          );
        }, 0) ?? 0;
      return groupSum + groupTax;
    }, 0) ?? 0;

  const isTaxApplied = taxAmount > 0;

  // Discount amount based on type
  const computedDiscountAmount = (() => {
    if (discountType === "percentage") {
      const pct = Math.min(100, Math.max(0, paymentData.discount));
      return (subtotalBeforeTax * pct) / 100;
    }
    return paymentData.discount;
  })();

  // Whether customer has enough points to even start redeeming
  const canRedeem =
    !customerProfile ||
    !loyaltySettings ||
    customerProfile.loyaltyPoint >= loyaltySettings.basePoint;

  // Max redeemable points: min(customer points, subtotal * redeemLimit%)
  const maxRedeemablePoints = loyaltySettings
    ? Math.min(
        customerProfile?.loyaltyPoint ?? 0,
        (subtotalBeforeTax * loyaltySettings.redeemLimit) / 100,
      )
    : 0;

  // Final payable = subtotal - discount + tax - redeemPoints
  const finalPayable = Math.max(
    0,
    subtotalBeforeTax +
      taxAmount -
      computedDiscountAmount -
      (redeemEnabled ? redeemPoints : 0),
  );

  // Validate discount
  const handleDiscountChange = (value: number) => {
    setPaymentData((prev) => ({ ...prev, discount: value }));
    if (discountType === "percentage" && (value < 0 || value > 100)) {
      setDiscountError("Percentage must be between 0 and 100.");
    } else if (discountType === "fixed" && value > subtotalBeforeTax) {
      setDiscountError("Discount cannot exceed subtotal.");
    } else {
      setDiscountError("");
    }
  };

  // Validate redeem points
  const handleRedeemChange = (value: number) => {
    setRedeemPoints(value);
    if (value > (customerProfile?.loyaltyPoint ?? 0)) {
      setRedeemError("Exceeds your available loyalty points.");
    } else if (value > maxRedeemablePoints) {
      setRedeemError(
        `Max redeemable is ${maxRedeemablePoints.toFixed(0)} points.`,
      );
    } else if (value < 0) {
      setRedeemError("Points cannot be negative.");
    } else {
      setRedeemError("");
    }
  };

  const openPaymentModal = () => {
    setPaymentData({
      amount: invoice?.grandTotal || 0,
      discount: invoice?.discount ?? 0,
      method: "cash",
    });
    setIsPaymentModalOpen(true);
  };

  const handleOpenPaymentModal = async () => {
    openPaymentModal();
    try {
      const response = await fetchLoyaltyPointSettings();
      const data = response && "data" in response ? response.data : response;
      setLoyaltySettings(data);
    } catch {
      console.error("Failed to fetch loyalty settings");
    }
  };

  const openSendInvoiceModal = () => {
    setIsSendInvoiceModalOpen(true);
  };

  const handleRecordPayment = async () => {
    if (discountError || redeemError || isRecordingPayment) return;
    setIsRecordingPayment(true);

    const formattedDate = new Date()
      .toISOString()
      .replace("T", " ")
      .split(".")[0];

    const paymentPayload = {
      payment: String(finalPayable),
      method: paymentData.method,
      discount: Number(computedDiscountAmount.toFixed(2)),
      paidAt: formattedDate,
      tax: "",
      taxId: null,
      taxamt: taxAmount,
      grandTotal: Number(finalPayable.toFixed(2)),
      redeemPointDeducted: redeemEnabled ? redeemPoints : 0,
    };

    const ticketId = invoice.invoice;

    if (!ticketId || isNaN(Number(ticketId))) {
      toast.error("Invalid Invoice Number");
      return;
    }

    try {
      const paymentRes = await fetch(`/api/tickets/${ticketId}/payment`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(paymentPayload),
      });

      const paymentResult = await paymentRes.json();

      if (paymentResult.status !== "success") {
        const errorMsg = paymentResult.data?.invoice_number || "Payment failed";
        toast.error(errorMsg);
        return;
      }

      if (redeemEnabled && redeemPoints > 0) {
        const redeemPayload = {
          invoiceNumber: String(ticketId),
          customerEmail: invoice.customerEmail ?? "",
          phoneNumber: invoice.phoneNumber ?? "",
          grandTotal: Number(finalPayable.toFixed(2)),
          redeemPoint: redeemPoints,
        };

        const redeemRes = await fetch("/api/tickets/redeem", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(redeemPayload),
        });
        const redeemResult = await redeemRes.json();

        if (redeemResult?.response?.status !== "success") {
          toast.error(
            "Payment recorded but failed to redeem loyalty points. Please contact support.",
          );
          console.error("Redeem failed:", redeemResult);
          setIsRecordingPayment(false);
          setIsPaymentModalOpen(false);
          queryClient.invalidateQueries({ queryKey: ["ticket", id] });
          return;
        }

        const redeemedAmount =
          redeemResult?.response?.data?.redeemedAmount ?? redeemPoints;
        toast.success(
          `Payment recorded! ${redeemedAmount} loyalty points redeemed.`,
        );
      } else {
        toast.success("Payment Recorded!");
      }

      setIsPaymentModalOpen(false);
      queryClient.invalidateQueries({ queryKey: ["ticket", id] });
      try {
        const detail = await getTransactionDetail(ticketId);
        setBillData(detail);
      } catch {
        console.warn("Could not fetch bill detail after payment");
      }
    } catch (error) {
      console.error("Fetch Error:", error);
      toast.error("Network error. Please try again.");
    } finally {
      setIsRecordingPayment(false);
    }
  };

  const copyPublicLinkForType = (type: string) => {
    const segment =
      type === "proforma"
        ? "proforma"
        : type === "invoice"
          ? "invoice"
          : "tax-invoice";
    const url = `${window.location.origin}/preview/${segment}/${invoice.invoice}`;
    navigator.clipboard.writeText(url);
    toast.success(
      `${type.charAt(0).toUpperCase() + type.slice(1)} link copied!`,
    );
  };

  // const [moreActionsOpen, setMoreActionsOpen] = useState(false);

  // ── Send invoice modal — selected invoice type state ──
  const [selectedInvoiceType, setSelectedInvoiceType] = useState<
    "proforma" | "invoice" | "tax"
  >("proforma");

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

  // Add this function inside the component
  const handleSendInvoiceByEmail = async (
    type: "proforma" | "invoice" | "tax",
  ) => {
    const refMap = {
      proforma: proformaRef,
      invoice: regularRef,
      tax: taxRef,
    };

    const labelMap = {
      proforma: "Proforma Invoice",
      invoice: "Invoice",
      tax: "Tax Invoice",
    };

    const ref = refMap[type];

    if (!ref.current) {
      toast.error("Invoice preview not ready");
      return;
    }

    const recipientEmail = customerProfile?.email || invoice?.customerEmail;

    if (!recipientEmail) {
      toast.error("No customer email found");
      return;
    }

    setInvoiceType(type);

    // Wait for DOM to render the correct invoice type
    await new Promise((r) => setTimeout(r, 200));

    try {
      await sendInvoiceScreenshot({
        element: ref.current,
        to: recipientEmail,
        invoiceNumber: String(invoice.invoice),
        businessName: business?.businessName,
        subject: `${labelMap[type]} #${invoice.invoice} — ${business?.businessName ?? "Rebuzz POS"}`,
      });
      toast.success(`${labelMap[type]} sent to ${recipientEmail}`);
    } catch (err) {
      console.error("Email send error:", err);
      toast.error(
        err instanceof Error ? err.message : "Failed to send invoice email",
      );
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-500">Loading invoice...</p>
      </div>
    );
  }

  if (!isLoading && !invoice) {
    // console.log("API Response received but no Tickets found:", data);
  }
  if (error || !invoice) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-500">Invoice not found.</p>
      </div>
    );
  }

  const displayStatus: InvoiceStatus =
    invoice.paidStatus === "paid" ? "paid" : "sent";
  const isToday =
    new Date(invoice.dueDate).toDateString() === new Date().toDateString();
  const dueDateLabel = isToday
    ? "Today"
    : new Date(invoice.dueDate).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });

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
                      {currency.symbol}0.00
                    </span>
                  ) : invoice.paidStatus === "paid" ? (
                    <span className="text-green-600 font-bold">
                      {currency.symbol}0.00
                    </span>
                  ) : (
                    <span className="text-600 font-bold">
                      {currency.symbol}
                      {invoice.grandTotal.toFixed(2)}
                    </span>
                  )}
                </p>
              </div>

              {/* <div>
                <p className="text-xs text-gray-500 font-bold uppercase tracking-wide mb-1">
                  Due
                </p>
                <p className="text-2xl font-semibold text-gray-800">
                  {dueDateLabel}
                </p>
              </div> */}
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
                  onClick={openSendInvoiceModal}
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
                      onClick={handleOpenPaymentModal}
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
                    <span className="text-orange-600 font-bold">$0.00</span>
                  ) : invoice.paidStatus === "paid" ? (
                    <span className="text-green-600 font-bold">$0.00</span>
                  ) : (
                    `$${invoice.grandTotal.toFixed(2)}`
                  )}
                  {invoice.paidStatus !== "paid" && (
                    <>
                      {" — "}
                      <button
                        onClick={handleOpenPaymentModal}
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

          {/* ── All 3 Previews (only active one visible, all rendered for PDF export) ── */}
          <div
            className={
              invoiceType === "proforma"
                ? "block"
                : "absolute -left-[99999px] top-0"
            }
          >
            <InvoicePreview
              type="proforma"
              invoiceRef={proformaRef}
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
              invoiceRef={regularRef}
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
              invoiceRef={taxRef}
              invoice={invoice}
              customerProfile={customerProfile}
              businessProfile={business}
              billData={displayBillData}
            />
          </div>
        </div>
      </div>

      {/* ── Send Invoice Modal ── */}
      {isSendInvoiceModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-md p-4"
          onClick={() => setIsSendInvoiceModalOpen(false)}
        >
          <div
            className="relative w-full max-w-3xl rounded-3xl bg-white shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* ── Header ───────────────────────────────────── */}
            <div className="sticky top-0 z-20 flex items-center justify-between border-b border-gray-100 bg-white/95 backdrop-blur px-6 py-5">
              <div>
                <h2 className="text-2xl font-bold text-gray-800">
                  Send Invoice
                </h2>
                <p className="text-sm text-gray-500 mt-1">
                  Share, download, or email invoice documents
                </p>
              </div>

              <button
                onClick={() => setIsSendInvoiceModalOpen(false)}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 text-gray-500 transition hover:bg-gray-200 hover:text-gray-700 cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* ── Scrollable Content ───────────────────────── */}
            <div
              className="max-h-[80vh] overflow-y-auto px-6 py-6 space-y-8"
              style={{
                scrollbarWidth: "none",
                msOverflowStyle: "none",
              }}
            >
              {/* Hide scrollbar for webkit */}
              <style jsx>{`
                div::-webkit-scrollbar {
                  display: none;
                }
              `}</style>

              {/* ── Copy Links ───────────────────────────── */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800">
                      Copy Invoice Links
                    </h3>
                    <p className="text-sm text-gray-500">
                      Share invoice links instantly
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {[
                    {
                      label: "Proforma",
                      type: "proforma",
                    },
                    {
                      label: "Invoice",
                      type: "invoice",
                    },
                    {
                      label: "Tax Invoice",
                      type: "tax",
                    },
                  ].map((item) => (
                    <button
                      key={item.type}
                      className="group cursor-pointer"
                      onClick={() =>
                        copyPublicLinkForType(
                          item.type as "proforma" | "invoice" | "tax",
                        )
                      }
                    >
                      <div className="rounded-2xl border border-gray-200 bg-gradient-to-b from-white to-gray-50 p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
                        <div className="h-12 w-12 rounded-2xl bg-blue-50 flex items-center justify-center mx-auto mb-4 group-hover:bg-blue-100 transition">
                          <Link className="text-blue-600" size={20} />
                        </div>

                        <h4 className="font-semibold text-gray-800">
                          {item.label}
                        </h4>

                        <p className="mt-1 text-sm text-gray-500">
                          Copy public link
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* ── Download PDFs ────────────────────────── */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800">
                      Download PDFs
                    </h3>
                    <p className="text-sm text-gray-500">
                      Generate printable invoice documents
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {[
                    {
                      label: "Proforma",
                      type: "proforma",
                      ref: proformaRef,
                    },
                    {
                      label: "Invoice",
                      type: "invoice",
                      ref: regularRef,
                    },
                    {
                      label: "Tax Invoice",
                      type: "tax",
                      ref: taxRef,
                    },
                  ].map((item) => (
                    <button
                      key={item.type}
                      className="group cursor-pointer"
                      onClick={() =>
                        handleDownloadPDF(
                          item.ref,
                          item.type as "proforma" | "invoice" | "tax",
                        )
                      }
                      disabled={generatingFor === item.type}
                    >
                      <div className="rounded-2xl border border-gray-200 bg-gradient-to-b from-white to-gray-50 p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
                        <div className="h-12 w-12 rounded-2xl bg-red-50 flex items-center justify-center mx-auto mb-4 group-hover:bg-red-100 transition">
                          <FileText className="text-red-500" size={20} />
                        </div>

                        <h4 className="font-semibold text-gray-800">
                          {generatingFor === item.type
                            ? "Generating..."
                            : item.label}
                        </h4>

                        <p className="mt-1 text-sm text-gray-500">
                          Download as PDF
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* ── Send Email Section ───────────────────── */}
              <div className="rounded-3xl border border-blue-100 bg-gradient-to-br from-blue-50 via-white to-indigo-50 p-6 shadow-sm">
                <div className="flex flex-col items-center text-center">
                  <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-100 text-blue-600 shadow-sm">
                    <Mail size={30} />
                  </div>

                  <h3 className="text-2xl font-bold text-gray-800">
                    Send Invoice by Email
                  </h3>

                  <p className="mt-2 max-w-md text-sm text-gray-500">
                    Select which invoice format you want to send to{" "}
                    <span className="font-semibold text-gray-700">
                      {customerProfile?.email ||
                        invoice?.customerEmail ||
                        "customer"}
                    </span>
                    . The invoice will be captured as an image and sent.
                  </p>
                </div>

                {/* ── Invoice Type Selector ── */}
                <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {(
                    [
                      { label: "Proforma", value: "proforma" },
                      { label: "Invoice", value: "invoice" },
                      { label: "Tax Invoice", value: "tax" },
                    ] as {
                      label: string;
                      value: "proforma" | "invoice" | "tax";
                    }[]
                  ).map((item) => (
                    <button
                      key={item.value}
                      type="button"
                      onClick={() => setSelectedInvoiceType(item.value)}
                      className={`rounded-2xl border-2 p-4 text-left transition-all cursor-pointer ${
                        selectedInvoiceType === item.value
                          ? "border-blue-600 bg-blue-600 text-white shadow-lg"
                          : "border-gray-200 bg-white hover:border-blue-300"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-semibold">{item.label}</p>
                          <p
                            className={`text-sm mt-1 ${
                              selectedInvoiceType === item.value
                                ? "text-blue-100"
                                : "text-gray-500"
                            }`}
                          >
                            Send this format
                          </p>
                        </div>
                        <div
                          className={`h-5 w-5 rounded-full border-2 flex items-center justify-center ${
                            selectedInvoiceType === item.value
                              ? "border-white bg-white"
                              : "border-gray-300"
                          }`}
                        >
                          {selectedInvoiceType === item.value && (
                            <div className="w-2.5 h-2.5 rounded-full bg-blue-600" />
                          )}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>

                {/* ── Recipient info ── */}
                {customerProfile?.email || invoice?.customerEmail ? (
                  <div className="mt-4 flex items-center gap-2 bg-white rounded-xl border border-blue-100 px-4 py-2.5">
                    <Mail size={14} className="text-blue-500 shrink-0" />
                    <p className="text-sm text-gray-600">
                      Will be sent to:{" "}
                      <span className="font-semibold text-gray-800">
                        {customerProfile?.email || invoice?.customerEmail}
                      </span>
                    </p>
                  </div>
                ) : (
                  <div className="mt-4 flex items-center gap-2 bg-red-50 rounded-xl border border-red-100 px-4 py-2.5">
                    <p className="text-sm text-red-600">
                      No customer email found — cannot send via email
                    </p>
                  </div>
                )}

                {/* ── Action Buttons ── */}
                <div className="mt-6 flex flex-col sm:flex-row gap-3">
                  {/* Screenshot email — sends all 3 types individually */}
                  <button
                    className="flex-1 rounded-2xl bg-blue-600 px-5 py-3.5 font-semibold text-white shadow-md transition-all hover:bg-blue-700 hover:shadow-lg cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    disabled={
                      isSendingEmail ||
                      !(customerProfile?.email || invoice?.customerEmail)
                    }
                    onClick={async () => {
                      setIsSendingEmail(true);
                      await handleSendInvoiceByEmail(selectedInvoiceType);
                      setIsSendingEmail(false);
                    }}
                  >
                    {isSendingEmail ? (
                      <>
                        <svg
                          className="animate-spin h-4 w-4 text-white"
                          fill="none"
                          viewBox="0 0 24 24"
                        >
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                          />
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8v8z"
                          />
                        </svg>
                        Sending...
                      </>
                    ) : (
                      <>
                        <Mail size={16} />
                        Send{" "}
                        {selectedInvoiceType === "proforma"
                          ? "Proforma"
                          : selectedInvoiceType === "invoice"
                            ? "Invoice"
                            : "Tax Invoice"}
                      </>
                    )}
                  </button>

                  {/* Send all 3 formats */}
                  <button
                    className="flex-1 rounded-2xl border border-gray-300 bg-white px-5 py-3.5 font-semibold text-gray-700 transition-all hover:bg-gray-50 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={
                      isSendingEmail ||
                      !(customerProfile?.email || invoice?.customerEmail)
                    }
                    onClick={async () => {
                      setIsSendingEmail(true);
                      const types: ("proforma" | "invoice" | "tax")[] = [
                        "proforma",
                        "invoice",
                        "tax",
                      ];
                      for (const type of types) {
                        try {
                          await handleSendInvoiceByEmail(type);
                        } catch {
                          // individual errors already toasted inside handleSendInvoiceByEmail
                        }
                      }
                      setIsSendingEmail(false);
                    }}
                  >
                    Send All 3 Formats
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Payment Modal ── */}
      {isPaymentModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center sticky top-0 bg-white z-10">
              <h2 className="text-xl font-semibold text-gray-700">
                Record Payment
              </h2>
              <button
                onClick={() => setIsPaymentModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 text-2xl"
              >
                &times;
              </button>
            </div>

            <div className="p-6 space-y-5">
              <div>
                <label className="text-xs font-semibold text-gray-400 uppercase tracking-widest block mb-2">
                  Payment Method
                </label>
                <Select
                  value={paymentData.method}
                  onValueChange={(value) =>
                    setPaymentData({ ...paymentData, method: value })
                  }
                >
                  <SelectTrigger className="w-full h-11 rounded-xl border-gray-200 bg-gray-50 font-medium capitalize">
                    <SelectValue placeholder="Select method" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border-gray-200 shadow-xl">
                    <SelectItem
                      value="cash"
                      className="py-3 cursor-pointer font-medium"
                    >
                      Cash
                    </SelectItem>
                    <SelectItem
                      value="card"
                      className="py-3 cursor-pointer font-medium"
                    >
                      Credit Card
                    </SelectItem>
                    <SelectItem
                      value="qr"
                      className="py-3 cursor-pointer font-medium"
                    >
                      QR / Digital Wallet
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="bg-gray-50 rounded-xl px-4 py-3 space-y-1.5 text-sm">
                <div className="flex justify-between text-gray-500">
                  <span>Subtotal</span>
                  <span className="font-medium text-gray-800">
                    {currency.symbol}
                    {subtotalBeforeTax.toFixed(2)}
                  </span>
                </div>
                {isTaxApplied && (
                  <div className="flex justify-between text-blue-600">
                    <span>Tax</span>
                    <span>
                      +{currency.symbol}
                      {taxAmount.toFixed(2)}
                    </span>
                  </div>
                )}
                {computedDiscountAmount > 0 && (
                  <div className="flex justify-between text-red-500">
                    <span>Discount</span>
                    <span>
                      −{currency.symbol}
                      {computedDiscountAmount.toFixed(2)}
                    </span>
                  </div>
                )}
                {redeemEnabled && redeemPoints > 0 && !redeemError && (
                  <div className="flex justify-between text-violet-500">
                    <span>Loyalty redeemed</span>
                    <span>
                      −{currency.symbol}
                      {redeemPoints.toFixed(2)}
                    </span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-gray-800 border-t pt-1.5 mt-1">
                  <span>Total payable</span>
                  <span>
                    {currency.symbol}
                    {finalPayable.toFixed(2)}
                  </span>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-400 uppercase tracking-widest block mb-2">
                  Discount
                </label>
                <div className="flex gap-2 mb-2">
                  <button
                    type="button"
                    onClick={() => {
                      setDiscountType("fixed");
                      setPaymentData((prev) => ({ ...prev, discount: 0 }));
                      setDiscountError("");
                    }}
                    className={`flex-1 py-2 rounded-lg text-sm font-medium border transition ${
                      discountType === "fixed"
                        ? "bg-blue-600 text-white border-blue-600"
                        : "bg-white text-gray-600 border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    Fixed Amount
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setDiscountType("percentage");
                      setPaymentData((prev) => ({ ...prev, discount: 0 }));
                      setDiscountError("");
                    }}
                    className={`flex-1 py-2 rounded-lg text-sm font-medium border transition ${
                      discountType === "percentage"
                        ? "bg-blue-600 text-white border-blue-600"
                        : "bg-white text-gray-600 border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    Percentage (%)
                  </button>
                </div>
                <div className="relative">
                  <input
                    type="number"
                    min={0}
                    max={
                      discountType === "percentage" ? 100 : subtotalBeforeTax
                    }
                    value={paymentData.discount}
                    onChange={(e) =>
                      handleDiscountChange(Number(e.target.value))
                    }
                    placeholder={
                      discountType === "percentage" ? "e.g. 10" : "e.g. 50"
                    }
                    className={`w-full px-4 py-2.5 bg-gray-50 border rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm pr-10 ${
                      discountError ? "border-red-300" : "border-gray-200"
                    }`}
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">
                    {discountType === "percentage" ? "%" : currency.symbol}
                  </span>
                </div>
                {discountType === "percentage" &&
                  paymentData.discount > 0 &&
                  !discountError && (
                    <p className="text-xs text-gray-400 mt-1">
                      {paymentData.discount}% of {currency.symbol}
                      {subtotalBeforeTax.toFixed(2)} = {currency.symbol}
                      {computedDiscountAmount.toFixed(2)} off
                    </p>
                  )}
                {discountError && (
                  <p className="text-xs text-red-500 mt-1">{discountError}</p>
                )}
              </div>

              {customerProfile && (
                <div className="border border-violet-200 rounded-xl p-4 space-y-3 bg-violet-50/40">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-gray-800">
                        Redeem Loyalty Points
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        Customer has{" "}
                        <span className="font-semibold text-violet-600">
                          {customerProfile.loyaltyPoint.toFixed(2) ?? 0} pts
                        </span>{" "}
                        available
                      </p>
                    </div>
                    <button
                      type="button"
                      disabled={!canRedeem}
                      onClick={() => {
                        setRedeemEnabled((prev) => !prev);
                        setRedeemPoints(0);
                        setRedeemError("");
                      }}
                      className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors focus:outline-none ${
                        !canRedeem
                          ? "bg-gray-300 cursor-not-allowed"
                          : redeemEnabled
                            ? "bg-violet-500"
                            : "bg-gray-200"
                      }`}
                    >
                      <span
                        className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform ${
                          redeemEnabled
                            ? "translate-x-[18px]"
                            : "translate-x-0.5"
                        }`}
                      />
                    </button>
                  </div>
                  {!canRedeem && loyaltySettings && (
                    <div className="bg-violet-100/60 rounded-lg px-3 py-2.5 text-xs text-gray-600">
                      Your loyalty point is lower than the required base point (
                      <span className="font-semibold text-violet-700">
                        {loyaltySettings.basePoint} pts
                      </span>
                      ). You currently have{" "}
                      <span className="font-semibold">
                        {customerProfile.loyaltyPoint.toFixed(2)} pts
                      </span>
                      .
                    </div>
                  )}
                  {redeemEnabled && (
                    <div className="space-y-2">
                      <div className="grid grid-cols-2 gap-3 text-xs text-gray-500 bg-white rounded-lg px-3 py-2 border border-violet-200">
                        <div>
                          <p className="text-gray-400">Total points</p>
                          <p className="font-bold text-gray-800 text-sm">
                            {customerProfile.loyaltyPoint ?? 0} pts
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-400">Max redeemable</p>
                          <p className="font-bold text-violet-600 text-sm">
                            {maxRedeemablePoints.toFixed(0)} pts
                          </p>
                        </div>
                      </div>
                      <div>
                        <input
                          type="number"
                          min={0}
                          max={maxRedeemablePoints}
                          value={redeemPoints}
                          onChange={(e) =>
                            handleRedeemChange(Number(e.target.value))
                          }
                          placeholder={`Max ${maxRedeemablePoints.toFixed(0)} pts`}
                          className={`w-full px-4 py-2.5 bg-white border rounded-xl focus:ring-2 focus:ring-violet-400 outline-none text-sm ${
                            redeemError ? "border-red-300" : "border-violet-200"
                          }`}
                        />
                        {redeemError && (
                          <p className="text-xs text-red-500 mt-1">
                            {redeemError}
                          </p>
                        )}
                        {!redeemError && redeemPoints > 0 && (
                          <p className="text-xs text-violet-500 mt-1">
                            {redeemPoints} pts = {currency.symbol}
                            {redeemPoints.toFixed(2)} off
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div className="bg-white rounded-2xl border border-gray-100 p-5 flex justify-between items-center shadow-sm">
                <div>
                  <p className="text-gray-400 text-xs uppercase font-medium">
                    Final Amount
                  </p>
                  <p className="text-3xl font-bold text-gray-800">
                    {currency.symbol}
                    {finalPayable.toFixed(2)}
                  </p>
                </div>
                <span className="text-xs bg-gray-100 text-gray-600 px-3 py-1.5 rounded-full font-medium capitalize">
                  {paymentData.method}
                </span>
              </div>
            </div>

            <div className="px-6 pb-6">
              <button
                onClick={handleRecordPayment}
                disabled={
                  !!discountError || !!redeemError || isRecordingPayment
                }
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-4 rounded-2xl transition-all shadow-lg shadow-blue-200 flex items-center justify-center gap-2"
              >
                {isRecordingPayment ? (
                  <>
                    <svg
                      className="animate-spin h-5 w-5 text-white"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8v8z"
                      />
                    </svg>
                    Processing Payment...
                  </>
                ) : (
                  <>
                    Confirm & Pay {currency.symbol}
                    {finalPayable.toFixed(2)}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
