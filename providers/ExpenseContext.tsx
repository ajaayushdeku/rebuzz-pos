"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  fetchPurposes,
  createPurpose as apiCreatePurpose,
  updatePurpose as apiUpdatePurpose,
  deletePurpose as apiDeletePurpose,
  createExpenseEntry,
  fetchTransactions,
  type PurposeItem,
  type CreateExpensePayload,
  type CreatePurposePayload,
} from "@/services/apiExpense.client";
import toast from "react-hot-toast";

export type Budget = {
  id: string;
  purposeId: string;
  amount: number;
};

// ── Types ─────────────────────────────────────────────────────────────────

export type TransactionType = "expense" | "income";
export type Frequency = "daily" | "weekly" | "monthly" | "yearly";

export type Transaction = {
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
};

export type Summary = {
  expenseTotal: number;
  incomeTotal: number;
  net: number;
};

// ── Purpose Colors ────────────────────────────────────────────────────────

// Colors keyed by icon value (Material Design icon names from the API)
// and purpose name (for backward compatibility / custom purposes)
export const PURPOSE_COLORS: Record<string, string> = {
  // ── By icon value ──
  restaurant: "#f97316",
  shopping_cart: "#22c55e",
  card_giftcard: "#a855f7",
  lightbulb: "#f59e0b",
  directions_bus: "#3b82f6",
  movie: "#ec4899",
  person: "#f43f5e",
  checkroom: "#6366f1",
  monitor_heart: "#ef4444",
  home: "#14b8a6",
  school: "#8b5cf6",
  public: "#6b7280",
  work: "#10b981",
  desktop: "#06b6d4",
  local_cafe: "#b45309",
  camera: "#7c3aed",
  directions_car: "#2563eb",
  pedal_bike: "#16a34a",
  flight: "#0ea5e9",
  music: "#db2777",
  smartphone: "#4f46e5",
  book: "#7c3aed",
  favorite: "#e11d48",
  sports_esports: "#9333ea",
  pie_chart: "#d97706",
  // ── By purpose name (matching default purposes from the API) ──
  "Food And Drinks": "#f97316",
  Grocery: "#22c55e",
  "Gifts/Donations": "#a855f7",
  Utilities: "#f59e0b",
  Transportation: "#3b82f6",
  Entertainment: "#ec4899",
  "Personal Care": "#f43f5e",
  Clothing: "#6366f1",
  Health: "#ef4444",
  Housing: "#14b8a6",
  Education: "#8b5cf6",
  Others: "#6b7280",
  Salary: "#10b981",
  Freelance: "#06b6d4",
  "Gift Received": "#a855f7",
};

// Resolve the color for a purpose: try icon value first, then name, then fallback
export function getPurposeColor(icon: string, name: string): string {
  const iconKey = (icon || "").toLowerCase();
  if (PURPOSE_COLORS[iconKey]) return PURPOSE_COLORS[iconKey];
  if (PURPOSE_COLORS[name]) return PURPOSE_COLORS[name];
  return "#6b7280";
}

const COLOR_POOL = [
  "#ef4444",
  "#f97316",
  "#eab308",
  "#22c55e",
  "#14b8a6",
  "#3b82f6",
  "#6366f1",
  "#8b5cf6",
  "#ec4899",
  "#f43f5e",
  "#0ea5e9",
  "#10b981",
  "#a78bfa",
  "#fb923c",
  "#4ade80",
  "#34d399",
  "#60a5fa",
  "#c084fc",
];

let colorIndex = Object.keys(PURPOSE_COLORS).length;

export function getOrAssignColor(name: string): string {
  if (!PURPOSE_COLORS[name]) {
    PURPOSE_COLORS[name] = COLOR_POOL[colorIndex % COLOR_POOL.length];
    colorIndex++;
  }
  return PURPOSE_COLORS[name];
}

type TrackerContextValue = {
  // Purposes
  expensePurposes: PurposeItem[];
  incomePurposes: PurposeItem[];
  allPurposes: PurposeItem[];
  isPurposesLoading: boolean;

  // Transactions
  transactions: Transaction[];
  summary: Summary;
  isLoading: boolean;

  // Budgets
  budgets: Budget[];
  addBudget: (budget: { purposeId: string; amount: number }) => Promise<void>;
  updateBudget: (
    id: string,
    updates: { purposeId?: string; amount?: number },
  ) => Promise<void>;
  deleteBudget: (id: string) => Promise<void>;

  // Month/year filter
  month: number;
  year: number;
  setMonth: (m: number) => void;
  setYear: (y: number) => void;

  // Actions
  addTransaction: (t: CreateExpensePayload) => Promise<void>;
  updateTransaction: (id: string, patch: Partial<Transaction>) => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>;
  addPurpose: (
    name: string,
    appliesTo: "expense" | "income" | "both",
    icon?: string,
  ) => Promise<void>;
  updatePurpose: (
    id: string,
    payload: Partial<CreatePurposePayload>,
  ) => Promise<void>;
  deletePurpose: (id: string) => Promise<void>;
  refetchTransactions: () => void;
};

const TrackerContext = createContext<TrackerContextValue | null>(null);

// ── Provider ──────────────────────────────────────────────────────────────

export function ExpenseTrackerProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());

  // ── Purposes ──────────────────────────────────────────────────────────
  const { data: allPurposes = [], isLoading: isPurposesLoading } = useQuery<
    PurposeItem[]
  >({
    queryKey: ["expense-purposes"],
    queryFn: fetchPurposes,
    staleTime: 10 * 60 * 1000,
  });

  const expensePurposes = allPurposes.filter(
    (p) => p.appliesTo === "expense" || p.appliesTo === "both",
  );
  const incomePurposes = allPurposes.filter(
    (p) => p.appliesTo === "income" || p.appliesTo === "both",
  );

  // ── Transactions ──────────────────────────────────────────────────────
  const {
    data: txData,
    isLoading: isTxLoading,
    refetch: refetchTransactions,
  } = useQuery({
    queryKey: ["expense-transactions", month, year],
    queryFn: () => fetchTransactions(month, year),
    staleTime: 2 * 60 * 1000,
  });

  const transactions: Transaction[] = txData?.transactions ?? [];
  const summary: Summary = txData?.summary ?? {
    expenseTotal: 0,
    incomeTotal: 0,
    net: 0,
  };

  // ── addTransaction mutation ───────────────────────────────────────────
  const addTransactionMutation = useMutation({
    mutationFn: createExpenseEntry,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["expense-transactions", month, year],
      });
    },
    onError: (err: Error) => {
      toast.error(err.message || "Failed to save transaction");
    },
  });

  const addTransaction = useCallback(
    async (payload: CreateExpensePayload) => {
      await addTransactionMutation.mutateAsync(payload);
    },
    [addTransactionMutation],
  );

  // ── updateTransaction mutation ────────────────────────────────────────
  const updateTransactionMutation = useMutation({
    mutationFn: async ({
      id,
      ...patch
    }: {
      id: string;
      kind?: TransactionType;
      purposeId?: string;
      remark?: string;
      amount?: number;
      date?: string;
      isRecurring?: boolean;
      frequency?: string | null;
      endDate?: string | null;
      otherDetail?: string | null;
    }) => {
      const response = await fetch(`/api/expense/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
      if (!response.ok) throw new Error("Failed to update transaction");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["expense-transactions", month, year],
      });
    },
    onError: (err: Error) => {
      toast.error(err.message || "Failed to update transaction");
    },
  });

  const updateTransaction = useCallback(
    async (id: string, patch: Partial<Transaction>) => {
      await updateTransactionMutation.mutateAsync({ id, ...patch });
    },
    [updateTransactionMutation],
  );

  // ── deleteTransaction mutation ────────────────────────────────────────
  const deleteTransactionMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/expense/${id}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Failed to delete transaction");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["expense-transactions", month, year],
      });
    },
    onError: (err: Error) => {
      toast.error(err.message || "Failed to delete transaction");
    },
  });

  const deleteTransaction = useCallback(
    async (id: string) => {
      await deleteTransactionMutation.mutateAsync(id);
    },
    [deleteTransactionMutation],
  );

  // ── addPurpose mutation ───────────────────────────────────────────────
  const addPurposeMutation = useMutation({
    mutationFn: ({
      name,
      appliesTo,
      icon,
    }: {
      name: string;
      appliesTo: "expense" | "income" | "both";
      icon?: string;
    }) => apiCreatePurpose({ name, appliesTo, icon }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["expense-purposes"] });
    },
    onError: (err: Error) => {
      toast.error(err.message || "Failed to create purpose");
    },
  });

  const addPurpose = useCallback(
    async (
      name: string,
      appliesTo: "expense" | "income" | "both",
      icon?: string,
    ) => {
      getOrAssignColor(name);
      await addPurposeMutation.mutateAsync({ name, appliesTo, icon });
    },
    [addPurposeMutation],
  );

  // ── updatePurpose mutation ───────────────────────────────────────────
  const updatePurposeMutation = useMutation({
    mutationFn: ({
      id,
      ...payload
    }: { id: string } & Partial<CreatePurposePayload>) =>
      apiUpdatePurpose(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["expense-purposes"] });
    },
    onError: (err: Error) => {
      toast.error(err.message || "Failed to update purpose");
    },
  });

  const updatePurpose = useCallback(
    async (id: string, payload: Partial<CreatePurposePayload>) => {
      await updatePurposeMutation.mutateAsync({ id, ...payload });
    },
    [updatePurposeMutation],
  );

  // ── deletePurpose mutation ───────────────────────────────────────────
  const deletePurposeMutation = useMutation({
    mutationFn: (id: string) => apiDeletePurpose(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["expense-purposes"] });
    },
    onError: (err: Error) => {
      toast.error(err.message || "Failed to delete purpose");
    },
  });

  const deletePurpose = useCallback(
    async (id: string) => {
      await deletePurposeMutation.mutateAsync(id);
    },
    [deletePurposeMutation],
  );

  // ── Budgets (localStorage) ───────────────────────────────────────────
  const BUDGETS_STORAGE_KEY = "rebuzz-budgets";

  const loadBudgetsFromStorage = (): Budget[] => {
    try {
      const raw = localStorage.getItem(BUDGETS_STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  };

  const saveBudgetsToStorage = (budgets: Budget[]) => {
    try {
      localStorage.setItem(BUDGETS_STORAGE_KEY, JSON.stringify(budgets));
    } catch {
      // Silently fail if storage is full
    }
  };

  const [budgets, setBudgets] = useState<Budget[]>(() =>
    loadBudgetsFromStorage(),
  );

  const addBudget = useCallback(
    async (budget: { purposeId: string; amount: number }) => {
      const newBudget: Budget = {
        id: crypto.randomUUID?.() ?? Date.now().toString(),
        purposeId: budget.purposeId,
        amount: budget.amount,
      };
      setBudgets((prev) => {
        const next = [...prev, newBudget];
        saveBudgetsToStorage(next);
        return next;
      });
    },
    [],
  );

  const updateBudget = useCallback(
    async (id: string, updates: { purposeId?: string; amount?: number }) => {
      setBudgets((prev) => {
        const next = prev.map((b) => (b.id === id ? { ...b, ...updates } : b));
        saveBudgetsToStorage(next);
        return next;
      });
    },
    [],
  );

  const deleteBudget = useCallback(async (id: string) => {
    setBudgets((prev) => {
      const next = prev.filter((b) => b.id !== id);
      saveBudgetsToStorage(next);
      return next;
    });
  }, []);

  return (
    <TrackerContext.Provider
      value={{
        expensePurposes,
        incomePurposes,
        allPurposes,
        isPurposesLoading,
        transactions,
        summary,
        isLoading: isTxLoading,
        budgets,
        addBudget,
        updateBudget,
        deleteBudget,
        month,
        year,
        setMonth,
        setYear,
        addTransaction,
        updateTransaction,
        deleteTransaction,
        addPurpose,
        updatePurpose,
        deletePurpose,
        refetchTransactions,
      }}
    >
      {children}
    </TrackerContext.Provider>
  );
}

export function useTracker() {
  const ctx = useContext(TrackerContext);
  if (!ctx)
    throw new Error("useTracker must be used inside ExpenseTrackerProvider");
  return ctx;
}
