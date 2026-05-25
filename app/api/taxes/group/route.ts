import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

const BASE = process.env.NEXT_PUBLIC_API_URL;

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;
    const body = await request.json();

    const res = await fetch(`${BASE}/business/tax/grouptaxes`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    const data = await res.json();

    console.log("All Taxes:", data);

    if (!res.ok) {
      return NextResponse.json(
        { message: data?.message || "Failed to create group tax" },
        { status: res.status },
      );
    }
    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    console.error("Group tax error:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 },
    );
  }
}
