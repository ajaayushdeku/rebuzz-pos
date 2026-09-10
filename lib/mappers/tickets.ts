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
    // Left null rather than defaulted: no due date is a real state the table
    // has to show, and a fabricated one would read as a deadline.
    due_date: raw.dueDate ?? null,
    // Carried so the due-date dialog opens on the schedule already saved
    // rather than on an empty one, which would quietly wipe it on save.
    reminder_schedule: raw.reminderSchedule ?? null,
    archivedAt: raw.archivedAt || new Date().toISOString(),
    status: raw.paidStatus || "pending",
  };
}
