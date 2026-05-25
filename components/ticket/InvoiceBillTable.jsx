import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table";

export default function InvoiceBillTable({ invoices }) {
  return (
    <div className="w-full overflow-hidden">
      <Table className="w-full border-collapse">
        <TableHeader>
          <TableRow className="border-b border-gray-400 hover:bg-transparent">
            <TableHead className="text-black font-bold text-sm py-3 pl-0 w-[40%]">
              Name
            </TableHead>
            <TableHead className="text-black font-bold text-sm py-3 text-center w-[20%]">
              Quantity
            </TableHead>
            <TableHead className="text-black font-bold text-sm py-3 text-center w-[20%]">
              Rate ( $)
            </TableHead>
            <TableHead className="text-black font-bold text-sm py-3 text-right pr-0 w-[20%]">
              Amount ($)
            </TableHead>
          </TableRow>
        </TableHeader>

        <TableBody>
          {invoices.map((group) =>
            group.item.map((product, index) => (
              <TableRow
                key={`${group._id}-${index}`}
                className="border-none hover:bg-transparent"
              >
                <TableCell className="py-2 pl-0 text-sm text-black">
                  {product.productName}
                </TableCell>
                <TableCell className="py-2 text-center text-sm text-black">
                  x {product.quantity}
                </TableCell>
                <TableCell className="py-2 text-center text-sm text-black">
                  {Number(product.unitPrice).toFixed(2)}
                </TableCell>
                <TableCell className="py-2 pr-0 text-right text-sm text-black">
                  {(product.quantity * product.unitPrice).toFixed(2)}
                </TableCell>
              </TableRow>
            )),
          )}
        </TableBody>
      </Table>
    </div>
  );
}
