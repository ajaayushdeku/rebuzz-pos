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
      // Same reasoning as the bill list: the key carries no account, so a
      // cached staff list could cross businesses on a shared device. Names
      // change rarely, but not being wrong matters more than a cache hit.
      cache: "no-store" as const,
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
        // No caching. `revalidate` here would hold the bill list in Next's
        // Data Cache, so a payment or refund taken a moment ago would not show
        // until the window elapsed — no client refetch can reach past it. The
        // cache key is also the URL alone, with the token only in the headers,
        // so on a device that switches business one account could be served
        // another's bills.
        cache: "no-store" as const,
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
        BillWithCustomerId | undefined;

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
