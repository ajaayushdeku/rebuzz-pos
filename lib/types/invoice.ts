import { Product } from "./product";

export type Invoice = {
  invoice?: number;
  invoice_id: string;
  customer_name: string;
  ticket_name: string;
  amount: number;
  created_at: string;
  status: string;
};

export interface InvoiceStatsProps {
  invoices: Invoice[];
}
export interface InvoiceTableProps {
  invoices: Invoice[];
}
export interface InvoiceRowProps {
  invoice: Invoice;
}

export interface CreateInvoiceInput {
  customer_id: string;
  invoice_number: string;
  po_number?: string;
  invoice_date: string;
  items: {
    product_id: string;
    name: string;
    description: string;
    quantity: number;
    unit_price: number;
    total: number;
    tax_rate?: string;
  }[];
  discount_description?: string;
  discount_value?: number;
  discount_type?: "fixed" | "percentage";
  subtotal: number;
  total: number;
  currency: string;
  notes?: string;
  status?: string;
}

export interface InvoiceItem {
  id: string;
  productId: string;
  name: string;
  description: string | undefined;
  quantity: number;
  price: number;
  discounts: string[];
  taxes: string[];
  isTaxable: boolean;
}
// export interface Discount {
//   id: string;
//   description: string;
//   value: number;
//   type: "fixed" | "percentage";
// }

export interface Discount {
  _id: string;
  name: string;
  isEnabled: boolean;
  rate: number;
  type: "percentage" | "fixed";
}

export interface Tax {
  _id: string;
  name: string;
  isEnabled: boolean;
  rate: number;
}

export interface InvoiceItemsSelectorProps {
  products: Product[];
  items: InvoiceItem[];
  onItemsChange: (items: InvoiceItem[]) => void;
  masterDiscounts: Discount[];
  onAddDiscount: (itemId: string, discountId: string) => void;
  onRemoveDiscount: (itemId: string, discountId: string) => void;
  refetchProducts?: () => void;
  // ── tax pill ──
  activeTax: { id: string; name: string; rate: number } | null;
}

export interface InvoiceItemDetails {
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
  note: string | null;
  addons: any[];
  discounts: any[];
}

export interface InvoiceItemGroup {
  _id: string;
  item: InvoiceItemDetails[];
  createdAt: string;
}
