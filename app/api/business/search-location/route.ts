import axios from "axios";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

const BASE = process.env.NEXT_PUBLIC_API_URL;

export const GET = async (request: NextRequest) => {
  const query = request.nextUrl.searchParams.get("query");
  if (!query) {
    return NextResponse.json({ locations: [] });
  }

  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;

  try {
    const res = await axios.get(
      `${BASE}/business/aboutBusiness/search-location?query=${encodeURIComponent(query)}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      },
    );
    return NextResponse.json(res.data, { status: res.status });
  } catch (error) {
    console.error("Search location error:", error);
    return NextResponse.json({ locations: [] }, { status: 200 });
  }
};
