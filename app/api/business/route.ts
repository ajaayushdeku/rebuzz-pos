import axios from "axios";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

import { DEMO_EDIT_LOCKED_REASON } from "@/lib/auth/demoAccount";
import { isDemoSession } from "@/lib/auth/demoSession";

const BASE = process.env.NEXT_PUBLIC_API_URL;

// export const GET = async () => {
//   const cookieStore = await cookies();
//   const token = cookieStore.get("token")?.value;

//   const res = await axios.get(`${BASE}/business/aboutBusiness`, {
//     headers: {
//       Authorization: `Bearer ${token}`,
//       "Content-Type": "application/json",
//     },
//   });
//   const data = res.data;
//   return NextResponse.json(data, {
//     status: res.status,
//   });
// };

export const GET = async () => {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;

  try {
    const res = await fetch(`${BASE}/business/aboutBusiness`, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch business" },
      { status: 500 },
    );
  }
};

export const POST = async (request: Request) => {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;
  const body = await request.json();

  try {
    const response = await axios.post(`${BASE}/business/aboutBusiness`, body, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    const result = response.data;
    return NextResponse.json(result, {
      status: response.status,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to create business" },
      { status: 500 },
    );
  }
};

// export const PUT = async (request: Request) => {
//   const cookieStore = await cookies();
//   const token = cookieStore.get("token")?.value;
//   const body = await request.json();

//   try {
//     const response = await axios.put(`${BASE}/business/aboutBusiness`, body, {
//       headers: {
//         Authorization: `Bearer ${token}`,
//         "Content-Type": "application/json",
//       },
//     });

//     const result = response.data;
//     return NextResponse.json(result, {
//       status: response.status,
//     });
//   } catch (error) {
//     console.error(error);
//     return NextResponse.json(
//       { error: "Failed to update business" },
//       { status: 500 },
//     );
//   }
// };
/**
 * Update the business profile — refused for the shared demo account.
 *
 * This is the block, not the disabled button on the settings page: it holds for
 * a tab left open, a replayed request and anything else that reaches the route
 * without going through the screen. Every other account is unaffected.
 *
 * Checked before the body is parsed, so a refused request never buffers the
 * multipart logo upload that came with it.
 *
 * 403 rather than 404: the route exists and the caller is signed in, this
 * particular account is simply not allowed to write. `GET` (the page's own
 * read) and `POST` (onboarding creating the business) are untouched, as is the
 * separate currency route.
 */
export const PUT = async (request: NextRequest) => {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;

  if (await isDemoSession(token)) {
    return NextResponse.json(
      { status: "fail", message: DEMO_EDIT_LOCKED_REASON },
      { status: 403 },
    );
  }

  try {
    // Read as FormData from the incoming request
    const incomingForm = await request.formData();

    // Forward the same FormData to the backend
    // fetch handles the multipart boundary automatically
    const response = await fetch(`${BASE}/business/aboutBusiness`, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
        // DO NOT set Content-Type here — fetch sets it with boundary automatically
      },
      body: incomingForm,
    });

    const result = await response.json();
    return NextResponse.json(result, { status: response.status });
  } catch (error) {
    console.error("Business update error:", error);
    return NextResponse.json(
      { error: "Failed to update business" },
      { status: 500 },
    );
  }
};
