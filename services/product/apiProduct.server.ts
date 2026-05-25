import {
  mapRawProductToProduct,
  Product,
  RawProductListResponse,
} from "@/lib/types/product";
import { authHeaders } from "../authServices/session";

const BASE = process.env.NEXT_PUBLIC_API_URL;

export async function fetchProducts(): Promise<Product[]> {
  const res = await fetch(`${BASE}/business/products/popular`, {
    headers: await authHeaders(),
  });
  if (!res.ok) throw new Error(`Failed to fetch products: ${res.status}`);

  const data: RawProductListResponse = await res.json();

  return data.data.products.map((rawItem) => mapRawProductToProduct(rawItem));
}
