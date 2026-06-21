import axios from "axios";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

const BASE = process.env.NEXT_PUBLIC_API_URL;

const getErrorMessage = (error: unknown, defaultMessage: string) => {
  if (axios.isAxiosError(error) && error.response?.data?.message) {
    return error.response.data.message as string;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return defaultMessage;
};

export const GET = async () => {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;

  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const res = await axios.get(`${BASE}/business/users/roles/employee`, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    return NextResponse.json(res.data, { status: res.status });
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch staff" },
      { status: 500 },
    );
  }
};

export const POST = async (request: NextRequest) => {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;

  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { name, email, phone, role } = await request.json();

  try {
    const res = await axios.post(
      `${BASE}/java/auth/user/create`,
      { name, email, phone, role },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      },
    );

    return NextResponse.json(res.data, { status: res.status });
  } catch (error: unknown) {
    const message = getErrorMessage(error, "Failed to create staff");
    return NextResponse.json({ error: message }, { status: 500 });
  }
};

export const PUT = async (request: NextRequest) => {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;

  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { userId, name, email, phone, role } = body;

  if (!userId) {
    return NextResponse.json({ error: "User ID is required" }, { status: 400 });
  }

  try {
    const res = await axios.put(
      `${BASE}/business/users/${userId}`,
      { name, email, phone, isEmployee: true, role },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      },
    );

    return NextResponse.json(res.data, { status: res.status });
  } catch (error: unknown) {
    const message = getErrorMessage(error, "Failed to update staff");
    return NextResponse.json({ error: message }, { status: 500 });
  }
};

export const DELETE = async (request: NextRequest) => {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get("userId");

  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!userId) {
    return NextResponse.json({ error: "User ID is required" }, { status: 400 });
  }

  try {
    const res = await axios.delete(
      `${BASE}/business/auth/user/${userId}/delete`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      },
    );

    return NextResponse.json(res.data, { status: res.status });
  } catch (error: unknown) {
    const message = getErrorMessage(error, "Failed to delete staff");
    return NextResponse.json({ error: message }, { status: 500 });
  }
};
