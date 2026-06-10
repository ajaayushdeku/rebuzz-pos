// import { mockTransactions } from "@/components/dashboard/orderhistory/mock-transactions";
import { mapBillsToTransactions } from "@/lib/mappers/transaction";
import { authHeaders } from "../authServices/session";
import { RawBillListResponse } from "@/lib/types/bill";
import { Transaction } from "@/components/dashboardComponents/orderHistory/transaction-columns";
// import { mapBillsToTransactions } from "@/lib/mappers/transaction";

const BASE = process.env.NEXT_PUBLIC_API_URL;

export async function getTransactions(): Promise<Transaction[]> {
  try {
    const res = await fetch(`${BASE}/business/ticket/bills?limit=10`, {
      headers: await authHeaders(),
      next: { revalidate: 60 },
    });

    if (!res.ok) throw new Error(`Failed to fetch transactions: ${res.status}`);

    const data: RawBillListResponse = await res.json();
    return mapBillsToTransactions(data);
  } catch (error) {
    console.error("getTransactions error:", error);
    return [];
  }
}
