// ── Shared date-range resolution for the Profit & Cost page ────────────────
// Single source of truth for how the global date filter is interpreted.
// Used by both the page (server) and the header filter (client) so the
// default range and preset handling stay in sync.

export type ResolvedRange = { startDate: string; endDate: string };

function toDateStr(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/** Default global range: rolling last 30 days. */
export function getDefaultRange(): ResolvedRange {
  const today = new Date();
  const start = new Date(today);
  start.setDate(today.getDate() - 29);
  return { startDate: toDateStr(start), endDate: toDateStr(today) };
}

/** Convert a preset key (24h/week/month/year) to a concrete range. */
export function getPresetRange(range: string): ResolvedRange {
  const today = new Date();
  const end = toDateStr(today);
  let start: Date;

  switch (range) {
    case "24h":
      start = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      break;
    case "week":
      start = new Date(today);
      start.setDate(today.getDate() - 6);
      break;
    case "month":
      start = new Date(today);
      start.setDate(today.getDate() - 29);
      break;
    case "year":
      start = new Date(today);
      start.setDate(today.getDate() - 364);
      break;
    default:
      return getDefaultRange();
  }

  return { startDate: toDateStr(start), endDate: end };
}

/**
 * Resolve the effective range from URL search params.
 * Explicit start/end win, then a named preset, then the default range.
 */
export function resolveRange(params: {
  range?: string;
  startDate?: string;
  endDate?: string;
}): ResolvedRange {
  if (params.startDate && params.endDate) {
    return { startDate: params.startDate, endDate: params.endDate };
  }
  if (params.range) {
    return getPresetRange(params.range);
  }
  return getDefaultRange();
}
