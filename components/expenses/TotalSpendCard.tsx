/**
 * TotalSpendCard — gradient hero card with a spend sparkline.
 * Self-contained: mock data, formatters and the chart all live in this file.
 * No chart library, no hooks, so it works as a server component.
 */

// ── Types ────────────────────────────────────────────────────────────────

type TrendPoint = {
  /** Short axis label, e.g. "Sep" */
  label: string;
  /** Amount in rupees */
  value: number;
};

type SpendSummary = {
  periodLabel: string;
  total: number;
  /** Percent change vs the previous period; negative means spend fell */
  changePercent: number;
  netProfit: number;
  marginPercent: number;
  trend: TrendPoint[];
};

// ── Mock data ────────────────────────────────────────────────────────────

export const spendSummary: SpendSummary = {
  periodLabel: "February 2026",
  total: 980_000,
  changePercent: 6.2,
  netProfit: 215_000,
  marginPercent: 18,
  trend: [
    { label: "Sep", value: 820_000 },
    { label: "Oct", value: 840_000 },
    { label: "Nov", value: 880_000 },
    // Dec and Jan both round to 9.2L but Jan is genuinely higher,
    // which is why the line keeps climbing between them.
    { label: "Dec", value: 918_000 },
    { label: "Jan", value: 924_000 },
    { label: "Feb", value: 980_000 },
  ],
};

// ── Formatters ───────────────────────────────────────────────────────────

const inr = new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 });

/** 980000 -> "Rs 9,80,000" */
const formatRupees = (value: number) => `Rs ${inr.format(Math.round(value))}`;

/** 980000 -> "9.8L" */
const formatLakh = (value: number) =>
  `${(value / 100_000).toFixed(1).replace(/\.0$/, "")}L`;

/** 6.2 -> "6.2%" */
const formatPercent = (value: number) =>
  `${value.toFixed(1).replace(/\.0$/, "")}%`;

// ── Card ─────────────────────────────────────────────────────────────────

export default function TotalSpendCard({
  summary = spendSummary,
}: {
  summary?: SpendSummary;
}) {
  const { periodLabel, total, changePercent, netProfit, marginPercent, trend } =
    summary;
  const isUp = changePercent >= 0;

  return (
    <section
      className="overflow-hidden rounded-[28px] p-7 text-white shadow-[0_20px_45px_-24px_rgba(52,76,220,0.75)] sm:p-9"
      style={{
        backgroundImage:
          "linear-gradient(135deg, #2f6bec 0%, #3f4fe4 52%, #4a33d8 100%)",
      }}
    >
      <div className="flex flex-col gap-8 lg:flex-row lg:items-center lg:gap-12">
        <div className="lg:w-[320px] lg:shrink-0">
          <p className="text-[15px] font-medium text-white/75">
            Total spend · {periodLabel}
          </p>

          <p className="mt-2 text-[44px] font-extrabold leading-none tracking-tight sm:text-[52px]">
            {formatRupees(total)}
          </p>

          <p className="mt-4 flex items-center gap-2 text-[15px] font-semibold">
            <TrendArrow up={isUp} />
            {formatPercent(Math.abs(changePercent))} vs last month
          </p>

          <div className="mt-6 flex flex-wrap gap-3">
            <Pill>Net profit {formatRupees(netProfit)}</Pill>
            <Pill>{marginPercent}% margin</Pill>
          </div>
        </div>

        <div className="min-w-0 flex-1">
          <SpendTrendChart data={trend} />
        </div>
      </div>
    </section>
  );
}

// ── Sparkline ────────────────────────────────────────────────────────────

/**
 * The series is plotted into a narrow band near the top of the frame rather
 * than on a zero baseline — the tinted area below is atmosphere, not data.
 * Widen BAND_HEIGHT to give the line more vertical room.
 */
const BAND_TOP = 10; // % from the top where the highest point sits
const BAND_HEIGHT = 9; // % of the frame the whole series spans

function SpendTrendChart({
  data,
  gradientId = "spend-trend-fill",
}: {
  data: TrendPoint[];
  /** Pass a unique id if more than one chart renders on a page — SVG defs are global. */
  gradientId?: string;
}) {
  const values = data.map((d) => d.value);
  const max = Math.max(...values);
  const min = Math.min(...values);
  const span = max - min || 1;

  const points = data.map((point, i) => ({
    ...point,
    x: data.length === 1 ? 50 : (i / (data.length - 1)) * 100,
    y: BAND_TOP + ((max - point.value) / span) * BAND_HEIGHT,
  }));

  const line = points
    .map((p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(2)},${p.y.toFixed(2)}`)
    .join(" ");
  const area = `${line} L100,100 L0,100 Z`;

  return (
    <figure className="px-3">
      <figcaption className="sr-only">
        Monthly spend from {points[0]?.label} to{" "}
        {points[points.length - 1]?.label}
      </figcaption>

      <div className="relative h-[150px] w-full sm:h-[190px]">
        {/* preserveAspectRatio="none" lets the path stretch to any card width.
            Strokes stay even via vectorEffect; dots are HTML so they stay round. */}
        <svg
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          aria-hidden="true"
          className="absolute inset-0 h-full w-full"
        >
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#ffffff" stopOpacity="0.02" />
            </linearGradient>
          </defs>

          <path d={area} fill={`url(#${gradientId})`} />
          <path
            d={line}
            fill="none"
            stroke="#ffffff"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            vectorEffect="non-scaling-stroke"
          />
        </svg>

        {points.map((point) => (
          <div
            key={point.label}
            className="absolute h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white shadow-[0_0_0_3px_rgba(255,255,255,0.18)]"
            style={{ left: `${point.x}%`, top: `${point.y}%` }}
          >
            <span className="absolute bottom-4 left-1/2 -translate-x-1/2 whitespace-nowrap text-[13px] font-bold tracking-tight text-white">
              {formatLakh(point.value)}
            </span>
          </div>
        ))}
      </div>

      <div className="mt-1 flex justify-between">
        {points.map((point) => (
          <span
            key={point.label}
            className="text-[13px] font-medium text-white/65"
          >
            {point.label}
          </span>
        ))}
      </div>
    </figure>
  );
}

// ── Bits ─────────────────────────────────────────────────────────────────

function Pill({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-full bg-white/15 px-4 py-2 text-sm font-semibold text-white ring-1 ring-inset ring-white/10 backdrop-blur-sm">
      {children}
    </span>
  );
}

function TrendArrow({ up }: { up: boolean }) {
  return (
    <svg
      viewBox="0 0 16 16"
      aria-hidden="true"
      className={`h-4 w-4 ${up ? "" : "rotate-90"}`}
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M4 12 12 4" />
      <path d="M6 4h6v6" />
    </svg>
  );
}
