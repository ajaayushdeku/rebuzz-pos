import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { FESTIVALS } from "@/components/offers/festivals";

/**
 * Turn a plain-language schedule request into step 3's fields.
 *
 * The model's job is classification only — which occasion, which days, which
 * hours. It is never asked to work out a date: the app already knows when each
 * festival falls (`festivalWindow`), and a model doing calendar arithmetic
 * would eventually date a campaign to a festival that has already passed.
 * Explicit dates are accepted only when the merchant named one and no festival
 * matched, and every value is validated here before it reaches the form.
 */

// Monday first, matching the order step 3 shows and saves days in.
const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const ACTIVE_HOURS = ["all-day", "happy", "lunch", "evening"];

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;

const RESPONSE_SCHEMA = {
  type: "object",
  properties: {
    festivalId: {
      type: "string",
      description:
        "The id of the matching occasion, or an empty string if none is meant.",
    },
    startDate: {
      type: "string",
      description:
        "YYYY-MM-DD, only if the request names explicit dates and no festival applies. Otherwise empty.",
    },
    endDate: { type: "string", description: "YYYY-MM-DD or empty." },
    repeatingDays: {
      type: "array",
      description:
        "Days the offer repeats, from Sun, Mon, Tue, Wed, Thu, Fri, Sat. Empty means every day.",
      items: { type: "string" },
    },
    startTime: { type: "string", description: "HH:MM 24-hour, or empty." },
    endTime: { type: "string", description: "HH:MM 24-hour, or empty." },
    activeHours: {
      type: "string",
      description: "One of: all-day, happy, lunch, evening.",
    },
  },
  required: [
    "festivalId",
    "startDate",
    "endDate",
    "repeatingDays",
    "startTime",
    "endTime",
    "activeHours",
  ],
} as const;

export async function POST(req: NextRequest) {
  const cookieStore = await cookies();
  if (!cookieStore.get("token")?.value) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!process.env.GEMINI_API_KEY) {
    return NextResponse.json(
      { error: "AI fill is not configured on this server" },
      { status: 503 },
    );
  }

  const body = await req.json().catch(() => null);
  const prompt = typeof body?.prompt === "string" ? body.prompt.trim() : "";

  if (!prompt) {
    return NextResponse.json(
      { error: "Describe when the offer should run" },
      { status: 400 },
    );
  }

  // Capped rather than truncated silently: a paragraph pasted in by accident
  // should be refused, not quietly half-read.
  if (prompt.length > 300) {
    return NextResponse.json(
      { error: "Keep the description under 300 characters" },
      { status: 400 },
    );
  }

  const festivalList = FESTIVALS.map((f) => `${f.id} = ${f.label}`).join("\n");

  const instruction = `You map a Nepali restaurant owner's plain-language description of when an offer should run onto a fixed set of fields.

Occasions you may choose from (use the id on the left, exactly):
${festivalList}

Rules:
- Pick festivalId only when the description clearly refers to that occasion. Otherwise return an empty string.
- Do NOT calculate dates for a festival. Leave startDate and endDate empty whenever festivalId is set — the application knows each festival's dates.
- Only fill startDate/endDate when the description gives explicit calendar dates and no festival applies.
- repeatingDays uses exactly: Mon, Tue, Wed, Thu, Fri, Sat, Sun. "Weekdays" means Mon to Fri; "weekend" means Sat and Sun.
- Leave repeatingDays empty when the offer should run every day.
- startTime/endTime are 24-hour HH:MM, empty when the offer runs all day.
- activeHours is one of all-day, happy, lunch, evening.
- Guess nothing. A field you cannot infer from the description must be empty.`;

  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: instruction }] },
          contents: [{ role: "user", parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.1,
            // Native structured output, so there is no markdown fence to strip
            // and no chance of a half-parsed object reaching the form.
            responseMimeType: "application/json",
            responseSchema: RESPONSE_SCHEMA,
          },
        }),
      },
    );

    if (!res.ok) {
      console.error("ai-schedule: Gemini returned", res.status);
      return NextResponse.json(
        { error: "Could not read that — try rephrasing" },
        { status: 502 },
      );
    }

    const json = await res.json();
    const text = json?.candidates?.[0]?.content?.parts?.[0]?.text ?? "";

    let parsed: Record<string, unknown>;
    try {
      parsed = JSON.parse(text);
    } catch {
      return NextResponse.json(
        { error: "Could not read that — try rephrasing" },
        { status: 502 },
      );
    }

    // ── Validate everything before it can touch the form ──
    const festivalId =
      typeof parsed.festivalId === "string" &&
      FESTIVALS.some((f) => f.id === parsed.festivalId)
        ? parsed.festivalId
        : "";

    const asDate = (v: unknown) =>
      typeof v === "string" && DATE_RE.test(v) && !Number.isNaN(Date.parse(v))
        ? v
        : "";

    let startDate = asDate(parsed.startDate);
    let endDate = asDate(parsed.endDate);

    // A backwards window would run the offer for negative days.
    if (startDate && endDate && endDate < startDate) endDate = "";
    if (endDate && !startDate) endDate = "";

    // Dates are the app's to compute whenever a festival is named.
    if (festivalId) {
      startDate = "";
      endDate = "";
    }

    // Filtered against DAYS rather than trusted, so an unexpected value can
    // never reach the form. Order comes from DAYS, so "Sat, Fri" normalises to
    // week order the same way the day toggles do.
    const rawDays: unknown[] = Array.isArray(parsed.repeatingDays)
      ? parsed.repeatingDays
      : [];
    const repeatingDays = DAYS.filter((d) => rawDays.includes(d));

    const asTime = (v: unknown) =>
      typeof v === "string" && TIME_RE.test(v) ? v : "";

    let startTime = asTime(parsed.startTime);
    let endTime = asTime(parsed.endTime);
    // Half a window is not a window — the form treats both-empty as all day.
    if (!startTime || !endTime) {
      startTime = "";
      endTime = "";
    }

    const activeHours =
      typeof parsed.activeHours === "string" &&
      ACTIVE_HOURS.includes(parsed.activeHours)
        ? parsed.activeHours
        : "all-day";

    return NextResponse.json({
      data: {
        festivalId,
        startDate,
        endDate,
        repeatingDays,
        startTime,
        endTime,
        activeHours,
      },
    });
  } catch (error) {
    console.error("ai-schedule failed:", error);
    return NextResponse.json(
      { error: "Could not reach the AI service" },
      { status: 500 },
    );
  }
}
