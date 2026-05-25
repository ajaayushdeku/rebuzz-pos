// import { mockTransactions } from "@/components/dashboard/orderhistory/mock-transactions";
import { mapBillsToTransactions } from "@/lib/mappers/transaction";
import { authHeaders } from "../authServices/session";
import { RawBillListResponse } from "@/lib/types/bill";
import { Transaction } from "@/components/dashboardComponents/orderHistory/transaction-columns";
// import { mapBillsToTransactions } from "@/lib/mappers/transaction";

const BASE = process.env.NEXT_PUBLIC_API_URL;

export async function getTransactions(): Promise<Transaction[]> {
  const res = await fetch(`${BASE}/business/ticket/bills?limit=10`, {
    headers: await authHeaders(),
  });

  if (!res.ok) throw new Error(`Failed to fetch transactions: ${res.status}`);

  const data: RawBillListResponse = await res.json();
  return mapBillsToTransactions(data);
  // return mockTransactions;
}
