import { useQuery } from "@tanstack/react-query";
import { fetchCustomersClient } from "@/services/apiCustomer.client";

export const customerKeys = {
  all: ["customers"] as const, // Base key for all customer-related queries
  lists: () => [...customerKeys.all, "list"] as const, // Key for queries that fetch lists of customers, can be extended with search parameters
  list: (searchQuery?: string) =>
    [...customerKeys.lists(), searchQuery || ""] as const, // Key for fetching a list of customers, optionally with a search query to filter results
  details: () => [...customerKeys.all, "detail"] as const, // Key for queries that fetch details of a single customer, can be extended with customer ID
  detail: (id: string) => [...customerKeys.details(), id] as const, // Key for fetching details of a specific customer by ID
};

// Queries related to customers, including fetching lists of customers and individual customer details
export function useCustomers(searchQuery?: string) {
  return useQuery({
    queryKey: customerKeys.list(searchQuery), // Use the list key with an optional search query to fetch customers
    queryFn: () => fetchCustomersClient(), // Function to fetch customers from the API
    staleTime: 10 * 1000, // Cache the customer data for 10 seconds to reduce unnecessary network requests
  });
}
