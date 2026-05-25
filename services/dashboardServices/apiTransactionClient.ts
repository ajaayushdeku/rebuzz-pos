import { Transaction } from "@/components/dashboardComponents/orderHistory/transaction-columns";
import { mapDetailBillToTransaction } from "@/lib/mappers/transaction";
import { RawBillDetailResponse } from "@/lib/types/bill";

// const BASE = "https://appapi.rebuzzpos.com/api";

export async function getTransactionDetail(
  invoiceNo: number,
): Promise<Transaction> {
  const res = await fetch(`/api/transactions/${invoiceNo}`, {
    method: "GET",
  });
  if (!res.ok)
    throw new Error(`Failed to fetch transaction detail: ${res.status}`);
  const data: RawBillDetailResponse = await res.json();

  return mapDetailBillToTransaction(data);
}
