import ProductServiceTable from "@/components/expenses/products-services/ProductServiceTable";
import { Button } from "@/components/ui/button";
import { fetchProductService } from "@/services/purchases/product-service/apiProductService.client";
import { BoxIcon } from "lucide-react";
import Link from "next/link";

export default async function Page() {
  const [productService] = await Promise.all([fetchProductService()]);
  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-4xl font-bold text-gray-900">
          Products & Services
        </h1>
        <div className="flex items-center gap-3">
          <Button className="bg-blue-600 hover:bg-blue-700 px-6 py-3 text-white rounded-2xl">
            <BoxIcon />
            <Link href="/products-services/add">Add a product or service</Link>
          </Button>
        </div>
      </div>
      <ProductServiceTable productService={productService} />
    </div>
  );
}
