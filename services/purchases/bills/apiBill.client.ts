import { mockBillData } from "@/lib/mockData/bill-mock-data";
import { BillView } from "@/lib/types/expenses";

export async function fetchBills(): Promise<BillView[]> {
  return mockBillData;
}
