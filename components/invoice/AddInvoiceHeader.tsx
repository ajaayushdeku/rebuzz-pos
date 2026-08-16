import { TableHead, TableHeader, TableRow } from "@/components/ui/table";

export default function AddInvoiceHeader() {
  return (
    <TableHeader>
      {/* Neutral header band — the blue fill competed with the blue action
          controls in the rows below. Numeric columns are right-aligned so the
          labels sit over their values.

          ── Column widths ──
          The table is auto-layout inside an overflow-x-auto wrapper, so a
          column's width is only honoured when the HEADER and the matching
          <TableCell> in InvoiceItemsSelector declare the same thing — the
          widest of the two wins. Keep the pairs in sync when editing.

          Items and Description are the only elastic columns (% widths), so
          all slack lands on the two free-text fields. Everything else is a
          fixed pixel width sized to its worst-case content: Amount is the
          widest of them because it holds a formatted currency string, and it
          was previously the ONLY column with no width at all — it got
          whatever was left over, which is why long totals were cramped. */}
      <TableRow className="bg-gray-50 border-b border-gray-200 hover:bg-gray-50">
        {/* Drag handle */}
        <TableHead className="w-[28px]" />
        <TableHead className="text-[11px] font-semibold uppercase tracking-wider text-gray-500 w-[32%] min-w-[190px]">
          Items
        </TableHead>
        <TableHead className="text-[11px] font-semibold uppercase tracking-wider text-gray-500 w-[24%] min-w-[150px]">
          Description
        </TableHead>
        <TableHead className="text-[11px] font-semibold uppercase tracking-wider text-gray-500 text-right w-[84px] min-w-[84px]">
          Qty
        </TableHead>
        <TableHead className="text-[11px] font-semibold uppercase tracking-wider text-gray-500 text-right w-[104px] min-w-[104px]">
          Price
        </TableHead>
        <TableHead className="text-[11px] font-semibold uppercase tracking-wider text-gray-500 text-right w-[132px] min-w-[120px]">
          Amount
        </TableHead>
        {/* ── Discount column temporarily hidden ──
            Paired with the matching <TableCell> in InvoiceItemsSelector and the
            pills-row colSpan there. Restore all three together. */}
        {/* <TableHead className="text-[11px] font-semibold uppercase tracking-wider text-gray-500 text-center w-[80px] min-w-[80px]">
          Discount
        </TableHead> */}
        <TableHead className="text-[11px] font-semibold uppercase tracking-wider text-gray-500 text-center w-[76px] min-w-[76px]">
          Taxable
        </TableHead>
        <TableHead className="text-[11px] font-semibold uppercase tracking-wider text-gray-500 text-center w-[44px] min-w-[44px]">
          Action
        </TableHead>
      </TableRow>
    </TableHeader>
  );
}
