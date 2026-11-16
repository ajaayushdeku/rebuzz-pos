import { cookies } from "next/headers";
import { NextResponse } from "next/server";

const BASE = process.env.NEXT_PUBLIC_API_URL;

// ── GET /api/categories ────────────────────────────────────────────────────

export const GET = async () => {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;

    const res = await fetch(`${BASE}/business/addons/`, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    const data = await res.json();

    if (!res.ok) {
      return NextResponse.json(
        { message: data?.message || "Failed to fetch addons" },
        { status: res.status },
      );
    }

    return NextResponse.json(data, { status: res.status });
  } catch (error) {
    console.error("Fetch addons error:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 },
    );
  }
};

// ── POST /api/addons ──────────────────────────────────────────────────

export const POST = async (request: Request) => {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;

    const body = await request.json();

    const res = await fetch(`${BASE}/business/addons/`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    const data = await res.json();

    if (!res.ok) {
      return NextResponse.json(
        { message: data?.message || "Failed to create addon" },
        { status: res.status },
      );
    }

    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    console.error("Create addon error:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 },
    );
  }
};

// ── DELETE /api/addons (bulk) ─────────────────────────────────────────

// export const DELETE = async (request: Request) => {
//   try {
//     const cookieStore = await cookies();
//     const token = cookieStore.get("token")?.value;

//     const body = await request.json();

//     const res = await fetch(`${BASE}/business/addons/`, {
//       method: "DELETE",
//       headers: {
//         Authorization: `Bearer ${token}`,
//         "Content-Type": "application/json",
//       },
//       body: JSON.stringify(body),
//     });

//     const data = await res.json();

//     if (!res.ok) {
//       return NextResponse.json(
//         { message: data?.message || "Failed to delete addons" },
//         { status: res.status },
//       );
//     }

//     return NextResponse.json(data, { status: res.status });
//   } catch (error) {
//     console.error("Delete addons error:", error);
//     return NextResponse.json(
//       { message: "Internal server error" },
//       { status: 500 },
//     );
//   }
// };
