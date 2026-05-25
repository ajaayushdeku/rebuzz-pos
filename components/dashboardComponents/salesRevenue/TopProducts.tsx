"use client";

import { DataTable } from "@/components/ui/data-table";
import { getTopProductColumns, TopProduct } from "./top-product-columns";
import { useCurrency } from "@/providers/CurrencyContext";

type TopProductsProps = {
  topProducts: TopProduct[];
};

export default function TopProducts({ topProducts }: TopProductsProps) {
  const { currency } = useCurrency();
  const columns = getTopProductColumns(currency);
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 md:p-6 w-full">
      <h1 className="font-bold mt-1 text-[16px] md:text-xl text-gray-900">
        Top Selling Products
      </h1>
      <p className="text-gray-400 mt-0.5 text-sm">
        Products contributing most to revenue growth
      </p>
      <DataTable columns={columns} data={topProducts} pageSize={5} />
    </div>
  );
}
// export default function TopProducts({
//   topProducts,
// }: TopProductsProps) {
//   return (
//     <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 min-w-150">
//       <h1 className="font-semibold text-[17px]">
//         Top Selling Products
//       </h1>
//       <p className="text-gray-700">
//         Products contributing most to revenue
//         growth
//       </p>

//       <Table>
//         <TableHeader>
//           <TableRow>
//             <TableHead>Product</TableHead>
//             <TableHead>Category</TableHead>
//             <TableHead>Revenue</TableHead>
//             <TableHead>Growth</TableHead>
//           </TableRow>
//         </TableHeader>
//         <TableBody>
//           {topProducts.map((product) => {
//             const { badge } = getPercentColor(
//               product.percent,
//             );
//             return (
//               <TableRow key={product.name}>
//                 <TableCell className="font-semibold">
//                   {product.name}
//                 </TableCell>
//                 <TableCell>
//                   {product.category}
//                 </TableCell>
//                 <TableCell className="font-semibold">
//                   $ {product.revenue}
//                 </TableCell>
//                 <TableCell>
//                   <p
//                     className={`w-12 flex items-center justify-center rounded-lg ${badge} px-1`}
//                   >
//                     {product.percent}%
//                   </p>
//                 </TableCell>
//               </TableRow>
//             );
//           })}
//         </TableBody>
//       </Table>
//     </div>
//   );
// }
