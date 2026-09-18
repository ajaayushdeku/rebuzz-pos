"use client";

import {
  Clock3,
  Layers,
  ListChecks,
  RefreshCw,
  Sparkles,
  Star,
  TriangleAlert,
  WandSparkles,
  type LucideIcon,
} from "lucide-react";

/** "10:42 AM", or "Sep 16, 10:42 AM" when it was not today. */
function updatedLabel(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  const sameDay = date.toDateString() === new Date().toDateString();
  return date.toLocaleString("en-US", {
    ...(sameDay ? {} : { month: "short", day: "numeric" }),
    hour: "numeric",
    minute: "2-digit",
  });
}

/**
 * One figure on the banner.
 *
 * The number stays in white ink; the small tinted icon carries what the
 * figure is about. Colouring the number itself made "3" in rose read as a
 * warning level rather than a count.
 */
function StatTile({
  icon: Icon,
  iconClassName,
  label,
  value,
  hint,
}: {
  icon: LucideIcon;
  /** Icon tile tint, e.g. "bg-rose-500/15 text-rose-300". */
  iconClassName: string;
  label: string;
  value: string | number;
  hint: string;
}) {
  return (
    // Stacked on a phone so three fit across; side by side once there is room.
    <div className="flex flex-col gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-3 sm:flex-row sm:items-start sm:gap-3 sm:px-3.5">
      <span
        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${iconClassName}`}
        aria-hidden
      >
        <Icon size={15} />
      </span>
      <div className="min-w-0">
        <dt className="text-[11px] font-medium text-slate-300">{label}</dt>
        <dd className="text-xl font-bold leading-tight tabular-nums text-white">
          {value}
        </dd>
        <p className="hidden truncate text-[11px] text-slate-400 sm:block">
          {hint}
        </p>
      </div>
    </div>
  );
}

/**
 * The summary banner at the top of the page.
 *
 * Every figure is derived from what is on the page below, not stored beside
 * it: dismissing a card lowers the insight count, dismissing a slow item
 * lowers that count, and starring a menu idea raises the shortlist. A banner
 * that kept saying "24 insights" after three were closed would be the first
 * thing on the page to stop being true.
 */
export default function AiInsightsHero({
  activeInsights,
  slowItems,
  shortlisted,
  liveSections,
  totalSections,
  lastUpdated,
  savedAnswers,
  isGenerating,
  onGenerate,
}: {
  activeInsights: number;
  /**
   * Slow items still on the page. This replaced an "estimated menu uplift",
   * which added up extra-revenue guesses for dishes that have never sold: no
   * figure the POS holds could back it.
   */
  slowItems: number;
  shortlisted: number;
  /** Sections generated from the business's own data. */
  liveSections: number;
  totalSections: number;
  /** The newest answer on the page, ISO. */
  lastUpdated?: string;
  /** Sections whose answer was today's saved one, at no cost. */
  savedAnswers: number;
  isGenerating: boolean;
  onGenerate: () => void;
}) {
  const connectedPct = Math.round((liveSections / totalSections) * 100);

  return (
    // `relative` anchors the screen-reader labels inside, for the reason given
    // in SalesRecommendationsSection: unanchored, they size the window.
    // `overflow-hidden` clips the glow to the card's rounded corners.
    <section className="relative overflow-hidden rounded-2xl bg-slate-900 mt-4 text-white shadow-sm">
      {/* Decoration only: a soft violet glow behind the heading. */}
      <div
        className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-violet-600/25 blur-3xl"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -bottom-28 left-1/3 h-56 w-56 rounded-full bg-emerald-500/10 blur-3xl"
        aria-hidden
      />

      <div className="relative grid gap-6 px-6 py-6 md:px-7 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] lg:items-center">
        {/* ── Intro and the action ── */}
        <div className="flex flex-col gap-4">
          <p className="inline-flex w-fit items-center gap-2 rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider text-slate-200">
            <span className="relative flex h-2 w-2" aria-hidden>
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
            </span>
            AI Co-Pilot
          </p>

          <div>
            <h2 className="flex items-center gap-2 text-xl font-bold md:text-2xl">
              Smart Revenue Insights
              <Sparkles size={18} className="text-violet-300" aria-hidden />
            </h2>
            <p className="mt-1.5 max-w-xl text-[13px] leading-relaxed text-slate-300">
              Advice written from your own sales, menu and calendar: what to
              add, what to fix, which hours to work on and which festivals to
              plan for.
            </p>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4">
            <button
              type="button"
              onClick={onGenerate}
              disabled={isGenerating}
              aria-busy={isGenerating}
              className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg bg-violet-600 px-4 py-2.5 text-[13px] font-semibold text-white shadow-sm transition-colors hover:bg-violet-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-300 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900 disabled:cursor-wait disabled:opacity-80"
            >
              {isGenerating ? (
                <RefreshCw size={15} className="animate-spin" aria-hidden />
              ) : (
                <WandSparkles size={15} aria-hidden />
              )}
              {isGenerating ? "Loading insights…" : "Generate insights"}
            </button>

            <p className="flex items-center gap-1.5 text-[11px] text-slate-400">
              <Clock3 size={12} aria-hidden />
              {lastUpdated ? (
                <span>
                  Updated {updatedLabel(lastUpdated)}
                  {savedAnswers > 0 &&
                    ` · ${savedAnswers} from today's saved answers`}
                </span>
              ) : (
                <span>Not generated yet today</span>
              )}
            </p>
          </div>

          {/* What the button costs, where it is decided: saved answers are
              reused, so only a section without one spends a call. */}
          <p className="text-[11px] leading-relaxed text-slate-400">
            Reuses today&apos;s saved answers. Only sections without one are
            sent to AI.
          </p>
        </div>

        {/* ── The figures ── */}
        <div className="flex flex-col gap-3">
          <dl className="grid grid-cols-3 gap-2 sm:gap-3">
            <StatTile
              icon={ListChecks}
              iconClassName="bg-violet-500/15 text-violet-300"
              label="Active insights"
              value={activeInsights}
              hint="Across every section"
            />
            <StatTile
              icon={TriangleAlert}
              iconClassName="bg-rose-500/15 text-rose-300"
              label="Slow items"
              value={slowItems}
              hint="To fix on the menu"
            />
            <StatTile
              icon={Star}
              iconClassName="bg-amber-500/15 text-amber-300"
              label="Shortlisted"
              value={shortlisted}
              hint="Menu ideas starred"
            />
          </dl>

          <div className="rounded-xl border border-white/10 bg-white/5 px-3.5 py-3">
            <div className="flex items-center justify-between gap-3 text-[11px]">
              <span className="flex items-center gap-1.5 font-medium text-slate-300">
                <Layers size={13} className="text-emerald-300" aria-hidden />
                Sections using your data
              </span>
              <span className="font-semibold tabular-nums text-white">
                {liveSections} of {totalSections}
              </span>
            </div>
            <div
              className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/10"
              role="meter"
              aria-valuemin={0}
              aria-valuemax={totalSections}
              aria-valuenow={liveSections}
              aria-label="Sections using your data"
            >
              <div
                className="h-full rounded-full bg-emerald-400"
                style={{ width: `${connectedPct}%` }}
              />
            </div>
            <p className="mt-1.5 text-[11px] text-slate-400">
              The rest show sample data until they are connected.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
