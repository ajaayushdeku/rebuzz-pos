import { NextRequest, NextResponse } from "next/server";
import {
  readAccounts,
  writeAccounts,
  setToken,
  clearToken,
  clearAccounts,
  resolveActiveId,
  TOKEN_COOKIE,
} from "@/lib/auth/accounts";

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

  const res = NextResponse.json({
    ok: true,
    remaining: remaining.length,
    // Tell the client whether the active session changed / ended.
    switchedTo: wasActive ? (remaining[0]?.id ?? null) : activeId,
    signedOut: wasActive && remaining.length === 0,
  });

  if (remaining.length === 0) {
    clearAccounts(res);
    clearToken(res);
    return res;
  }

  if (wasActive) {
    setToken(res, remaining[0].token);
    writeAccounts(res, { accounts: remaining, activeId: remaining[0].id });
  } else {
    writeAccounts(res, { accounts: remaining, activeId });
  }
  return res;
};
