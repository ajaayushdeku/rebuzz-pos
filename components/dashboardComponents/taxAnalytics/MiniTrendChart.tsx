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
  amount: number | null;
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
