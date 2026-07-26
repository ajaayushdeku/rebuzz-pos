import { LoginRequest, LoginResponse } from "@/lib/types/auth";
import { NextRequest, NextResponse } from "next/server";
import axios from "axios";
import {
  readAccounts,
  writeAccounts,
  upsertActiveAccount,
} from "@/lib/auth/accounts";

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

    const response = NextResponse.json({
      ok: true,
      data: responseLogin.data,
    });

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
