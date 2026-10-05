import { NextRequest, NextResponse } from "next/server";

import {
  fetchPeriodContext,
  generateSection,
  periodSlices,
  periodWindows,
  storeEmptyPeriod,
} from "@/lib/ai-insights/periodData.server";
import {
  getBuilder,
  isEmptySection,
} from "@/lib/ai-insights/sections/builders.server";
import { salesDataUnavailable } from "@/lib/ai-insights/sections/posData.server";

/**
 * Generate one section for one analytics period.
 *
 * The order here is the whole design, and each step exists to avoid paying for
 * something:
 *
 *   1. ask what is stored — and stop if the answer is already there
 *   2. read the POS for the period's own windows
 *   3. nothing sold? store that, and never ask a model about an empty month
 *   4. draft, join the answer onto the figures, store the finished cards
 *
 * Step 1 is the one that changes the economics. Under the day-scoped flow every
 * visit rebuilt the briefing from scratch — thirteen sales reports for pricing
 * alone — and leaned on a cache that expired after a day. A closed period's
 * figures are final, so once an answer exists there is nothing to recompute.
 *
 * One route for every section rather than one route each: what differs between
 * them is which reports to read and how to phrase the question, and that lives in
 * `builders.server.ts`.
 *
 * Admin-only is enforced by the service, which compares the token's subject with
 * the business's admin. A staff member's request is refused there with 403
 * ADMIN_ONLY and that is passed straight back — reading stays open to everyone.
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ kind: string; id: string; section: string }> },
) {
  const { kind, id, section } = await params;

  const builder = getBuilder(section);
  if (!builder) {
    // Not a section this app generates per period. `festival-prep` lands here,
    // which is correct: it advises on coming festivals, so it has no period to
    // describe and stays on the day-scoped route.
    return NextResponse.json({ error: "INVALID_SECTION" }, { status: 400 });
  }

  const body = await req.json().catch(() => ({}));
  const mode: "ensure" | "regenerate" | "more" =
    body?.mode === "regenerate" || body?.mode === "more" ? body.mode : "ensure";
  const exclude: string[] = Array.isArray(body?.exclude) ? body.exclude : [];

  // ── 1. What is already there ────────────────────────────────────────────
  const context = await fetchPeriodContext(kind, id);
  if (!context.ok) return context.response;

  const { token, context: periodContext } = context;
  const { period, sections } = periodContext;

  const stored = sections?.[section];
  if (stored && mode === "ensure") {
    // The common case for a closed period: nothing fetched, nothing spent, and
    // the same shape a later read gives.
    return NextResponse.json(
      { data: stored },
      { headers: { "Cache-Control": "no-store" } },
    );
  }

  // ── 2. The period's own data ────────────────────────────────────────────
  let built;
  try {
    built = await builder({
      token,
      period,
      windows: periodWindows(period),
      slices: periodSlices(period),
      exclude,
      // Which batch this is. Taken from what is stored rather than from the
      // request: a client claiming batch 9 would mint card ids that collide
      // with nothing and append for ever.
      batch:
        mode === "more"
          ? Number((stored as { batches?: number } | undefined)?.batches ?? 1)
          : 0,
    });
  } catch (error) {
    // The POS being unreachable is not the model's failure, and saying so keeps
    // a merchant from going to check an API key that is perfectly fine.
    return salesDataUnavailable(section, error);
  }

  // ── 3. A period with nothing in it ──────────────────────────────────────
  if (isEmptySection(built)) {
    const result = await storeEmptyPeriod({
      token,
      kind: period.kind,
      id: period.id,
      section,
      // The section's real version, so a later `ensure` finds this record
      // instead of generating despite it.
      promptVersion: built.promptVersion,
      reason: built.reason,
      basis: built.basis,
    });
    if (!result.ok) return result.response;
    return NextResponse.json(
      { data: result.data },
      { headers: { "Cache-Control": "no-store" } },
    );
  }

  // ── 4. Draft, join, store ───────────────────────────────────────────────
  const result = await generateSection({
    token,
    kind: period.kind,
    id: period.id,
    section,
    mode,
    exclude,
    promptVersion: built.promptVersion,
    briefing: built.briefing,
    systemInstruction: built.systemInstruction,
    responseSchema: built.responseSchema,
    basis: built.basis,
    extra: built.extra,
    resolve: built.resolve,
  });

  if (!result.ok) return result.response;

  return NextResponse.json(
    { data: result.data },
    { headers: { "Cache-Control": "no-store" } },
  );
}
