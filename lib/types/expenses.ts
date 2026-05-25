export type BillItem = {
  id: string;
  productId: string;
  name: string;
  quantity: number;
  price: number;
  description?: string;
};

export type Bill = {
  id: string;
  bill_no: number;
  vendor_name: string;
  description: string;
  price: number;
  created_at: string;
  due_date: string;
  status: string;
  notes: string;
  items: BillItem[];
  subtotal: number;
  discount: number;
  total: number;
};

export type BillView = {
  id: string;
  bill_no: number;
  vendor_name: string;
  subtotal: number;
  created_at?: string;
  due_date?: string;
  status: "Pay In" | "Pay Out" | "Sales";
  comment?: string;
  paymentMethod?: string;
};

export type BillStatus = "completed" | "pending" | "failed" | "refunded";

export const statusStyles: Record<BillStatus, { cell: string; badge: string }> =
  {
    completed: {
      cell: "text-green-800",
      badge: "bg-green-300",
    },
    pending: {
      cell: "text-yellow-800",
      badge: "bg-yellow-200",
    },
    failed: {
      cell: "text-red-800",
      badge: "bg-red-300",
    },
    refunded: {
      cell: "text-gray-800",
      badge: "bg-gray-300",
    },
  };
