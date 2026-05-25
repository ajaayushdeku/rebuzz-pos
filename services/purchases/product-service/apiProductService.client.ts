import { mockProductService } from "@/components/expenses/products-services/mock-product-services";
import { ProductService } from "@/components/expenses/products-services/productservice-columns";

export async function fetchProductService(): Promise<ProductService[]> {
  return mockProductService;
}
