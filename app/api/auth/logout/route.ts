import axios from "axios";
import { NextRequest, NextResponse } from "next/server";
import { clearAccounts, clearRole } from "@/lib/auth/accounts";

const BASE = process.env.NEXT_PUBLIC_API_URL;

export const POST = async (req: NextRequest) => {
  const token = req.cookies.get("token")?.value;

  try {
    if (token) {
      await axios.post(`${BASE}/java/auth/logout`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
    }
  } catch (error) {
    console.error("Backend logout failed:", error);
  }

  const response = NextResponse.json({
    success: true,
  });

  response.cookies.set("token", "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });

  // The role cookie shadows the token, so it goes at the same moment. Leaving
  // it behind would let the middleware read a role for a session that no
  // longer exists.
  clearRole(response);

  // Full sign-out clears every saved account too. To sign out of just one
  // account while staying in another, use "Remove" in the account switcher.
  clearAccounts(response);

  return response;
};
