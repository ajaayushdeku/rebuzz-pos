import { useQuery } from "@tanstack/react-query";
import { fetchProductsListClient } from "@/services/product/apiProduct.client";

export const useProductsList = () => {
  return useQuery({
    queryKey: ["products-list"],
    queryFn: fetchProductsListClient,
  });
};

export const useProductNames = () => {
  return useQuery({
    queryKey: ["products-list"],
    queryFn: fetchProductsListClient,
  });
};
