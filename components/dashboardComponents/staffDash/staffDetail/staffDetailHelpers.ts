"use client";

export type StaffOverview = {
  name: string;
  totalSales: number;
  totalRevenue: number;
  totalOrders: number;
  avgTime: string;
  // Employee Analytics KPIs
  totalBills?: number;
  totalProfit?: number;
  profitMargin?: number;
  avgBillValue?: number;
  avgItemsPerBill?: number;
  itemsSold?: number;
  totalRefunds?: number;
  refundedAmount?: number;
  totalShiftMinutes?: number;
  salesPerHour?: number;
  billsPerHour?: number;
};

export type ShiftSummary = {
  shiftId?: string;
  employee?: string;
  overAllPayIn?: number;
  overAllPayOut?: number;
  overallTransaction?: number;
  openingTime?: string;
  closingTIme?: string;
  payIn?: number;
  payOut?: number;
  totalSale?: number;
  /** "HH:MM:SS" from the staff-shifts endpoint; absent on the analytics path. */
  totalHours?: string;
  cashSale?: number;
  onlineSale?: number;
  openingCash?: number;
  closingCash?: number;
  expectedAmount?: number;
  difference?: number;
  billImages?: string[];
};

export type ShiftDetailTransaction = {
  _id: string;
  transactionAmount: number;
  transactionType: string;
  note: string;
  paymentMethod?: string;
  transactionTime: string;
  invoiceNo?: number;
  billImages?: string[];
  isSplitPayment?: boolean;
  cashAmount?: number;
  qrAmount?: number;
};

export type ShiftDetail = {
  openingCash: number;
  closingCash: number;
  openingTime: string;
  closingTime: string;
  employeeName: string;
  transactions: ShiftDetailTransaction[];
};

export type BillItem = {
  _id: string;
  orderId: string;
  invoiceNo: number;
  paidBillNo: number;
  totalAmount: number;
  grandTotal: number;
  paidAt: string;
  customerName?: string;
  customerPhone?: string;
  paymentMethod?: string;
  status?: string;
  billName?: string;
};

export type EmployeeData = {
  _id: string;
  name: string;
  role?: string;
  totalSales: number;
  totalRevenue: number;
  bills: BillItem[];
};

export function getDefaultDateRange() {
  const end = new Date();
  const start = new Date();
  start.setDate(end.getDate() - 29);
  return {
    startDate: start.toISOString().split("T")[0],
    endDate: end.toISOString().split("T")[0],
  };
}

export function extractTime(raw: string | undefined): string {
  if (!raw) return "—";
  const d = parseNepalDateTime(raw);
  if (d) {
    const h = d.getHours().toString().padStart(2, "0");
    const m = d.getMinutes().toString().padStart(2, "0");
    return `${h}:${m}`;
  }
  const match = raw.match(/(\d{1,2}):(\d{2})/);
  if (match) {
    const h = match[1].padStart(2, "0");
    const m = match[2];
    return `${h}:${m}`;
  }
  return raw;
}

export function parseNepalDateTime(raw: string): Date | null {
  if (!raw) return null;
  if (/^\d{13}$/.test(raw)) {
    const d = new Date(Number(raw));
    return isNaN(d.getTime()) ? null : d;
  }
  const normalized = raw.includes("T")
    ? raw.replace("Z", "")
    : raw.replace(" ", "T");
  // Non-zero milliseconds -> already Nepal local time; ".000" or no fraction
  // -> UTC (+5:45). Mirrors `parseNepalTime` in lib/mappers/transaction.ts,
  // which parses the same `paidAt` values for Order History.
  const fraction = normalized.match(/\.(\d+)/)?.[1];
  const hasSubSecond = fraction != null && Number(fraction) > 0;
  let date: Date;
  if (hasSubSecond) {
    date = new Date(normalized);
  } else {
    date = new Date(normalized + "+00:00");
  }
  return isNaN(date.getTime()) ? null : date;
}

/**
 * How long a shift ran, e.g. "7h 45m", or null when it can't be determined —
 * an open shift has no end yet, and a stale "elapsed so far" would be worse
 * than showing nothing.
 *
 * Shared by the shifts table and the shift detail modal so the two can't
 * disagree about the same shift's length.
 */
export function formatShiftDuration(
  openingTime: string | undefined,
  closingTime: string | undefined,
): string | null {
  if (!openingTime || !closingTime) return null;

  const open = parseNepalDateTime(openingTime) ?? new Date(openingTime);
  const close = parseNepalDateTime(closingTime) ?? new Date(closingTime);
  if (isNaN(open.getTime()) || isNaN(close.getTime())) return null;

  const minutes = Math.round((close.getTime() - open.getTime()) / 60000);
  if (minutes < 0) return null;

  const hrs = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return hrs > 0 ? `${hrs}h ${mins}m` : `${mins}m`;
}

export const inputClass =
  "border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition";

export function useCurrency() {
  // This is a re-export helper; actual usage should come from @/providers/CurrencyContext
  throw new Error(
    "Do not import useCurrency from helpers; import from @/providers/CurrencyContext directly.",
  );
}
