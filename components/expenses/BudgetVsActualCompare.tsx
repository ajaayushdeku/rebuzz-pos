/**
 * BudgetVsActual — section heading, grouped horizontal bar chart and a
 * variance table. Self-contained: mock data, formatters, chart and table all
 * live in this file. No chart library, no hooks, so it works as a server
 * component.
 */

// ── Types ────────────────────────────────────────────────────────────────

type BudgetLine = {
  id: string;
  category: string;
  budget: number;
  actual: number;
};

// ── Mock data ────────────────────────────────────────────────────────────

export const budgetLines: BudgetLine[] = [
  {
    id: "food",
    category: "Food & ingredients",
    budget: 312_000,
    actual: 340_000,
  },
  { id: "wages", category: "Staff wages", budget: 268_000, actual: 260_000 },
  {
    id: "delivery",
    category: "Delivery commissions",
    budget: 86_000,
    actual: 95_000,
  },
  {
    id: "utilities",
    category: "Utilities & gas",
    budget: 40_000,
    actual: 45_000,
  },
  { id: "packaging", category: "Packaging", budget: 53_000, actual: 52_000 },
  {
    id: "marketing",
    category: "Marketing & ads",
    budget: 44_000,
    actual: 38_000,
  },
  { id: "rent", category: "Rent & rates", budget: 120_000, actual: 120_000 },
];

// ── Formatters ───────────────────────────────────────────────────────────

const inr = new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 });

/** 312000 -> "Rs 3,12,000" */
const formatRupees = (value: number) => `Rs ${inr.format(Math.round(value))}`;

/** 85000 -> "85k" */
const formatThousands = (value: number) => `${Math.round(value / 1000)}k`;

/**
 * Zero-based axis whose top tick is a round number.
 * niceScale(340000) -> { max: 340000, ticks: [0, 85000, 170000, 255000, 340000] }
 */
function niceScale(rawMax: number, steps = 4) {
  if (rawMax <= 0) return { max: steps, ticks: [0, steps] };

  const rough = rawMax / steps;
  const magnitude = 10 ** Math.floor(Math.log10(rough));
  const increment = magnitude / 2;
  const step = Math.ceil(rough / increment) * increment;
  const max = step * steps;

  return {
    max,
    ticks: Array.from({ length: steps + 1 }, (_, i) => i * step),
  };
}

const ACTUAL = "#2f6bed";
const BUDGET = "#cbd5e1";

// ── Section ──────────────────────────────────────────────────────────────

export default function BudgetVsActualCompare({
  lines = budgetLines,
}: {
  lines?: BudgetLine[];
}) {
  return (
    <section>
      <h2 className="text-xl font-bold tracking-tight text-slate-900">
        Budget vs actual
      </h2>
      <p className="mt-1 text-[15px] text-slate-500">
        How each category tracked against your monthly plan
      </p>

      <div className="mt-6 grid gap-6 lg:grid-cols-2 lg:items-start">
        <BudgetBarChart lines={lines} />
        <BudgetTable lines={lines} />
      </div>
    </section>
  );
}

// ── Bar chart ────────────────────────────────────────────────────────────

function BudgetBarChart({
  lines,
  title = "Budget vs actual at a glance",
  description = "Planned vs spent per category",
}: {
  lines: BudgetLine[];
  title?: string;
  description?: string;
}) {
  const rawMax = Math.max(...lines.flatMap((l) => [l.budget, l.actual]));
  const { max, ticks } = niceScale(rawMax);
  const width = (value: number) => `${(value / max) * 100}%`;

  return (
    <div className="rounded-2xl bg-white p-6 shadow-[0_1px_3px_rgba(15,23,42,0.06)] sm:p-7">
      <h3 className="text-lg font-bold tracking-tight text-slate-900">
        {title}
      </h3>
      <p className="mt-1 text-sm text-slate-500">{description}</p>

      <div className="mt-7">
        {lines.map((line) => (
          <div
            key={line.id}
            className="grid grid-cols-[84px_minmax(0,1fr)] items-center gap-x-4 py-2.5 sm:grid-cols-[110px_minmax(0,1fr)]"
          >
            <span className="text-right text-[13px] font-medium leading-tight text-slate-600">
              {line.category}
            </span>

            <div className="relative">
              {/* Gridlines overshoot the row so they read as continuous columns */}
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-y-[-10px] left-0 right-0"
              >
                {ticks.map((tick) => (
                  <span
                    key={tick}
                    className="absolute top-0 h-full border-l border-dashed border-slate-200"
                    style={{ left: `${(tick / max) * 100}%` }}
                  />
                ))}
              </div>

              <div className="relative flex flex-col gap-1.5">
                <Bar
                  width={width(line.budget)}
                  color={BUDGET}
                  label={`${line.category} budget ${formatRupees(line.budget)}`}
                />
                <Bar
                  width={width(line.actual)}
                  color={ACTUAL}
                  label={`${line.category} actual ${formatRupees(line.actual)}`}
                />
              </div>
            </div>
          </div>
        ))}

        {/* Axis */}
        <div className="grid grid-cols-[84px_minmax(0,1fr)] gap-x-4 sm:grid-cols-[110px_minmax(0,1fr)]">
          <span />
          <div className="relative h-6">
            {ticks.map((tick) => (
              <span
                key={tick}
                className="absolute top-2 -translate-x-1/2 text-xs font-medium text-slate-400"
                style={{ left: `${(tick / max) * 100}%` }}
              >
                {tick === 0 ? "0k" : formatThousands(tick)}
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-center gap-6">
        <LegendItem color={ACTUAL} label="Actual" strong />
        <LegendItem color={BUDGET} label="Budget" />
      </div>
    </div>
  );
}

function Bar({
  width,
  color,
  label,
}: {
  width: string;
  color: string;
  label: string;
}) {
  return (
    <div
      className="h-2.5 rounded-sm transition-[width] duration-500 ease-out motion-reduce:transition-none"
      style={{ width, backgroundColor: color }}
      role="img"
      aria-label={label}
    />
  );
}

function LegendItem({
  color,
  label,
  strong = false,
}: {
  color: string;
  label: string;
  strong?: boolean;
}) {
  return (
    <span className="flex items-center gap-2">
      <span
        className="h-3 w-3 rounded-[3px]"
        style={{ backgroundColor: color }}
      />
      <span
        className={`text-sm ${strong ? "font-semibold text-slate-700" : "font-medium text-slate-400"}`}
      >
        {label}
      </span>
    </span>
  );
}

// ── Table ────────────────────────────────────────────────────────────────

function BudgetTable({ lines }: { lines: BudgetLine[] }) {
  return (
    <div className="overflow-hidden rounded-2xl bg-white shadow-[0_1px_3px_rgba(15,23,42,0.06)]">
      <table className="w-full border-collapse text-left">
        <caption className="sr-only">
          Budget, actual spend and variance by category
        </caption>
        <thead>
          <tr className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
            <th scope="col" className="px-6 py-4 font-semibold">
              Category
            </th>
            <th scope="col" className="px-6 py-4 text-right font-semibold">
              Budget
            </th>
            <th scope="col" className="px-6 py-4 text-right font-semibold">
              Actual
            </th>
            <th scope="col" className="px-6 py-4 text-right font-semibold">
              Variance
            </th>
          </tr>
        </thead>
        <tbody>
          {lines.map((line) => (
            <tr key={line.id} className="border-t border-slate-100">
              <th
                scope="row"
                className="px-6 py-4 text-[15px] font-medium text-slate-800"
              >
                {line.category}
              </th>
              <td className="px-6 py-4 text-right text-[15px] text-slate-500">
                {formatRupees(line.budget)}
              </td>
              <td className="px-6 py-4 text-right text-[15px] font-semibold text-slate-900">
                {formatRupees(line.actual)}
              </td>
              <td className="px-6 py-4 text-right">
                <VariancePill budget={line.budget} actual={line.actual} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/** Variance is derived from the row, never stored. */
function VariancePill({ budget, actual }: { budget: number; actual: number }) {
  const delta = actual - budget;

  if (delta === 0) {
    return (
      <span className="inline-flex items-center rounded-full bg-slate-100 px-3 py-1.5 text-[13px] font-medium text-slate-500">
        on budget
      </span>
    );
  }

  const over = delta > 0;

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[13px] font-semibold ${
        over ? "bg-red-50 text-red-600" : "bg-emerald-50 text-emerald-700"
      }`}
    >
      {over ? <CaretUpIcon /> : <CheckIcon />}
      {formatRupees(Math.abs(delta))} {over ? "over" : "under"}
    </span>
  );
}

function CaretUpIcon() {
  return (
    <svg
      viewBox="0 0 12 12"
      aria-hidden="true"
      className="h-3 w-3"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M2 8l4-4 4 4" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg
      viewBox="0 0 12 12"
      aria-hidden="true"
      className="h-3 w-3"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M2 6.5l2.5 2.5L10 3.5" />
    </svg>
  );
}
