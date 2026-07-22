"use client";

export interface VatSummary {
  collected: number;
  inputVat: number;
  refund: number;
  payable: number;
  dueDate: string;
}

export interface VatStat {
  id: string;
  title: string;
  amount: number;
  change: number;
  trend: "up" | "down";
  chartColor: "green" | "red" | "blue";
  sparkline: number[];
  /** Shown on hover to explain what the card represents. */
  description: string;
}

interface MiniTrendChartProps {
  data: number[];
  color?: "green" | "red" | "blue";
  className?: string;
}

export const vatSummary: VatSummary = {
  collected: 156000,
  inputVat: 54600,
  refund: 1950,
  payable: 99450,
  dueDate: "25 Falgun 2082",
};

export const vatStats: VatStat[] = [
  {
    id: "sales",
    title: "Total Sales",
    amount: 1500000,
    change: 12.4,
    trend: "up",
    chartColor: "green",
    sparkline: [18, 19, 19, 20, 22, 24, 23, 26, 28, 29],
    description:
      "Total revenue this month before any deductions. Higher sales means more VAT to collect and remit.",
  },
  {
    id: "collected",
    title: "VAT Collected",
    amount: 156000,
    change: 8.5,
    trend: "down",
    chartColor: "red",
    sparkline: [25, 26, 27, 28, 29, 28, 27, 29, 30, 30],
    description:
      "VAT you charged customers at 13%. This money belongs to IRD — you're holding it on their behalf.",
  },
  {
    id: "purchase",
    title: "VAT Paid On Purchases",
    amount: 54600,
    change: 2.1,
    trend: "up",
    chartColor: "green",
    sparkline: [16, 16, 16, 16, 16, 18, 16, 20, 20, 20],
    description: "2.1% vs last month",
  },
  {
    id: "payable",
    title: "Net VAT Payable",
    amount: 99450,
    change: 11.2,
    trend: "down",
    chartColor: "red",
    sparkline: [20, 21, 22, 23, 24, 24, 23, 26, 26, 26],
    description:
      "What you actually owe IRD = Output VAT − Input VAT − Refunds. This is your real tax bill.",
  },
];

const colors = {
  green: {
    stroke: "#10B981",
    glow: "#D1FAE5",
  },
  red: {
    stroke: "#EF4444",
    glow: "#FEE2E2",
  },
  blue: {
    stroke: "#2563EB",
    glow: "#DBEAFE",
  },
};

export function generatePolyline(values: number[], width = 120, height = 42) {
  const max = Math.max(...values);
  const min = Math.min(...values);

  return values
    .map((v, i) => {
      const x = (i / (values.length - 1)) * width;
      const y = height - ((v - min) / (max - min || 1)) * height;

      return `${x},${y}`;
    })
    .join(" ");
}

export default function MiniTrendChart({
  data,
  color = "green",
  className = "",
}: MiniTrendChartProps) {
  const polyline = generatePolyline(data, 110, 34);

  const c = colors[color];

  return (
    <div
      className={`w-[80px] h-[40px] flex items-end justify-end ${className}`}
    >
      <svg width="110" height="42" viewBox="0 0 110 42" fill="none">
        <defs>
          <filter id={`shadow-${color}`}>
            <feDropShadow
              dx="0"
              dy="1"
              stdDeviation="1.5"
              floodColor={c.glow}
            />
          </filter>
        </defs>

        <polyline
          points={polyline}
          fill="none"
          stroke={c.stroke}
          strokeWidth="3.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          filter={`url(#shadow-${color})`}
        />
      </svg>
    </div>
  );
}
