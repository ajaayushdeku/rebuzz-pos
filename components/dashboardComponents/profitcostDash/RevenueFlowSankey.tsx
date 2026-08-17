"use client";

import { useEffect, useState, useRef } from "react";
import {
  ResponsiveContainer,
  Sankey,
  Tooltip,
  type SankeyNodeProps,
} from "recharts";
import {
  Waypoints,
  TrendingUp,
  PlusCircle,
  Wallet,
  RotateCcw,
  HandCoins,
  CalendarDays,
  ChevronDown,
  type LucideIcon,
  Loader2,
} from "lucide-react";

import { useCurrency } from "@/providers/CurrencyContext";
import { formatCurrencySymbol } from "@/utils/helper";
import { ComponentHeader } from "@/components/ComponentHeader";
import { getPurposeColor } from "@/providers/ExpenseContext";
import { getPurposeIcon } from "@/lib/purpose-icons";

interface NodeBox {
  y: number;
  h: number;
}

interface LinkBox {
  sTop: number;
  sBottom: number;
  tTop: number;
  tBottom: number;
}

interface FlowNode {
  id: string;
  name: string;
  color: string;
  onFill: string;
  depth: number;
  icon?: LucideIcon;
  displayValue?: number;
  share?: string;
  caption?: string;
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
  icon: string;
  color: string;
  amount: number;
}

// ── Date range ─────────────────────────────────────────────────────────────

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

/**
 * Build the date range for a given month/year. The compare-sales API expects
 * explicit start/end dates. For past months we pass the full calendar month
 * (1st → last day). For the current month, the end date is capped at today —
 * the API doesn't support future dates.
 */
function monthRange(month: number, year: number) {
  const mm = String(month).padStart(2, "0");
  const now = new Date();
  const isCurrentMonth =
    month === now.getMonth() + 1 && year === now.getFullYear();

  let endDay: number;
  if (isCurrentMonth) {
    endDay = now.getDate();
  } else {
    endDay = new Date(year, month, 0).getDate(); // 0 → last day of prev month
  }
  const dd = String(endDay).padStart(2, "0");

  return {
    startDate: `${year}-${mm}-01`,
    endDate: `${year}-${mm}-${dd}`,
  };
}

// ── Data fetching ──────────────────────────────────────────────────────────

interface SankeyData {
  grossRevenue: number;
  miscIncome: number;
  refunds: number;
  expensesByPurpose: ExpenseByPurpose[];
  isLoading: boolean;
  isError: boolean;
}

const EMPTY_DATA: SankeyData = {
  grossRevenue: 0,
  miscIncome: 0,
  refunds: 0,
  expensesByPurpose: [],
  isLoading: true,
  isError: false,
};

async function fetchSankeyData(
  month: number,
  year: number,
): Promise<SankeyData> {
  const { startDate, endDate } = monthRange(month, year);

  const compareRes = await fetch(
    `/api/report/compare-sales/month?startDate=${startDate}&endDate=${endDate}`,
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

  const grossRevenue =
    Number((raw as { totalRevenue?: unknown }).totalRevenue ?? 0) || 0;

  const refundField =
    (raw as { refundedAmount?: unknown }).refundedAmount ??
    (raw as { totalRefunds?: unknown }).totalRefunds ??
    (raw as { totalRefunded?: unknown }).totalRefunded ??
    (raw as { refunds?: unknown }).refunds ??
    0;
  const refunds = Number(refundField) || 0;

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

  const purposeJson = purposeRes.ok ? await purposeRes.json() : null;
  const purposes = (purposeJson?.data?.purposes ?? []) as PurposeInfo[];
  const purposeMap = new Map(purposes.map((p) => [p._id, p]));

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
        icon: p?.icon ?? "",
        color: getPurposeColor(p?.icon ?? "", name),
        amount,
      };
    })
    .filter((e) => e.amount > 0)
    .sort((a, b) => b.amount - a.amount);

  return {
    grossRevenue,
    miscIncome,
    refunds,
    expensesByPurpose,
    isLoading: false,
    isError: false,
  };
}

// ── Flow model ─────────────────────────────────────────────────────────────

const NODE_IDS = {
  gross: "gross",
  misc: "misc",
  totalIncome: "total-income",
  refunds: "refunds",
  profit: "profit",
  deficit: "deficit",
} as const;

/**
 * Three stages: income sources feed Total Income, which splits straight into
 * everything the money became.
 *
 *   Gross Revenue ┐
 *                 ├→ Total Income ┬→ Net Profit
 *   Misc. Income ─┘               ├→ each expense purpose
 *                                 └→ Refunds
 */
const DEPTH = {
  source: 0,
  totalIncome: 1,
  outcome: 2,
} as const;

const MAX_DEPTH = DEPTH.outcome;

const PALETTE = {
  incomeFill: "#86CBA3",
  incomeText: "#14532D",
  totalFill: "#15734A",
  totalText: "#FFFFFF",
  refundsFill: "#F0952E",
  refundsText: "#FFFFFF",
  profitFill: "#4A7EBB",
  profitText: "#FFFFFF",
  deficitFill: "#DC2626",
  deficitText: "#FFFFFF",
};

const CHART_MARGIN = { top: 20, right: 172, left: 14, bottom: 20 };
const NODE_WIDTH = 22;
const MIN_NODE_HEIGHT = 20;
const MAX_NODE_HEIGHT = 120;

/** Never let a column's nodes press against the top or bottom of the plot. */
const STAGE_PADDING = 10;
/** Floor and ceiling for the gap between neighbours in a column. */
const MIN_NODE_GAP = 20;
const MAX_NODE_GAP = 80;

interface FlowStages {
  grossRevenue: number;
  miscIncome: number;
  totalIncome: number;
  refunds: number;
  /** Income after refunds — the pot expenses and profit come out of. */
  netRevenue: number;
  expenses: number;
  netProfit: number;
  refundsCapped: boolean;
}

/**
 * Each figure is derived from the one before it, so the diagram balances by
 * construction:
 *
 *   grossRevenue + miscIncome           = totalIncome
 *   totalIncome − refunds − expenses    = netProfit
 */
function computeStages(data: SankeyData): FlowStages {
  const grossRevenue = Math.max(0, data.grossRevenue);
  const miscIncome = Math.max(0, data.miscIncome);
  const totalIncome = grossRevenue + miscIncome;

  // Refunds can't exceed what came in — that would leave nothing drawable.
  const rawRefunds = Math.max(0, data.refunds);
  const refunds = Math.min(rawRefunds, totalIncome);
  const netRevenue = totalIncome - refunds;

  const expenses = data.expensesByPurpose.reduce((s, e) => s + e.amount, 0);
  const netProfit = netRevenue - expenses;

  return {
    grossRevenue,
    miscIncome,
    totalIncome,
    refunds,
    netRevenue,
    expenses,
    netProfit,
    refundsCapped: rawRefunds > totalIncome,
  };
}

function buildGraph(
  s: FlowStages,
  expensesByPurpose: ExpenseByPurpose[],
): { nodes: FlowNode[]; links: SankeyLink[] } {
  const nodes: FlowNode[] = [];
  const links: SankeyLink[] = [];

  const pct = (v: number) =>
    s.totalIncome > 0 ? `${((v / s.totalIncome) * 100).toFixed(1)}%` : "—";

  // ── Stage 1 — income sources ──
  if (s.grossRevenue > 0) {
    nodes.push({
      id: NODE_IDS.gross,
      name: "Gross Revenue",
      color: PALETTE.incomeFill,
      onFill: PALETTE.incomeText,
      depth: DEPTH.source,
      icon: TrendingUp,
      displayValue: s.grossRevenue,
      share: pct(s.grossRevenue),
    });
    links.push({
      source: NODE_IDS.gross,
      target: NODE_IDS.totalIncome,
      value: s.grossRevenue,
    });
  }

  if (s.miscIncome > 0) {
    nodes.push({
      id: NODE_IDS.misc,
      name: "Misc. Income",
      color: PALETTE.incomeFill,
      onFill: PALETTE.incomeText,
      depth: DEPTH.source,
      icon: PlusCircle,
      displayValue: s.miscIncome,
      share: pct(s.miscIncome),
    });
    links.push({
      source: NODE_IDS.misc,
      target: NODE_IDS.totalIncome,
      value: s.miscIncome,
    });
  }

  // ── Stage 2 — total income ──
  nodes.push({
    id: NODE_IDS.totalIncome,
    name: "Total Income",
    color: PALETTE.totalFill,
    onFill: PALETTE.totalText,
    depth: DEPTH.totalIncome,
    icon: Wallet,
    displayValue: s.totalIncome,
    share: pct(s.totalIncome),
  });

  // ── Stage 3 — where the income ended up ──
  // Push order sets the column top-to-bottom: profit, purposes by size,
  // then refunds.
  if (s.netProfit > 0) {
    nodes.push({
      id: NODE_IDS.profit,
      name: "Net Profit",
      color: PALETTE.profitFill,
      onFill: PALETTE.profitText,
      depth: DEPTH.outcome,
      icon: HandCoins,
      displayValue: s.netProfit,
      share: pct(s.netProfit),
    });
    links.push({
      source: NODE_IDS.totalIncome,
      target: NODE_IDS.profit,
      value: s.netProfit,
    });
  }

  for (const e of expensesByPurpose) {
    nodes.push({
      id: `exp-${e.purposeId}`,
      name: e.name,
      color: e.color,
      onFill: "#FFFFFF",
      depth: DEPTH.outcome,
      icon: getPurposeIcon(e.icon, e.name),
      displayValue: e.amount,
      share: pct(e.amount),
    });
  }

  if (s.refunds > 0) {
    nodes.push({
      id: NODE_IDS.refunds,
      name: "Refunds",
      color: PALETTE.refundsFill,
      onFill: PALETTE.refundsText,
      depth: DEPTH.outcome,
      icon: RotateCcw,
      displayValue: s.refunds,
      share: pct(s.refunds),
    });
    links.push({
      source: NODE_IDS.totalIncome,
      target: NODE_IDS.refunds,
      value: s.refunds,
    });
  }

  // ── Expense links ──
  if (s.netProfit >= 0) {
    for (const e of expensesByPurpose) {
      links.push({
        source: NODE_IDS.totalIncome,
        target: `exp-${e.purposeId}`,
        value: e.amount,
      });
    }
  } else {
    // Loss: expenses outran what was left after refunds. The shortfall enters
    // as its own source rather than distorting any input. Nothing in the data
    // says which purpose went unfunded, so every purpose draws the same
    // proportion from income and the rest from the deficit.
    const shortfall = Math.abs(s.netProfit);
    const incomeShare = s.expenses > 0 ? s.netRevenue / s.expenses : 0;

    for (const e of expensesByPurpose) {
      const fromIncome = e.amount * incomeShare;
      const fromDeficit = e.amount - fromIncome;

      if (fromIncome > 0) {
        links.push({
          source: NODE_IDS.totalIncome,
          target: `exp-${e.purposeId}`,
          value: fromIncome,
        });
      }
      if (fromDeficit > 0) {
        links.push({
          source: NODE_IDS.deficit,
          target: `exp-${e.purposeId}`,
          value: fromDeficit,
        });
      }
    }

    // Sits beside Total Income — it feeds the outcome column the same way.
    nodes.push({
      id: NODE_IDS.deficit,
      name: "Deficit",
      color: PALETTE.deficitFill,
      onFill: PALETTE.deficitText,
      depth: DEPTH.totalIncome,
      displayValue: shortfall,
      share: pct(shortfall),
      caption: "not covered by income",
    });
  }

  return { nodes, links };
}

// ── Layout ─────────────────────────────────────────────────────────────────

/**
 * Positions every node and every ribbon end in one pass.
 *
 * Recharts sizes a Sankey node in proportion to its value and places links
 * against that geometry. Clamping the drawn rect breaks the contract — the
 * rect moves but the link endpoints don't — so both have to come from the
 * same numbers instead.
 *
 * Vertical rule, per column: nodes are sized, then centred as one block with
 * symmetric padding. The gap is uniform and derived from the room left over,
 * capped at MAX_NODE_GAP so a two-node column doesn't fling its nodes to
 * opposite ends. If even MIN_NODE_GAP won't fit, heights shrink together —
 * that floor is what makes overlap impossible at any node count.
 *
 * Horizontal position is decided in the node renderer, from the same `depth`
 * field — see the note on columnX.
 */
function computeLayout(
  nodes: FlowNode[],
  links: SankeyLink[],
  plotTop: number,
  plotHeight: number,
): { nodePos: Map<string, NodeBox>; linkPos: LinkBox[] } {
  const nodePos = new Map<string, NodeBox>();

  // ── Group by column, preserving the order nodes were built in ──
  const columns = new Map<number, FlowNode[]>();
  for (const node of nodes) {
    const col = columns.get(node.depth) ?? [];
    col.push(node);
    columns.set(node.depth, col);
  }

  const maxValue = Math.max(...nodes.map((n) => n.displayValue ?? 0), 1);
  // Room the collection may occupy once padding is reserved at both ends.
  const available = Math.max(1, plotHeight - STAGE_PADDING * 2);

  for (const col of columns.values()) {
    // Height still reads as value — just bounded, so a tiny expense stays
    // visible and a huge one doesn't swallow the column.
    let heights = col.map((n) => {
      const raw = ((n.displayValue ?? 0) / maxValue) * MAX_NODE_HEIGHT;
      return Math.min(MAX_NODE_HEIGHT, Math.max(MIN_NODE_HEIGHT, raw));
    });

    const count = col.length;

    if (count === 1) {
      // A lone node sits in the vertical middle of the plot.
      const h = Math.min(heights[0], available);
      nodePos.set(col[0].id, { y: plotTop + (plotHeight - h) / 2, h });
      continue;
    }

    let used = heights.reduce((a, b) => a + b, 0);
    let gap: number;

    if (used + (count - 1) * MIN_NODE_GAP > available) {
      // Doesn't fit even at the tightest spacing — shrink the whole column
      // proportionally and hold the gap at its floor.
      const room = Math.max(1, available - (count - 1) * MIN_NODE_GAP);
      const scale = room / used;
      heights = heights.map((h) => Math.max(4, h * scale));
      used = heights.reduce((a, b) => a + b, 0);
      gap = MIN_NODE_GAP;
    } else {
      // Spread into the space left over, but don't let two nodes drift to
      // opposite ends of a tall chart.
      gap = Math.min(MAX_NODE_GAP, (available - used) / (count - 1));
    }

    // Centre the whole collection; padding falls out of the centring.
    const blockHeight = used + gap * (count - 1);
    let y = plotTop + (plotHeight - blockHeight) / 2;

    col.forEach((node, i) => {
      nodePos.set(node.id, { y, h: heights[i] });
      y += heights[i] + gap;
    });
  }

  // ── Ribbon ends: each link takes a slice of its node's face ──
  const linkPos: LinkBox[] = links.map(() => ({
    sTop: 0,
    sBottom: 0,
    tTop: 0,
    tBottom: 0,
  }));

  const outgoing = new Map<string, number[]>();
  const incoming = new Map<string, number[]>();
  links.forEach((link, i) => {
    outgoing.set(link.source, [...(outgoing.get(link.source) ?? []), i]);
    incoming.set(link.target, [...(incoming.get(link.target) ?? []), i]);
  });

  // Order slices by where the other end sits, so ribbons don't cross.
  for (const [nodeId, indices] of outgoing) {
    const box = nodePos.get(nodeId);
    if (!box) continue;

    const ordered = [...indices].sort(
      (a, b) =>
        (nodePos.get(links[a].target)?.y ?? 0) -
        (nodePos.get(links[b].target)?.y ?? 0),
    );
    const total = indices.reduce((s, i) => s + links[i].value, 0) || 1;

    let offset = 0;
    for (const i of ordered) {
      const thickness = (links[i].value / total) * box.h;
      linkPos[i].sTop = box.y + offset;
      linkPos[i].sBottom = box.y + offset + thickness;
      offset += thickness;
    }
  }

  for (const [nodeId, indices] of incoming) {
    const box = nodePos.get(nodeId);
    if (!box) continue;

    const ordered = [...indices].sort(
      (a, b) =>
        (nodePos.get(links[a].source)?.y ?? 0) -
        (nodePos.get(links[b].source)?.y ?? 0),
    );
    const total = indices.reduce((s, i) => s + links[i].value, 0) || 1;

    let offset = 0;
    for (const i of ordered) {
      const thickness = (links[i].value / total) * box.h;
      linkPos[i].tTop = box.y + offset;
      linkPos[i].tBottom = box.y + offset + thickness;
      offset += thickness;
    }
  }

  return { nodePos, linkPos };
}

// ── Rendering ──────────────────────────────────────────────────────────────

/** Our custom node fields survive into the objects recharts hands back. */
interface LinkPayload {
  value?: number;
  source?: { color?: string; depth?: number };
  target?: { color?: string; depth?: number };
}

interface SankeyLinkRenderProps {
  sourceX: number;
  sourceY: number;
  sourceControlX: number;
  targetX: number;
  targetY: number;
  targetControlX: number;
  linkWidth: number;
  index: number;
  payload: unknown;
}

// ── Filter dropdown ────────────────────────────────────────────────────────

type Option = { value: number; label: string };

function FilterDropdown({
  value,
  options,
  onChange,
  widthClass = "w-[110px]",
}: {
  value: number;
  options: Option[];
  onChange: (v: number) => void;
  widthClass?: string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const onClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onClickOutside);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onClickOutside);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, []);

  const selected = options.find((o) => o.value === value);

  return (
    <div ref={ref} className={`relative ${widthClass}`}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between gap-1.5 rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-[13px] text-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 cursor-pointer transition"
      >
        <span className="truncate">{selected?.label ?? "—"}</span>
        <ChevronDown
          size={14}
          className={`shrink-0 text-gray-400 transition-transform duration-200 ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>

      <div
        className={`absolute z-30 mt-1 w-full origin-top rounded-md border border-gray-200 bg-white shadow-lg p-1 transition-all duration-200 ${
          open
            ? "opacity-100 scale-100 translate-y-0 pointer-events-auto"
            : "opacity-0 scale-95 -translate-y-1 pointer-events-none"
        }`}
      >
        {options.map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => {
              onChange(opt.value);
              setOpen(false);
            }}
            className={`w-full text-left px-2.5 py-1.5 text-[13px] rounded-md transition-colors cursor-pointer ${
              value === opt.value
                ? "bg-blue-50 text-blue-700 font-medium"
                : "text-gray-600 hover:bg-gray-100"
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}

// ── Component ──────────────────────────────────────────────────────────────

export default function RevenueFlowSankey() {
  const { currency } = useCurrency();
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [data, setData] = useState<SankeyData>(EMPTY_DATA);

  // Recharts' own X is unusable here: it aligns nodes by walking the link
  // graph, so a node with no incoming links (Deficit) lands in the first
  // column no matter what its depth says. Measure the plot and place the
  // columns ourselves.
  const chartRef = useRef<HTMLDivElement | null>(null);
  const [chartWidth, setChartWidth] = useState(0);

  useEffect(() => {
    let active = true;
    fetchSankeyData(month, year)
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
  }, [month, year]);

  useEffect(() => {
    const el = chartRef.current;
    if (!el) return;

    setChartWidth(el.getBoundingClientRect().width);

    const observer = new ResizeObserver(([entry]) => {
      setChartWidth(entry.contentRect.width);
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, [data.isLoading, data.isError]);

  const fmt = (v: number) =>
    formatCurrencySymbol(v, currency.symbol, currency.locale);

  const stages = computeStages(data);
  const { nodes, links } = buildGraph(stages, data.expensesByPurpose);

  if (
    process.env.NODE_ENV !== "production" &&
    !data.isLoading &&
    stages.refundsCapped
  ) {
    console.warn(
      `[RevenueFlowSankey] Refunds (${data.refunds}) exceed total income ` +
        `(${stages.totalIncome}) and were capped. Check whether ` +
        `totalRevenue is already net of refunds.`,
    );
  }

  const idToIndex = new Map(nodes.map((n, i) => [n.id, i]));
  const sankeyData = {
    nodes: nodes.map((n) => ({ ...n })),
    links: links.map((l) => ({
      source: idToIndex.get(l.source) ?? 0,
      target: idToIndex.get(l.target) ?? 0,
      value: l.value,
    })),
  };

  // The outcome column is the tallest: Net Profit, one node per expense
  // purpose, and Refunds. The chart has to grow with it.
  const lastColumnCount = Math.max(
    data.expensesByPurpose.length +
      (stages.netProfit > 0 ? 1 : 0) +
      (stages.refunds > 0 ? 1 : 0),
    2,
  );
  const chartHeight = Math.max(400, lastColumnCount * 50 + 70);

  // One layout drives both renderers below.
  const plotTop = CHART_MARGIN.top;
  const plotHeight = chartHeight - CHART_MARGIN.top - CHART_MARGIN.bottom;
  const { nodePos, linkPos } = computeLayout(nodes, links, plotTop, plotHeight);

  const plotWidth = Math.max(
    1,
    chartWidth - CHART_MARGIN.left - CHART_MARGIN.right,
  );

  /** Left edge of a column, from the node's declared depth. */
  const columnX = (depth: number) =>
    CHART_MARGIN.left +
    (MAX_DEPTH > 0 ? (depth / MAX_DEPTH) * (plotWidth - NODE_WIDTH) : 0);

  // Before the first measurement, fall back to recharts' geometry for a frame.
  const ownX = chartWidth > 0;

  const currentYear = now.getFullYear();
  const years = Array.from({ length: 7 }, (_, i) => currentYear - 5 + i);

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 w-full relative select-none">
      <div className="mb-4">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-cyan-50 flex items-center justify-center shrink-0">
              <Waypoints size={15} className="text-cyan-600" />
            </div>
            <ComponentHeader
              title="Revenue Flow (Sankey Diagram)"
              subHeader="Income sources → Total Income → Expenses / Refunds / Net Profit"
            />
          </div>

          {/* Month / Year filter */}
          <div className="flex items-center gap-1.5">
            <CalendarDays className="h-4 w-4 text-gray-400 shrink-0" />
            <FilterDropdown
              value={month}
              options={MONTHS.map((name, idx) => ({
                value: idx + 1,
                label: name,
              }))}
              onChange={setMonth}
              widthClass="w-[120px]"
            />
            <FilterDropdown
              value={year}
              options={years.map((y) => ({ value: y, label: String(y) }))}
              onChange={setYear}
              widthClass="w-[90px]"
            />
          </div>
        </div>
      </div>

      {data.isLoading ? (
        <div
          className="bg-white rounded-2xl border border-gray-100 shadow-sm p-16 flex flex-col items-center justify-center gap-3 text-gray-400"
          style={{ height: chartHeight }}
        >
          <Loader2 className="h-6 w-6 animate-spin" />
          <p className="text-sm"> Loading revenue flow…</p>
        </div>
      ) : data.isError || stages.totalIncome <= 0 ? (
        <div
          className="flex flex-col items-center justify-center text-sm text-gray-400"
          style={{ height: chartHeight }}
        >
          <Waypoints size={28} className="text-gray-300 mb-2" />
          {data.isError
            ? "Failed to load revenue flow data"
            : " No revenue data for this month yet."}
        </div>
      ) : (
        <div className="overflow-x-auto">
          <div ref={chartRef} style={{ height: chartHeight, minWidth: 440 }}>
            <ResponsiveContainer width="100%" height="100%">
              <Sankey
                data={sankeyData}
                nodePadding={20}
                nodeWidth={NODE_WIDTH}
                margin={CHART_MARGIN}
                linkCurvature={0.5}
                iterations={64}
                node={(props: SankeyNodeProps) => {
                  const { x: rechartsX, width: rechartsWidth, payload } = props;
                  const node = payload as unknown as FlowNode;

                  const box = nodePos.get(node.id);
                  if (!box) return <g />;

                  // Both axes derive from `node.depth`, so no node can be
                  // placed in a column it doesn't belong to.
                  const x = ownX ? columnX(node.depth) : rechartsX;
                  const width = ownX ? NODE_WIDTH : rechartsWidth;

                  const { y, h } = box;
                  const midY = y + h / 2;

                  const Icon = node.icon;
                  const iconSize = Math.min(16, Math.max(9, h * 0.6));
                  const showIcon = Boolean(Icon) && h >= 20;

                  const labelX = x + width + 14;

                  const halo = {
                    stroke: "#ffffff",
                    strokeWidth: 3,
                    paintOrder: "stroke" as const,
                    strokeLinejoin: "round" as const,
                  };

                  return (
                    <g>
                      <rect
                        x={x}
                        y={y}
                        width={width}
                        height={h}
                        rx={7}
                        ry={7}
                        fill={node.color}
                      />

                      {showIcon && Icon && (
                        <g
                          transform={`translate(${x + (width - iconSize) / 2}, ${
                            midY - iconSize / 2
                          })`}
                        >
                          <Icon
                            size={iconSize}
                            color="#ffffff"
                            strokeWidth={2.5}
                            opacity={0.95}
                          />
                        </g>
                      )}

                      {/* Name + share on one line, amount beneath it */}
                      <text
                        x={labelX}
                        y={midY - 4}
                        fill="#374151"
                        fontSize={11}
                        fontWeight={600}
                        {...halo}
                      >
                        {node.name}
                        {node.share && (
                          <tspan
                            fill="#94A3B8"
                            fontWeight={500}
                            style={{ fontVariantNumeric: "tabular-nums" }}
                          >
                            {"  "}
                            {node.share}
                          </tspan>
                        )}
                      </text>

                      <text
                        x={labelX}
                        y={midY + 11}
                        fill="#111827"
                        fontSize={11.5}
                        fontWeight={700}
                        style={{ fontVariantNumeric: "tabular-nums" }}
                        {...halo}
                      >
                        {fmt(node.displayValue ?? node.value ?? 0)}
                      </text>
                    </g>
                  );
                }}
                link={(linkProps: SankeyLinkRenderProps) => {
                  const { index, payload } = linkProps;

                  const box = linkPos[index];
                  if (!box) return <g />;

                  const { sTop, sBottom, tTop, tBottom } = box;
                  const { source, target } = (payload ?? {}) as LinkPayload;

                  // A ribbon leaves the right edge of its source column and
                  // meets the left edge of its target column — both derived
                  // from depth, like the nodes.
                  const sourceX = ownX
                    ? columnX(source?.depth ?? 0) + NODE_WIDTH
                    : linkProps.sourceX;
                  const targetX = ownX
                    ? columnX(target?.depth ?? MAX_DEPTH)
                    : linkProps.targetX;

                  // linkCurvature 0.5 puts both control points at the midpoint.
                  const midX = (sourceX + targetX) / 2;
                  const sourceControlX = ownX ? midX : linkProps.sourceControlX;
                  const targetControlX = ownX ? midX : linkProps.targetControlX;

                  const d = [
                    `M${sourceX},${sTop}`,
                    `C${sourceControlX},${sTop} ${targetControlX},${tTop} ${targetX},${tTop}`,
                    `L${targetX},${tBottom}`,
                    `C${targetControlX},${tBottom} ${sourceControlX},${sBottom} ${sourceX},${sBottom}`,
                    "Z",
                  ].join(" ");

                  const gradientId = `flow-grad-${index}`;
                  const from = source?.color ?? "#cbd5e1";
                  const to = target?.color ?? "#cbd5e1";

                  return (
                    <g key={`link-${index}`}>
                      <defs>
                        <linearGradient
                          id={gradientId}
                          x1={sourceX}
                          x2={targetX}
                          y1={0}
                          y2={0}
                          gradientUnits="userSpaceOnUse"
                        >
                          <stop offset="0%" stopColor={from} />
                          <stop offset="100%" stopColor={to} />
                        </linearGradient>
                      </defs>
                      <path
                        d={d}
                        fill={`url(#${gradientId})`}
                        fillOpacity={0.45}
                        stroke="none"
                      />
                    </g>
                  );
                }}
              >
                <Tooltip
                  cursor={false}
                  contentStyle={{
                    fontSize: 12,
                    borderRadius: 10,
                    border: "1px solid #e2e8f0",
                    boxShadow: "0 4px 16px -6px rgba(15,23,42,0.25)",
                  }}
                  formatter={(value) => fmt(Number(value ?? 0))}
                />
              </Sankey>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
}
