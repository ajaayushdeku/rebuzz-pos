import { cookies } from "next/headers";
import { NextResponse } from "next/server";

const BASE = process.env.NEXT_PUBLIC_API_URL;

export async function POST(request: Request) {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;
  const contentType = request.headers.get("content-type") ?? "";
  const isMultipart = contentType.includes("multipart/form-data");

  // Multipart carries the profile photo and is forwarded as-is; JSON is kept
  // for callers that don't upload an image.
  const headers: Record<string, string> = { Authorization: `Bearer ${token}` };
  let upstreamBody: BodyInit;
  let fields: Record<string, unknown>;

  if (isMultipart) {
    const formData = await request.formData();
    fields = Object.fromEntries(
      [...formData.entries()].map(([k, v]) => [
        k,
        typeof v === "string" ? v : v.name,
      ]),
    );
    // DO NOT set Content-Type — fetch re-encodes with a fresh boundary
    upstreamBody = formData;
  } else {
    const body = await request.json();
    fields = body;
    headers["Content-Type"] = "application/json";
    upstreamBody = JSON.stringify(body);
  }

  const { name, email, phone, countryCode } = fields as Record<string, string>;
  if (!name || !email || !phone || !countryCode) {
    return NextResponse.json(
      { message: "Name, email, phone, and country code are required" },
      { status: 400 },
    );
  }

  const response = await fetch(`${BASE}/business/auth/customer/create`, {
    method: "POST",
    headers,
    body: upstreamBody,
  });

  const data = await response.json();

  if (!response.ok) {
    return NextResponse.json(
      { message: data?.message || "Failed to create customer" },
      { status: response.status },
    );
  }

  return NextResponse.json(data, { status: response.status });
}

// import axios from "axios";
// import { cookies } from "next/headers";
// import { NextResponse } from "next/server";

// export async function POST(request: Request) {
//   const cookieStore = await cookies();
//   const token = cookieStore.get("token")?.value;
//   const body = await request.json();

//   const { name, email, phone, countryCode } = body;
//   if (!name || !email || !phone || !countryCode) {
//     return NextResponse.json(
//       { message: "Name, email, phone, and country code are required" },
//       { status: 400 },
//     );
//   }

//   const response = await axios.post(
//     `${BASE}/business/auth/customer/create`,
//     { body },
//     {
//       headers: {
//         Authorization: `Bearer ${token}`,
//         "Content-Type": "application/json",
//       },
//     },
//   );

//   const data = response.data;

//   // if (!response.ok) {
//   //   return NextResponse.json(
//   //     { message: data?.message || "Failed to create customer" },
//   //     { status: response.status },
//   //   );
//   // }

//   return NextResponse.json(data, { status: response.status });
// }
