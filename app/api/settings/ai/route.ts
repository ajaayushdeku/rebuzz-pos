import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

const AI_SERVICE_URL = process.env.AI_SERVICE_URL;

/**
 * Bridge between the browser and the BYOK AI service.
 *
 * The browser cannot call that service directly: the session token lives in an
 * httpOnly cookie, so client JavaScript cannot read it or attach it as a
 * bearer header, and the service rejects anything unauthenticated. This route
 * is the only place that can do both.
 *
 * Nothing is cached. A key's status changes the moment it is saved, and Next's
 * data cache keys on URL rather than on the Authorization header — a cached
 * response here could show one business another's configuration.
 */

async function forward(
  method: "GET" | "POST" | "PATCH" | "DELETE",
  body?: unknown,
) {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;

  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!AI_SERVICE_URL) {
    return NextResponse.json(
      { error: "AI service is not configured on this server" },
      { status: 503 },
    );
  }

  let res: Response;
  try {
    res = await fetch(`${AI_SERVICE_URL}/api/settings/ai`, {
      method,
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: body === undefined ? undefined : JSON.stringify(body),
      cache: "no-store",
    });
  } catch (error) {
    // Distinguished from a real failure: the usual cause is the service simply
    // not running, and "AI service unavailable" is a far better prompt than a
    // generic error that sends someone debugging the form.
    //
    // The cause is logged rather than swallowed. A bare catch here turns every
    // network problem into the same sentence, so a DNS failure, a refused
    // connection and a bad URL all look identical — and the one thing needed
    // to tell them apart is the thing being discarded.
    const cause =
      (error as { cause?: { code?: string; message?: string } })?.cause ?? {};
    console.error(
      `[ai-settings] ${method} ${AI_SERVICE_URL} failed:`,
      (error as Error)?.message,
      "| cause:",
      cause.code ?? cause.message ?? "(none)",
    );

    return NextResponse.json(
      { error: "AI service is unreachable — is it running?" },
      { status: 503 },
    );
  }

  const json = await res.json().catch(() => ({}));

  if (!res.ok) {
    // The service's error codes carry the meaning — GEMINI_KEY_INVALID needs a
    // different fix from GEMINI_QUOTA_EXCEEDED — so they pass through intact.
    return NextResponse.json(
      {
        error: json?.error ?? "Request failed",
        // Present when the model was the problem: the names this key can
        // actually use, so the message can name them instead of guessing.
        available: json?.available ?? undefined,
      },
      { status: res.status },
    );
  }

  return NextResponse.json(json);
}

export async function GET() {
  return forward("GET");
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const apiKey = typeof body?.apiKey === "string" ? body.apiKey.trim() : "";
  const model = typeof body?.model === "string" ? body.model.trim() : "";

  if (!apiKey) {
    return NextResponse.json({ error: "API_KEY_REQUIRED" }, { status: 400 });
  }

  // `model` is forwarded when supplied so the user can save a key against the
  // model they were told works. Dropping it here was a dead end: the service
  // answers GEMINI_MODEL_UNAVAILABLE with a list of usable names, and without
  // this there was no way to act on that answer.
  return forward("POST", model ? { apiKey, model } : { apiKey });
}

/**
 * Toggle `enabled`, or switch to one of the models the service reported as
 * usable. Cannot change the key — that is POST's job.
 */
export async function PATCH(req: NextRequest) {
  const body = await req.json().catch(() => null);

  const payload: { enabled?: boolean; model?: string } = {};

  if (typeof body?.enabled === "boolean") {
    payload.enabled = body.enabled;
  }
  if (typeof body?.model === "string" && body.model.trim()) {
    payload.model = body.model.trim();
  }

  if (Object.keys(payload).length === 0) {
    return NextResponse.json({ error: "NOTHING_TO_UPDATE" }, { status: 400 });
  }

  return forward("PATCH", payload);
}

export async function DELETE() {
  return forward("DELETE");
}
