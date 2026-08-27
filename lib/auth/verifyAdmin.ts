import { isAdminRole } from "@/lib/auth/roles";

const BASE = process.env.NEXT_PUBLIC_API_URL;

/**
 * Ask the backend what this token's role actually is.
 *
 * Server-side only — it is handed a raw token, which must never reach a
 * client bundle. Called from `app/(app)/layout.tsx`.
 *
 * The `role` cookie is written by this app, so a browser can edit it; the
 * token cannot be forged, and this endpoint answers for it. That makes this
 * the real gate and the cookie merely a way for the middleware to turn most
 * requests away without a round trip.
 *
 * Returns `true` when the session is definitely not an admin. Anything else —
 * a timeout, a 500, a shape that does not parse — returns `false`, so a bad
 * minute at the API signs nobody out. The middleware still holds the line for
 * sessions whose role cookie says staff.
 */
export async function isDeniedSession(token: string): Promise<boolean> {
  try {
    const res = await fetch(`${BASE}/business/users/me`, {
      headers: { Authorization: `Bearer ${token}` },
      // Roles change rarely, but a stale "admin" would keep someone in for the
      // life of the cache, so this is never served from one.
      cache: "no-store",
    });

    // 401/403 means the token is dead, not that the role is wrong. Middleware
    // handles a missing session; letting it through here avoids fighting over
    // which redirect wins.
    if (!res.ok) return false;

    const data = await res.json();
    const role = data?.data?.user?.role;

    // A response that carries no role at all is not evidence of anything.
    if (typeof role !== "string") return false;

    return !isAdminRole(role);
  } catch {
    return false;
  }
}
