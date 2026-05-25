import axios from "axios";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

const BASE = process.env.NEXT_PUBLIC_API_URL;

export const GET = async (request: Request) => {
  const { searchParams } = new URL(request.url);
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;
  const phone = searchParams.get("phone");
  const email = searchParams.get("email");

  const queryParam = phone ? `phone=${phone}` : `email=${email}`;

  try {
    const response = await axios.get(
      `${BASE}/business/users/roles/user?${queryParam}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      },
    );

    const result = response.data;
    return NextResponse.json(result);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Lookup failed" }, { status: 500 });
  }
};
