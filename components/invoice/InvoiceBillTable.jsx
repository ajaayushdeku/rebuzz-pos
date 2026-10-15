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
          <TableRow className=" rounded-xl border border-b-gray-200 bg-gray-300/20">
            <TableHead className="text-black font-bold text-sm tracking-wider py-3 w-[40%] @max-xl/doc:py-2 @max-xl/doc:text-[10px]">
              Name
            </TableHead>
            <TableHead className="text-black font-bold text-sm py-3 text-center tracking-wider w-[20%] @max-xl/doc:py-2 @max-xl/doc:text-[10px]">
              Quantity
            </TableHead>
            <TableHead className="text-black font-bold text-sm py-3 text-center tracking-wider w-[20%] @max-xl/doc:py-2 @max-xl/doc:text-[10px]">
              Rate ({currency.symbol})
            </TableHead>
            <TableHead className="text-black font-bold text-sm py-3 text-right tracking-wider w-[20%] @max-xl/doc:py-2 @max-xl/doc:text-[10px]">
              Amount ({currency.symbol})
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
                <TableCell className="py-2 text-sm text-black tracking-wider @max-xl/doc:py-1.5 @max-xl/doc:text-[11px]">
                  {product.productName}{" "}
                  {product.variantItems?.name && (
                    <span className="text-gray-600 racking-wider">
                      {" "}
                      ({product.variantItems.name})
                    </span>
                  )}
                  {product.discounts.length !== 0 && (
                    <span className="block text-[12px] flex text-red-500/100 tracking-wider @max-xl/doc:text-[9px] @max-xl/doc:flex-wrap @max-xl/doc:w-8">
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
                <TableCell className="py-2 text-center text-sm text-black tracking-wider tabular-nums @max-xl/doc:py-1.5 @max-xl/doc:text-[11px]">
                  x {product.quantity}
                </TableCell>
                <TableCell className="py-2 text-center text-sm text-black tracking-wider tabular-nums @max-xl/doc:py-1.5 @max-xl/doc:text-[11px]">
                  {formatAmount(Number(product.unitPrice), currency.locale)}
                </TableCell>
                <TableCell className="py-2 text-right text-sm text-black tracking-wider tabular-nums @max-xl/doc:py-1.5 @max-xl/doc:text-[11px]">
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
