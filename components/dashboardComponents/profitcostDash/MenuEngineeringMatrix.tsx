"use client";

import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Cell,
} from "recharts";
import {
  mockMenuEngineeringData,
  MENU_MATRIX_MIDPOINTS,
} from "@/lib/mockData/mock-profitcost-advanced";
import type { MenuCategory } from "@/lib/mockData/mock-profitcost-advanced";
import LockDimFeactureOverlay from "@/components/LockDimFeactureOverlay";
import { useCurrency } from "@/providers/CurrencyContext";
import { formatCurrencySymbol, formatCompactCurrency } from "@/utils/helper";
import { Grid2x2 } from "lucide-react";
import {
  AXIS_TICK,
  CHART_PALETTE,
  ChartCard,
  ChartLegend,
  ChartTooltipBox,
  yAxisTitle,
} from "../chartCard";

const CATEGORY_COLORS: Record<MenuCategory, string> = {
  Coffee: CHART_PALETTE.darkBlue,
  Food: "#f29900",
  Bakery: "#a142f4",
  Tea: "#34a853",
};

/**
 * The four quadrants' names, each in a soft tint of what the quadrant means:
 * stars green, puzzles blue, plowhorses amber, dogs red. Faint on purpose —
 * they label the ground the dots sit on, not the dots.
 */
const QUADRANTS = [
  { label: "Puzzles", position: "top-3 left-4", color: "#aecbfa" },
  { label: "Stars", position: "top-3 right-4", color: "#81c995" },
  { label: "Dogs", position: "bottom-3 left-4", color: "#f6aea9" },
  { label: "Plowhorses", position: "bottom-3 right-4", color: "#fdd663" },
];

type TooltipPayloadItem = {
  payload: {
    name: string;
    category: MenuCategory;
    unitsSold: number;
    contributionMargin: number;
  };
};

const CustomTooltip = ({
  active,
  payload,
}: {
  active?: boolean;
  payload?: TooltipPayloadItem[];
}) => {
  const { currency } = useCurrency();
  if (!active || !payload?.length) return null;
  const d = payload[0]?.payload;
  const color = CATEGORY_COLORS[d.category];
  return (
    <ChartTooltipBox
      label={
        <>
          <span style={{ color: CHART_PALETTE.title }}>{d.name}</span>
          <span style={{ color: CHART_PALETTE.subtitle }}> · {d.category}</span>
        </>
      }
      rows={[
        { name: "Units sold", color, value: d.unitsSold },
        {
          name: "Margin",
          color,
          value: formatCurrencySymbol(
            d.contributionMargin,
            currency.symbol,
            currency.locale,
          ),
        },
      ]}
    />
  );
};

export default function MenuEngineeringMatrix() {
  const { currency } = useCurrency();
  const categories = Object.keys(CATEGORY_COLORS) as MenuCategory[];

  return (
    <ChartCard
      icon={Grid2x2}
      // Indigo, as before: Tailwind's indigo-600 / indigo-200 / indigo-50.
      iconColor="#4f46e5"
      iconBorder="#c7d2fe"
      iconBg="#eef2ff"
      title="Menu Engineering Matrix"
      subtitle="Popularity (Units Sold) vs Profitability (Contribution Margin)"
      // Clipped so the lock overlay follows the card's rounded corners.
      className="overflow-hidden select-none"
    >
      {/* Lock overlay — a direct child of the card, so it covers the header
          as well as the chart. */}
      <LockDimFeactureOverlay component_name="Menu Engineering Matrix" />

      <div className="relative">
        {/* Quadrant labels — positioned inside the chart's plotting area */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{ left: 80, right: 8, top: 8, bottom: 56 }}
        >
          {QUADRANTS.map((q) => (
            <span
              key={q.label}
              className={`absolute text-sm font-semibold ${q.position}`}
              style={{ color: q.color }}
            >
              {q.label}
            </span>
          ))}
        </div>

        <ResponsiveContainer width="100%" height={340}>
          <ScatterChart margin={{ top: 8, right: 8, left: 8, bottom: 8 }}>
            <CartesianGrid stroke={CHART_PALETTE.grid} />

            <XAxis
              type="number"
              dataKey="unitsSold"
              name="Units Sold"
              domain={[0, 1050]}
              ticks={[0, 250, 500, 750, 1000]}
              axisLine={false}
              tickLine={{ stroke: CHART_PALETTE.control }}
              tickSize={6}
              tick={AXIS_TICK}
              height={44}
              label={{
                value: "Units sold",
                position: "insideBottom",
                offset: 0,
                style: { fill: CHART_PALETTE.axis, fontSize: 12 },
              }}
            />

            <YAxis
              type="number"
              dataKey="contributionMargin"
              name="Margin ($)"
              domain={[0, 9]}
              ticks={[0, 2, 4, 6, 8]}
              tickFormatter={(v) =>
                formatCompactCurrency(v, currency.symbol, currency.locale)
              }
              axisLine={false}
              tickLine={false}
              tick={AXIS_TICK}
              width={72}
              label={yAxisTitle("Margin per item")}
            />

            {/* Quadrant dividers */}
            <ReferenceLine
              x={MENU_MATRIX_MIDPOINTS.unitsSold}
              stroke={CHART_PALETTE.control}
              strokeDasharray="4 3"
              strokeWidth={1.5}
            />
            <ReferenceLine
              y={MENU_MATRIX_MIDPOINTS.contributionMargin}
              stroke={CHART_PALETTE.control}
              strokeDasharray="4 3"
              strokeWidth={1.5}
            />

            <Tooltip
              content={<CustomTooltip />}
              cursor={{ strokeDasharray: "3 3", stroke: CHART_PALETTE.control }}
            />

            {categories.map((cat) => (
              <Scatter
                key={cat}
                name={cat}
                data={mockMenuEngineeringData.filter((d) => d.category === cat)}
                fill={CATEGORY_COLORS[cat]}
              >
                {mockMenuEngineeringData
                  .filter((d) => d.category === cat)
                  .map((_, i) => (
                    <Cell key={i} fill={CATEGORY_COLORS[cat]} />
                  ))}
              </Scatter>
            ))}
          </ScatterChart>
        </ResponsiveContainer>
      </div>

      <ChartLegend
        items={categories.map((cat) => ({
          label: cat,
          color: CATEGORY_COLORS[cat],
          shape: "dot" as const,
        }))}
      />
    </ChartCard>
  );
}
