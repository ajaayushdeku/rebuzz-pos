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

    // The client sends multipart/form-data so the (optional) product image
    // survives the proxy. Rebuild it here to apply defaults for missing fields.
    const incoming = await request.formData();
    const str = (key: string, fallback = "") => {
      const v = incoming.get(key);
      return v == null || v instanceof File ? fallback : String(v);
    };
    const usesStocks = str("usesStocks", "false") === "true";

    const formData = new FormData();

    formData.append("name", str("name"));
    formData.append("price", str("price", "0"));
    formData.append("costPrice", str("costPrice", "0"));
    formData.append("description", str("description"));
    formData.append("isTaxable", str("isTaxable", "false"));
    formData.append("usesStocks", String(usesStocks));
    formData.append("showInOrdering", str("showInOrdering", "false"));
    formData.append("isAiImageEnabled", str("isAiImageEnabled", "false"));
    formData.append(
      "isUnsplashImageEnabled",
      str("isUnsplashImageEnabled", "false"),
    );
    formData.append("discountType", str("discountType", "applyEverytime"));

    const soldBy = str("soldBy");
    if (soldBy) {
      formData.append("soldBy", soldBy);
    }

    const categories = str("categories");
    if (categories) {
      formData.append("categories", categories);
    }

    if (usesStocks) {
      formData.append("inStock", str("inStock", "0"));
      formData.append("lowStock", str("lowStock", "0"));
    }

    const image = incoming.get("image");
    if (image instanceof File && image.size > 0) {
      formData.append("image", image, image.name || "product_image.jpg");
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
