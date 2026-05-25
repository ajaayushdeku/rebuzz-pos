import axios from "axios";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

const BASE = process.env.NEXT_PUBLIC_API_URL;

export const GET = async () => {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;

  const res = await axios.get(`${BASE}/business/aboutBusiness`, {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });
  const data = res.data;
  return NextResponse.json(data, {
    status: res.status,
  });
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

export const PUT = async (request: Request) => {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;
  const body = await request.json();

  try {
    const response = await axios.put(`${BASE}/business/aboutBusiness`, body, {
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
      { error: "Failed to update business" },
      { status: 500 },
    );
  }
};
