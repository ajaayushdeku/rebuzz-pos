import { useMutation } from "@tanstack/react-query";
import { CreateTicketInput } from "@/lib/types/ticket";

const BASE = process.env.NEXT_PUBLIC_API_URL;
const API_URL = `${BASE}/business/ticket`;

const createInvoice = async (data: CreateTicketInput) => {
  const response = await fetch(API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      // Add your auth token here if required, e.g.:
      // "Authorization": `Bearer ${yourToken}`,
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));
    throw new Error(
      errorBody?.message ?? `Request failed with status ${response.status}`,
    );
  }

  return response.json(); // returns the created invoice, including its `id`
};

export function useCreateInvoice() {
  return useMutation({
    mutationFn: createInvoice,
  });
}
