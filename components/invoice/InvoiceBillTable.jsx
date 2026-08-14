import { useCurrency } from "@/providers/CurrencyContext";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table";
import { formatAmount, formatCurrencySymbol } from "@/utils/helper";

export default function InvoiceBillTable({ invoices }) {
  const { currency } = useCurrency();
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
              Rate ( {currency.symbol} )
            </TableHead>
            <TableHead className="text-black font-bold text-sm py-3 text-right pr-0 w-[20%]">
              Amount ( {currency.symbol} )
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
                  {product.productName}{" "}
                  {product.variantItems?.name && (
                    <span className="text-gray-600">
                      {" "}
                      ({product.variantItems.name})
                    </span>
                  )}
                  {product.discounts.length !== 0 && (
                    <span className="block text-[12px] text-red-500/100">
                      {product.discounts.map((disc, idx) => (
                        <span key={idx} className="flex flex-col">
                          - {disc.name}:{" "}
                          {disc.type === "fixed"
                            ? formatCurrencySymbol(
                                Number(disc.rate),
                                currency.symbol,
                                currency.locale,
                              )
                            : `${disc.rate}%`}{" "}
                          OFF{" "}
                        </span>
                      ))}
                    </span>
                  )}
                </TableCell>
                <TableCell className="py-2 text-center text-sm text-black">
                  x {product.quantity}
                </TableCell>
                <TableCell className="py-2 text-right text-sm text-black">
                  {formatAmount(Number(product.unitPrice), currency.locale)}
                </TableCell>
                <TableCell className="py-2 pr-0 text-right text-sm text-black">
                  {formatAmount(
                    product.quantity * product.unitPrice,
                    currency.locale,
                  )}
                </TableCell>
              </TableRow>
            )),
          )}
        </TableBody>
      </Table>
    </div>
  );
}
