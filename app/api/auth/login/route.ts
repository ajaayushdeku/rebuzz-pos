import { LoginRequest, LoginResponse } from "@/lib/types/auth";
import { NextRequest, NextResponse } from "next/server";
import axios from "axios";

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

    return response;
  } catch (error) {
    console.error(error);
  }
};
