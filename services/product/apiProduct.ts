// import supabase from "./supabase";
// import {
//   Product,
//   CreateProductInput,
// } from "@/lib/types/product";

// function transformProduct(row: any): Product {
//   return {
//     id: row.id,
//     name: row.name,
//     price: row.price,
//     category: row.category,
//     image: row.image || "",
//   };
// }

// export async function fetchProducts(
//   searchQuery?: string,
// ): Promise<{
//   products: Product[];
//   total: number;
// }> {
//   try {
//     let query = supabase
//       .from("products")
//       .select("*", { count: "exact" })
//       .order("created_at", { ascending: false });

//     if (searchQuery && searchQuery.trim()) {
//       query = query.or(
//         `name.ilike.%${searchQuery}%,`,
//       );
//     }

//     const { data, error, count } = await query;

//     if (error) {
//       console.error("Supabase error:", error);
//       throw new Error(
//         "Product could not be loaded",
//       );
//     }
//     return {
//       products: data
//         ? data.map(transformProduct)
//         : [],
//       total: count || 0,
//     };
//   } catch (error) {
//     console.log("Error fetching products", error);
//     throw error;
//   }
// }

// export async function fetchProductsList(): Promise<
//   Product[]
// > {
//   const { data, error } = await supabase
//     .from("products")
//     .select("id, name, price")
//     .order("name", { ascending: true });

//   if (error)
//     throw new Error(
//       "Products could not be loaded",
//     );

//   return data ? data.map(transformProduct) : [];
// }

// export async function deleteProduct(id: string) {
//   const { data, error } = await supabase
//     .from("products")
//     .delete()
//     .eq("id", id);
//   if (error) {
//     throw new Error("Couldn't be delted");
//   }
//   return data;
// }

// export async function createProduct(
//   input: CreateProductInput,
// ): Promise<Product> {
//   try {
//     const { data, error } = await supabase
//       .from("products")
//       .insert([
//         {
//           name: input.name,
//           category: input.category,
//           price: input.price,
//           image: input.image,
//         },
//       ])
//       .select()
//       .single();
//     if (error) {
//       console.error("Supabase error:", error);
//       throw new Error(
//         "Failed to create product" +
//           error.message,
//       );
//     }
//     return transformProduct(data);
//   } catch (error) {
//     console.error(
//       "Error creating product:",
//       error,
//     );
//     throw error;
//   }
// }
