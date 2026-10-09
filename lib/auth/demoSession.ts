import { isDemoPhone } from "@/lib/auth/demoAccount";

const BASE = process.env.NEXT_PUBLIC_API_URL;

/**
 * Whether this session is the shared demo account.
 *
 * Server-side only — it takes a raw token, which must never reach a client
 * bundle. Asks the API whose token it is rather than trusting anything the
 * browser sent: a client could claim to be any account, and the point of this
 * check is the cases where the UI's own guard has been bypassed.
 *
 * Returns false — not the demo, so allowed — when the answer cannot be had: a
 * timeout, a 500, a shape that does not parse. The alternative fails the other
 * way, and a bad minute at the API would stop real businesses editing their own
 * profile to protect a demo. Same trade as `isDeniedSession`, and for the same
 * reason: this guards demo data, it is not a security boundary.
 *
 * One extra round trip per save, which is a rare action on a small payload.
 */
export async function isDemoSession(
  token: string | undefined,
): Promise<boolean> {
  if (!token) return false;

  try {
    const res = await fetch(`${BASE}/business/users/me`, {
      headers: { Authorization: `Bearer ${token}` },
      // Never from a cache: the whole answer is "who is this token", and a
      // stale one would apply the previous account's rule to this one.
      cache: "no-store",
    });

    if (!res.ok) return false;

    const data = await res.json();
    return isDemoPhone(data?.data?.user?.phone);
  } catch {
    return false;
  }
}
