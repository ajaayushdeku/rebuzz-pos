import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";

// import { fetchProducts, deleteProduct } from "@/services/apiProduct";
import { createProduct } from "@/services/product/apiProduct.client";
import {
  deleteProduct,
  updateProduct,
} from "@/services/product/apiProduct.client";

export const productKeys = {
  all: ["products"] as const,
  lists: () => [...productKeys.all, "list"] as const,
  list: (searchQuery?: string) =>
    [
      ...productKeys.lists(),
      // { searchQuery },
      searchQuery || "",
    ] as const,
  details: () => [...productKeys.all, "detail"] as const,
  detail: (id: string) => [...productKeys.details(), id] as const,
};

export const useCreateProduct = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createProduct,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: productKeys.lists(),
      });
      queryClient.invalidateQueries({
        queryKey: ["products-list"],
      });
    },
  });
};

export function useDeleteProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteProduct,
    onSuccess: () => {
      // Invalidate both query key formats used across the app
      queryClient.invalidateQueries({
        queryKey: productKeys.lists(),
      });
      queryClient.invalidateQueries({
        queryKey: ["products-list"],
      });
      toast.success("Product deleted successfully");
    },
    onError: (error: Error) => {
      toast.error(`Failed to delete product: ${error.message}`);
    },
  });
}

export function useUpdateProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      productId,
      fields,
    }: {
      productId: string;
      fields: Parameters<typeof updateProduct>[1];
    }) => updateProduct(productId, fields),
    onSuccess: () => {
      // Invalidate both query key formats
      queryClient.invalidateQueries({
        queryKey: productKeys.lists(),
      });
      queryClient.invalidateQueries({
        queryKey: ["products-list"],
      });
      toast.success("Product updated successfully");
    },
    onError: (error: Error) => {
      toast.error(`Failed to update product: ${error.message}`);
    },
  });
}
