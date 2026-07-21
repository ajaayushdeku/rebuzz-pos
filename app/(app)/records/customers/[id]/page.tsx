"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useParams, useRouter } from "next/navigation";
import { useCustomersList } from "@/hooks/useCustomersList";
import { Customer } from "@/components/customer/customer-columns";
import { useCurrency } from "@/providers/CurrencyContext";
import { formatCurrencySymbol } from "@/utils/helper";
import { getCustomerImageUrl, getLoyaltyStatus } from "@/lib/types/customer";
import {
  ArrowLeft,
  Pencil,
  Star,
  Loader2,
  Mail,
  Phone,
  FileText,
  ShoppingBag,
  DollarSign,
  Calendar,
  User,
  CreditCard,
  ChevronLeft,
  ChevronRight,
  Hash,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import EditCustomerModal from "@/components/customer/EditCustomerModal";
import LoyaltyPointModal from "@/components/customer/LoyaltyPointModal";
import toast from "react-hot-toast";
import { statusStyles, paymentMethods } from "@/lib/config/transaction";
import {
  WhatsAppIcon,
  whatsappLink,
} from "@/components/customer/CustomerTable";
import { CustomerAvatar } from "@/components/customer/CustomerAvatar";
import { ComponentHeader } from "@/components/ComponentHeader";

// â”€â”€ Types â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

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

// â”€â”€ Tier badge styling â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

const TIER_BG: Record<string, string> = {
  Bronze: "bg-amber-100 text-amber-800",
  Silver: "bg-slate-200 text-slate-800",
  Gold: "bg-yellow-100 text-yellow-800",
  Platinum: "bg-indigo-100 text-indigo-800",
};

const TIER_RING: Record<string, string> = {
  Bronze: "ring-amber-200",
  Silver: "ring-slate-300",
  Gold: "ring-yellow-300",
  Platinum: "ring-indigo-300",
};

// â”€â”€ Helpers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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

const ORDER_STATUS_STYLE: Record<string, string> = {
  completed: "bg-green-50 text-green-700 border-green-200",
  refunded: "bg-gray-100 text-gray-500 border-gray-200",
};

// â”€â”€ Global scrollbar-hide styles â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

const scrollbarHideStyles = `
  .scrollbar-hide {
    -ms-overflow-style: none;
    scrollbar-width: none;
  }
  .scrollbar-hide::-webkit-scrollbar {
    display: none;
  }
`;

// â”€â”€ Main Page â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export default function CustomerDetailPage() {
  const params = useParams();
  const router = useRouter();
  const customerId = params.id as string;
  const { data: customers = [], isLoading } = useCustomersList();
  const { currency } = useCurrency();

  const [editOpen, setEditOpen] = useState(false);
  const [loyaltyOpen, setLoyaltyOpen] = useState(false);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [history, setHistory] = useState<PurchaseHistoryItem[]>([]);
  const [page, setPage] = useState(0);
  const pageSize = 5;

  const customer = customers.find((c) => c.id === customerId);

  // Fetch order history
  useEffect(() => {
    if (!customerId) return;

    const fetchHistory = async () => {
      setHistoryLoading(true);
      try {
        const res = await fetch(`/api/customers/${customerId}/history`);
        if (!res.ok) throw new Error("Failed to fetch history");
        const json: PurchaseHistoryResponse = await res.json();
        setHistory(json.customerPurchases ?? []);
      } catch {
        toast.error("Failed to load order history");
      } finally {
        setHistoryLoading(false);
      }
    };

    fetchHistory();
  }, [customerId]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50/50">
        <div className="flex items-center">
          <Loader2 size={24} className="animate-spin text-blue-500" />
          <span className="ml-3 text-sm text-gray-500">
            Loading customer...
          </span>
        </div>
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="min-h-screen bg-gray-50/50 px-6 py-8 md:px-10">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
              <User size={28} className="text-gray-300" />
            </div>
            <p className="text-gray-500 text-sm mb-4">Customer not found</p>
            <Button
              variant="outline"
              onClick={() => router.push("/records/customers")}
              className="text-sm"
            >
              <ArrowLeft size={14} className="mr-2" />
              Back to Customers
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const loyaltyStatus = getLoyaltyStatus(customer.loyaltyPoint);
  const imageUrl = getCustomerImageUrl(customer.image);

  // Calculate stats from history
  const validHistory = history.filter((p) => !p.isRefunded);
  const totalSpent = validHistory.reduce(
    (sum, p) => sum + (p.grandTotal ?? 0),
    0,
  );
  const totalOrders = validHistory.length;
  const refundedOrders = history.filter((p) => p.isRefunded).length;

  // Pagination
  const totalPages = Math.max(1, Math.ceil(history.length / pageSize));
  const paged = history.slice(page * pageSize, (page + 1) * pageSize);

  return (
    // <div className="min-h-screen bg-gray-50/50 px-6 py-8 md:px-10">
    <div className="min-h-screen bg-50 px-6 py-8 md:px-10">
      {/* <div className="max-w-6xl mx-auto"> */}
      <div>
        {/* â”€â”€ Header â”€â”€ */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push("/records/customers")}
              className="p-2 text-gray-400 hover:text-gray-700 hover:bg-white rounded-lg transition-colors shadow-sm"
            >
              <ArrowLeft size={18} />
            </button>
            <div className="flex items-center gap-3">
              <CustomerAvatar
                src={imageUrl}
                name={customer.name}
                className="w-12 h-12 shrink-0 ring-2 ring-white shadow-md"
                textClass="text-base"
                onClick={imageUrl ? () => setViewerOpen(true) : undefined}
              />
              <div>
                <h1 className="font-bold text-xl md:text-2xl text-gray-900">
                  {customer.name}
                </h1>
                <p className="text-xs text-gray-400 mt-0.5">
                  Customer ID: {customer.id.slice(0, 8)}...
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span
              className={`text-xs font-bold px-3 py-1.5 rounded-full ${TIER_BG[loyaltyStatus]} ring-2 ${TIER_RING[loyaltyStatus]} shadow-sm`}
            >
              {loyaltyStatus}
            </span>
            {customer.isDeactivated && (
              <span className="text-xs font-medium text-red-600 bg-red-50 px-2.5 py-1 rounded-full border border-red-200">
                Inactive
              </span>
            )}

            <div className="h-5 bg-gray-300 w-[2px]" />

            {customer.phone && (
              <a
                href={whatsappLink(customer.phone)}
                target="_blank"
                rel="noopener noreferrer"
                title={`Chat on WhatsApp — ${customer.phone}`}
                className="inline-flex items-center justify-center h-8 w-8 rounded-lg text-green-600 hover:bg-green-50 transition-colors"
              >
                <WhatsAppIcon className="h-6 w-6" />
              </a>
            )}
          </div>
        </div>

        {/* â”€â”€ Stats Row â”€â”€ */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {[
            {
              label: "Loyalty Points",
              value: customer.loyaltyPoint.toLocaleString(),
              icon: <Star size={16} className="text-amber-500" />,
              bg: "bg-amber-50",
            },
            {
              label: "Total Spent",
              value: formatCurrencySymbol(
                totalSpent,
                currency.symbol,
                currency.locale,
              ),
              icon: <DollarSign size={16} className="text-green-500" />,
              bg: "bg-green-50",
            },
            {
              label: "Total Orders",
              value: String(totalOrders),
              icon: <ShoppingBag size={16} className="text-blue-500" />,
              bg: "bg-blue-50",
            },
            {
              label: "Due Amount",
              value:
                customer.totalDueAmount !== undefined
                  ? formatCurrencySymbol(
                      customer.totalDueAmount,
                      currency.symbol,
                      currency.locale,
                    )
                  : "â€”",
              icon: <CreditCard size={16} className="text-red-500" />,
              bg: "bg-red-50",
            },
          ].map((stat) => (
            <div
              key={stat.label}
              className="bg-white rounded-xl border border-gray-100 shadow-sm p-4"
            >
              <div className="flex items-center gap-2 mb-2">
                <div
                  className={`w-7 h-7 rounded-lg ${stat.bg} flex items-center justify-center`}
                >
                  {stat.icon}
                </div>
                <span className="text-xs text-gray-400 font-medium">
                  {stat.label}
                </span>
              </div>
              <p className="text-lg font-bold text-gray-900 truncate">
                {stat.value}
              </p>
            </div>
          ))}
        </div>

        {/* â”€â”€ Customer Info + Loyalty Cards â”€â”€ */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {/* Customer Info Card */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-7 h-7 rounded-lg bg-blue-50 flex items-center justify-center">
                  <User size={14} className="text-blue-500" />
                </div>
                <ComponentHeader
                  title="Customer Informations"
                  subHeader="Customer Details"
                />
              </div>

              <button
                onClick={() => setEditOpen(true)}
                className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                title="Edit customer"
              >
                <Pencil size={14} />
              </button>
            </div>

            {/* Photo */}
            <div className="flex items-center gap-4 pb-4 mb-1 border-b border-gray-50">
              <CustomerAvatar
                src={imageUrl}
                name={customer.name}
                className="w-16 h-16 shrink-0 border border-gray-200"
                textClass="text-xl"
                onClick={imageUrl ? () => setViewerOpen(true) : undefined}
              />
              <div className="min-w-0">
                <p className="text-[10px] text-gray-400 uppercase tracking-wider font-medium">
                  Profile Photo
                </p>
                <p className="text-sm font-medium text-gray-900">
                  {imageUrl ? customer.name : "No photo uploaded"}
                </p>
                {!imageUrl && (
                  <button
                    onClick={() => setEditOpen(true)}
                    className="text-xs text-blue-600 hover:text-blue-700 mt-0.5"
                  >
                    Upload a photo
                  </button>
                )}
              </div>
            </div>

            <div className="space-y-0">
              {[
                {
                  icon: <User size={15} />,
                  label: "Name",
                  value: customer.name,
                },
                {
                  icon: <Mail size={15} />,
                  label: "Email",
                  value: customer.email,
                },
                {
                  icon: <Phone size={15} />,
                  label: "Phone",
                  value: customer.phone,
                },
                {
                  icon: <Hash size={15} />,
                  label: "Tax ID / PAN",
                  value: customer.customerPan || null,
                },
                {
                  icon: <FileText size={15} />,
                  label: "Note",
                  value: customer.note,
                },
              ].map((row) => (
                <div
                  key={row.label}
                  className="flex items-start gap-3 py-2.5 border-b border-gray-50 last:border-b-0"
                >
                  <div className="mt-0.5 text-gray-400 shrink-0">
                    {row.icon}
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] text-gray-400 uppercase tracking-wider font-medium">
                      {row.label}
                    </p>
                    <p className="text-sm font-medium text-gray-900 break-words">
                      {row.value ?? "—"}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Loyalty Card */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3 ">
                <div className="w-7 h-7 rounded-lg bg-amber-50 flex items-center justify-center">
                  <Star size={14} className="text-amber-500" />
                </div>
                <ComponentHeader
                  title="Loyalty Program"
                  subHeader="Customer's loyalty points, due amount and total spending"
                />
              </div>
              <button
                onClick={() => setLoyaltyOpen(true)}
                className="p-1.5 text-gray-400 hover:text-orange-500 hover:bg-orange-50 rounded-lg transition-colors"
                title="Edit loyalty points"
              >
                <Pencil size={14} />
              </button>
            </div>

            {/* Loyalty Tier & Points */}
            <div className="bg-gradient-to-r from-gray-50 to-gray-100/50 rounded-xl p-4 mb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span
                    className={`text-xs font-bold px-3 py-1.5 rounded-full ${TIER_BG[loyaltyStatus]}`}
                  >
                    {loyaltyStatus}
                  </span>
                  <div>
                    <p className="text-[10px] text-gray-400 uppercase tracking-wider font-medium">
                      Loyalty Points
                    </p>
                    <p className="text-2xl font-bold text-gray-900">
                      {customer.loyaltyPoint.toLocaleString()}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-[10px] text-gray-400 uppercase tracking-wider font-medium">
                    Purchases
                  </p>
                  <p className="text-lg font-bold text-gray-900">
                    {customer.numberOfPurchases ?? 0}
                  </p>
                </div>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="space-y-0">
              {[
                {
                  icon: <ShoppingBag size={15} />,
                  label: "Total Purchases",
                  value: customer.numberOfPurchases,
                },
                {
                  icon: <DollarSign size={15} />,
                  label: "Total Due Amount",
                  value:
                    customer.totalDueAmount !== undefined
                      ? formatCurrencySymbol(
                          customer.totalDueAmount,
                          currency.symbol,
                          currency.locale,
                        )
                      : null,
                },
                {
                  icon: <DollarSign size={15} />,
                  label: "Total Spent (History)",
                  value: formatCurrencySymbol(
                    totalSpent,
                    currency.symbol,
                    currency.locale,
                  ),
                },
                {
                  icon: <ShoppingBag size={15} />,
                  label: "Refunded Orders",
                  value: refundedOrders > 0 ? String(refundedOrders) : null,
                },
              ]
                .filter((r) => r.value !== null)
                .map((row) => (
                  <div
                    key={row.label}
                    className="flex items-start gap-3 py-2.5 border-b border-gray-50 last:border-b-0"
                  >
                    <div className="mt-0.5 text-gray-400 shrink-0">
                      {row.icon}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[10px] text-gray-400 uppercase tracking-wider font-medium">
                        {row.label}
                      </p>
                      <p className="text-sm font-medium text-gray-900">
                        {row.value}
                      </p>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>

        {/* â”€â”€ Order History â”€â”€ */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 mt-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-7 h-7 rounded-lg bg-purple-50 flex items-center justify-center">
                <Calendar size={14} className="text-purple-500" />
              </div>
              <ComponentHeader
                title="Order History"
                subHeader="Customer's Order/Transaction History"
              />
            </div>
            <span className="text-xs text-gray-400 font-medium">
              {history.length} {history.length === 1 ? "order" : "orders"}
            </span>
          </div>

          {historyLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 size={20} className="animate-spin text-blue-500" />
              <span className="ml-2 text-sm text-gray-500">
                Loading order history...
              </span>
            </div>
          ) : history.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mb-3">
                <ShoppingBag size={20} className="text-gray-300" />
              </div>
              <p className="text-sm text-gray-400">No order history found</p>
            </div>
          ) : (
            <>
              <style>{scrollbarHideStyles}</style>
              <div className="overflow-x-auto scrollbar-hide">
                <table className="w-full text-sm min-w-[850px]">
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
                      <th className="text-left pb-3 pt-3 px-3 font-medium">
                        Customer
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
                      const statusKey: "completed" | "refunded" = isRefunded
                        ? "refunded"
                        : "completed";
                      const orderStatusStyle =
                        ORDER_STATUS_STYLE[statusKey] ??
                        "bg-gray-50 text-gray-600 border-gray-200";

                      const paymentMethod = (purchase.paymentMethod ??
                        "Cash") as "Card" | "Cash" | "QR" | "Loyalty";
                      const p =
                        paymentMethods[paymentMethod] ?? paymentMethods["Cash"];

                      return (
                        <tr
                          key={idx}
                          onClick={() =>
                            purchase.invoiceNo &&
                            router.push(`/invoices/${purchase.invoiceNo}`)
                          }
                          className="border-b border-gray-50 last:border-0 hover:bg-gray-50/50 transition-colors cursor-pointer"
                        >
                          <td className="py-3 px-3 text-gray-400 text-xs">
                            {page * pageSize + idx + 1}
                          </td>
                          <td className="py-3 px-3">
                            <span className="font-semibold text-gray-900 text-xs">
                              {purchase.invoiceNo
                                ? `ORD-${purchase.invoiceNo}`
                                : (purchase.orderId ?? "â€”")}
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
                              <span className="text-gray-400">â€”</span>
                            )}
                          </td>

                          {/*    <td className="py-3 px-4">
                      <span className="font-medium text-gray-800 text-xs block">
                        {transaction.timestamp}
                      </span>
                      <span className="text-[11px] text-gray-400">
                        {transaction.date}
                      </span>
                    </td> */}
                          <td className="py-3 px-4 text-xs text-gray-600">
                            {purchase.ticketName || "â€”"}
                          </td>
                          <td className="py-3 px-4 text-xs text-gray-600">
                            {customer.name || "â€”"}
                          </td>
                          <td className="py-3 px-3 text-center">
                            <span
                              className={`${p.badge} ${p.cell} text-xs font-medium px-2 py-0.5 rounded-full inline-block capitalize`}
                            >
                              {paymentMethod}
                            </span>
                          </td>
                          <td className="py-3 px-3 text-xs text-right font-semibold text-gray-900">
                            {formatCurrencySymbol(
                              purchase.grandTotal ?? 0,
                              currency.symbol,
                              currency.locale,
                            )}
                          </td>
                          <td className="py-3 px-3 text-center">
                            <span
                              className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border capitalize inline-block ${orderStatusStyle}`}
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

              {/* Pagination */}
              {totalPages > 1 && (
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
        </div>
      </div>

      {/* â”€â”€ Modals â”€â”€ */}
      <EditCustomerModal
        customer={customer}
        open={editOpen}
        onClose={() => setEditOpen(false)}
      />
      <LoyaltyPointModal
        customer={customer}
        open={loyaltyOpen}
        onClose={() => setLoyaltyOpen(false)}
      />

      {/* â”€â”€ Photo viewer (full image) â”€â”€ */}
      {viewerOpen &&
        imageUrl &&
        createPortal(
          <div
            className="fixed inset-0 z-[100] bg-black/80 flex items-center justify-center p-4"
            onClick={() => setViewerOpen(false)}
          >
            <button
              type="button"
              onClick={() => setViewerOpen(false)}
              aria-label="Close"
              className="absolute top-4 right-4 text-white/80 hover:text-white"
            >
              <X size={26} />
            </button>

            <div
              className="max-w-3xl w-full"
              onClick={(e) => e.stopPropagation()}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={imageUrl}
                alt={customer.name}
                className="w-full max-h-[80vh] object-contain rounded-lg bg-black"
              />
              <p className="text-center text-white/70 text-xs mt-2 truncate">
                {customer.name}
              </p>
            </div>
          </div>,
          document.body,
        )}
    </div>
  );
}
