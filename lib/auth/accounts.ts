import { NextRequest, NextResponse } from "next/server";

import { ROLE_COOKIE } from "@/lib/auth/roles";

/**
 * Multi-account session store.
 *
 * The app authenticates with a single httpOnly `token` cookie (forwarded to the
 * backend as a Bearer token). To support switching between accounts without
 * re-entering a password each time, we ALSO keep a second httpOnly cookie
 * (`pos_accounts`) that remembers the session token issued for every account
 * the user has logged into on this device.
 *
 * IMPORTANT: we never store passwords — only the per-account session tokens the
 * backend already handed out at login. Switching simply copies the chosen
 * account's token into the active `token` cookie. Both cookies are httpOnly, so
 * client JS can never read the tokens (safe against XSS reads).
 */

export const TOKEN_COOKIE = "token";
export const ACCOUNTS_COOKIE = "pos_accounts";
export const MAX_ACCOUNTS = 5;

export type StoredAccount = {
  /** Backend userId — stable identity for dedupe/switch. */
  id: string;
  /** Email or phone used to log in (shown in the switcher). */
  label: string;
  /** Business name for this account (fetched at login / refreshed on switch). */
  businessName?: string;
  role?: string;
  /** Session token issued for this account. */
  token: string;
};

export type AccountsStore = {
  accounts: StoredAccount[];
  activeId: string | null;
};

const cookieBase = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
  maxAge: 60 * 60 * 24 * 7, // 7 days — matches the `token` cookie
};

export function readAccounts(req: NextRequest): AccountsStore {
  const raw = req.cookies.get(ACCOUNTS_COOKIE)?.value;
  if (!raw) return { accounts: [], activeId: null };
  try {
    const parsed = JSON.parse(raw) as AccountsStore;
    if (parsed && Array.isArray(parsed.accounts)) {
      return { accounts: parsed.accounts, activeId: parsed.activeId ?? null };
    }
  } catch {
    // malformed cookie — treat as empty
  }
  return { accounts: [], activeId: null };
}

export function writeAccounts(res: NextResponse, store: AccountsStore) {
  res.cookies.set(ACCOUNTS_COOKIE, JSON.stringify(store), cookieBase);
}

export function setToken(res: NextResponse, token: string) {
  res.cookies.set(TOKEN_COOKIE, token, cookieBase);
}

export function clearToken(res: NextResponse) {
  res.cookies.set(TOKEN_COOKIE, "", { ...cookieBase, maxAge: 0 });
}

/**
 * Mirror the session's role into its own cookie.
 *
 * The token is opaque to us, so the middleware has no way to tell an admin's
 * session from a staff one without asking the backend on every navigation.
 * This cookie is that answer, cached. It is written only where the token is
 * written, and cleared wherever the token is cleared, so the two cannot drift.
 *
 * It is a cache, not the authority: the layout re-checks the role against the
 * profile endpoint, which is what catches a cookie somebody set by hand.
 */
export function setRole(res: NextResponse, role: string | undefined) {
  res.cookies.set(ROLE_COOKIE, role ?? "", cookieBase);
}

export function clearRole(res: NextResponse) {
  res.cookies.set(ROLE_COOKIE, "", { ...cookieBase, maxAge: 0 });
}

export function clearAccounts(res: NextResponse) {
  res.cookies.set(ACCOUNTS_COOKIE, "", { ...cookieBase, maxAge: 0 });
}

/**
 * Insert-or-update an account (dedupe by id) and mark it active. Newest first,
 * capped at MAX_ACCOUNTS.
 */
export function upsertActiveAccount(
  store: AccountsStore,
  account: StoredAccount,
): AccountsStore {
  const others = store.accounts.filter((a) => a.id !== account.id);
  const accounts = [account, ...others].slice(0, MAX_ACCOUNTS);
  return { accounts, activeId: account.id };
}

/** Resolve which stored account matches the currently active `token` cookie. */
export function resolveActiveId(
  store: AccountsStore,
  activeToken: string | undefined,
): string | null {
  const byToken = store.accounts.find((a) => a.token === activeToken);
  return byToken?.id ?? store.activeId;
}
