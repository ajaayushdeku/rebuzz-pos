// ── Target Tracker API — client service ─────────────────────────────────────
// Talks to the Next.js proxy routes under /api/target, which forward to the
// business-scoped backend ({API_URL}/{slug}/target). All responses are
// JSend-style ({ status, data }); these helpers unwrap `data` and throw on
// non-success so they slot straight into React Query.

// ── Types ───────────────────────────────────────────────────────────────────

export type TargetPeriod = "daily" | "weekly" | "monthly";

export type ProgressStatus =
  | "no_target"
  | "behind"
  | "on_track"
  | "surpassed";

export interface MonthlyTarget {
  year: number;
  /** 1–12 (Jan–Dec). */
  month: number;
  amount: number;
}

/** Shape returned by GET /target and PUT /target. */
export interface SavedTargets {
  dailyTarget: number;
  weeklyTarget: number;
  year: number;
  monthlyTargets: MonthlyTarget[];
  annualTarget: number;
}

/** Body for PUT /target — every field optional, but send at least one. */
export interface SetTargetsPayload {
  dailyTarget?: number;
  weeklyTarget?: number;
  monthly?: {
    year: number;
    targets: { month: number; amount: number }[];
  };
}

/** Shape returned by GET /target/progress. */
export interface TargetProgress {
  period: TargetPeriod;
  startDate: string;
  endDate: string;
  target: number;
  achieved: number;
  remaining: number;
  /** achieved / target × 100; null when target is 0. */
  percentAchieved: number | null;
  progressStatus: ProgressStatus;
}

export interface MonthlyOverviewRow {
  /** 1–12 (Jan–Dec). */
  month: number;
  target: number;
  actual: number;
  /** null when the month has no target. */
  percentAchieved: number | null;
  /** Month-over-month vs previous actual; null for Jan or a 0 previous month. */
  growthPercent: number | null;
}

/** Shape returned by GET /target/monthly-overview. */
export interface MonthlyOverview {
  year: number;
  months: MonthlyOverviewRow[];
  annualTarget: number;
  annualActual: number;
}

// ── Helpers ─────────────────────────────────────────────────────────────────

/** Pull a human-readable message out of a JSend fail/error body. */
function extractError(json: unknown): string {
  if (!json || typeof json !== "object") return "";
  const j = json as Record<string, unknown>;
  if (typeof j.message === "string") return j.message;
  if (typeof j.data === "string") return j.data;
  if (
    j.data &&
    typeof j.data === "object" &&
    typeof (j.data as Record<string, unknown>).message === "string"
  ) {
    return (j.data as Record<string, string>).message;
  }
  return "";
}

async function requestJSend<T>(
  url: string,
  init: RequestInit,
  fallbackError: string,
): Promise<T> {
  const res = await fetch(url, { cache: "no-store", ...init });
  const json = await res.json().catch(() => ({}));

  if (!res.ok || (json as { status?: string })?.status !== "success") {
    throw new Error(extractError(json) || fallbackError);
  }

  return (json as { data: T }).data;
}

// ── Endpoints ───────────────────────────────────────────────────────────────

/** GET /target — saved targets, optionally for a specific year. */
export function fetchTargets(year?: number): Promise<SavedTargets> {
  const qs = year ? `?year=${year}` : "";
  return requestJSend<SavedTargets>(
    `/api/target${qs}`,
    { method: "GET" },
    "Failed to load targets",
  );
}

/** PUT /target — set any of daily/weekly/monthly; returns full saved state. */
export function setTargets(payload: SetTargetsPayload): Promise<SavedTargets> {
  return requestJSend<SavedTargets>(
    `/api/target`,
    {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    },
    "Failed to save targets",
  );
}

/** GET /target/progress — tracker card progress for the given period. */
export function fetchTargetProgress(
  period: TargetPeriod,
): Promise<TargetProgress> {
  return requestJSend<TargetProgress>(
    `/api/target/progress?period=${period}`,
    { method: "GET" },
    "Failed to load target progress",
  );
}

/** GET /target/monthly-overview — 12-month actual/growth for the modal. */
export function fetchMonthlyOverview(year?: number): Promise<MonthlyOverview> {
  const qs = year ? `?year=${year}` : "";
  return requestJSend<MonthlyOverview>(
    `/api/target/monthly-overview${qs}`,
    { method: "GET" },
    "Failed to load monthly overview",
  );
}
