import { TableHead, TableHeader, TableRow } from "@/components/ui/table";

export default function AddInvoiceHeader() {
  return (
    <TableHeader>
      {/* Neutral header band — the blue fill competed with the blue action
          controls in the rows below. Numeric columns are right-aligned so the
          labels sit over their values. */}
      <TableRow className="bg-gray-50 border-b border-gray-200 hover:bg-gray-50">
        {/* Drag handle */}
        <TableHead className="w-6" />
        <TableHead className="text-[11px] font-semibold uppercase tracking-wider text-gray-500 min-w-[140px] lg:min-w-[180px]">
          Items
        </TableHead>
        <TableHead className="text-[11px] font-semibold uppercase tracking-wider text-gray-500 min-w-[100px]">
          Description
        </TableHead>
        <TableHead className="text-[11px] font-semibold uppercase tracking-wider text-gray-500 text-center min-w-[65px] w-[85px]">
          Qty
        </TableHead>
        <TableHead className="text-[11px] font-semibold uppercase tracking-wider text-gray-500 text-center min-w-[70px] w-[95px]">
          Price
        </TableHead>
        <TableHead className="text-[11px] font-semibold uppercase tracking-wider text-gray-500 text-right min-w-[60px]">
          Amount
        </TableHead>
        {/* ── Discount column temporarily hidden ──
            Paired with the matching <TableCell> in InvoiceItemsSelector and the
            pills-row colSpan there. Restore all three together. */}
        {/* <TableHead className="text-[11px] font-semibold uppercase tracking-wider text-gray-500 text-center">
          Discount
        </TableHead> */}
        <TableHead className="text-[11px] font-semibold uppercase tracking-wider text-gray-500 text-center">
          Taxable
        </TableHead>
        <TableHead className="text-[11px] font-semibold uppercase tracking-wider text-gray-500 text-center w-[35px]">
          Action
        </TableHead>
      </TableRow>
    </TableHeader>
  );
}
