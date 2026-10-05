import { aiErrorMessage, AiInsightsError } from "./apiAiInsights.client";

/**
 * The browser's side of the period routes: reading stored insights, and asking
 * for new ones.
 *
 * Reading and generating are deliberately not the same shape. A read is free and
 * open to anyone; a generation spends the merchant's provider quota, is refused
 * for anyone but the admin, and takes as long as the POS takes to answer — so it
 * is a mutation with its own hook, never something a component can do by
 * accident while rendering.
 *
 * The calendar is not reimplemented here. Period ids, labels and date ranges all
 * come from the service, which owns the definition — including the +05:45
 * boundary that makes "September" start at 18:15 UTC on 31 August.
 */

export type PeriodKind = "month" | "quarter" | "year";

/** One period, as the service describes it. */
export interface AnalyticsPeriod {
  kind: PeriodKind;
  id: string;
  /** "September 2026", "Jul–Sep 2026", "2025". */
  label: string;
  /** Inclusive Nepal calendar dates, e.g. "2026-09-01" and "2026-09-30". */
  from: string;
  to: string;
  /** How many of the page's sections have been generated for it. */
  generatedSections: number;
  lastGeneratedAt: string | null;
}

export interface PeriodList {
  kinds: { kind: PeriodKind; label: string }[];
  kind: PeriodKind;
  /** The period a page should open on: the most recent completed one. */
  default: string;
  totalSections: number;
  periods: AnalyticsPeriod[];
}

/** One section's stored answer. `items` is whatever that section's cards are. */
export interface StoredSection<T = unknown> {
  period: { kind: PeriodKind; id: string };
  section: string;
  /**
   * The prompt that produced it.
   *
   * Compared with the version the app now ships: when they differ there is a
   * better analysis available, which is offered rather than generated — nobody's
   * quota should be spent by a deployment.
   */
  promptVersion: string;
  items: T[];
  /** Why there are no cards, when there are none: "NO_SALES". */
  reason?: string;
  /** The figures the answer was based on, for "based on 1,240 orders". */
  basis: Record<string, unknown> | null;
  model: string | null;
  provider: string | null;
  generatedAt: string | null;
  revision: number;
  batches: number;
  noMore: boolean;
  stored: true;
}

export interface PeriodInsights {
  period: {
    kind: PeriodKind;
    id: string;
    label: string;
    from: string;
    to: string;
    /** The period before it, named — for copy that compares the two. */
    previous?: { id: string; label: string; from: string; to: string };
  };
  /** Keyed by section name. Absent means never generated, not empty. */
  sections: Record<string, StoredSection>;
  /** Section names with nothing stored yet — what a Generate button would cover. */
  missing: string[];
  totalSections: number;
}

/**
 * This deployment cannot do period insights at all.
 *
 * Its own code rather than a generic failure: it means the app is pointed at the
 * POS API, whose copy of the AI routes has no notion of a period. Nothing the
 * user can do about it, and nothing a retry will fix, so the UI says so once
 * instead of offering a Try again that cannot work.
 */
export const PERIOD_INSIGHTS_UNAVAILABLE = "PERIOD_INSIGHTS_UNAVAILABLE";

const read = async (res: Response) => {
  const json = await res.json().catch(() => ({}));

  if (!res.ok) {
    const code = String(json?.error ?? "UNKNOWN");
    throw new AiInsightsError(
      code,
      code === PERIOD_INSIGHTS_UNAVAILABLE
        ? "Period insights are not available on this server."
        : (json?.detail ?? aiErrorMessage(code)),
      json?.retryAfter,
    );
  }

  return json?.data;
};

/** What a generation is being asked to do. */
export type GenerateMode = "ensure" | "regenerate" | "more";

export interface GenerateRequest {
  kind: PeriodKind;
  id: string;
  section: string;
  /**
   * `ensure` returns what is stored and generates only when nothing is;
   * `regenerate` replaces it; `more` appends a further batch.
   */
  mode?: GenerateMode;
  /** Cards already on screen, so a further batch is not the same ideas again. */
  exclude?: string[];
}

/**
 * Ask for one section of one period.
 *
 * Slow by nature: the server reads the POS reports for the period before it can
 * ask anything, which takes seconds rather than milliseconds. `ensure` on an
 * already-stored section is the exception — it returns immediately and reads
 * nothing.
 *
 * Errors arrive as `AiInsightsError` with the service's own code, so the caller
 * can tell a rate limit from a missing key from an admin-only refusal.
 */
export const generateSection = async <T = unknown>({
  kind,
  id,
  section,
  mode = "ensure",
  exclude,
}: GenerateRequest): Promise<StoredSection<T>> =>
  read(
    await fetch(
      `/api/period-insights/${encodeURIComponent(kind)}/${encodeURIComponent(id)}/${encodeURIComponent(section)}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode, ...(exclude?.length ? { exclude } : {}) }),
        cache: "no-store",
      },
    ),
  );

/** The periods on offer for one kind, newest first. */
export const fetchPeriods = async (kind: PeriodKind): Promise<PeriodList> =>
  read(
    await fetch(`/api/period-insights/periods?kind=${encodeURIComponent(kind)}`, {
      cache: "no-store",
    }),
  );

/**
 * Everything stored for one period.
 *
 * `id` may be `latest`, which the service resolves — so the first load does not
 * have to wait for the period list before it can ask for anything.
 */
export const fetchPeriodInsights = async (
  kind: PeriodKind,
  id: string,
): Promise<PeriodInsights> =>
  read(
    await fetch(
      `/api/period-insights/${encodeURIComponent(kind)}/${encodeURIComponent(id)}`,
      { cache: "no-store" },
    ),
  );
