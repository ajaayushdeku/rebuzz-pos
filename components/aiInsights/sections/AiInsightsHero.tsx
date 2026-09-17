"use client";

import { WandSparkles } from "lucide-react";

import { useMoney } from "../parts";

/**
 * The summary banner at the top of the page.
 *
 * Every figure is derived from what is on the page below, not stored beside
 * it: dismissing a card lowers the insight count, dismissing a menu idea
 * lowers the uplift, and starring one raises the shortlist. A banner that
 * kept saying "24 insights" after three were closed would be the first thing
 * on the page to stop being true.
 */
export default function AiInsightsHero({
  activeInsights,
  weeklyUplift,
  shortlisted,
  onGenerate,
}: {
  activeInsights: number;
  /** Sum of the menu ideas still on the page. */
  weeklyUplift: number;
  shortlisted: number;
  onGenerate: () => void;
}) {
  const money = useMoney();

  return (
    // `relative` anchors the screen-reader labels inside, for the reason given
    // in SalesRecommendationsSection: unanchored, they size the window.
    <section className="relative flex flex-col gap-5 rounded-2xl bg-slate-900 px-6 py-6 text-white shadow-sm sm:flex-row sm:items-center sm:justify-between md:px-7">
      <div>
        <p className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-gray-300">
          <span className="h-2 w-2 rounded-full bg-emerald-400" />
          AI Co-Pilot
        </p>
        <h2 className="mt-2 text-lg font-bold">Smart Revenue Insights</h2>
        <p className="mt-1 text-[13px] text-gray-300">
          AI-generated recommendations for menu items, slow hours, pricing, and
          floor staffing.
        </p>

        <dl className="mt-4 flex flex-wrap items-baseline gap-x-6 gap-y-2">
          <div className="flex items-baseline gap-1.5">
            <dt className="sr-only">Active insights</dt>
            <dd className="text-xl font-bold tabular-nums">{activeInsights}</dd>
            <span className="text-xs text-gray-300">active insights</span>
          </div>
          <div className="flex items-baseline gap-1.5">
            <dt className="sr-only">Estimated menu uplift</dt>
            <dd className="text-xl font-bold tabular-nums text-emerald-400">
              {money(weeklyUplift)}/wk
            </dd>
            <span className="text-xs text-gray-300">est. menu uplift</span>
          </div>
          <div className="flex items-baseline gap-1.5">
            <dt className="sr-only">Shortlisted</dt>
            <dd className="text-xl font-bold tabular-nums text-amber-400">
              {shortlisted}
            </dd>
            <span className="text-xs text-gray-300">shortlisted</span>
          </div>
        </dl>
      </div>

      <button
        type="button"
        onClick={onGenerate}
        className="inline-flex shrink-0 items-center justify-center gap-2 self-start rounded-lg bg-violet-600 px-4 py-2.5 text-[13px] font-semibold text-white shadow-sm transition-colors hover:bg-violet-500 sm:self-center"
      >
        <WandSparkles size={15} />
        Generate More Insights
      </button>
    </section>
  );
}
