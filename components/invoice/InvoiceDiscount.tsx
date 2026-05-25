import { Trash2 } from "lucide-react";

import { useDiscounts } from "@/hooks/useDiscounts";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  TableRow,
  TableCell,
} from "@/components/ui/table";

interface Discount {
  _id: string;
  name: string;
  isEnabled: boolean;
  rate: number;
  type: "percentage" | "fixed";
}
interface InvoiceDiscountProps {
  subtotal: number;
  selectedDiscountIds: string[];
  onDiscountSelect: (id: string) => void;
  onDiscountRemove: (id: string) => void;
}
export default function InvoiceDiscount({
  subtotal,
  selectedDiscountIds,
  onDiscountSelect,
  onDiscountRemove,
}: InvoiceDiscountProps) {
  const { data: masterDiscounts = [] } =
    useDiscounts();

  const getDiscountDetail = (id: string) =>
    masterDiscounts.find((d) => d._id === id);

  const totalDiscountAmount =
    selectedDiscountIds.reduce(
      (sum: number, id: string) => {
        const d = getDiscountDetail(id);
        if (!d) return sum;
        return (
          sum +
          (d.type === "percentage"
            ? (subtotal * d.rate) / 100
            : d.rate)
        );
      },
      0,
    );

  return (
    <>
      {selectedDiscountIds.map((id) => {
        const d = getDiscountDetail(id);
        if (!d) return null;
        return (
          <TableRow key={id}>
            <TableCell>Discount</TableCell>
            <TableCell colSpan={3}>
              {d.name}
            </TableCell>
            <TableCell className="text-right text-red-500">
              -$
              {(d.type === "percentage"
                ? (subtotal * d.rate) / 100
                : d.rate
              ).toFixed(2)}
            </TableCell>
            <TableCell>
              <Trash2
                className="h-4 w-4 cursor-pointer"
                onClick={() =>
                  onDiscountRemove(id)
                }
              />
            </TableCell>
          </TableRow>
        );
      })}

      {/* Selector to add a new discount */}
      <TableRow>
        <TableCell colSpan={4}>
          <Select
            onValueChange={(id) =>
              onDiscountSelect(id)
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Apply a business discount..." />
            </SelectTrigger>
            <SelectContent>
              {masterDiscounts.map((d) => (
                <SelectItem
                  key={d._id}
                  value={d._id}
                >
                  {d.name} (
                  {d.type === "percentage"
                    ? `${d.rate}%`
                    : `$${d.rate}`}
                  )
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </TableCell>
      </TableRow>
    </>
  );
}
// export default function InvoiceDiscount({
//   subtotal,
//   discounts,
//   currency,
//   onDiscountUpdate,
//   onDiscountRemove,
//   onCurrencyChange,
// }: DiscountSectionProps) {
//   const calculateDiscountAmount = (
//     discount: Discount,
//   ) => {
//     if (discount.type === "percentage") {
//       return (subtotal * discount.value) / 100;
//     }
//     return discount.value;
//   };

//   const totalDiscounts = discounts.reduce(
//     (sum, d) => sum + calculateDiscountAmount(d),
//     0,
//   );

//   const total = subtotal - totalDiscounts;

//   return (
//     <>
//       {/* Subtotal Row */}
//       <TableRow className="border-none hover:bg-transparent">
//         <TableCell colSpan={4} />
//         <TableCell className="text-right text-gray-600">
//           Subtotal
//         </TableCell>
//         <TableCell className="text-right">
//           ${subtotal.toFixed(2)}
//         </TableCell>
//         <TableCell />
//       </TableRow>

//       {/* Discount Rows */}
//       {discounts.map((discount) => (
//         <TableRow
//           key={discount.id}
//           className="hover:bg-transparent"
//         >
//           {/* Label */}
//           <TableCell className="text-gray-600">
//             Discount
//           </TableCell>

//           {/* Description */}
//           <TableCell colSpan={2}>
//             <Input
//               placeholder="Description (optional)"
//               value={discount.description}
//               onChange={(e) =>
//                 onDiscountUpdate(
//                   discount.id,
//                   "description",
//                   e.target.value,
//                 )
//               }
//               className="border-gray-300"
//             />
//           </TableCell>

//           {/* Value + Type */}
//           <TableCell>
//             <div className="flex items-center gap-1">
//               <Input
//                 type="number"
//                 min={0}
//                 value={discount.value || ""}
//                 onChange={(e) =>
//                   onDiscountUpdate(
//                     discount.id,
//                     "value",
//                     Number(e.target.value),
//                   )
//                 }
//                 className="w-24 text-right border"
//               />
//               <Select
//                 value={discount.type}
//                 onValueChange={(value) =>
//                   onDiscountUpdate(
//                     discount.id,
//                     "type",
//                     value,
//                   )
//                 }
//               >
//                 <SelectTrigger className="w-20">
//                   <SelectValue />
//                 </SelectTrigger>
//                 <SelectContent>
//                   <SelectItem value="fixed">
//                     $
//                   </SelectItem>
//                   <SelectItem value="percentage">
//                     %
//                   </SelectItem>
//                 </SelectContent>
//               </Select>
//             </div>
//           </TableCell>

//           {/* Discount Amount */}
//           <TableCell className="text-right text-gray-600">
//             $
//             {calculateDiscountAmount(
//               discount,
//             ).toFixed(2)}
//           </TableCell>

//           {/* Delete */}
//           <TableCell>
//             <Trash2
//               className="h-4 w-4 text-blue-500 cursor-pointer hover:text-red-500 transition-colors"
//               onClick={() =>
//                 onDiscountRemove(discount.id)
//               }
//             />
//           </TableCell>
//         </TableRow>
//       ))}

//       {/* Total Row */}
//       <TableRow className="border-t hover:bg-transparent">
//         <TableCell colSpan={3} />
//         <TableCell className="text-right font-semibold text-gray-900">
//           Total
//         </TableCell>
//         <TableCell colSpan={1}>
//           <Select
//             value={currency}
//             onValueChange={onCurrencyChange}
//           >
//             <SelectTrigger className="w-48">
//               <SelectValue />
//             </SelectTrigger>
//             <SelectContent>
//               <SelectItem value="usd">
//                 USD ($) - U.S. dollar
//               </SelectItem>
//               <SelectItem value="eur">
//                 EUR (€) - Euro
//               </SelectItem>
//               <SelectItem value="gbp">
//                 GBP (£) - British pound
//               </SelectItem>
//               <SelectItem value="cad">
//                 CAD ($) - Canadian dollar
//               </SelectItem>
//             </SelectContent>
//           </Select>
//         </TableCell>
//         <TableCell className="text-right font-semibold">
//           ${total.toFixed(2)}
//         </TableCell>
//         <TableCell />
//       </TableRow>

//       {/* Amount Due Row */}
//       <TableRow className="border-t hover:bg-transparent">
//         <TableCell colSpan={4} />
//         <TableCell className="text-right font-bold text-gray-900">
//           Amount Due
//         </TableCell>
//         <TableCell className="text-right font-bold text-lg">
//           ${total.toFixed(2)}
//         </TableCell>
//         <TableCell />
//       </TableRow>
//     </>
//   );
// }
