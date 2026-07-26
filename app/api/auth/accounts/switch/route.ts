import { NextRequest, NextResponse } from "next/server";
import axios from "axios";
import { readAccounts, writeAccounts, setToken } from "@/lib/auth/accounts";

const BASE = process.env.NEXT_PUBLIC_API_URL;

/** Switch the active session to a previously saved account. */
export const POST = async (req: NextRequest) => {
  const { id } = (await req.json()) as { id?: string };
  const store = readAccounts(req);
  const target = store.accounts.find((a) => a.id === id);

  if (!target) {
    return NextResponse.json({ error: "Account not found" }, { status: 404 });
  }

  // Validate the saved token before switching. A stored token may have expired
  // on the backend — in that case we must NOT switch into a dead session.
  let businessName = target.businessName;
  try {
    const bizRes = await axios.get(`${BASE}/business/aboutBusiness`, {
      headers: { Authorization: `Bearer ${target.token}` },
    });
    businessName = bizRes.data?.data?.business?.businessName ?? businessName;
  } catch (err) {
    const status = axios.isAxiosError(err) ? err.response?.status : undefined;
    if (status === 401 || status === 403) {
      // Expired/invalid token — tell the client to re-authenticate this account.
      return NextResponse.json({
        ok: false,
        expired: true,
        label: target.label,
      });
    }
    // Transient/network error — allow the switch rather than blocking on it.
  }

  const res = NextResponse.json({ ok: true, id: target.id });
  // Copy the chosen account's saved token into the active `token` cookie.
  setToken(res, target.token);
  // Persist any refreshed business name alongside the new active account.
  const accounts = store.accounts.map((a) =>
    a.id === target.id ? { ...a, businessName } : a,
  );
  writeAccounts(res, { accounts, activeId: target.id });
  return res;
};
