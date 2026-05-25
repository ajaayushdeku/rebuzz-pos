import { BillView } from "@/lib/types/expenses";

export const mockBillData: BillView[] = [
  {
    id: "1",
    bill_no: 1,
    vendor_name: "John's Shop",
    subtotal: 50,
    created_at: "2026-04-23",
    due_date: "2026-04-27",
    status: "Pay Out",
    comment: "Office supplies purchase",
  },
  {
    id: "2",
    bill_no: 2,
    vendor_name: "Bean Shop",
    subtotal: 80,
    created_at: "2026-04-25",
    due_date: "2026-04-25",
    status: "Pay In",
    comment: "Client payment received",
  },
  {
    id: "3",
    bill_no: 5,
    vendor_name: "Bean Shop",
    subtotal: 80,
    created_at: "2026-04-22",
    due_date: "2026-04-22",
    status: "Sales",
    comment: "Daily sales revenue",
  },
];
