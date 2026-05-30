import { cookies } from "next/headers";
import { NextResponse } from "next/server";

const BASE = process.env.NEXT_PUBLIC_API_URL;

export const PUT = async (
  request: Request,
  { params }: { params: Promise<{ invoice: string }> },
) => {
  const { invoice } = await params;
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;
  const body = await request.json();

  try {
    const response = await fetch(
      `${BASE}/business/ticket/${invoice}/update-ticketName`,
      {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body), // forward payload as-is
      },
    );

    const result = await response.json();

    if (!response.ok) {
      console.error("Update ticket API error:", result);
    }

    return NextResponse.json(result, { status: response.status });
  } catch (error) {
    console.error("Update ticket route error:", error);
    return NextResponse.json(
      { error: "Failed to update ticket" },
      { status: 500 },
    );
  }
};
