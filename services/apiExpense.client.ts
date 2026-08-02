"use client";

export type TransactionType = "expense" | "income";

export interface CreateExpensePayload {
  kind: TransactionType;
  purposeId: string;
  remark: string;
  amount: number;
  date: string;
  isRecurring: boolean;
  frequency?: string | null;
  endDate?: string | null;
  otherDetail?: string | null;
}

export interface CreatePurposePayload {
  name: string;
  icon?: string;
  appliesTo: "expense" | "income" | "both";
}

export interface PurposeItem {
  _id: string;
  name: string;
  icon: string;
  appliesTo: "expense" | "income" | "both";
  isDefault: boolean;
  key: string | null;
}

export interface TransactionItem {
  _id: string;
  kind: TransactionType;
  purposeId: string;
  remark: string;
  amount: number;
  date: string;
  isRecurring: boolean;
  frequency: string | null;
  endDate: string | null;
  otherDetail: string | null;
  createdAt: string;
}

export interface TransactionsResponse {
  transactions: TransactionItem[];
  summary: {
    expenseTotal: number;
    incomeTotal: number;
    net: number;
  };
}

// ── Purposes ──────────────────────────────────────────────────────────────

export const fetchPurposes = async (): Promise<PurposeItem[]> => {
  const res = await fetch("/api/expense/purpose");
  const json = await res.json();
  if (!res.ok) throw new Error(json?.error || "Failed to fetch purposes");
  // Response: { status, data: { purposes: [...] } }
  return json?.data?.purposes ?? [];
};

export const createPurpose = async (
  payload: CreatePurposePayload,
): Promise<PurposeItem> => {
  const res = await fetch("/api/expense/purpose", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: payload.name,
      icon: payload.icon ?? "public",
      appliesTo: payload.appliesTo,
    }),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json?.error || "Failed to create purpose");
  // Response: { status, data: { purpose: {...} } }
  return json?.data?.purpose;
};

export const updatePurpose = async (
  id: string,
  payload: Partial<CreatePurposePayload>,
): Promise<PurposeItem> => {
  const res = await fetch(`/api/expense/purpose/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      ...(payload.name ? { name: payload.name } : {}),
      ...(payload.icon ? { icon: payload.icon } : {}),
      ...(payload.appliesTo ? { appliesTo: payload.appliesTo } : {}),
    }),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json?.error || "Failed to update purpose");
  // Response: { status, data: { purpose: {...} } }
  return json?.data?.purpose;
};

export const deletePurpose = async (id: string): Promise<void> => {
  const res = await fetch(`/api/expense/purpose/${id}`, {
    method: "DELETE",
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json?.error || "Failed to delete purpose");
};

// ── Transactions ──────────────────────────────────────────────────────────

export const fetchTransactions = async (
  month: number,
  year: number,
): Promise<TransactionsResponse> => {
  const res = await fetch(`/api/expense?month=${month}&year=${year}`);
  const json = await res.json();
  if (!res.ok) throw new Error(json?.error || "Failed to fetch transactions");
  // Response: { status, data: { transactions: [...], summary: {...} } }
  return {
    transactions: json?.data?.transactions ?? [],
    summary: json?.data?.summary ?? { expenseTotal: 0, incomeTotal: 0, net: 0 },
  };
};

/**
 * Fetch transactions across multiple months in parallel.
 * Returns a flat list of all transactions from the given month/year pairs.
 */
export const fetchTransactionsRange = async (
  months: { month: number; year: number }[],
): Promise<TransactionItem[]> => {
  const results = await Promise.all(
    months.map(({ month, year }) => fetchTransactions(month, year)),
  );
  return results.flatMap((r) => r.transactions);
};

export const createExpenseEntry = async (
  payload: CreateExpensePayload,
): Promise<void> => {
  const res = await fetch("/api/expense", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json?.error || "Failed to create transaction");
};
