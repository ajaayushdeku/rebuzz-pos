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
  /** When payment is expected, YYYY-MM-DD. Absent until one is set. */
  dueDate?: string | null;
  /**
   * Days relative to `dueDate` on which a reminder goes out — negative before,
   * 0 on the day, positive once overdue.
   */
  reminderSchedule?: number[] | null;
  /** When the invoice or a reminder last went to the customer, as UTC. */
  lastReminderAt?: string | null;
  createdAt: string;
  updatedAt: string;
  customer?: {
    name: string;
    email: string;
    phone: string;
    customerPan?: string;
  } | null;
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
  /** Optional variant info when the item is a product variant. */
  variantId?: string;
  variantLabel?: string;
  variantItems?: {
    _id: string;
    name: string;
    unitPrice: number;
    quantity: number;
    costPrice: number;
  };
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
  /** Whether the tax is exclusive (added on top of the subtotal). */
  isTaxExclusive?: boolean;
};
