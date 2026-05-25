import type { ShiftStats, Transaction } from "@/lib/types/shift";
import type { BillView } from "@/lib/types/expenses";

type RawExpenseItem = {
  _id: string;
  shift: string;
  openingCash: number;
  closingCash?: number;
  transactionDate: string;
  isSplitPayment: boolean;
  cashAmount: number;
  qrAmount: number;
  transactionAmount: number;
  transactionType: "pay-in" | "pay-out";
  note: string;
  transactionTime: string;
  employeeId: string;
};

type ExpenseHistoryResponse = {
  payInTransactions: RawExpenseItem[];
  payOutTransactions: RawExpenseItem[];
  chartData: { date: string; payInAmount: number; payOutAmount: number }[];
  totalPayIn: number;
  totalPayOut: number;
  totalTransactions: number;
  totalPayInAmount: number;
  totalPayOutAmount: number;
  netAmount: number;
  pagination: { nextCursor: string | null; hasMore: boolean };
};

function derivePaymentMethod(item: RawExpenseItem): string {
  if (item.isSplitPayment) return "Split";
  if (item.cashAmount > 0 && item.qrAmount > 0) return "Split";
  if (item.qrAmount > 0) return "QR";
  return "Cash";
}

function mapToBillView(item: RawExpenseItem): BillView {
  return {
    id: item._id,
    bill_no: 0,
    vendor_name: "",
    subtotal: item.transactionAmount,
    created_at: item.transactionTime,
    due_date: "",
    status: item.transactionType === "pay-in" ? "Pay In" : "Pay Out",
    comment: item.note ?? "",
    paymentMethod: derivePaymentMethod(item),
  };
}

export const fetchCurrentShift = async (): Promise<ShiftStats | null> => {
  const res = await fetch("/api/shift");
  if (!res.ok) return null;
  const json = await res.json();
  return json?.data?.currentShiftDetails ?? null;
};

export const openShift = async (openingCash: number): Promise<ShiftStats> => {
  const res = await fetch("/api/shift/open", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ openingCash }),
  });
  if (!res.ok) throw new Error("Failed to open shift");
  const json = await res.json();
  return json?.data;
};

export const closeShift = async (closingCash: number): Promise<void> => {
  const res = await fetch("/api/shift/close", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ closingCash }),
  });
  if (!res.ok) throw new Error("Failed to close shift");
};

export const createExpense = async (
  shiftId: string,
  payload: {
    transactionAmount: number;
    transactionType: "pay-in" | "pay-out";
    transactionTime: string;
    note: string;
    billImage?: File | null;
  },
): Promise<void> => {
  const formData = new FormData();
  formData.append("transactionAmount", String(payload.transactionAmount));
  formData.append("transactionType", payload.transactionType);
  formData.append("transactionTime", payload.transactionTime);
  formData.append("note", payload.note);

  if (payload.billImage) {
    formData.append("billImages", payload.billImage, payload.billImage.name);
  }

  const res = await fetch(`/api/shift/expense/${shiftId}`, {
    method: "POST",
    body: formData,
  });
  if (!res.ok) throw new Error("Failed to create expense");
};

export const fetchShiftTransactions = async (): Promise<Transaction[]> => {
  const res = await fetch("/api/shift/transactions");
  if (!res.ok) return [];
  const json = await res.json();
  return json?.data?.transactions ?? [];
};

export const fetchExpenseHistory = async (): Promise<BillView[]> => {
  const res = await fetch("/api/shift/history");
  if (!res.ok) return [];

  const json: ExpenseHistoryResponse = await res.json();
  const all = [
    ...(json.payInTransactions ?? []),
    ...(json.payOutTransactions ?? []),
  ];

  return all.map(mapToBillView);
};
