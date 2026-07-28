import { useQuery } from "@tanstack/react-query";

import { getTicketByInvoice } from "@/services/apiTicket.client";
import type { TicketInvoice } from "@/components/invoice/modals/useInvoiceTicket";

/**
 * Fetch the open ticket referenced by a table's `currentTicket.invoice`.
 *
 * Shares the `["ticket", <invoice>]` query key with the invoice modals so the
 * cache is reused. Returns `null` when there is no invoice to look up.
 */
export function useTableTicket(invoice: number | null | undefined) {
  const idStr = invoice != null ? String(invoice) : "";

  return useQuery<TicketInvoice | null>({
    queryKey: ["ticket", idStr],
    queryFn: async () => {
      const json = await getTicketByInvoice(idStr);
      return json?.data?.Tickets ?? null;
    },
    enabled: invoice != null,
    staleTime: 15 * 1000,
  });
}
