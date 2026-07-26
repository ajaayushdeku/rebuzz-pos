import { NextRequest, NextResponse } from "next/server";
import {
  readAccounts,
  resolveActiveId,
  TOKEN_COOKIE,
} from "@/lib/auth/accounts";

/** List the saved accounts on this device (metadata only — never the tokens). */
export const GET = async (req: NextRequest) => {
  const store = readAccounts(req);
  const activeToken = req.cookies.get(TOKEN_COOKIE)?.value;
  const activeId = resolveActiveId(store, activeToken);

  return NextResponse.json({
    accounts: store.accounts.map((a) => ({
      id: a.id,
      label: a.label,
      businessName: a.businessName ?? null,
      role: a.role ?? null,
      active: a.id === activeId,
    })),
  });
};
