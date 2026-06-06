"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  ReactNode,
} from "react";

export type TransactionType = "expense" | "income";

export type Frequency = "daily" | "weekly" | "monthly" | "yearly";

export type Transaction = {
  id: string;
  type: TransactionType;
  purpose: string;
  remarks: string;
  amount: number;
  date: string;
  recurring: boolean;
  frequency?: Frequency;
  endDate?: string;
};

export const EXPENSE_PURPOSES = [
  "Clothing",
  "Education",
  "Entertainment",
  "Food & Drinks",
  "Gifts/Donations",
  "Grocery",
  "Health",
  "Housing",
  "Lending/Borrow",
  "Personal Care",
  "Transportation",
  "Utilities",
  "Others",
];

export const INCOME_PURPOSES = [
  "Freelance",
  "Gift Received",
  "Lending/Borrow",
  "Salary",
  "Business",
  "Investments",
  "Others",
];

export const PURPOSE_COLORS: Record<string, string> = {
  Clothing: "#f59e0b",
  Education: "#3b82f6",
  Entertainment: "#8b5cf6",
  "Food & Drinks": "#ef4444",
  "Gifts/Donations": "#ec4899",
  Grocery: "#10b981",
  Health: "#06b6d4",
  Housing: "#f97316",
  "Lending/Borrow": "#6366f1",
  "Personal Care": "#a78bfa",
  Transportation: "#14b8a6",
  Utilities: "#84cc16",
  Others: "#6b7280",
  Freelance: "#3b82f6",
  "Gift Received": "#ec4899",
  Salary: "#10b981",
  Business: "#f97316",
  Investments: "#8b5cf6",
};

type ExpenseTrackerContextType = {
  transactions: Transaction[];
  addTransaction: (t: Omit<Transaction, "id">) => void;
  deleteTransaction: (id: string) => void;
  updateTransaction: (id: string, t: Partial<Transaction>) => void;
  expensePurposes: string[];
  incomePurposes: string[];
  addPurpose: (type: TransactionType, purpose: string) => void;
  removePurpose: (type: TransactionType, purpose: string) => void;
};

const ExpenseTrackerContext = createContext<ExpenseTrackerContextType | null>(
  null,
);

const LS_TRANSACTIONS = "expense_tracker_transactions";
const LS_EXPENSE_PURPOSES = "expense_tracker_expense_purposes";
const LS_INCOME_PURPOSES = "expense_tracker_income_purposes";

/** Safe read from localStorage — returns null on SSR / error */
function readLS<T>(key: string): T | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(key);
    if (raw) return JSON.parse(raw) as T;
  } catch {}
  return null;
}

/** Lazy initialiser that reads from localStorage */
function initTransactions(): Transaction[] {
  return readLS<Transaction[]>(LS_TRANSACTIONS) ?? [];
}

function initPurposes(key: string, defaults: string[]): string[] {
  return readLS<string[]>(key) ?? defaults;
}

export function ExpenseTrackerProvider({ children }: { children: ReactNode }) {
  const [transactions, setTransactions] =
    useState<Transaction[]>(initTransactions);
  const [expensePurposes, setExpensePurposes] = useState<string[]>(() =>
    initPurposes(LS_EXPENSE_PURPOSES, EXPENSE_PURPOSES),
  );
  const [incomePurposes, setIncomePurposes] = useState<string[]>(() =>
    initPurposes(LS_INCOME_PURPOSES, INCOME_PURPOSES),
  );

  // Persist to localStorage whenever state changes
  useEffect(() => {
    localStorage.setItem(LS_TRANSACTIONS, JSON.stringify(transactions));
  }, [transactions]);

  useEffect(() => {
    localStorage.setItem(LS_EXPENSE_PURPOSES, JSON.stringify(expensePurposes));
  }, [expensePurposes]);

  useEffect(() => {
    localStorage.setItem(LS_INCOME_PURPOSES, JSON.stringify(incomePurposes));
  }, [incomePurposes]);

  const addTransaction = useCallback((t: Omit<Transaction, "id">) => {
    setTransactions((prev) => [{ ...t, id: crypto.randomUUID() }, ...prev]);
  }, []);

  const deleteTransaction = useCallback((id: string) => {
    setTransactions((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const updateTransaction = useCallback(
    (id: string, updates: Partial<Transaction>) => {
      setTransactions((prev) =>
        prev.map((t) => (t.id === id ? { ...t, ...updates } : t)),
      );
    },
    [],
  );

  const addPurpose = useCallback((type: TransactionType, purpose: string) => {
    if (type === "expense") setExpensePurposes((p) => [...p, purpose]);
    else setIncomePurposes((p) => [...p, purpose]);
  }, []);

  const removePurpose = useCallback(
    (type: TransactionType, purpose: string) => {
      if (type === "expense")
        setExpensePurposes((p) => p.filter((x) => x !== purpose));
      else setIncomePurposes((p) => p.filter((x) => x !== purpose));
    },
    [],
  );

  return (
    <ExpenseTrackerContext.Provider
      value={{
        transactions,
        addTransaction,
        deleteTransaction,
        updateTransaction,
        expensePurposes,
        incomePurposes,
        addPurpose,
        removePurpose,
      }}
    >
      {children}
    </ExpenseTrackerContext.Provider>
  );
}

export function useTracker() {
  const ctx = useContext(ExpenseTrackerContext);
  if (!ctx) throw new Error("useTracker must be used inside TrackerProvider");
  return ctx;
}
