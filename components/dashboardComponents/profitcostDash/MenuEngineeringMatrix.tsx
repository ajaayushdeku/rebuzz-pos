"use client";

import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
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
import { formatCompactNumber, formatCurrencySymbol } from "@/utils/helper";
import { ComponentHeader } from "@/components/ComponentHeader";

const CATEGORY_COLORS: Record<MenuCategory, string> = {
  Coffee: "#3b82f6",
  Food: "#f97316",
  Bakery: "#a78bfa",
  Tea: "#10b981",
};

const QUADRANT_LABELS = [
  { label: "Stars", x: "right", y: "top", color: "#10b981" },
  { label: "Puzzles", x: "left", y: "top", color: "#93c5fd" },
  { label: "Plowhorses", x: "right", y: "bottom", color: "#fbbf24" },
  { label: "Dogs", x: "left", y: "bottom", color: "#f87171" },
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
  return (
    <div className="bg-white border border-gray-100 rounded-xl px-3 py-2.5 shadow-lg text-xs">
      <p className="font-semibold text-gray-800 mb-1">{d.name}</p>
      <p className="text-gray-500">{d.category}</p>
      <div className="mt-1 space-y-0.5">
        <p>
          <span className="text-gray-400">Units sold:</span>{" "}
          <span className="font-semibold">{d.unitsSold}</span>
        </p>
        <p>
          <span className="text-gray-400">Margin:</span>{" "}
          <span className="font-semibold">
            {formatCurrencySymbol(
              d.contributionMargin,
              currency.symbol,
              currency.locale,
            )}
          </span>
        </p>
      </div>
    </div>
  );
};

const CustomLegend = () => (
  <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-1.5 mt-3">
    {Object.entries(CATEGORY_COLORS).map(([cat, color]) => (
      <div key={cat} className="flex items-center gap-1.5">
        <span
          className="w-2.5 h-2.5 rounded-full shrink-0"
          style={{ backgroundColor: color }}
        />
        <span className="text-xs text-gray-500">{cat}</span>
      </div>
    ))}
  </div>
);

export default function MenuEngineeringMatrix() {
  const { currency } = useCurrency();
  const categories = Object.keys(CATEGORY_COLORS) as MenuCategory[];

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 w-full relative select-none">
      {/* Lock overlay */}
      <LockDimFeactureOverlay component_name="Menu Engineering Matrix" />

      {/* Header */}
      <div className="mb-6">
        <ComponentHeader
          title="Menu Engineering Matrix"
          subHeader="Popularity (Units Sold) vs Profitability (Contribution Margin)"
        />
      </div>

      <div className="relative">
        {/* Quadrant labels — positioned absolutely inside the chart area */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ left: 45, right: 8, top: 8, bottom: 48 }}
        >
          <span className="absolute top-3 left-4 text-sm font-bold text-blue-200">
            Puzzles
          </span>
          <span className="absolute top-3 right-4 text-sm font-bold text-emerald-300">
            Stars
          </span>
          <span className="absolute bottom-3 left-4 text-sm font-bold text-red-200">
            Dogs
          </span>
          <span className="absolute bottom-3 right-4 text-sm font-bold text-amber-300">
            Plowhorses
          </span>
        </div>

        <ResponsiveContainer width="100%" height={340}>
          <ScatterChart margin={{ top: 10, right: 10, left: 0, bottom: 10 }}>
            <CartesianGrid stroke="#f3f4f6" />

            <XAxis
              type="number"
              dataKey="unitsSold"
              name="Units Sold"
              domain={[0, 1050]}
              ticks={[0, 250, 500, 750, 1000]}
              axisLine={false}
              tickLine={false}
              tick={{ fill: "#9ca3af", fontSize: 11 }}
            />

            <YAxis
              type="number"
              dataKey="contributionMargin"
              name="Margin ($)"
              domain={[0, 9]}
              ticks={[0, 2, 4, 6, 8]}
              tickFormatter={(v) =>
                `${currency.symbol} ${formatCompactNumber(v)}`
              }
              axisLine={false}
              tickLine={false}
              tick={{ fill: "#9ca3af", fontSize: 11 }}
              width={38}
            />

            {/* Quadrant dividers */}
            <ReferenceLine
              x={MENU_MATRIX_MIDPOINTS.unitsSold}
              stroke="#e2e8f0"
              strokeDasharray="4 3"
              strokeWidth={1.5}
            />
            <ReferenceLine
              y={MENU_MATRIX_MIDPOINTS.contributionMargin}
              stroke="#e2e8f0"
              strokeDasharray="4 3"
              strokeWidth={1.5}
            />

            <Tooltip
              content={<CustomTooltip />}
              cursor={{ strokeDasharray: "3 3" }}
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

            <Legend content={<CustomLegend />} />
          </ScatterChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
