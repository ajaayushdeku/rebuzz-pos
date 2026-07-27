// lib/mappers/transaction.ts

import { Transaction } from "@/components/dashboardComponents/orderHistory/transaction-columns";
import {
  RawBill,
  RawBillDetailResponse,
  RawBillListResponse,
} from "../types/bill";
import { PaymentMethod } from "../config/transaction";

// Handles inconsistent casing from the backend
function normalizePaymentMethod(method: string): PaymentMethod {
  const lower = method.toLowerCase();
  if (lower === "cash") return "Cash";
  if (lower.includes("qr")) return "QR";
  if (lower === "card") return "Card";
  return method as PaymentMethod;
}

/**
 * Parse a raw `paidAt` string into a Date whose UTC fields equal the Nepal
 * wall-clock time. Callers MUST format it with `timeZone: "UTC"` so the result
 * is identical on every machine (dev in Nepal or a UTC server) — otherwise the
 * runtime timezone would add the Nepal offset a second time.
 *
 * Hours < 12 are stored as UTC and need the +5:45 Nepal offset; hours >= 12 are
 * already Nepal time and are used as-is.
 */
function parseNepalTime(rawDate: string): Date {
  const normalized = rawDate.includes("T")
    ? rawDate.replace("Z", "")
    : rawDate.replace(" ", "T");
  const rawHour = parseInt(normalized.split("T")[1]?.split(":")[0] ?? "12", 10);
  // Parse the wall-clock components AS UTC (append "Z"), never as local time,
  // so downstream UTC formatting round-trips the intended value.
  const utc = new Date(normalized + "Z");
  if (rawHour >= 12) {
    return utc;
  }
  return new Date(utc.getTime() + (5 * 60 + 45) * 60 * 1000);
}

function mapBillToTransaction(bill: RawBill, isDetail = false): Transaction {
  const paidAt = parseNepalTime(bill.paidAt);
  return {
    id: `ORD-${bill.invoiceNo}`,
    date: paidAt.toLocaleDateString("en-US", {
      timeZone: "UTC",
      month: "short",
      day: "numeric",
      year: "numeric",
    }),
    timestamp: paidAt.toLocaleTimeString("en-US", {
      timeZone: "UTC",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }),
    timestamp12h: paidAt.toLocaleTimeString("en-US", {
      timeZone: "UTC",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    }),
    invoiceName: bill.ticketName ?? "—",
    amount: String(bill.grandTotal),
    paymentMethod: normalizePaymentMethod(bill.paymentMethod),
    items: (bill.items ?? []).flatMap((entry) =>
      entry.item.map((i) => ({
        name: i.productName,
        quantity: i.quantity,
        unitPrice: i.unitPrice,
      })),
    ),
    status: bill.isRefunded ? "refunded" : "completed",
    businessName: bill.businessName,
    generatedBy: bill.generatedBy,
    totalAmount: bill.totalAmount,
    discount: bill.discount ?? 0,
    taxAmount: bill.taxamt,
    cashAmount: bill.cashAmount,
    qrAmount: bill.qrAmount,
    invoiceNo: bill.invoiceNo,
    billNo: bill.paidBillNo,
    currentPoint: bill.currentPoint,
    totalPoints: bill.totalPoints,
    updatedAt: bill.updatedAt,
    createdAt: bill.createdAt,
    paidAt: bill.paidAt,
    discountByPoints: bill.discountByPoints,
    // ✅ Only include customer when mapping detail response
    customer:
      isDetail && bill.customer
        ? {
            name: bill.customer.name ?? "",
            email: bill.customer.email ?? "",
            phone: bill.customer.phone ?? "",
          }
        : null,
  };
}

export function mapBillsToTransactions(
  response: RawBillListResponse,
): Transaction[] {
  return response.data.bill.map((bill) => mapBillToTransaction(bill, false));
}

export function mapDetailBillToTransaction(
  response: RawBillDetailResponse,
): Transaction {
  return mapBillToTransaction(response.data.bill, true); // ✅ isDetail = true
}
