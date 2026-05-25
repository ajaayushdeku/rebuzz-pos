import { create } from "zustand";
import { Invoice } from "@/lib/types/invoice";

interface Filters {
  status: string;
  dateRange: string;
  searchTerm: string;
  customer: string;
}

interface InvoiceStore {
  invoices: Invoice[];
  filters: Filters;
  setInvoices: (invoices: Invoice[]) => void;
  setFilters: (filters: Filters) => void;
  updateFilter: (key: keyof Filters, value: string) => void;
  getFilteredInvoices: () => Invoice[];
}

export const useInvoiceStore = create<InvoiceStore>((set, get) => ({
  invoices: [],
  filters: {
    status: "all",
    dateRange: "all",
    searchTerm: "",
    customer: "all-customers",
  },

  setInvoices: (invoices) => set({ invoices }),
  setFilters: (filters) => set({ filters }),
  updateFilter: (key, value) =>
    set((state) => ({
      filters: {
        ...state.filters,
        [key]: value,
      },
    })),

  getFilteredInvoices: () => {
    const { invoices, filters } = get();

    return invoices.filter((ticket) => {
      if (filters.status !== "all" && ticket.status !== filters.status)
        return false;

      if (filters.dateRange === "today") {
        const date = new Date(ticket.created_at);
        const today = new Date();
        if (date.toDateString() !== today.toDateString()) return false;
      }

      if (filters.searchTerm) {
        const term = filters.searchTerm.toLowerCase();
        const matchesEmail = ticket.customer_name?.toLowerCase().includes(term);
        const matchesName = ticket.invoice_id?.toLowerCase().includes(term);
        if (!matchesEmail && !matchesName) return false;
      }

      return true;
    });
  },
}));
