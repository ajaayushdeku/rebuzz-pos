import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

const BASE = process.env.NEXT_PUBLIC_API_URL;

export const GET = async (req: NextRequest) => {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;

    if (!token) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = req.nextUrl;
    const endDate =
      searchParams.get("endDate") ?? new Date().toISOString().split("T")[0];
    const startDate =
      searchParams.get("startDate") ??
      new Date(Date.now() - 365 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split("T")[0];

    // Fetch bills, products, and categories in parallel
    const [billsRes, productsRes, categoriesRes] = await Promise.all([
      fetch(
        `${BASE}/business/ticket/bills?startDate=${startDate}&endDate=${endDate}&limit=5000`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          next: { revalidate: 300 },
        },
      ),
      fetch(`${BASE}/business/products/popular`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        next: { revalidate: 3600 },
      }),
      fetch(`${BASE}/business/categories/`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        next: { revalidate: 3600 },
      }),
    ]);

    if (!billsRes.ok || !productsRes.ok || !categoriesRes.ok) {
      return NextResponse.json(
        { message: "Failed to fetch required data" },
        { status: 500 },
      );
    }

    const billsData = await billsRes.json();
    const productsData = await productsRes.json();
    const categoriesData = await categoriesRes.json();

    const bills = billsData?.data?.bill ?? [];
    const products = productsData?.data ?? [];
    const categories = categoriesData?.data ?? [];

    // Create a map of product ID to category ID
    const productToCategoryMap = new Map<string, string>();
    for (const product of products) {
      if (product._id && product.categories && product.categories.length > 0) {
        // Use the first category (or could be an array)
        const categoryId =
          typeof product.categories[0] === "string"
            ? product.categories[0]
            : product.categories[0]?._id;
        if (categoryId) {
          productToCategoryMap.set(product._id, categoryId);
        }
      }
    }

    // Create a map of category ID to category name
    const categoryNameMap = new Map<string, string>();
    for (const category of categories) {
      if (category._id && category.name) {
        categoryNameMap.set(category._id, category.name);
      }
    }

    // Aggregate tax by category
    const categoryTaxMap = new Map<
      string,
      { revenue: number; taxAmount: number }
    >();

    for (const bill of bills) {
      // Skip refunded bills
      if (bill.isRefunded) continue;

      // Get items from bill
      const items = bill.items ?? [];

      for (const itemEntry of items) {
        const billItems = itemEntry.item ?? [];

        for (const billItem of billItems) {
          const productId = billItem.product;
          if (!productId) continue;

          // Get category ID from product
          const categoryId = productToCategoryMap.get(productId);
          if (!categoryId) continue;

          // Get category name
          const categoryName = categoryNameMap.get(categoryId) || "Unknown";

          // Calculate item totals
          const quantity = billItem.quantity || 1;
          const unitPrice = billItem.unitPrice || 0;
          const taxAmount = billItem.taxAmount || 0;
          const itemRevenue = unitPrice * quantity;

          // Aggregate
          const existing = categoryTaxMap.get(categoryName) || {
            revenue: 0,
            taxAmount: 0,
          };
          categoryTaxMap.set(categoryName, {
            revenue: existing.revenue + itemRevenue,
            taxAmount: existing.taxAmount + taxAmount,
          });
        }
      }
    }

    // Convert to array and sort by tax amount
    const result = Array.from(categoryTaxMap.entries())
      .map(([category, data]) => ({
        category,
        revenue: data.revenue,
        taxAmount: data.taxAmount,
      }))
      .sort((a, b) => b.taxAmount - a.taxAmount);

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    console.error("Tax by category error:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 },
    );
  }
};
