import { NextRequest, NextResponse } from "next/server";

import {
  TOKEN_COOKIE,
  clearCurrencyCookie,
  clearRole,
  clearToken,
  readAccounts,
  writeAccounts,
} from "@/lib/auth/accounts";

/**
 * End a session the backend has stopped accepting, and land on the login page.
 *
 * A route handler rather than something the layout does itself, because a
 * server component cannot write cookies while rendering — only a handler can.
 * `app/(app)/layout.tsx` redirects here the moment `sessionStatus` reports
 * `expired`, so this is the one place that both clears and explains.
 *
 * A `GET`, because a redirect is a GET. The existing `POST /api/auth/logout`
 * does the same clearing for a deliberate sign-out and stays as it is: that one
 * also tells the backend, which is pointless for a token it has already
 * rejected, and it clears every saved account, which would be wrong here.
 *
 * Nothing about this is destructive beyond the session — no data is touched —
 * so there is no confirmation to ask for. Arriving here means the session is
 * already over.
 */
export const GET = async (req: NextRequest) => {
  const token = req.cookies.get(TOKEN_COOKIE)?.value;

  // `expired=1` so the login page can say why it is being shown, rather than
  // appearing to have logged the user out for no reason.
  const res = NextResponse.redirect(new URL("/login?expired=1", req.url));

  clearToken(res);
  // The role cookie shadows the token, so it goes at the same moment — left
  // behind, the middleware would read a role for a session that is gone.
  clearRole(res);
  // The currency belonged to the session, not the device.
  clearCurrencyCookie(res);

  /*
   * Drop this one account from the switcher, and leave the others.
   *
   * Only the active token is known to be dead; another saved account may still
   * be good, and clearing the lot would sign the user out of businesses that
   * were working fine. Keeping the dead one would be worse than useless,
   * though: it would sit in the switcher offering a session that cannot work.
   *
   * `activeId` is cleared because the account it pointed at is the one leaving.
   */
  const store = readAccounts(req);
  const remaining = store.accounts.filter((account) => account.token !== token);

  if (remaining.length !== store.accounts.length) {
    writeAccounts(res, { accounts: remaining, activeId: null });
  }

  return res;
};
