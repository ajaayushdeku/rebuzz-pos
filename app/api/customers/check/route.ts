import axios from "axios";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

const BASE = process.env.NEXT_PUBLIC_API_URL;

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;
    const body = await request.json();

    const response = await axios.post(
      `${BASE}/java/auth/user/check`,
      {
        hasKey: "any",
        keykey: "any",
        hasValueFor: "any",
        phone: body.phone,
        countryCode: body.countryCode,
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      },
    );

    const data = response.data;

    // if (!response.ok) {
    //   return NextResponse.json(
    //     { message: data?.message || "Failed to check user" },
    //     { status: response.status },
    //   );
    // }

    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 },
    );
  }
}
