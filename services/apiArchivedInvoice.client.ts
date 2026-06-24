// services/apiArchivedInvoice.client.ts

import { mapRawTicketToInvoice } from "@/lib/mappers/tickets";
import { Invoice } from "@/lib/types/invoice";
import { RawTicket } from "@/lib/types/ticket";

// Fetch Archived Invoices/Tickets
export const fetchArchivedInvoicesClient = async (): Promise<Invoice[]> => {
  const res = await fetch("/api/invoices/archived?limit=500");

  if (!res.ok) {
    throw new Error(`Failed to fetch archived invoices: ${res.status}`);
  }

  const payload = await res.json();

  const rawTickets: RawTicket[] = payload?.data || [];

  return rawTickets.map((ticket) => mapRawTicketToInvoice(ticket));
};
