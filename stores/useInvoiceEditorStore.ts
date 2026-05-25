import { create } from "zustand";
import { devtools, persist } from "zustand/middleware";

export interface InvoiceLineItem {
  id: string;
  description: string;
  quantity: number;
  rate: number;
  amount: number;
}

interface InvoiceEditorState {
  // Current draft invoice
  draftInvoice: {
    customerId: string | null;
    customerName: string;
    issueDate: string;
    dueDate: string;
    items: InvoiceLineItem[];
    notes: string;
    taxRate: number;
  };

  // Computed values
  subtotal: number;
  tax: number;
  total: number;

  // Actions
  setCustomer: (customerId: string, customerName: string) => void;
  setDates: (issueDate: string, dueDate: string) => void;
  addItem: (item: Omit<InvoiceLineItem, "id" | "amount">) => void;
  updateItem: (id: string, updates: Partial<InvoiceLineItem>) => void;
  removeItem: (id: string) => void;
  setNotes: (notes: string) => void;
  setTaxRate: (rate: number) => void;
  calculateTotals: () => void;
  resetDraft: () => void;
  //   loadDraft: (invoice: any) => void; // For editing existing invoices
}

const initialDraftState = {
  customerId: null,
  customerName: "",
  issueDate: new Date().toISOString().split("T")[0],
  dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    .toISOString()
    .split("T")[0],
  items: [],
  notes: "",
  taxRate: 0,
};

export const useInvoiceEditorStore = create<InvoiceEditorState>()(
  devtools(
    persist(
      (set, get) => ({
        draftInvoice: initialDraftState,
        subtotal: 0,
        tax: 0,
        total: 0,

        setCustomer: (customerId, customerName) =>
          set((state) => ({
            draftInvoice: {
              ...state.draftInvoice,
              customerId,
              customerName,
            },
          })),

        setDates: (issueDate, dueDate) =>
          set((state) => ({
            draftInvoice: {
              ...state.draftInvoice,
              issueDate,
              dueDate,
            },
          })),

        addItem: (item) => {
          const id = `item_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
          const amount = item.quantity * item.rate;

          set((state) => ({
            draftInvoice: {
              ...state.draftInvoice,
              items: [...state.draftInvoice.items, { ...item, id, amount }],
            },
          }));

          get().calculateTotals();
        },

        updateItem: (id, updates) => {
          set((state) => ({
            draftInvoice: {
              ...state.draftInvoice,
              items: state.draftInvoice.items.map((item) => {
                if (item.id !== id) return item;

                const updated = {
                  ...item,
                  ...updates,
                };
                // Recalculate amount if quantity or rate changed
                if (
                  updates.quantity !== undefined ||
                  updates.rate !== undefined
                ) {
                  updated.amount = updated.quantity * updated.rate;
                }
                return updated;
              }),
            },
          }));

          get().calculateTotals();
        },

        removeItem: (id) => {
          set((state) => ({
            draftInvoice: {
              ...state.draftInvoice,
              items: state.draftInvoice.items.filter((item) => item.id !== id),
            },
          }));

          get().calculateTotals();
        },

        setNotes: (notes) =>
          set((state) => ({
            draftInvoice: {
              ...state.draftInvoice,
              notes,
            },
          })),

        setTaxRate: (taxRate) => {
          set((state) => ({
            draftInvoice: {
              ...state.draftInvoice,
              taxRate,
            },
          }));
          get().calculateTotals();
        },

        calculateTotals: () => {
          const state = get();
          const subtotal = state.draftInvoice.items.reduce(
            (sum, item) => sum + item.amount,
            0,
          );
          const tax = subtotal * (state.draftInvoice.taxRate / 100);
          const total = subtotal + tax;

          set({ subtotal, tax, total });
        },

        resetDraft: () =>
          set({
            draftInvoice: initialDraftState,
            subtotal: 0,
            tax: 0,
            total: 0,
          }),

        //   loadDraft: (invoice) => {
        //     set({
        //       draftInvoice: {
        //         customerId: invoice.customer.id,
        //         customerName:
        //           invoice.customer.name,
        //         issueDate: invoice.issueDate,
        //         dueDate: invoice.dueDate,
        //         items: invoice.items,
        //         notes: invoice.notes || "",
        //         taxRate: invoice.taxRate || 0,
        //       },
        //     });
        //     get().calculateTotals();
        //   },
      }),
      {
        name: "invoice-draft-storage",
        // Only persist the draft, not computed values
        partialize: (state) => ({
          draftInvoice: state.draftInvoice,
        }),
      },
    ),
    { name: "InvoiceEditorStore" },
  ),
);
