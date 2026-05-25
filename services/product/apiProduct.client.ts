import { mapRawProductToProduct, Product } from "@/lib/types/product";

export async function fetchProductsListClient(): Promise<Product[]> {
  const res = await fetch("/api/products");

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.message || "Failed to fetch products");
  }
  const payload = await res.json();

  const rawProducts = payload?.data?.products || [];
  return rawProducts.map(mapRawProductToProduct);
}

export async function createProduct(productData: any): Promise<Product> {
  const res = await fetch("/api/products", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(productData),
  });

  if (!res.ok) throw new Error("Failed to create product");

  const result = await res.json();
  console.log("Raw create product response:", result.data.products);
  return mapRawProductToProduct(result.data.products);
}

export async function updateProduct(
  productId: string,
  fields: Partial<{
    name: string;
    price: number;
    costPrice: number;
    description: string;
    categories: string;
    sku: string;
    isTaxable: boolean;
    usesStocks: boolean;
    lowStock: number;
    soldBy: string;
    inStock: number;
  }>,
): Promise<Product> {
  const formData = new FormData();

  if (fields.name !== undefined) formData.append("name", fields.name);
  if (fields.price !== undefined)
    formData.append("price", String(fields.price));
  if (fields.costPrice !== undefined)
    formData.append("costPrice", String(fields.costPrice));
  if (fields.description !== undefined)
    formData.append("description", fields.description);
  if (fields.categories !== undefined)
    formData.append("categories", fields.categories);
  if (fields.sku !== undefined) formData.append("sku", fields.sku);
  if (fields.isTaxable !== undefined)
    formData.append("isTaxable", String(fields.isTaxable));
  if (fields.usesStocks !== undefined)
    formData.append("usesStocks", String(fields.usesStocks));
  if (fields.soldBy !== undefined) formData.append("soldBy", fields.soldBy);
  if (fields.inStock !== undefined)
    formData.append("inStock", String(fields.inStock));
  if (fields.lowStock !== undefined)
    formData.append("lowStock", String(fields.lowStock));

  const res = await fetch(`/api/products/${productId}`, {
    method: "PUT",
    body: formData,
  });
  if (!res.ok) throw new Error("Failed to update product");
  const result = await res.json();
  return mapRawProductToProduct(result.data.products ?? result.data);
}

export async function updateProductTaxable(
  productId: string,
  isTaxable: boolean,
): Promise<void> {
  await updateProduct(productId, { isTaxable });
}

export async function deleteProduct(productId: string): Promise<void> {
  const res = await fetch(`/api/products/${productId}`, {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.message || "Failed to delete product");
  }
}
