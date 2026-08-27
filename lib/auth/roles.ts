/**
 * Who is allowed into the POS.
 *
 * Kept free of any Next.js import so the middleware — which runs on the edge
 * runtime — can use it as-is.
 */

/** Mirrors the active session's role, so the middleware can read it. */
export const ROLE_COOKIE = "role";

/** Where a signed-in non-admin is sent. Must stay in `publicPages`. */
export const ACCESS_DENIED_PATH = "/access-denied";

/**
 * The roles that may use the POS.
 *
 * The backend also returns "staff", "owner" and "user". Only "admin" is
 * admitted today — add "owner" here if business owners come back with that
 * role instead, which is the one change this whole gate needs.
 */
const ADMIN_ROLES = new Set(["admin"]);

/** True when the role may sign in. Absent or unrecognised counts as no. */
export function isAdminRole(role: string | null | undefined): boolean {
  if (typeof role !== "string") return false;
  return ADMIN_ROLES.has(role.trim().toLowerCase());
}
