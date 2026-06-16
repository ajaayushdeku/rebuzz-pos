import axios from "axios";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

const BASE = process.env.NEXT_PUBLIC_API_URL;

export const GET = async () => {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;

  const res = await axios.get(`${BASE}/business/products/popular`, {
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
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;

    const body = await request.json();

    const formData = new FormData();

    formData.append("name", body.name);
    formData.append("price", String(body.price));
    formData.append("costPrice", String(body.costPrice));
    formData.append("description", body.description ?? "");
    formData.append("isTaxable", String(body.isTaxable ?? false));
    formData.append("usesStocks", String(body.usesStocks ?? false));
    formData.append("showInOrdering", String(body.showInOrdering ?? false));
    formData.append("isAiImageEnabled", String(body.isAiImageEnabled ?? false));
    formData.append(
      "isUnsplashImageEnabled",
      String(body.isUnsplashImageEnabled ?? false),
    );
    formData.append("discountType", body.discountType ?? "applyEverytime");

    if (body.soldBy) {
      formData.append("soldBy", body.soldBy);
    }

    if (body.categories) {
      formData.append("categories", body.categories);
    }

    if (body.usesStocks) {
      formData.append("inStock", String(body.inStock ?? 0));
      formData.append("lowStock", String(body.lowStock ?? 0));
    }

    // Debug log
    for (const [key, value] of formData.entries()) {
      console.log(`${key}:`, value);
    }

    const res = await fetch(`${BASE}/business/products`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        // ❌ Do NOT manually set Content-Type for FormData
      },
      body: formData,
    });

    const data = await res.json();

    return NextResponse.json(data, {
      status: res.status,
    });
  } catch (error) {
    console.error("Create product error:", error);

    return NextResponse.json(
      {
        message: "Internal server error",
      },
      {
        status: 500,
      },
    );
  }
};
