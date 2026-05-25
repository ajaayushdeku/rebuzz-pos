import { fetchVendors } from "@/services/purchases/vendors/apiVendors.client";
import { useQuery } from "@tanstack/react-query";

export const vendorKeys = {
  all: ["vendors"] as const,
  lists: () =>
    [...vendorKeys.all, "list"] as const,
  list: (searchQuery?: string) =>
    [
      ...vendorKeys.lists(),
      searchQuery || "",
    ] as const,
  details: () =>
    [...vendorKeys.all, "detail"] as const,
  detail: (id: string) =>
    [...vendorKeys.details(), id] as const,
};

export function useVendors(searchQuery?: string) {
  return useQuery({
    queryKey: vendorKeys.list(searchQuery),
    queryFn: () => fetchVendors(),
    staleTime: 10 * 1000,
  });
}
