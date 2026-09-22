import { cookies } from "next/headers";

/**
 * Whether this business has a Gemini key saved, asked from the server.
 *
 * The server-side twin of `useHasSavedAiKey`, for AI features that are built
 * in a server component. Answering here rather than in the browser lets such
 * a feature skip its own data gathering when there is no key: the overview's
 * AI cards would otherwise collect a full briefing — a round of dashboard
 * fetches — for a request that can only be refused.
 *
 * Asks the AI service's settings route, the same one the settings screen
 * reads, so both sides agree on what "has a key" means. It returns a status
 * and a mask, never the key.
 *
 * False whenever it cannot find out — no session, no service configured, the
 * service down or slow. Every one of those means the AI features could not
 * run anyway, and hiding them beats showing cards that can only fail.
 */
export async function hasSavedAiKey(): Promise<boolean> {
  const serviceUrl = process.env.AI_SERVICE_URL;
  // [POS backend] To ask khajaGharBackend instead of backend/, use the POS
  // base URL (NEXT_PUBLIC_API_URL) and the fetch path below:
  // const serviceUrl = process.env.NEXT_PUBLIC_API_URL;
  if (!serviceUrl) return false;

  const token = (await cookies()).get("token")?.value;
  if (!token) return false;

  try {
    // [POS backend] const res = await fetch(`${serviceUrl}/settings/ai`, {
    const res = await fetch(`${serviceUrl}/api/settings/ai`, {
      headers: { Authorization: `Bearer ${token}` },
      // Never cached: the answer changes the moment a key is saved, and Next's
      // data cache keys on the URL rather than the token, so a cached answer
      // could belong to another business.
      cache: "no-store",
      // Checked before the rest of the page's AI section renders, so a slow
      // service must not hold that section up for long.
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) return false;

    const json = await res.json().catch(() => null);
    return json?.data?.configured === true;
  } catch {
    return false;
  }
}
