import { fetchProductService } from "@/services/purchases/product-service/apiProductService.client";
import { useQuery } from "@tanstack/react-query";

export function useProductServiceList() {
  return useQuery({
    queryKey: ["product-service-list"],
    queryFn: fetchProductService,
  });
}
