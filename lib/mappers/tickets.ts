import { Invoice } from "../types/invoice";
import { RawTicket } from "../types/ticket";

export function mapRawTicketToInvoice(raw: RawTicket): Invoice {
  // Prefer customer.name from the API, fallback to ticketName, then email, then "Guest"
  const customerName =
    raw.customer?.name || raw.ticketName || raw.customerEmail || "Guest";

  return {
    invoice_id: raw._id,
    invoice: raw.invoice,
    customer_name: customerName,
    ticket_name: raw.ticketName || "—",
    amount: Number(raw.grandTotal) || 0,
    created_at: raw.createdAt || new Date().toISOString(),
    status: raw.paidStatus || "pending",
  };
}
