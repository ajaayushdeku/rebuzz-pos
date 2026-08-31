import {
  Customer,
  // IndividualCustomer,
  mapRawCustomerToCustomer,
  type RawCustomer,
} from "@/lib/types/customer";
import axios from "axios";
import { fetchLoyaltyTiers } from "@/services/apiLoyaltyTier.client";

export async function fetchCustomersClient(): Promise<Customer[]> {
  /**
   * The ladder is read alongside the customers so each one is banded by the
   * business's own tiers rather than the built-in thresholds — and banded
   * once, here, so every screen showing `loyaltyStatus` agrees.
   *
   * A failure to read it is not a failure to list customers: the mapper falls
   * back to the built-in thresholds, which is what it did before the tiers
   * were configurable.
   */
  const [res, tiers] = await Promise.all([
    axios.get("/api/customers"),
    fetchLoyaltyTiers().catch(() => []),
  ]);

  // if (!res.ok) {
  //   const errorData = await res.json().catch(() => ({}));
  //   throw new Error(errorData.message || "Failed to fetch customers");
  // }

  const payload = res.data;

  const rawUsers = payload?.data?.users || [];
  return rawUsers.map((raw: RawCustomer) =>
    mapRawCustomerToCustomer(raw, tiers),
  );
}

// export async function fetchIndividualCustomerData(): Promise<IndividualCustomer> {
//   const res = await fetch(
//     `/api/customers/lookup?${query}`,
//   );
// }

// export const getCustomerById = async (
//   customerId: string,
// ) => {
//   const response = await fetch(
//     `/api/customers/lookup?${customerId}`,
//   );
//   if (!response.ok)
//     throw new Error(
//       "Failed to fetch customer data",
//     );
//   return response.json();
// };
