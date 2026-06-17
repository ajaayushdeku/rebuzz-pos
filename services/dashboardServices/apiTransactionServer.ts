import { mapBillsToTransactions } from "@/lib/mappers/transaction";
import { authHeaders } from "../authServices/session";
import { RawBillListResponse } from "@/lib/types/bill";
import { Transaction } from "@/components/dashboardComponents/orderHistory/transaction-columns";

const BASE = process.env.NEXT_PUBLIC_API_URL;

// ── Fetch all users to build a customerId → name lookup ──────────────────────

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

// ── RawBill with customerId ──────────────────────────────────────────────────

type BillWithCustomerId = {
  customerId?: string | null;
};

export async function getTransactions(): Promise<Transaction[]> {
  try {
    const [billRes, users] = await Promise.all([
      fetch(`${BASE}/business/ticket/bills?limit=500`, {
        headers: await authHeaders(),
        next: { revalidate: 60 },
      }),
      fetchAllUsers(),
    ]);

    if (!billRes.ok)
      throw new Error(`Failed to fetch transactions: ${billRes.status}`);

    const data: RawBillListResponse = await billRes.json();

    // Build customerId → name lookup
    const customerNameMap = new Map<string, string>();
    for (const user of users) {
      customerNameMap.set(user._id, user.name);
    }

    // Map bills to transactions
    const transactions = mapBillsToTransactions(data);

    // Enrich each transaction with the customer name from the lookup
    return transactions.map((t) => {
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
  } catch (error) {
    console.error("getTransactions error:", error);
    return [];
  }
}
