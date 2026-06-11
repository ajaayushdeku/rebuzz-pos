"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import {
  ComposedChart,
  Area,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import SetTargetsModal from "./SetTargetsModal";
import SampleDataBadge from "@/components/ui/sampledatabadge";
import { CustomTooltipProps } from "@/lib/types/chart";
import { useCurrency } from "@/providers/CurrencyContext";
import { formatCurrency } from "@/utils/helper";

export interface TargetActualData {
  month: string;
  actual: number;
  target: number;
}

// ── IndexedDB config ──────────────────────────────────────────────────────

const DB_NAME = "rebuzz_growth";
const DB_VERSION = 1;
const STORE_TARGETS = "targets";

// ── IndexedDB helpers ─────────────────────────────────────────────────────

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);

    req.onupgradeneeded = (e) => {
      const db = (e.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_TARGETS)) {
        // Each record: { month: "Jan", target: 50000 }
        db.createObjectStore(STORE_TARGETS, { keyPath: "month" });
      }
    };

    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

function dbGetAll<T>(db: IDBDatabase, storeName: string): Promise<T[]> {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, "readonly");
    const req = tx.objectStore(storeName).getAll();
    req.onsuccess = () => resolve(req.result as T[]);
    req.onerror = () => reject(req.error);
  });
}

function dbPutAll(
  db: IDBDatabase,
  storeName: string,
  records: { month: string; target: number }[],
): Promise<void> {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, "readwrite");
    const store = tx.objectStore(storeName);
    for (const record of records) {
      store.put(record);
    }
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

// ── Chart helpers ─────────────────────────────────────────────────────────

const getYAxisTicks = (data: TargetActualData[]): number[] => {
  const max = Math.max(...data.flatMap((d) => [d.actual, d.target]), 1);
  const step = Math.ceil(max / 4 / 1000) * 1000 || 1000;
  return [0, step, step * 2, step * 3, step * 4];
};

const CustomTooltip = ({
  active,
  payload,
  label,
  currency,
}: CustomTooltipProps) => {
  if (!active || !payload?.length) return null;
  const actual = payload.find((p) => p.dataKey === "actual");
  const target = payload.find((p) => p.dataKey === "target");
  const variance =
    actual && target
      ? (actual.value as number) - (target.value as number)
      : null;

  return (
    <div className="bg-white rounded-xl px-4 py-3 shadow-lg border border-gray-100 min-w-40">
      <p className="text-gray-400 text-xs mb-2 font-medium">{label}</p>
      {payload.map((entry, idx) => (
        <div
          key={`${entry.name ?? "tip"}-${idx}`}
          className="flex items-center justify-between gap-4"
        >
          <div className="flex items-center gap-1.5">
            <span
              className="w-2 h-2 rounded-full shrink-0"
              style={{ backgroundColor: entry.color as string }}
            />
            <span className="text-xs text-gray-600">{entry.name}</span>
          </div>
          <span className="text-xs font-bold text-gray-800">
            {formatCurrency(entry.value as number, currency)}
          </span>
        </div>
      ))}
      {variance !== null && (
        <div className="border-t border-gray-100 mt-2 pt-2 flex justify-between">
          <span className="text-xs text-gray-400">Variance</span>
          <span
            className={`text-xs font-bold ${variance >= 0 ? "text-green-500" : "text-red-400"}`}
          >
            {variance >= 0 ? "+" : ""}
            {formatCurrency(variance, currency)}
          </span>
        </div>
      )}
    </div>
  );
};

const CustomLegend = () => (
  <div className="flex items-center justify-center gap-6 mt-2">
    <div className="flex items-center gap-1.5">
      <span className="w-2 h-2 rounded-full bg-blue-400" />
      <span className="text-xs font-semibold text-blue-500">Actual</span>
    </div>
    <div className="flex items-center gap-2">
      <svg width="20" height="8">
        <line
          x1="0"
          y1="4"
          x2="20"
          y2="4"
          stroke="#9ca3af"
          strokeWidth="2"
          strokeDasharray="4 3"
        />
      </svg>
      <span className="text-xs font-semibold text-gray-400">Target</span>
    </div>
  </div>
);

// ── Skeleton ──────────────────────────────────────────────────────────────

const ChartSkeleton = () => (
  <div className="animate-pulse space-y-3">
    <div className="h-4 bg-gray-200 rounded w-1/3" />
    <div className="h-3 bg-gray-200 rounded w-1/2" />
    <div className="h-72 bg-gray-100 rounded-xl mt-4" />
  </div>
);

// ── Main chart ────────────────────────────────────────────────────────────

export interface TargetVsActualProps {
  data: TargetActualData[];
}

export default function TargetVsActualChart({ data }: TargetVsActualProps) {
  const { currency } = useCurrency();
  const dbRef = useRef<IDBDatabase | null>(null);
  const [chartData, setChartData] = useState<TargetActualData[]>(data);
  const [isLoadingTargets, setIsLoadingTargets] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalVersion, setModalVersion] = useState(0);

  // ── Open DB and load saved targets on mount ───────────────────────────
  useEffect(() => {
    let mounted = true;

    async function loadTargets() {
      try {
        const db = await openDB();
        dbRef.current = db;

        const saved = await dbGetAll<{ month: string; target: number }>(
          db,
          STORE_TARGETS,
        );

        if (!mounted) return;

        if (saved.length > 0) {
          // Build a map: "Jan" → target value
          const targetMap = new Map(saved.map((r) => [r.month, r.target]));

          // Merge saved targets into server data
          setChartData(
            data.map((row) => ({
              ...row,
              target: targetMap.get(row.month) ?? row.target,
            })),
          );
        } else {
          setChartData(data);
        }
      } catch (err) {
        console.error("Failed to load targets from IndexedDB:", err);
        if (mounted) setChartData(data);
      } finally {
        if (mounted) setIsLoadingTargets(false);
      }
    }

    loadTargets();
    return () => {
      mounted = false;
    };
  }, []); // only on mount — intentionally not re-running on data change

  // ── When server data updates (navigation), merge with saved targets ───
  useEffect(() => {
    if (isLoadingTargets) return; // wait for DB load first
    const db = dbRef.current;
    if (!db) {
      setChartData(data);
      return;
    }

    dbGetAll<{ month: string; target: number }>(db, STORE_TARGETS)
      .then((saved) => {
        const targetMap = new Map(saved.map((r) => [r.month, r.target]));
        setChartData(
          data.map((row) => ({
            ...row,
            target: targetMap.get(row.month) ?? row.target,
          })),
        );
      })
      .catch(() => setChartData(data));
  }, [data]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Save targets to IndexedDB ─────────────────────────────────────────
  const handleSaveTargets = useCallback(async (updated: TargetActualData[]) => {
    setChartData(updated);

    const db = dbRef.current;
    if (!db) return;

    try {
      // Store each month as a separate record: { month, target }
      const records = updated.map(({ month, target }) => ({ month, target }));
      await dbPutAll(db, STORE_TARGETS, records);
    } catch (err) {
      console.error("Failed to save targets to IndexedDB:", err);
    }
  }, []);

  const isEmpty = chartData.every((d) => d.actual === 0 && d.target === 0);
  const formatYAxis = (value: number): string =>
    value >= 1000
      ? `${currency.symbol}${value / 1000}k`
      : formatCurrency(value, currency);
  const yTicks = getYAxisTicks(chartData);
  const yMax = yTicks[yTicks.length - 1] * 1.05;

  if (isLoadingTargets) {
    return (
      <div className="relative bg-white rounded-2xl border border-gray-100 shadow-sm p-6 w-full">
        <ChartSkeleton />
      </div>
    );
  }

  return (
    <>
      <div className="relative bg-white rounded-2xl border border-gray-100 shadow-sm p-6 w-full">
        {isEmpty && <SampleDataBadge />}

        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#60a5fa"
                strokeWidth="2"
              >
                <circle cx="12" cy="12" r="10" />
                <circle cx="12" cy="12" r="6" />
                <circle cx="12" cy="12" r="2" />
              </svg>
              <h1 className="text-[16px] md:text-xl mt-1 font-bold text-gray-900">
                Target vs Actual Revenue
              </h1>
            </div>
            <p className="text-sm mt-0.5 text-gray-400">
              Monthly performance against set targets
            </p>
          </div>

          <button
            onClick={() => {
              setModalOpen(true);
              setModalVersion((v) => v + 1);
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-blue-600 border border-blue-200 rounded-xl hover:bg-blue-50 transition-colors shrink-0"
          >
            <svg
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
            >
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
            </svg>
            Set Targets
          </button>
        </div>

        <ResponsiveContainer width="100%" height={300}>
          <ComposedChart
            data={chartData}
            margin={{ top: 10, right: 20, left: 10, bottom: 10 }}
          >
            <defs>
              <linearGradient id="actualGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#60a5fa" stopOpacity={0.2} />
                <stop offset="100%" stopColor="#60a5fa" stopOpacity={0.02} />
              </linearGradient>
            </defs>

            <CartesianGrid vertical={false} stroke="#f3f4f6" />
            <XAxis
              dataKey="month"
              axisLine={false}
              tickLine={false}
              tick={{ fill: "#9ca3af", fontSize: 12 }}
              dy={8}
            />
            <YAxis
              tickFormatter={formatYAxis}
              axisLine={false}
              tickLine={false}
              tick={{ fill: "#9ca3af", fontSize: 12 }}
              ticks={yTicks}
              domain={[0, yMax]}
              width={50}
            />
            <Tooltip content={<CustomTooltip currency={currency} />} />
            <Legend content={<CustomLegend />} />

            <Area
              type="monotone"
              dataKey="actual"
              name="Actual"
              stroke="#60a5fa"
              strokeWidth={2.5}
              fill="url(#actualGradient)"
              dot={{ r: 4, fill: "#60a5fa", stroke: "#fff", strokeWidth: 2 }}
              activeDot={{
                r: 6,
                fill: "#60a5fa",
                stroke: "#fff",
                strokeWidth: 2,
              }}
            />
            <Line
              type="monotone"
              dataKey="target"
              name="Target"
              stroke="#9ca3af"
              strokeWidth={2}
              strokeDasharray="6 4"
              dot={false}
              activeDot={{
                r: 4,
                fill: "#9ca3af",
                stroke: "#fff",
                strokeWidth: 2,
              }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      <SetTargetsModal
        key={modalVersion}
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        data={chartData}
        onSave={handleSaveTargets}
      />
    </>
  );
}
