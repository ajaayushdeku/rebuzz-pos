import { NextRequest, NextResponse } from "next/server";
import { authHeaders } from "@/services/authServices/session";
import { RawBillListResponse } from "@/lib/types/bill";
import { mapBillsToTransactions } from "@/lib/mappers/transaction";

const BASE = process.env.NEXT_PUBLIC_API_URL;

type RawUser = {
  _id: string;
  name: string;
};

async function fetchAllUsers(): Promise<RawUser[]> {
  try {
    const res = await fetch(`${BASE}/business/users/roles/user`, {
      headers: await authHeaders(),
      next: { revalidate: 300 },
    });
    if (!res.ok) return [];
    const json = await res.json();
    return json?.data?.users ?? [];
  } catch {
    return [];
  }
}

type BillWithCustomerId = {
  customerId?: string | null;
};

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    let url = `${BASE}/business/ticket/bills?limit=500`;
    if (startDate) url += `&startDate=${startDate}`;
    if (endDate) url += `&endDate=${endDate}`;

    const [billRes, users] = await Promise.all([
      fetch(url, {
        headers: await authHeaders(),
        next: { revalidate: 60 },
      }),
      fetchAllUsers(),
    ]);

    if (!billRes.ok) {
      return NextResponse.json(
        { error: "Failed to fetch transactions" },
        { status: billRes.status },
      );
    }

    const data: RawBillListResponse = await billRes.json();

    // Build customerId → name lookup
    const customerNameMap = new Map<string, string>();
    for (const user of users) {
      customerNameMap.set(user._id, user.name);
    }

    // Map bills to transactions
    const transactions = mapBillsToTransactions(data);

    // Enrich each transaction with the customer name from the lookup
    const enriched = transactions.map((t) => {
      const bill = data.data.bill.find((b) => `ORD-${b.invoiceNo}` === t.id) as
        | BillWithCustomerId
        | undefined;

      const customerId = bill?.customerId;
      const customerName = customerId
        ? (customerNameMap.get(customerId) ?? null)
        : null;

      return {
        ...t,
        customer: customerName
          ? { name: customerName, email: "", phone: "" }
          : t.customer,
      };
    });

    return NextResponse.json({ data: enriched });
  } catch (error) {
    console.error("Order history transactions error:", error);
    return NextResponse.json({ data: [] }, { status: 500 });
  }
}
