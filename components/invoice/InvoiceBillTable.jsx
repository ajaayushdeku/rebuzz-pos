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
          <TableRow className="bg-gray-300/20 rounded-xl">
            <TableHead className="text-black font-bold text-sm tracking-wider py-3  w-[40%]">
              Name
            </TableHead>
            <TableHead className="text-black font-bold text-sm py-3 text-center racking-wider w-[20%]">
              Quantity
            </TableHead>
            <TableHead className="text-black font-bold text-sm py-3 text-center racking-wider w-[20%]">
              Rate ( {currency.symbol} )
            </TableHead>
            <TableHead className="text-black font-bold text-sm py-3 text-right racking-wider  w-[20%]">
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
                <TableCell className="py-2  text-sm text-black tracking-wider ">
                  {product.productName}{" "}
                  {product.variantItems?.name && (
                    <span className="text-gray-600 racking-wider">
                      {" "}
                      ({product.variantItems.name})
                    </span>
                  )}
                  {product.discounts.length !== 0 && (
                    <span className="block text-[12px] text-red-500/100 racking-wider">
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
                <TableCell className="py-2 text-center text-sm text-black racking-wider">
                  x {product.quantity}
                </TableCell>
                <TableCell className="py-2 text-center text-sm text-black racking-wider">
                  {formatAmount(Number(product.unitPrice), currency.locale)}
                </TableCell>
                <TableCell className="py-2  text-right text-sm text-black  racking-wider">
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
