import { cookies } from "next/headers";
import { NextResponse } from "next/server";

const BASE = process.env.NEXT_PUBLIC_API_URL;

export const PUT = async (
  request: Request,
  { params }: { params: Promise<{ id: string; group_id: string }> },
) => {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;
  const body = await request.json();
  const { id, group_id } = await params;

  const res = await fetch(
    `${BASE}/business/tax/${id}/${group_id}/updategroup`,
    {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    },
  );

  const data = await res.json();
  return NextResponse.json(data, {
    status: res.status,
  });
};

export const DELETE = async (
  _request: Request,
  { params }: { params: Promise<{ id: string; group_id: string }> },
) => {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;
  const { id, group_id } = await params;

  const res = await fetch(
    `${BASE}/business/tax/${id}/${group_id}/delete-group`,
    {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    },
  );

  const data = await res.json();
  return NextResponse.json(data, {
    status: res.status,
  });
};
