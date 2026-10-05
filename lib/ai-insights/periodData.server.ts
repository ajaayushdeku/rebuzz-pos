import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { periodApiUrl, readAiError } from "@/lib/ai-insights/posAiApi.server";
import type { DateWindow } from "@/lib/ai-insights/sections/shared";

/**
 * What a section route needs to answer for an analytics period.
 *
 * The shape of a section route changes in one important way under periods: it no
 * longer always gathers data. A closed period's insight is stored, so the first
 * thing to do is ask whether it exists — and if it does, the thirteen report
 * requests that used to run on every visit are not made at all.
 *
 *   1. `fetchPeriodContext` — the period's windows, and what is already stored
 *   2. return early when the answer is there and nobody asked for a new one
 *   3. otherwise fetch POS reports for `periodWindows` / `periodSlices`
 *   4. `generatePeriodSection` — hand the briefing over to be generated and kept
 *
 * The calendar lives in the service, which is why step 1 exists at all: the
 * windows come back from it rather than being worked out here. Two definitions of
 * "September" would eventually disagree over the +05:45 boundary, and the one
 * that wrote the document would win silently.
 */

export interface PeriodDescriptor {
  kind: string;
  id: string;
  label: string;
  /** Inclusive Nepal calendar dates. */
  from: string;
  to: string;
  /** The period before it, of the same kind — every section's baseline. */
  previous?: { id: string; label: string; from: string; to: string };
}

export interface PeriodContext {
  period: PeriodDescriptor;
  /** Keyed by section name; absent means never generated. */
  sections: Record<string, { promptVersion: string; [key: string]: unknown }>;
  missing: string[];
}

export type PeriodContextResult =
  | { ok: true; context: PeriodContext; token: string }
  | { ok: false; response: NextResponse };

const unavailable = () =>
  NextResponse.json(
    {
      error: "PERIOD_INSIGHTS_UNAVAILABLE",
      detail:
        "This server is not configured with the standalone AI service, which is " +
        "where period insights live.",
    },
    { status: 503 },
  );

/** Which period a request is about. Defaults to the most recent completed one. */
export function readPeriodRequest(body: unknown): { kind: string; id: string } {
  const asked = (body ?? {}) as { period?: { kind?: unknown; id?: unknown } };
  const kind =
    typeof asked.period?.kind === "string" ? asked.period.kind : "month";
  const id = typeof asked.period?.id === "string" ? asked.period.id : "latest";
  // Neither is trusted: the service validates both and refuses anything its own
  // calendar could not have produced.
  return { kind, id };
}

/**
 * The period's windows and whatever is already stored for it.
 *
 * One request, answering two questions, because the second one decides whether
 * any POS reports need fetching at all.
 */
export async function fetchPeriodContext(
  kind: string,
  id: string,
): Promise<PeriodContextResult> {
  const token = (await cookies()).get("token")?.value;
  if (!token) {
    return {
      ok: false,
      response: NextResponse.json({ error: "AUTH_REQUIRED" }, { status: 401 }),
    };
  }

  const url = periodApiUrl(`/${encodeURIComponent(kind)}/${encodeURIComponent(id)}`);
  if (!url) return { ok: false, response: unavailable() };

  let res: Response;
  try {
    res = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });
  } catch (error) {
    console.error(`[period-insights] GET ${url} failed:`, (error as Error)?.message);
    return {
      ok: false,
      response: NextResponse.json(
        { error: "AI service is unreachable — is it running?" },
        { status: 503 },
      ),
    };
  }

  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    const { error, detail } = readAiError(json);
    return {
      ok: false,
      response: NextResponse.json({ error, detail }, { status: res.status }),
    };
  }

  return { ok: true, token, context: json?.data as PeriodContext };
}

/**
 * The period itself and the one before it, as report windows.
 *
 * Both come from the service's descriptor. A section comparing "this period
 * against the last" is therefore comparing two windows of the same shape — a
 * month against a month — rather than a month against a rolling 30 days.
 */
export function periodWindows(period: PeriodDescriptor): {
  current: DateWindow;
  previous: DateWindow;
} {
  return {
    current: { startDate: period.from, endDate: period.to },
    previous: {
      startDate: period.previous?.from ?? period.from,
      endDate: period.previous?.to ?? period.to,
    },
  };
}

/** Calendar arithmetic on plain dates. No clock, so no hour can tip a day. */
const addDays = (iso: string, days: number) => {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d + days)).toISOString().slice(0, 10);
};

const firstOfMonth = (iso: string) => `${iso.slice(0, 7)}-01`;

const addMonths = (iso: string, months: number) => {
  const [y, m] = iso.split("-").map(Number);
  const index = y * 12 + (m - 1) + months;
  return `${Math.floor(index / 12)}-${String((index % 12) + 1).padStart(2, "0")}-01`;
};

/**
 * The period cut into comparable slices, for the sections that read a timeline
 * rather than a total — pricing watching a price move, say.
 *
 * The granularity follows the period's length, which is the point: thirteen
 * weekly reports made sense for "the last quarter" as a rolling window, but a
 * year sliced into weeks would be fifty-two report requests for one insight.
 *
 *   month    → weeks  (4–5 slices)
 *   quarter  → months (3 slices)
 *   year     → months (12 slices)
 *
 * Slices never run past the period: the last one is truncated to `to`, so no
 * slice can include a day the period does not own.
 */
export function periodSlices(period: PeriodDescriptor): DateWindow[] {
  const slices: DateWindow[] = [];

  if (period.kind === "month") {
    let startDate = period.from;
    while (startDate <= period.to) {
      const endDate = addDays(startDate, 6);
      slices.push({
        startDate,
        endDate: endDate > period.to ? period.to : endDate,
      });
      startDate = addDays(startDate, 7);
    }
    return slices;
  }

  // Quarters and years, month by month.
  let monthStart = firstOfMonth(period.from);
  while (monthStart <= period.to) {
    const nextMonth = addMonths(monthStart, 1);
    const endDate = addDays(nextMonth, -1);
    slices.push({
      startDate: monthStart < period.from ? period.from : monthStart,
      endDate: endDate > period.to ? period.to : endDate,
    });
    monthStart = nextMonth;
  }
  return slices;
}

export interface DraftInput {
  token: string;
  kind: string;
  id: string;
  section: string;
  /** The section's prompt version, so an improvement is a new answer. */
  promptVersion: string;
  briefing: string;
  systemInstruction: string;
  responseSchema: object;
  mode?: "ensure" | "regenerate" | "more";
  /** Cards already shown, so a further batch does not repeat them. */
  exclude?: string[];
}

/** What the model said, before it has been joined onto the period's figures. */
export interface Draft {
  /** The parsed answer, in whatever shape the section's schema asked for. */
  answer: unknown;
  model: string | null;
  provider: string | null;
  settingsModel: string | null;
  /** False when this joined a generation already running, so nothing was paid. */
  spent: boolean;
}

export type DraftResult =
  | { ok: true; draft: Draft }
  | { ok: false; response: NextResponse };

export interface StoreInput {
  token: string;
  kind: string;
  id: string;
  section: string;
  promptVersion: string;
  /** The finished cards. Not the model's raw answer — see `generateSection`. */
  items: unknown[];
  /** Anything else the section returns beside its cards: windows, reasons. */
  extra?: Record<string, unknown> | null;
  /** The figures behind it, kept so the answer stays explicable later. */
  basis?: Record<string, unknown>;
  mode?: "ensure" | "regenerate" | "more";
  model?: string | null;
  provider?: string | null;
  settingsModel?: string | null;
}

export type StoreResult =
  | { ok: true; data: Record<string, unknown> }
  | { ok: false; response: NextResponse };

/** The one place a service failure becomes a response for the browser. */
async function post(
  url: string,
  token: string,
  body: unknown,
  label: string,
): Promise<{ ok: true; data: Record<string, unknown> } | { ok: false; response: NextResponse }> {
  let res: Response;
  try {
    res = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
      cache: "no-store",
    });
  } catch (error) {
    console.error(`[period-insights] ${label} failed:`, (error as Error)?.message);
    return {
      ok: false,
      response: NextResponse.json(
        { error: "AI service is unreachable — is it running?" },
        { status: 503 },
      ),
    };
  }

  const json = await res.json().catch(() => ({}));

  if (!res.ok) {
    // `detail` and `retryAfter` travel with it, which is what lets a card say
    // "your plan's limit — try again in 42s" rather than "something went wrong".
    const { error, detail, retryAfter } = readAiError(json);
    return {
      ok: false,
      response: NextResponse.json(
        { error, detail, retryAfter },
        { status: res.status },
      ),
    };
  }

  return { ok: true, data: json?.data };
}

/**
 * Ask the model. Nothing is stored by this.
 *
 * The answer alone is not what a card shows: the model replies against an
 * anonymised reference, and the item name, price and numbers come from the
 * period's own figures. Joining the two is the caller's job, because the caller
 * is the side holding the data — and the join has to happen before anything is
 * kept, or the stored insight would be a list of references nobody can resolve
 * once those figures are gone.
 *
 * The paid answer is cached by the service for a day, so a failure between this
 * and the store costs a retry rather than another provider call.
 */
export async function draftSection(input: DraftInput): Promise<DraftResult> {
  const url = periodApiUrl(
    `/${encodeURIComponent(input.kind)}/${encodeURIComponent(input.id)}/${encodeURIComponent(input.section)}/draft`,
  );
  if (!url) return { ok: false, response: unavailable() };

  const result = await post(
    url,
    input.token,
    {
      mode: input.mode ?? "ensure",
      promptVersion: input.promptVersion,
      briefing: input.briefing,
      systemInstruction: input.systemInstruction,
      responseSchema: input.responseSchema,
      ...(input.exclude?.length ? { exclude: input.exclude } : {}),
    },
    `POST draft ${input.section}`,
  );

  if (!result.ok) return result;

  const data = result.data as Partial<Draft>;
  return {
    ok: true,
    draft: {
      answer: data.answer,
      model: data.model ?? null,
      provider: data.provider ?? null,
      settingsModel: data.settingsModel ?? null,
      spent: data.spent !== false,
    },
  };
}

/** Keep the finished cards. This is all a later visit reads. */
export async function storeSection(input: StoreInput): Promise<StoreResult> {
  const url = periodApiUrl(
    `/${encodeURIComponent(input.kind)}/${encodeURIComponent(input.id)}/${encodeURIComponent(input.section)}`,
  );
  if (!url) return { ok: false, response: unavailable() };

  return post(
    url,
    input.token,
    {
      mode: input.mode ?? "ensure",
      promptVersion: input.promptVersion,
      items: input.items,
      ...(input.extra ? { extra: input.extra } : {}),
      ...(input.basis ? { basis: input.basis } : {}),
      ...(input.model ? { model: input.model } : {}),
      ...(input.provider ? { provider: input.provider } : {}),
      ...(input.settingsModel ? { settingsModel: input.settingsModel } : {}),
    },
    `POST save ${input.section}`,
  );
}

/**
 * The whole generation, in the order it has to happen: draft, join, store.
 *
 * `resolve` is the join — it receives the model's answer and returns the cards as
 * the UI will read them, which for most sections means calling that section's
 * existing `parse*` function against its facts. Those functions are unchanged by
 * any of this; they simply run here rather than after a cache hit.
 *
 * Returning the stored document rather than the resolved cards is deliberate: the
 * caller then answers from the same shape a later read will give it, so a freshly
 * generated section and a stored one cannot render differently.
 */
export async function generateSection(
  input: DraftInput & {
    basis?: Record<string, unknown>;
    extra?: Record<string, unknown> | null;
    resolve: (answer: unknown, draft: Draft) => unknown[];
  },
): Promise<StoreResult> {
  const drafted = await draftSection(input);
  if (!drafted.ok) return drafted;

  const items = input.resolve(drafted.draft.answer, drafted.draft);

  return storeSection({
    token: input.token,
    kind: input.kind,
    id: input.id,
    section: input.section,
    promptVersion: input.promptVersion,
    mode: input.mode,
    items,
    extra: input.extra ?? null,
    basis: input.basis,
    model: drafted.draft.model,
    provider: drafted.draft.provider,
    settingsModel: drafted.draft.settingsModel,
  });
}

/**
 * Record a period that has nothing to analyse.
 *
 * Stored rather than returned, and with no provider call: a month with no orders
 * gives a model nothing to work from, and without storing the fact every visit
 * would ask again. The reason travels with it so the card can say which kind of
 * empty it was.
 */
export async function storeEmptyPeriod(input: {
  token: string;
  kind: string;
  id: string;
  section: string;
  promptVersion: string;
  reason: string;
  basis?: Record<string, unknown>;
}): Promise<StoreResult> {
  const url = periodApiUrl(
    `/${encodeURIComponent(input.kind)}/${encodeURIComponent(input.id)}/${encodeURIComponent(input.section)}`,
  );
  if (!url) return { ok: false, response: unavailable() };

  return post(
    url,
    input.token,
    {
      promptVersion: input.promptVersion,
      empty: true,
      reason: input.reason,
      ...(input.basis ? { basis: input.basis } : {}),
    },
    `POST empty ${input.section}`,
  );
}
