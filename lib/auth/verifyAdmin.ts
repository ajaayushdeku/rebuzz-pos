import { isAdminRole } from "@/lib/auth/roles";

const BASE = process.env.NEXT_PUBLIC_API_URL;

/**
 * What the API says about the token in the cookie.
 *
 * - `ok` — a live session belonging to an admin.
 * - `expired` — the token was rejected. Dead, revoked, or never valid.
 * - `denied` — a live session, but not a role the POS admits.
 * - `unknown` — the question could not be answered: a timeout, a 500, a shape
 *   that does not parse. Treated as "carry on", because signing every till out
 *   over a bad minute at the API is worse than letting a dead session linger
 *   until the next navigation.
 */
export type SessionStatus = "ok" | "expired" | "denied" | "unknown";

/**
 * Ask the backend what this token's session actually is.
 *
 * Server-side only — it is handed a raw token, which must never reach a client
 * bundle. Called from `app/(app)/layout.tsx`, which wraps every page in the
 * app, so this runs once per navigation and is the only gate that sees the real
 * answer rather than a cookie.
 *
 * The `role` cookie is written by this app, so a browser can edit it; the token
 * cannot be forged, and this endpoint answers for it. That makes this the real
 * gate and the cookie merely a way for the middleware to turn most requests
 * away without a round trip.
 *
 * This used to return a boolean — "is this session denied?" — and folded a
 * rejected token into "not denied", on the reasoning that the middleware
 * handles a missing session. It does: a *missing* one. A token that is present
 * but dead passed every check, which is why expired sessions could still open
 * the dashboard while every request inside it failed.
 */
export async function sessionStatus(token: string): Promise<SessionStatus> {
  try {
    const res = await fetch(`${BASE}/business/users/me`, {
      headers: { Authorization: `Bearer ${token}` },
      // Roles change rarely, but a stale "admin" would keep someone in for the
      // life of the cache, so this is never served from one.
      cache: "no-store",
    });

    // The token is the only credential sent, so a refusal is about the token.
    if (res.status === 401 || res.status === 403) return "expired";

    // Any other failure is the API having a bad moment, not a verdict.
    if (!res.ok) return "unknown";

    const data = await res.json();
    const role = data?.data?.user?.role;

    // A response that carries no role at all is not evidence of anything.
    if (typeof role !== "string") return "unknown";

    return isAdminRole(role) ? "ok" : "denied";
  } catch {
    return "unknown";
  }
}
