import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

const BASE = process.env.NEXT_PUBLIC_API_URL;

interface BillRecord {
  _id: string;
  generatedById: string;
  invoiceNo: number;
  [key: string]: unknown;
}

interface BillDetailItem {
  product?: string;
  productName?: string;
  quantity?: number;
  _id?: string;
  [key: string]: unknown;
}

interface BillDetailItemWrapper {
  item?: BillDetailItem[];
  [key: string]: unknown;
}

interface BillDetail {
  data?: {
    bill?: {
      items?: BillDetailItemWrapper[];
      [key: string]: unknown;
    };
    [key: string]: unknown;
  };
  [key: string]: unknown;
}

export const GET = async (
  request: NextRequest,
  { params }: { params: Promise<{ employeeId: string }> },
) => {
  const { employeeId } = await params;
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;

  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const startDate = searchParams.get("startDate") ?? "";
  const endDate = searchParams.get("endDate") ?? "";

  try {
    // Fetch bills from the external API with limit=10
    let billsUrl = `${BASE}/business/ticket/bills?limit=10`;
    if (startDate) billsUrl += `&startDate=${startDate}`;
    if (endDate) billsUrl += `&endDate=${endDate}`;

    const billsRes = await fetch(billsUrl, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    if (!billsRes.ok) {
      return NextResponse.json(
        { error: "Failed to fetch bills" },
        { status: billsRes.status },
      );
    }

    const billsData = await billsRes.json();
    const allBills: BillRecord[] =
      billsData?.data?.bill ?? billsData?.bill ?? billsData?.data ?? [];

    console.log("BILLS DATA:", allBills);
    // Filter bills for the selected employee
    const employeeBills = allBills.filter(
      (bill) => bill.generatedById === employeeId,
    );

    // Fetch item details for each bill
    const itemMap = new Map<string, { name: string; quantity: number }>();

    await Promise.all(
      employeeBills.map(async (bill) => {
        try {
          const billRes = await fetch(
            `${BASE}/business/ticket/${bill.invoiceNo}/bill`,
            {
              headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
              },
            },
          );

          if (!billRes.ok) return;

          const billDetail: BillDetail = await billRes.json();
          const itemWrappers = billDetail?.data?.bill?.items ?? [];

          itemWrappers.forEach((wrapper) => {
            const innerItems = wrapper.item ?? [];
            innerItems.forEach((innerItem) => {
              const itemId =
                (innerItem.product as string) || innerItem._id || "unknown";
              const itemName =
                (innerItem.productName as string) || "Unknown Item";
              const quantity = (innerItem.quantity as number) || 0;

              const existing = itemMap.get(itemId);
              if (existing) {
                existing.quantity += quantity;
              } else {
                itemMap.set(itemId, { name: itemName, quantity });
              }
            });
          });
        } catch {
          // Skip failed bill detail fetches
        }
      }),
    );

    // Convert to array and sort by quantity
    const topItems = Array.from(itemMap.entries())
      .map(([itemId, data]) => ({
        itemId,
        itemName: data.name,
        totalQuantity: data.quantity,
      }))
      .sort((a, b) => b.totalQuantity - a.totalQuantity)
      .slice(0, 10);

    return NextResponse.json({
      status: "success",
      data: {
        items: topItems,
        totalBillsAnalyzed: employeeBills.length,
      },
    });
  } catch (error) {
    console.error("Error fetching top items:", error);
    return NextResponse.json(
      { error: "Failed to fetch top items data" },
      { status: 500 },
    );
  }
};
