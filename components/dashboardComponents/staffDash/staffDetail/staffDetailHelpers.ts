"use client";

export type StaffOverview = {
  name: string;
  totalSales: number;
  totalRevenue: number;
  avgTime: string;
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
  totalSales: number;
  totalRevenue: number;
  bills: BillItem[];
};

export function getDefaultDateRange() {
  const end = new Date();
  const start = new Date();
  start.setDate(1);
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

export const inputClass =
  "border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition";

export function useCurrency() {
  // This is a re-export helper; actual usage should come from @/providers/CurrencyContext
  throw new Error(
    "Do not import useCurrency from helpers; import from @/providers/CurrencyContext directly.",
  );
}
