"use client";

import { useMemo, useState } from "react";
import { useCurrency } from "@/providers/CurrencyContext";
import { formatCurrencySymbol } from "@/utils/helper";
import { Trophy, Receipt, ChevronLeft, ChevronRight } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import type {
  NameType,
  Payload,
  ValueType,
} from "recharts/types/component/DefaultTooltipContent";

interface TaxableItem {
  name: string;
  totalTaxAmount: number;
  transactionCount: number;
}

interface ChartDatum {
  name: string;
  amount: number;
  count: number;
  rank: number;
}

const PAGE_SIZE = 5;
const CHART_COLORS = ["#3B82F6", "#60A5FA", "#93C5FD", "#BFDBFE"];
const TOP_COLOR = "#F59E0B";

const colorForRank = (rank: number, idx: number): string =>
  rank === 0 ? TOP_COLOR : CHART_COLORS[idx % CHART_COLORS.length];

const CustomTooltip = ({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Payload<ValueType, NameType>[];
}) => {
  const { currency } = useCurrency();
  if (!active || !payload?.length) return null;

  const item = payload[0].payload as ChartDatum;
  return (
    <div className="bg-white rounded-xl px-4 py-3 shadow-lg border border-gray-100 min-w-44">
      <div className="flex items-center gap-1.5 mb-2">
        <span className="text-[10px] font-bold text-gray-300">
          #{item.rank + 1}
        </span>
        <p className="text-xs font-semibold text-gray-700 truncate">
          {item.name}
        </p>
      </div>
      <div className="flex items-center justify-between gap-4 text-xs mb-1">
        <span className="text-gray-500">Tax generated</span>
        <span className="font-bold text-amber-600">
          {formatCurrencySymbol(item.amount, currency.symbol, currency.locale)}
        </span>
      </div>
      <div className="flex items-center justify-between gap-4 text-xs">
        <span className="text-gray-500">Order Counts</span>
        <span className="font-semibold text-gray-700">{item.count}</span>
      </div>
    </div>
  );
};

const HighestTaxGenerated = ({ data }: { data: TaxableItem[] }) => {
  const { currency } = useCurrency();
  const [page, setPage] = useState(0);

  const fmt = (v: number) =>
    formatCurrencySymbol(v, currency.symbol, currency.locale);

  // Highest tax-generating items first (all items, not just the top 5).
  const sorted = useMemo(
    () => [...data].sort((a, b) => b.totalTaxAmount - a.totalTaxAmount),
    [data],
  );

  // Reset to the first page whenever the dataset changes (e.g. date filter).
  // Render-time reset avoids a setState-in-effect cascade; `sorted` is stable
  // (memoized on `data`) so this only fires when the data actually changes.
  const [prevSorted, setPrevSorted] = useState(sorted);
  if (prevSorted !== sorted) {
    setPrevSorted(sorted);
    setPage(0);
  }

  const { totalTax, totalTransactions } = useMemo(
    () => ({
      totalTax: sorted.reduce((sum, i) => sum + i.totalTaxAmount, 0),
      totalTransactions: sorted.reduce((sum, i) => sum + i.transactionCount, 0),
    }),
    [sorted],
  );

  const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages - 1);

  // Chart data for the current page, carrying the global rank + transactions.
  const chartData = useMemo<ChartDatum[]>(
    () =>
      sorted
        .slice(safePage * PAGE_SIZE, safePage * PAGE_SIZE + PAGE_SIZE)
        .map((item, idx) => ({
          name: item.name,
          amount: item.totalTaxAmount,
          count: item.transactionCount,
          rank: safePage * PAGE_SIZE + idx,
        })),
    [sorted, safePage],
  );

  if (sorted.length === 0) {
    return (
      <p className="text-xs text-gray-400 text-center py-8">
        No tax data available
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {/* Totals card — compact stat bar */}
      <div className=" px-3.5 py-2.5 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="min-w-0">
            <p className="text-[10px] uppercase tracking-wide text-gray-400 font-medium">
              Total tax Generated
            </p>
            <p className="text-base font-bold text-gray-800 truncate">
              {fmt(totalTax)}
            </p>
          </div>
        </div>
        <div className="h-7 w-px bg-gray-100" />
        <div className="flex items-center gap-3 shrink-0">
          <div className="text-right">
            <p className="text-[10px] uppercase tracking-wide text-gray-400 font-medium">
              Items
            </p>
            <p className="text-sm font-bold text-gray-700">{sorted.length}</p>
          </div>
          <div className="hidden sm:block h-7 w-px bg-gray-100" />
          <div className="hidden sm:block text-right">
            <p className="text-[10px] uppercase tracking-wide text-gray-400 font-medium">
              Items Order Count
            </p>
            <p className="text-sm font-bold text-gray-700">
              {totalTransactions}
            </p>
          </div>
        </div>
      </div>

      {/* Horizontal bar chart (current page) */}
      <div style={{ height: Math.max(chartData.length * 40, 120) }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            layout="vertical"
            margin={{ top: 0, right: 10, left: 0, bottom: 0 }}
            barCategoryGap="20%"
          >
            <CartesianGrid
              horizontal={false}
              stroke="#f3f4f6"
              strokeDasharray="3 3"
            />
            <XAxis
              type="number"
              axisLine={false}
              tickLine={false}
              tick={{ fill: "#9ca3af", fontSize: 10 }}
              tickFormatter={(v: number) =>
                v >= 1000 ? `${(v / 1000).toFixed(0)}k` : `${v}`
              }
            />
            <YAxis
              dataKey="name"
              type="category"
              axisLine={false}
              tickLine={false}
              tick={{ fill: "#9ca3af", fontSize: 10 }}
              width={80}
              tickFormatter={(val: string) =>
                val.length > 10 ? val.slice(0, 9) + "…" : val
              }
            />
            <Tooltip
              content={<CustomTooltip />}
              cursor={{ fill: "rgba(0,0,0,0.03)" }}
            />
            <Bar dataKey="amount" name="Tax generated" radius={[0, 4, 4, 0]}>
              {chartData.map((d, index) => (
                <Cell key={index} fill={colorForRank(d.rank, index)} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-1 border-t border-gray-50">
          <button
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            disabled={safePage === 0}
            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              safePage === 0
                ? "text-gray-300 cursor-not-allowed"
                : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
            }`}
          >
            <ChevronLeft size={14} />
            Prev
          </button>
          <span className="text-xs text-gray-400 font-medium">
            Page {safePage + 1} of {totalPages} · {sorted.length} items
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
            disabled={safePage >= totalPages - 1}
            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              safePage >= totalPages - 1
                ? "text-gray-300 cursor-not-allowed"
                : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
            }`}
          >
            Next
            <ChevronRight size={14} />
          </button>
        </div>
      )}
    </div>
  );
};

export default HighestTaxGenerated;
