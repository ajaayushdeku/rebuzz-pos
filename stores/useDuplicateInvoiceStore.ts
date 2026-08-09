import { create } from "zustand";
import { Customer } from "@/lib/types/customer";
import { InvoiceItem } from "@/lib/types/invoice";

/**
 * Stores the payload for a "Duplicate Invoice" action so it can be passed
 * across navigation into the invoice creation form (`/invoices/add`).
 *
 * The store is intentionally ephemeral: it holds nothing invoice-specific that
 * should be regenerated (invoice id, payment history, status, timestamps).
 * Consumers should call `clearDuplicate()` once they have consumed the data.
 */
interface DuplicateInvoiceState {
  hasDuplicate: boolean;
  customer: Customer | null;
  invoiceTitle: string;
  items: InvoiceItem[];
  notes: string;
  /** Preserved global discount amount (the ticket stores an amount, not an id). */
  discountAmount: number;
  setDuplicate: (data: {
    customer: Customer | null;
    invoiceTitle: string;
    items: InvoiceItem[];
    notes: string;
    discountAmount: number;
  }) => void;
  clearDuplicate: () => void;
}

export const useDuplicateInvoiceStore = create<DuplicateInvoiceState>(
  (set) => ({
    hasDuplicate: false,
    customer: null,
    invoiceTitle: "",
    items: [],
    notes: "",
    discountAmount: 0,

    setDuplicate: (data) => set({ hasDuplicate: true, ...data }),

    clearDuplicate: () =>
      set({
        hasDuplicate: false,
        customer: null,
        invoiceTitle: "",
        items: [],
        notes: "",
        discountAmount: 0,
      }),
  }),
);
