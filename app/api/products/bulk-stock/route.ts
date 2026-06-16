// import axios from "axios";
// import { cookies } from "next/headers";
// import { NextResponse } from "next/server";

// const BASE = process.env.NEXT_PUBLIC_API_URL;

// export const PUT = async (request: Request) => {
//   try {
//     const cookieStore = await cookies();
//     const token = cookieStore.get("token")?.value;

//     const body = await request.json();

//     const res = await axios.post(`${BASE}/business/products/bulkStock`, body, {
//       headers: {
//         Authorization: `Bearer ${token}`,
//         "Content-Type": "application/json",
//       },
//     });

//     return NextResponse.json(res.data, {
//       status: res.status,
//     });
//   } catch (error: any) {
//     console.error("Bulk stock update error:", error?.response?.data || error);
//     return NextResponse.json(
//       {
//         message: error?.response?.data?.message || "Internal server error",
//       },
//       {
//         status: error?.response?.status || 500,
//       },
//     );
//   }
// };

import axios from "axios";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

const BASE = process.env.NEXT_PUBLIC_API_URL;

export const PUT = async (request: Request) => {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;

    const body = await request.json();

    const res = await axios.put(`${BASE}/business/products/bulkStock`, body, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    return NextResponse.json(res.data, { status: res.status });
  } catch (error: any) {
    console.error("Bulk stock update error:", error?.response?.data || error);

    // 400 errors from backend have only `message` (no `status`)
    // 500 errors have `status: "failed"` + `message`/`error`
    const errData = error?.response?.data;

    return NextResponse.json(
      {
        message: errData?.message || errData?.error || "Internal server error",
      },
      { status: error?.response?.status || 500 },
    );
  }
};
