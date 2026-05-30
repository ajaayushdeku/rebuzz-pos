import { CreateTicketInput } from "@/lib/types/ticket";

export const createTicket = async (ticketData: CreateTicketInput) => {
  const res = await fetch("/api/tickets", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(ticketData),
  });
  const result = await res.json();
  if (!res.ok || result.status !== "success") {
    throw new Error(result.message || "Failed to save invoice");
  }
  return result;
};

export const updateTicket = async ({
  invoiceNumber,
  ticketData,
}: {
  invoiceNumber: string;
  ticketData: any;
}) => {
  const payload = {
    ticketName: ticketData.ticketName,
    customerEmail: ticketData.customerEmail,
    phoneNumber: ticketData.phoneNumber,
    grandTotal: null,
    total: null,
    taxId: ticketData.taxId ?? null,
    isTaxExclusive: !!ticketData.taxId,
    // ✅ include discount fields — same as create
    discount: ticketData.discount ?? 0,
    totalDiscount: ticketData.totalDiscount ?? 0,
    items: (ticketData.items ?? [])
      .filter((item: any) => item.id && item.name)
      .map((item: any) => ({
        id: item.id,
        name: item.name,
        unitPrice: item.unitPrice ?? 0,
        quantity: item.quantity ?? 1,
        isTaxable: item.isTaxable ?? false,
        note: item.note ?? "",
        discounts: item.discounts ?? [],
      })),
  };

  const res = await fetch(`/api/tickets/${invoiceNumber}/update-ticketName`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const result = await res.json();
  if (!res.ok || result.status !== "success") {
    throw new Error(result.message || "Failed to update invoice");
  }
  return result;
};
export const getTicketByInvoice = async (invoiceNumber: string) => {
  const response = await fetch(`/api/tickets/${invoiceNumber}`);
  if (!response.ok) throw new Error("Failed to fetch invoice");
  return response.json();
};
