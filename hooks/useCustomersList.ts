import { useQuery } from "@tanstack/react-query";
import { fetchCustomersClient } from "@/services/apiCustomer.client";

export const useCustomersList = () => {
  return useQuery({
    queryKey: ["customers-list"],
    queryFn: fetchCustomersClient,
  });
};
export const useCustomerNames = () => {
  return useQuery({
    queryKey: ["customers-list"],
    queryFn: fetchCustomersClient,
  });
};
