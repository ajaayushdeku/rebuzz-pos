// services/invoices/apiInvoices.client.ts

import { mapRawTicketToInvoice } from "@/lib/mappers/tickets";
import { Invoice } from "@/lib/types/invoice";
import { RawTicket } from "@/lib/types/ticket";
import { CreateTicketInput } from "@/lib/types/ticket";

// Fetch Unarchived Invoices/Tickets
export const fetchInvoicesClient = async (): Promise<Invoice[]> => {
  const res = await fetch("/api/invoices");

  if (!res.ok) {
    throw new Error(`Failed to fetch invoices: ${res.status}`);
  }

  const payload = await res.json();

  const rawTickets: RawTicket[] = payload?.data?.tickets || [];

  return rawTickets.map((ticket) => mapRawTicketToInvoice(ticket));
};

// Create new Invoice/Ticket
export const createTicket = async (
  payload: CreateTicketInput,
): Promise<void> => {
  const res = await fetch("/api/invoices", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) throw new Error(`Failed to create ticket: ${res.status}`);
};
