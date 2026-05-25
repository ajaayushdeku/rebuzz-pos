export type RawTicketItem = {
  _id: string;
  product: string;
  productName: string;
  unitPrice: number;
  preTaxPrice: number;
  taxApplied: boolean;
  taxAmount: number;
  costPrice: number;
  quantity: number;
  discount: number;
  isTaxable: boolean;
  note: string | null;
  addons: unknown[];
  discounts: unknown[];
  categories: string | null;
};

export type RawTicket = {
  _id: string;
  invoice: number;
  ticketName: string;
  adminId: string;
  businessId?: string;
  customerEmail: string | null;
  phoneNumber?: string | null;
  grandTotal: number;
  total: number;
  discount?: number;
  totalTax: number;
  paymentMethod?: string;
  paidStatus: string;
  ticketType?: string;
  checkedOut: boolean;
  archivedAt: string | null;
  items: RawTicketItem[];
  createdAt: string;
  updatedAt: string;
};

export type RawTicketListResponse = {
  status: string;
  data: {
    tickets: RawTicket[];
  };
};

export type CreateTicketItem = {
  id: string;
  name: string;
  quantity: number;
  unitPrice: number;
  note: string | null;
  discounts: unknown[];
  isTaxable: boolean;
};

export type CreateTicketInput = {
  ticketName: string;
  items: CreateTicketItem[];
  taxId: string | null;
  grandTotal: number;
  total: number;
  discount?: number;
  totalDiscount?: number;
  phoneNumber: string;
  customerEmail: string;
  note: string;
};
