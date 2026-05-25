export type RawBillItem = {
  preTaxPrice: number;
  taxApplied: boolean;
  taxAmount: number;
  costPrice: number;
  quantity: number;
  discount: number;
  isTaxable: boolean;
  _id: string;
  product: string;
  productName: string;
  unitPrice: number;
  discounts: unknown[];
  addons: unknown[];
};

export type RawBillEntry = {
  _id: string;
  item: RawBillItem[];
  createdAt: string;
};

export type RawBill = {
  _id: string;
  adminId: string;
  orderId: string;
  businessId: string | null;
  businessName: string;
  customerId: string | null;
  invoiceNo: number;
  paidBillNo: number;
  totalAmount: number;
  grandTotal: number;
  paymentMethod: string;
  generatedById: string;
  generatedBy: string;
  paidAt: string;
  taxamt: number;
  ticketName: string;
  discount: number | null;
  isSplitAmount?: boolean;
  cashAmount?: number;
  qrAmount?: number;
  costPrice: number;
  isRefunded: boolean;
  fonepay_prn: string | null;
  printCount: number;
  createdAt: string;
  updatedAt: string;
  // Only present in detail response
  customer?: { name: string; email: string; phone: string } | null;
  items?: RawBillEntry[];
  tax?: unknown;
  discountByPoints?: number;
  currentPoint?: number;
  totalPoints?: number;
};

export type RawBillListResponse = {
  status: string;
  data: {
    bill: RawBill[];
    nextCursor: string;
  };
};

export type RawBillDetailResponse = {
  status: string;
  data: {
    bill: RawBill;
  };
};
