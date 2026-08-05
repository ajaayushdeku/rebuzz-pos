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
  Banknote,
  HandCoins,
  CalendarDays,
  ChevronDown,
  type LucideIcon,
} from "lucide-react";

import { useCurrency } from "@/providers/CurrencyContext";
import { formatCurrencySymbol } from "@/utils/helper";
import { ComponentHeader } from "@/components/ComponentHeader";
import { getPurposeColor } from "@/providers/ExpenseContext";
import { getPurposeIcon } from "@/lib/purpose-icons";

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
  netRevenue: "net-revenue",
  profit: "profit",
  deficit: "deficit",
} as const;

const DEPTH = {
  source: 0,
  totalIncome: 1,
  split: 2,
  outcome: 3,
} as const;

const MAX_DEPTH = DEPTH.outcome;

const PALETTE = {
  incomeFill: "#86CBA3",
  incomeText: "#14532D",
  totalFill: "#15734A",
  totalText: "#FFFFFF",
  netRevenueFill: "#4E9E7A",
  netRevenueText: "#FFFFFF",
  refundsFill: "#F0952E",
  refundsText: "#FFFFFF",
  profitFill: "#4A7EBB",
  profitText: "#FFFFFF",
  deficitFill: "#DC2626",
  deficitText: "#FFFFFF",
};

const CHART_MARGIN = { top: 26, right: 172, left: 14, bottom: 26 };
const NODE_WIDTH = 22;

interface FlowStages {
  grossRevenue: number;
  miscIncome: number;
  totalIncome: number;
  refunds: number;
  netRevenue: number;
  expenses: number;
  netProfit: number;
  refundsCapped: boolean;
}

function computeStages(data: SankeyData): FlowStages {
  const grossRevenue = Math.max(0, data.grossRevenue);
  const miscIncome = Math.max(0, data.miscIncome);
  const totalIncome = grossRevenue + miscIncome;

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
  fmt: (v: number) => string,
): { nodes: FlowNode[]; links: SankeyLink[] } {
  const nodes: FlowNode[] = [];
  const links: SankeyLink[] = [];

  const pct = (v: number) =>
    s.totalIncome > 0 ? `${((v / s.totalIncome) * 100).toFixed(1)}%` : "—";

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

  if (s.refunds > 0) {
    nodes.push({
      id: NODE_IDS.refunds,
      name: "Refunds",
      color: PALETTE.refundsFill,
      onFill: PALETTE.refundsText,
      depth: DEPTH.split,
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

  if (s.netRevenue > 0) {
    nodes.push({
      id: NODE_IDS.netRevenue,
      name: "Net Revenue",
      color: PALETTE.netRevenueFill,
      onFill: PALETTE.netRevenueText,
      depth: DEPTH.split,
      icon: Banknote,
      displayValue: s.netRevenue,
      share: pct(s.netRevenue),
      caption: s.refunds > 0 ? `after ${fmt(s.refunds)} refunds` : undefined,
    });
    links.push({
      source: NODE_IDS.totalIncome,
      target: NODE_IDS.netRevenue,
      value: s.netRevenue,
    });
  }

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
      source: NODE_IDS.netRevenue,
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

  if (s.netProfit >= 0) {
    for (const e of expensesByPurpose) {
      links.push({
        source: NODE_IDS.netRevenue,
        target: `exp-${e.purposeId}`,
        value: e.amount,
      });
    }
  } else {
    const shortfall = Math.abs(s.netProfit);
    const revenueShare = s.expenses > 0 ? s.netRevenue / s.expenses : 0;

    for (const e of expensesByPurpose) {
      const fromRevenue = e.amount * revenueShare;
      const fromDeficit = e.amount - fromRevenue;

      if (fromRevenue > 0) {
        links.push({
          source: NODE_IDS.netRevenue,
          target: `exp-${e.purposeId}`,
          value: fromRevenue,
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

    nodes.push({
      id: NODE_IDS.deficit,
      name: "Deficit",
      color: PALETTE.deficitFill,
      onFill: PALETTE.deficitText,
      depth: DEPTH.split,
      displayValue: shortfall,
      share: pct(shortfall),
      caption: "not covered by net revenue",
    });
  }

  return { nodes, links };
}

// ── Rendering ──────────────────────────────────────────────────────────────

interface LinkPayload {
  value?: number;
  source?: { color?: string };
  target?: { color?: string };
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

export default function RevenueFlowSankey() {
  const { currency } = useCurrency();
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [data, setData] = useState<SankeyData>(EMPTY_DATA);

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

  const fmt = (v: number) =>
    formatCurrencySymbol(v, currency.symbol, currency.locale);

  const stages = computeStages(data);
  const { nodes, links } = buildGraph(stages, data.expensesByPurpose, fmt);

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

  const lastColumnCount = Math.max(
    data.expensesByPurpose.length + (stages.netProfit > 0 ? 1 : 0),
    2,
  );
  const chartHeight = Math.max(600, lastColumnCount * 74 + 100);

  const currentYear = now.getFullYear();
  const years = Array.from({ length: 7 }, (_, i) => currentYear - 5 + i);

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 w-full relative select-none">
      <div className="mb-4">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-cyan-50 flex items-center justify-center shrink-0">
              <Waypoints size={15} className="text-cyan-600" />
            </div>
            <ComponentHeader
              title="Revenue Flow (Sankey Diagram)"
              subHeader="Income sources → Total Income → Refunds / Net Revenue → Expenses / Net Profit"
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
        <div className="h-[600px] flex items-center justify-center text-sm text-gray-400">
          Loading revenue flow…
        </div>
      ) : data.isError || stages.totalIncome <= 0 ? (
        <div className="h-[600px] flex flex-col items-center justify-center text-sm text-gray-400">
          <Waypoints size={28} className="text-gray-300 mb-2" />
          {data.isError
            ? "Failed to load revenue flow data"
            : " No revenue data for this month yet."}
        </div>
      ) : (
        <>
          <div className="overflow-x-auto">
            <div style={{ height: chartHeight, minWidth: 640 }}>
              <ResponsiveContainer width="100%" height="100%">
                <Sankey
                  data={sankeyData}
                  nodePadding={30}
                  nodeWidth={NODE_WIDTH}
                  margin={CHART_MARGIN}
                  linkCurvature={0.5}
                  iterations={64}
                  node={(props: SankeyNodeProps) => {
                    const { x, y, width, height, payload } = props;
                    const node = payload as unknown as FlowNode;

                    const rectH = Math.max(height, 15);
                    const midY = y + rectH / 2;

                    const Icon = node.icon;
                    const iconSize = Math.min(16, Math.max(10, rectH * 0.28));
                    const iconX = x + (width - iconSize) / 2;

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
                          height={rectH}
                          rx={7}
                          ry={7}
                          fill={node.color}
                        />

                        {Icon && (
                          <g
                            transform={`translate(${iconX}, ${midY - iconSize / 2})`}
                          >
                            <Icon
                              size={iconSize}
                              color="#f9f9f9"
                              strokeWidth={2.5}
                              opacity={0.9}
                            />
                          </g>
                        )}

                        <text
                          x={x + width + 55}
                          y={midY - 6}
                          fill="#374151"
                          fontSize={10}
                          fontWeight={600}
                          {...halo}
                        >
                          {node.name}
                        </text>
                        <text
                          x={x + width + 14}
                          y={midY + 6}
                          fill="#111827"
                          fontSize={10}
                          fontWeight={700}
                          style={{ fontVariantNumeric: "tabular-nums" }}
                          {...halo}
                        >
                          {fmt(node.displayValue ?? node.value ?? 0)}
                        </text>
                        {node.share && (
                          <text
                            x={x + width + 14}
                            y={midY - 6}
                            fill="#94A3B8"
                            fontSize={10}
                            style={{ fontVariantNumeric: "tabular-nums" }}
                            {...halo}
                          >
                            [{node.share}]
                          </text>
                        )}
                      </g>
                    );
                  }}
                  link={(linkProps: SankeyLinkRenderProps) => {
                    const {
                      sourceX,
                      sourceY,
                      sourceControlX,
                      targetX,
                      targetY,
                      targetControlX,
                      linkWidth,
                      index,
                      payload,
                    } = linkProps;

                    const sTop = sourceY - linkWidth / 2;
                    const sBottom = sourceY + linkWidth / 2;
                    const tTop = targetY - linkWidth / 2;
                    const tBottom = targetY + linkWidth / 2;

                    const d = [
                      `M${sourceX},${sTop}`,
                      `C${sourceControlX},${sTop} ${targetControlX},${tTop} ${targetX},${tTop}`,
                      `L${targetX},${tBottom}`,
                      `C${targetControlX},${tBottom} ${sourceControlX},${sBottom} ${sourceX},${sBottom}`,
                      "Z",
                    ].join(" ");

                    const gradientId = `flow-grad-${index}`;
                    const { source, target } = payload as LinkPayload;
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
                          fillOpacity={0.42}
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
        </>
      )}
    </div>
  );
}
