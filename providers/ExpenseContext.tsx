"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
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

export function ExpenseTrackerProvider({ children }: { children: ReactNode }) {
  const [transactions, setTransactions] = useState<Transaction[]>([
    {
      id: "1",
      type: "expense",
      purpose: "Food & Drinks",
      remarks: "Lunch",
      amount: 450,
      date: "2026-05-20",
      recurring: false,
    },
    {
      id: "2",
      type: "expense",
      purpose: "Transportation",
      remarks: "Taxi",
      amount: 200,
      date: "2026-05-21",
      recurring: false,
    },
    {
      id: "3",
      type: "income",
      purpose: "Salary",
      remarks: "May salary",
      amount: 50000,
      date: "2026-05-01",
      recurring: true,
      frequency: "monthly",
    },
    {
      id: "4",
      type: "expense",
      purpose: "Grocery",
      remarks: "Weekly shop",
      amount: 1200,
      date: "2026-05-18",
      recurring: true,
      frequency: "weekly",
    },
    {
      id: "5",
      type: "income",
      purpose: "Freelance",
      remarks: "Logo design",
      amount: 8000,
      date: "2026-05-15",
      recurring: false,
    },
    {
      id: "6",
      type: "expense",
      purpose: "Health",
      remarks: "Doctor visit",
      amount: 800,
      date: "2026-05-14",
      recurring: false,
    },
    {
      id: "7",
      type: "expense",
      purpose: "Education",
      remarks: "Course fee",
      amount: 3000,
      date: "2026-05-10",
      recurring: false,
    },
    {
      id: "8",
      type: "expense",
      purpose: "Entertainment",
      remarks: "Movie night",
      amount: 600,
      date: "2026-05-22",
      recurring: false,
    },
  ]);

  const [expensePurposes, setExpensePurposes] = useState(EXPENSE_PURPOSES);
  const [incomePurposes, setIncomePurposes] = useState(INCOME_PURPOSES);

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
