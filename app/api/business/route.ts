import axios from "axios";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

const BASE = process.env.NEXT_PUBLIC_API_URL;

// export const GET = async () => {
//   const cookieStore = await cookies();
//   const token = cookieStore.get("token")?.value;

//   const res = await axios.get(`${BASE}/business/aboutBusiness`, {
//     headers: {
//       Authorization: `Bearer ${token}`,
//       "Content-Type": "application/json",
//     },
//   });
//   const data = res.data;
//   return NextResponse.json(data, {
//     status: res.status,
//   });
// };

export const GET = async () => {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;

  try {
    const res = await fetch(`${BASE}/business/aboutBusiness`, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch business" },
      { status: 500 },
    );
  }
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

// export const PUT = async (request: Request) => {
//   const cookieStore = await cookies();
//   const token = cookieStore.get("token")?.value;
//   const body = await request.json();

//   try {
//     const response = await axios.put(`${BASE}/business/aboutBusiness`, body, {
//       headers: {
//         Authorization: `Bearer ${token}`,
//         "Content-Type": "application/json",
//       },
//     });

//     const result = response.data;
//     return NextResponse.json(result, {
//       status: response.status,
//     });
//   } catch (error) {
//     console.error(error);
//     return NextResponse.json(
//       { error: "Failed to update business" },
//       { status: 500 },
//     );
//   }
// };
export const PUT = async (request: NextRequest) => {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;

  try {
    // Read as FormData from the incoming request
    const incomingForm = await request.formData();

    // Forward the same FormData to the backend
    // fetch handles the multipart boundary automatically
    const response = await fetch(`${BASE}/business/aboutBusiness`, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
        // DO NOT set Content-Type here — fetch sets it with boundary automatically
      },
      body: incomingForm,
    });

    const result = await response.json();
    return NextResponse.json(result, { status: response.status });
  } catch (error) {
    console.error("Business update error:", error);
    return NextResponse.json(
      { error: "Failed to update business" },
      { status: 500 },
    );
  }
};
