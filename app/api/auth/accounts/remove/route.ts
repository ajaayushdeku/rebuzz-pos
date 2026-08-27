import { NextRequest, NextResponse } from "next/server";
import {
  readAccounts,
  writeAccounts,
  setToken,
  clearToken,
  setRole,
  clearRole,
  clearAccounts,
  resolveActiveId,
  TOKEN_COOKIE,
} from "@/lib/auth/accounts";
import { isAdminRole } from "@/lib/auth/roles";

/**
 * Remove a saved account from this device. If the removed account was active,
 * fall back to another saved account (switching the session) or fully sign out
 * when none remain.
 */
export const POST = async (req: NextRequest) => {
  const { id } = (await req.json()) as { id?: string };
  const store = readAccounts(req);
  const activeToken = req.cookies.get(TOKEN_COOKIE)?.value;
  const activeId = resolveActiveId(store, activeToken);

  const remaining = store.accounts.filter((a) => a.id !== id);
  const wasActive = activeId === id;

  // Removing the active account hands the session to another saved one, so
  // that fallback runs the same gate as login and switching. Without it,
  // removing an admin account would quietly sign the device in as whichever
  // account happened to be next in the list.
  const fallback = remaining.find((a) => isAdminRole(a.role));

  const res = NextResponse.json({
    ok: true,
    remaining: remaining.length,
    // Tell the client whether the active session changed / ended.
    switchedTo: wasActive ? (fallback?.id ?? null) : activeId,
    signedOut: wasActive && !fallback,
  });

  if (remaining.length === 0) {
    clearAccounts(res);
    clearToken(res);
    clearRole(res);
    return res;
  }

  if (wasActive) {
    if (!fallback) {
      // Accounts are still saved, but none of them may sign in. Keep the list
      // and end the session rather than picking one that would be bounced.
      clearToken(res);
      clearRole(res);
      writeAccounts(res, { accounts: remaining, activeId: null });
      return res;
    }

    setToken(res, fallback.token);
    setRole(res, fallback.role);
    writeAccounts(res, { accounts: remaining, activeId: fallback.id });
  } else {
    writeAccounts(res, { accounts: remaining, activeId });
  }
  return res;
};
