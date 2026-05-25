import { TableHead, TableHeader, TableRow } from "../ui/table";

export default function AddInvoiceHeader() {
  return (
    <TableHeader>
      <TableRow className="bg-blue-50 border-y border-blue-100 hover:bg-blue-50">
        {/* Drag handle */}
        <TableHead className="w-6" />
        <TableHead className="font-semibold text-blue-700 text-sm min-w-[160px]">
          Items
        </TableHead>
        <TableHead className="font-medium text-blue-700 text-sm min-w-[120px]">
          Description
        </TableHead>
        <TableHead className="font-medium text-blue-700 text-sm text-center w-20">
          Qty
        </TableHead>
        <TableHead className="font-medium text-blue-700 text-sm text-center w-24">
          Price
        </TableHead>
        <TableHead className="font-medium text-blue-700 text-sm text-center w-20">
          Amount
        </TableHead>
        <TableHead className="font-medium text-blue-700 text-sm text-center w-[120px]">
          Discount
        </TableHead>
        {/* ← new */}
        <TableHead className="font-medium text-blue-700 text-sm text-center w-20">
          Taxable
        </TableHead>
        <TableHead className="font-medium text-blue-700 text-sm text-center w-20">
          Action
        </TableHead>
        {/* Delete column
        <TableHead className="w-5" /> */}
      </TableRow>
    </TableHeader>
  );
}
