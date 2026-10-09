/**
 * How long a session token has left, read off the token itself.
 *
 * Kept free of imports so it can be used from a route handler, a server
 * component or the edge middleware, and tested on its own.
 */

/**
 * How long a session cookie lasts when the token says nothing useful.
 *
 * A ceiling as much as a default: `tokenCookieMaxAge` never returns more than
 * this, so reading the token's own expiry can only ever shorten a session and
 * never extend one past what this app already allowed.
 */
export const DEFAULT_SESSION_MAX_AGE = 60 * 60 * 24 * 7; // 7 days

/**
 * The `exp` claim out of a JWT, in seconds since the epoch.
 *
 * Read, not verified. Nothing is trusted on the strength of it: the only use is
 * deciding when to stop sending a token the backend will reject anyway, and the
 * worst a tampered `exp` can do is shorten the tamperer's own session or let
 * the cookie outlive the token — which is the state this app was already in,
 * and which `app/(app)/layout.tsx` catches on the next navigation. Verifying
 * would need the backend's signing key, which this app does not have and should
 * not want.
 *
 * Returns null for anything that is not a JWT carrying a numeric `exp`, opaque
 * tokens included. Those fall back to the default.
 */
export function tokenExpiry(token: string): number | null {
  const payload = token.split(".")[1];
  if (!payload) return null;

  try {
    // base64url → base64, re-padded: `atob` wants the standard alphabet and a
    // length that is a multiple of four, and a JWT is written with neither.
    const base64 = payload.replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, "=");
    const exp = JSON.parse(atob(padded))?.exp;

    return typeof exp === "number" && Number.isFinite(exp) ? exp : null;
  } catch {
    return null;
  }
}

/**
 * How long the session cookie should live for this token.
 *
 * The point of asking the token rather than picking a number: the cookie used
 * to last a flat seven days whatever the token's own lifetime was, so once the
 * token died the browser kept presenting it. The middleware saw a cookie and
 * let the request through, and the dashboard rendered a shell whose every
 * request failed.
 *
 * An `exp` that is missing, unreadable or already past falls back to the
 * default and leaves the layout's check to end the session on the next
 * navigation. Returning 0 for a dead token would be worse than it sounds: the
 * browser would drop the cookie before the redirect to the dashboard arrived,
 * so a login would appear to silently fail instead of signing in and then
 * being told the session is over.
 */
export function tokenCookieMaxAge(token: string): number {
  const exp = tokenExpiry(token);
  if (exp === null) return DEFAULT_SESSION_MAX_AGE;

  const remaining = Math.floor(exp - Date.now() / 1000);
  if (remaining <= 0) return DEFAULT_SESSION_MAX_AGE;

  return Math.min(remaining, DEFAULT_SESSION_MAX_AGE);
}
