import { CreateTicketInput } from "@/lib/types/ticket";

// Create new Invoice/Ticket
export const createTicket = async (ticketData: CreateTicketInput) => {
  const res = await fetch("/api/tickets", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(ticketData),
  });

  const result = await res.json();
  if (!res.ok || result.status !== "success") {
    throw new Error(result.message || "Failed to save invoice");
  }
  return result;
};

// Update the Invoice/Ticket
export const updateTicket = async ({
  invoiceNumber,
  ticketData,
}: {
  invoiceNumber: string;
  ticketData: any;
}) => {
  const res = await fetch(`/api/tickets/${invoiceNumber}/update-ticketName`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(ticketData),
  });
  const result = await res.json();
  if (!res.ok || result.status !== "success") {
    throw new Error(result.message || "Failed to save invoice");
  }
  return result;
};

export const getTicketByInvoice = async (invoiceNumber: string) => {
  const response = await fetch(`/api/tickets/${invoiceNumber}`);
  if (!response.ok) throw new Error("Failed to fetch invoice");
  return response.json();
};
