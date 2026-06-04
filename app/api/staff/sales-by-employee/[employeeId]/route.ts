import axios from "axios";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

const BASE = process.env.NEXT_PUBLIC_API_URL;

export const GET = async (
  _request: Request,
  { params }: { params: Promise<{ employeeId: string }> },
) => {
  const { employeeId } = await params;
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;

  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const res = await axios.get(
      `${BASE}/business/report/salesByEmployee/${employeeId}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      },
    );

    return NextResponse.json(res.data, { status: res.status });
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch employee sales data" },
      { status: 500 },
    );
  }
};
