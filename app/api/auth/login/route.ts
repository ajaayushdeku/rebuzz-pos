import { LoginRequest, LoginResponse } from "@/lib/types/auth";
import { NextRequest, NextResponse } from "next/server";
import axios from "axios";
import {
  readAccounts,
  writeAccounts,
  upsertActiveAccount,
  setRole,
  setCurrencyCookie,
  clearCurrencyCookie,
} from "@/lib/auth/accounts";
import { isAdminRole } from "@/lib/auth/roles";
import { currencyCodeForToken } from "@/lib/auth/sessionCurrency";

const BASE = process.env.NEXT_PUBLIC_API_URL;

export const POST = async (req: NextRequest) => {
  const body: LoginRequest = await req.json();

  try {
    const res = await axios.post(
      `${BASE}/business/auth/login/pos`,
      {
        hasKey: "any",
        keykey: "any",
        hasValueFor: "any",
        deviceToken: "any",
        ...body,
      },
      {
        headers: {
          "Content-Type": "application/json",
          accept: "*/*",
          app: "user",
        },
      },
    );

    const responseLogin: LoginResponse = await res.data;

    if (responseLogin.status !== "success") {
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 },
      );
    }

    // ── Role gate ──
    //
    // Checked before anything is written, so a non-admin leaves with no token
    // cookie, no role cookie and no entry in the account switcher. The
    // credentials were valid — the backend issued a token — but that token
    // never reaches the browser, so there is nothing to block later.
    if (!isAdminRole(responseLogin.data.role)) {
      return NextResponse.json(
        {
          error: "This account is not allowed to use the POS.",
          forbidden: true,
          role: responseLogin.data.role,
        },
        { status: 403 },
      );
    }

    const response = NextResponse.json({
      ok: true,
      data: responseLogin.data,
    });

    setRole(response, responseLogin.data.role);

    // A device that has held another business's session still has its currency
    // cookie. Reset it here so the first render after signing in is this
    // account's currency, not the last one's.
    const currencyCode = await currencyCodeForToken(responseLogin.data.token);
    if (currencyCode) {
      setCurrencyCookie(response, currencyCode);
    } else {
      clearCurrencyCookie(response);
    }

    response.cookies.set("token", responseLogin.data.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });

    // Best-effort: fetch the business name for this account so the switcher can
    // label it by business rather than by email.
    let businessName: string | undefined;
    try {
      const bizRes = await axios.get(`${BASE}/business/aboutBusiness`, {
        headers: { Authorization: `Bearer ${responseLogin.data.token}` },
      });
      businessName = bizRes.data?.data?.business?.businessName ?? undefined;
    } catch {
      // non-fatal — switcher falls back to the email label
    }

    // Remember this account (dedupe by userId) and make it the active one, so
    // it appears in the account switcher and can be switched back to without
    // re-entering the password.
    const updatedAccounts = upsertActiveAccount(readAccounts(req), {
      id: responseLogin.data.userId,
      label: body.email_or_phone,
      businessName,
      role: responseLogin.data.role,
      token: responseLogin.data.token,
    });
    writeAccounts(response, updatedAccounts);

    return response;
  } catch (error) {
    console.error(error);
  }
};
