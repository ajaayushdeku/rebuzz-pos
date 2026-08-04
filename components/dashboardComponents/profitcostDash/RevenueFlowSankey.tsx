"use client";

import { useEffect, useState } from "react";
import {
  ResponsiveContainer,
  Sankey,
  Tooltip,
  type SankeyNodeProps,
} from "recharts";

import { useCurrency } from "@/providers/CurrencyContext";
import { formatCurrencySymbol } from "@/utils/helper";
import LockDimFeactureOverlay from "@/components/LockDimFeactureOverlay";
import { ComponentHeader } from "@/components/ComponentHeader";
import { Waypoints } from "lucide-react";
import { getPurposeColor } from "@/providers/ExpenseContext";
import type { CustomTooltipProps } from "@/lib/types/chart";

interface FlowNode {
  id: string;
  name: string;
  color: string;
  /** Custom display value — recharts overwrites `value` with the sum of
   *  outgoing links, so we keep the real figure in a separate field. */
  displayValue?: number;
  /** Populated by recharts at render time. */
  value?: number;
}

interface SankeyLink {
  source: string;
  target: string;
  value: number;
}

interface PurposeInfo {
  _id: string;
  name: string;
  icon: string;
}

interface ExpenseByPurpose {
  purposeId: string;
  name: string;
  color: string;
  amount: number;
}

// ── Custom tooltip (matches GrossProfitTrendChart style) ──────────────────

const CustomTooltip = ({ active, payload, currency }: CustomTooltipProps) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white rounded-xl px-4 py-3 shadow-lg border border-gray-100">
      {payload.map((entry) => (
        <div
          key={entry.name}
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
            {formatCurrencySymbol(
              entry.value as number,
              currency.symbol,
              currency.locale,
            )}
          </span>
        </div>
      ))}
    </div>
  );
};

// ── Data fetching ──────────────────────────────────────────────────────────

/** First day of the current month as YYYY-MM-DD */
function monthStartStr(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  return `${y}-${m}-01`;
}

/** Today as YYYY-MM-DD */
function todayStr(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

interface SankeyData {
  /** Sales revenue only, from compare-sales-by-month */
  salesRevenue: number;
  /** Miscellaneous income from the expense ledger */
  miscIncome: number;
  /** salesRevenue + miscIncome */
  grossRevenue: number;
  netProfit: number;
  refunds: number;
  expensesByPurpose: ExpenseByPurpose[];
  isLoading: boolean;
  isError: boolean;
}

const EMPTY_DATA: SankeyData = {
  salesRevenue: 0,
  miscIncome: 0,
  grossRevenue: 0,
  netProfit: 0,
  refunds: 0,
  expensesByPurpose: [],
  isLoading: true,
  isError: false,
};

async function fetchSankeyData(): Promise<SankeyData> {
  const start = monthStartStr();
  const end = todayStr();
  const month = new Date().getMonth() + 1; // 1–12
  const year = new Date().getFullYear();

  // ── 1. compare-sales-by-month → gross revenue + net profit + refunds ──
  // Same endpoint used by GrossVsNetProfit (via /api/report/compare-sales/month)
  const compareRes = await fetch(
    `/api/report/compare-sales/month?startDate=${start}&endDate=${end}`,
    { cache: "no-store" },
  );
  const compareJson = compareRes.ok ? await compareRes.json() : null;
  const monthlyData = (compareJson?.data ?? []) as Record<string, unknown>[];
  const currentMonth =
    monthlyData.find((m) => {
      const s = String((m as { monthStart?: unknown }).monthStart ?? "");
      return s.startsWith(`${year}-${String(month).padStart(2, "0")}`);
    }) ?? {};
  const raw = currentMonth as Record<string, unknown>;

  const totalRevenue =
    Number((raw as { totalRevenue?: unknown }).totalRevenue ?? 0) || 0;
  const totalNetProfit =
    Number((raw as { totalNetProfit?: unknown }).totalNetProfit ?? 0) || 0;

  // Refunds — compare-sales-by-month may name the field differently. Try
  // the common variants; fall back to 0 if none is present.
  const refundField =
    (raw as { refundedAmount?: unknown }).refundedAmount ??
    (raw as { totalRefunds?: unknown }).totalRefunds ??
    (raw as { totalRefunded?: unknown }).totalRefunded ??
    (raw as { refunds?: unknown }).refunds ??
    0;
  const refunds = Number(refundField) || 0;

  // ── 2. Expense API → transactions (grouped by purpose) + income ──
  const [expenseRes, purposeRes] = await Promise.all([
    fetch(`/api/expense?month=${month}&year=${year}`, { cache: "no-store" }),
    fetch("/api/expense/purpose", { cache: "no-store" }),
  ]);

  const expenseJson = expenseRes.ok ? await expenseRes.json() : null;
  const transactions = (expenseJson?.data?.transactions ?? []) as {
    kind: string;
    purposeId: string;
    amount: number;
  }[];
  const summary = expenseJson?.data?.summary ?? {
    expenseTotal: 0,
    incomeTotal: 0,
    net: 0,
  };

  const miscIncome = Number(summary?.incomeTotal) || 0;

  // Purpose lookup: id → { name, icon }
  const purposeJson = purposeRes.ok ? await purposeRes.json() : null;
  const purposes = (purposeJson?.data?.purposes ?? []) as PurposeInfo[];
  const purposeMap = new Map(purposes.map((p) => [p._id, p]));

  // Group expense transactions by purpose
  const byPurpose = new Map<string, number>();
  for (const t of transactions) {
    if (t.kind !== "expense") continue;
    const amt = Number(t.amount) || 0;
    byPurpose.set(t.purposeId, (byPurpose.get(t.purposeId) ?? 0) + amt);
  }

  const expensesByPurpose: ExpenseByPurpose[] = Array.from(byPurpose.entries())
    .map(([purposeId, amount]) => {
      const p = purposeMap.get(purposeId);
      const name = p?.name ?? purposeId;
      return {
        purposeId,
        name,
        color: getPurposeColor(p?.icon ?? "", name),
        amount,
      };
    })
    .filter((e) => e.amount > 0)
    .sort((a, b) => b.amount - a.amount);

  const totalExpenses = expensesByPurpose.reduce((s, e) => s + e.amount, 0);

  // Gross revenue = sales revenue (compare-sales-by-month) + misc income
  const grossRevenue = totalRevenue + miscIncome;

  // Net profit = sales net profit + income − expenses
  let netProfit = totalNetProfit + miscIncome - totalExpenses;
  // Guard: net profit shouldn't exceed gross revenue
  netProfit = Math.max(0, Math.min(netProfit, grossRevenue));

  return {
    salesRevenue: totalRevenue,
    miscIncome,
    grossRevenue,
    netProfit,
    refunds,
    expensesByPurpose,
    isLoading: false,
    isError: false,
  };
}

// ── Node / link builders ──────────────────────────────────────────────────

const GROSS_ID = "gross";

const buildNodes = (
  grossRevenue: number,
  miscIncome: number,
  netProfit: number,
  expensesByPurpose: ExpenseByPurpose[],
  refunds: number,
): FlowNode[] => [
  {
    id: GROSS_ID,
    // The left node covers both revenue streams once misc income exists.
    name: miscIncome > 0 ? "Gross Revenue + Misc. Income" : "Gross Revenue",
    color: "#3B82F6",
    // Keep the real gross revenue in a custom field — recharts overwrites
    // `value` with the sum of outgoing links, so we can't rely on it.
    displayValue: grossRevenue,
  },
  ...(netProfit > 0
    ? [{ id: "profit", name: "Net Profit", color: "#10B981" }]
    : []),
  ...expensesByPurpose.map((e) => ({
    id: `exp-${e.purposeId}`,
    name: e.name,
    color: e.color,
  })),
  // A zero-value node still renders a label, so drop it entirely.
  ...(refunds > 0
    ? [{ id: "refunds", name: "Refunds", color: "#F43F5E" }]
    : []),
];

const buildLinks = (
  netProfit: number,
  expensesByPurpose: ExpenseByPurpose[],
  refunds: number,
): SankeyLink[] =>
  [
    { source: GROSS_ID, target: "profit", value: netProfit },
    ...expensesByPurpose.map((e) => ({
      source: GROSS_ID,
      target: `exp-${e.purposeId}`,
      value: e.amount,
    })),
    { source: GROSS_ID, target: "refunds", value: refunds },
  ].filter((l) => l.value > 0);

export default function RevenueFlowSankey() {
  const { currency } = useCurrency();
  const [data, setData] = useState<SankeyData>(EMPTY_DATA);

  useEffect(() => {
    let active = true;
    fetchSankeyData()
      .then((result) => {
        if (active) setData(result);
      })
      .catch(() => {
        if (active)
          setData((prev) => ({ ...prev, isLoading: false, isError: true }));
      });
    return () => {
      active = false;
    };
  }, []);

  const fmt = (v: number) =>
    formatCurrencySymbol(v, currency.symbol, currency.locale);

  const nodes = buildNodes(
    data.grossRevenue,
    data.miscIncome,
    data.netProfit,
    data.expensesByPurpose,
    data.refunds,
  );
  const links = buildLinks(
    data.netProfit,
    data.expensesByPurpose,
    data.refunds,
  );

  const idToIndex = new Map(nodes.map((n, i) => [n.id, i]));
  const sankeyData = {
    nodes: nodes.map((n) => ({ ...n })),
    links: links.map((l) => ({
      source: idToIndex.get(l.source) ?? 0,
      target: idToIndex.get(l.target) ?? 0,
      value: l.value,
    })),
  };

  // Every node except Gross Revenue sits in the right-hand column, so the
  // chart has to grow with them or the labels collide.
  const rightNodeCount = Math.max(nodes.length - 1, 1);
  const chartHeight = Math.max(420, rightNodeCount * 58 + 90);

  const grossRevenue = data.grossRevenue;

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 w-full relative select-none">
      {/* Lock overlay */}
      {/* <LockDimFeactureOverlay component_name="Revenue Flow Sankey" /> */}

      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-cyan-50 flex items-center justify-center shrink-0">
            <Waypoints size={15} className="text-cyan-600" />
          </div>
          <ComponentHeader
            title="Revenue Flow (Sankey Diagram)"
            subHeader="Visualizing how Gross Revenue distributes into expenses and Net Profit"
          />
        </div>
      </div>

      {data.isLoading ? (
        <div className="h-[520px] flex items-center justify-center text-sm text-gray-400">
          Loading revenue flow…
        </div>
      ) : data.isError || grossRevenue <= 0 ? (
        <div className="h-[520px] flex flex-col items-center justify-center text-sm text-gray-400">
          <Waypoints size={28} className="text-gray-300 mb-2" />
          {data.isError
            ? "Failed to load revenue flow data"
            : " No revenue data for this month yet."}
        </div>
      ) : (
        <div className="rounded-xl" style={{ height: chartHeight }}>
          <ResponsiveContainer width="100%" height="100%">
            <Sankey
              data={sankeyData}
              nodePadding={40}
              nodeWidth={9}
              margin={{
                top: 20,
                right: 190,
                left: 30,
                bottom: 24,
              }}
              linkCurvature={0.5}
              iterations={64}
              node={(props: SankeyNodeProps) => {
                const { x, y, width, height, payload } = props;
                const node = payload as unknown as FlowNode;
                const isGross = node.id === GROSS_ID;
                const midY = y + height / 2;

                // Capsule ends — matches the pill-shaped nodes in the design
                const radius = width / 2;

                return (
                  <g>
                    <rect
                      x={x}
                      y={y}
                      width={width}
                      height={Math.max(height, 3)}
                      rx={radius}
                      ry={radius}
                      fill={node.color}
                    />

                    <text
                      x={x + width + 12}
                      y={isGross && data.miscIncome > 0 ? midY - 10 : midY - 3}
                      fill="#1F2937"
                      fontSize={13.5}
                      fontWeight={600}
                    >
                      {node.name}
                    </text>

                    <text
                      x={x + width + 12}
                      y={isGross && data.miscIncome > 0 ? midY + 7 : midY + 13}
                      fill="#64748B"
                      fontSize={11.5}
                      style={{ fontVariantNumeric: "tabular-nums" }}
                    >
                      {fmt(node.displayValue ?? node.value ?? 0)}
                    </text>

                    {/* Gross Revenue shows how the total is composed */}
                    {isGross && data.miscIncome > 0 && (
                      <text
                        x={x + width + 12}
                        y={midY + 23}
                        fill="#94A3B8"
                        fontSize={10}
                        style={{ fontVariantNumeric: "tabular-nums" }}
                      >
                        {`${fmt(data.salesRevenue)} sales + ${fmt(
                          data.miscIncome,
                        )} income`}
                      </text>
                    )}
                  </g>
                );
              }}
              link={{
                stroke: "#717272",
                fill: "none",
                opacity: 0.45,
              }}
            >
              <Tooltip
                cursor={false}
                content={<CustomTooltip currency={currency} />}
              />
            </Sankey>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
