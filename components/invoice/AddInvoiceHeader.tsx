import { TableHead, TableHeader, TableRow } from "@/components/ui/table";

export default function AddInvoiceHeader() {
  return (
    <TableHeader>
      <TableRow className="bg-blue-50 border-y border-blue-100 hover:bg-blue-50">
        {/* Drag handle */}
        <TableHead className="w-6" />
        <TableHead className="font-semibold text-blue-700 text-xs lg:text-sm min-w-[140px] lg:min-w-[180px]">
          Items
        </TableHead>
        <TableHead className="font-medium text-blue-700 text-xs min-w-[100px]">
          Description
        </TableHead>
        <TableHead className="font-medium text-blue-700 text-xs text-center min-w-[65px] w-[75px]">
          Qty
        </TableHead>
        <TableHead className="font-medium text-blue-700 text-xs text-center min-w-[70px] w-[85px]">
          Price
        </TableHead>
        <TableHead className="font-medium text-blue-700 text-xs text-center min-w-[60px]">
          Amount
        </TableHead>
        <TableHead className="font-medium text-blue-700 text-xs text-center">
          Discount
        </TableHead>
        <TableHead className="font-medium text-blue-700 text-xs text-center">
          Taxable
        </TableHead>
        <TableHead className="font-medium text-blue-700 text-xs text-center w-[35px]">
          Action
        </TableHead>
      </TableRow>
    </TableHeader>
  );
}
