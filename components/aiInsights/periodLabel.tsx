"use client";

import { createContext, useContext } from "react";

/**
 * Which period the surrounding cards describe, for the words on them.
 *
 * Every section's copy used to name a rolling window — "your last 13 weeks of
 * sales", "the last 30 days, compared with the 30 before". Those sentences are
 * now wrong: the cards describe September 2026, and a card that misstates which
 * figures it is built from is worse than one that says nothing, because it will
 * be checked against a report and found not to match.
 *
 * A context rather than a prop through seven components, and `null` outside a
 * period page — which is how `festival-prep` keeps its own rolling wording while
 * sitting on the same screen. It is deliberately left outside the provider.
 */
export interface PeriodLabels {
  /** "September 2026", "Jul–Sep 2026", "2025". */
  label: string;
  /** The period before it, for copy that compares the two. */
  previousLabel?: string;
}

const PeriodLabelContext = createContext<PeriodLabels | null>(null);

export const PeriodLabelProvider = PeriodLabelContext.Provider;

/** The period these cards describe, or null when they describe "now". */
export const usePeriodLabels = () => useContext(PeriodLabelContext);

/**
 * The phrase a section should use for the figures behind it.
 *
 * `fallback` is the section's own rolling-window wording, used verbatim when
 * there is no period — so the day-scoped path reads exactly as it always did.
 */
export function useWindowPhrase(fallback: string): string {
  return usePeriodLabels()?.label ?? fallback;
}

/** The same, for copy that names both the period and the one before it. */
export function useComparisonPhrase(fallback: string): string {
  const periods = usePeriodLabels();
  if (!periods) return fallback;
  return periods.previousLabel
    ? `${periods.label}, compared with ${periods.previousLabel}`
    : periods.label;
}

/**
 * Said once on the page, not per card: prices are today's, the sales are not.
 *
 * Each sale carries the price it was sold at, so the sales figures are genuinely
 * historical. The menu is not — the POS keeps no earlier versions of it — so an
 * item re-priced or re-costed since the period is judged against what it costs
 * *today*. That can turn a healthy September into a "sells below cost" card, and
 * nothing on the card would say why.
 *
 * Deliberately not inside the sections' info tooltips, which is where this first
 * went: those open on hover, are capped at sixteen rem, and cannot be opened at
 * all on a touch screen. A caveat nobody can reach is not a caveat.
 *
 * Null outside a period, where menu and sales come from the same week.
 */
export function useCurrentPricesNote(): string | null {
  const periods = usePeriodLabels();
  if (!periods) return null;
  return `Sales figures are from ${periods.label}. Prices, costs and margins are the ones on your menu today — the POS keeps no earlier versions — so an item re-priced since then is measured against its current price.`;
}
