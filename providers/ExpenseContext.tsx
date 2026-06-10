"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useRef,
  type ReactNode,
} from "react";

// ── Types ─────────────────────────────────────────────────────────────────

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
  createdAt: string;
};

type PurposeStore = {
  expense: string[];
  income: string[];
};

type TrackerContextValue = {
  transactions: Transaction[];
  expensePurposes: string[];
  incomePurposes: string[];
  isLoading: boolean;
  addTransaction: (t: Omit<Transaction, "id" | "createdAt">) => Promise<void>;
  updateTransaction: (id: string, patch: Partial<Transaction>) => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>;
  addPurpose: (type: TransactionType, name: string) => Promise<void>;
  removePurpose: (type: TransactionType, name: string) => Promise<void>;
};

// ── Default purposes ──────────────────────────────────────────────────────

const DEFAULT_PURPOSES: PurposeStore = {
  expense: [
    "Rent",
    "Utilities",
    "Groceries",
    "Salary",
    "Marketing",
    "Supplies",
    "Transport",
    "Maintenance",
  ],
  income: ["Sales", "Service", "Consultation", "Refund", "Investment", "Other"],
};

// ── Purpose colors ────────────────────────────────────────────────────────

export const PURPOSE_COLORS: Record<string, string> = {
  Rent: "#ef4444",
  Utilities: "#f97316",
  Groceries: "#eab308",
  Salary: "#6366f1",
  Marketing: "#8b5cf6",
  Supplies: "#14b8a6",
  Transport: "#3b82f6",
  Maintenance: "#f43f5e",
  Sales: "#22c55e",
  Service: "#10b981",
  Consultation: "#0ea5e9",
  Refund: "#a78bfa",
  Investment: "#f59e0b",
  Other: "#6b7280",
};

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

// ── IndexedDB helpers ─────────────────────────────────────────────────────

const DB_NAME = "rebuzz_expense_tracker";
const DB_VERSION = 1;
const STORE_TRANSACTIONS = "transactions";
const STORE_PURPOSES = "purposes";

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);

    req.onupgradeneeded = (e) => {
      const db = (e.target as IDBOpenDBRequest).result;

      if (!db.objectStoreNames.contains(STORE_TRANSACTIONS)) {
        const store = db.createObjectStore(STORE_TRANSACTIONS, {
          keyPath: "id",
        });
        store.createIndex("type", "type", { unique: false });
        store.createIndex("date", "date", { unique: false });
        store.createIndex("createdAt", "createdAt", { unique: false });
      }

      if (!db.objectStoreNames.contains(STORE_PURPOSES)) {
        db.createObjectStore(STORE_PURPOSES, { keyPath: "id" });
      }
    };

    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

// Generic read all from a store
function dbGetAll<T>(db: IDBDatabase, storeName: string): Promise<T[]> {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, "readonly");
    const req = tx.objectStore(storeName).getAll();
    req.onsuccess = () => resolve(req.result as T[]);
    req.onerror = () => reject(req.error);
  });
}

// Generic put (upsert)
function dbPut(
  db: IDBDatabase,
  storeName: string,
  value: unknown,
): Promise<void> {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, "readwrite");
    const req = tx.objectStore(storeName).put(value);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

// Generic delete by key
function dbDelete(
  db: IDBDatabase,
  storeName: string,
  key: string,
): Promise<void> {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, "readwrite");
    const req = tx.objectStore(storeName).delete(key);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

// ── Context ───────────────────────────────────────────────────────────────

const TrackerContext = createContext<TrackerContextValue | null>(null);

export function ExpenseTrackerProvider({ children }: { children: ReactNode }) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [purposes, setPurposes] = useState<PurposeStore>(DEFAULT_PURPOSES);
  const [isLoading, setIsLoading] = useState(true);
  const dbRef = useRef<IDBDatabase | null>(null);

  // ── Initialize DB and load data ─────────────────────────────────────────
  useEffect(() => {
    let mounted = true;

    async function init() {
      try {
        const db = await openDB();
        dbRef.current = db;

        // Load transactions sorted by createdAt desc
        const txns = await dbGetAll<Transaction>(db, STORE_TRANSACTIONS);
        txns.sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
        );

        // Load purposes (stored as { id: "purposes", expense: [...], income: [...] })
        const purposeRows = await dbGetAll<{ id: string } & PurposeStore>(
          db,
          STORE_PURPOSES,
        );
        const savedPurposes = purposeRows.find((r) => r.id === "purposes");

        if (mounted) {
          setTransactions(txns);
          if (savedPurposes) {
            setPurposes({
              expense: savedPurposes.expense,
              income: savedPurposes.income,
            });
            // Pre-assign colors for saved purposes
            [...savedPurposes.expense, ...savedPurposes.income].forEach(
              getOrAssignColor,
            );
          }
          setIsLoading(false);
        }
      } catch (err) {
        console.error("IndexedDB init error:", err);
        if (mounted) setIsLoading(false);
      }
    }

    init();
    return () => {
      mounted = false;
    };
  }, []);

  // ── Persist purposes helper ─────────────────────────────────────────────
  const savePurposes = useCallback(async (next: PurposeStore) => {
    const db = dbRef.current;
    if (!db) return;
    await dbPut(db, STORE_PURPOSES, { id: "purposes", ...next });
  }, []);

  // ── addTransaction ──────────────────────────────────────────────────────
  const addTransaction = useCallback(
    async (t: Omit<Transaction, "id" | "createdAt">) => {
      const db = dbRef.current;
      if (!db) return;

      const newTxn: Transaction = {
        ...t,
        id: crypto.randomUUID(),
        createdAt: new Date().toISOString(),
      };

      await dbPut(db, STORE_TRANSACTIONS, newTxn);
      setTransactions((prev) => [newTxn, ...prev]);
    },
    [],
  );

  // ── updateTransaction ───────────────────────────────────────────────────
  const updateTransaction = useCallback(
    async (id: string, patch: Partial<Transaction>) => {
      const db = dbRef.current;
      if (!db) return;

      setTransactions((prev) => {
        const updated = prev.map((t) => (t.id === id ? { ...t, ...patch } : t));
        // Persist the updated record
        const record = updated.find((t) => t.id === id);
        if (record) dbPut(db, STORE_TRANSACTIONS, record).catch(console.error);
        return updated;
      });
    },
    [],
  );

  // ── deleteTransaction ───────────────────────────────────────────────────
  const deleteTransaction = useCallback(async (id: string) => {
    const db = dbRef.current;
    if (!db) return;

    await dbDelete(db, STORE_TRANSACTIONS, id);
    setTransactions((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // ── addPurpose ──────────────────────────────────────────────────────────
  const addPurpose = useCallback(
    async (type: TransactionType, name: string) => {
      getOrAssignColor(name);
      setPurposes((prev) => {
        const next = {
          ...prev,
          [type]: prev[type].includes(name)
            ? prev[type]
            : [...prev[type], name],
        };
        savePurposes(next).catch(console.error);
        return next;
      });
    },
    [savePurposes],
  );

  // ── removePurpose ───────────────────────────────────────────────────────
  const removePurpose = useCallback(
    async (type: TransactionType, name: string) => {
      setPurposes((prev) => {
        const next = {
          ...prev,
          [type]: prev[type].filter((p) => p !== name),
        };
        savePurposes(next).catch(console.error);
        return next;
      });
    },
    [savePurposes],
  );

  return (
    <TrackerContext.Provider
      value={{
        transactions,
        expensePurposes: purposes.expense,
        incomePurposes: purposes.income,
        isLoading,
        addTransaction,
        updateTransaction,
        deleteTransaction,
        addPurpose,
        removePurpose,
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
