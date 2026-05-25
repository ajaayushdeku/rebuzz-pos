import { RawTicketListResponse, RawTicket } from "@/lib/types/ticket";
import { authHeaders } from "./authServices/session";

const BASE = process.env.NEXT_PUBLIC_API_URL;

export const fetchInvoices = async (): Promise<RawTicket[]> => {
  const res = await fetch(`${BASE}/business/ticket/unarchived`, {
    headers: await authHeaders(),
  });

  if (!res.ok) throw new Error(`Failed to fetch invoices: ${res.status}`);

  const data: RawTicketListResponse = await res.json();
  return data.data.tickets;
};
