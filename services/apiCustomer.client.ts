import {
  Customer,
  // IndividualCustomer,
  mapRawCustomerToCustomer,
} from "@/lib/types/customer";
import axios from "axios";

export async function fetchCustomersClient(): Promise<Customer[]> {
  const res = await axios.get("/api/customers");

  // if (!res.ok) {
  //   const errorData = await res.json().catch(() => ({}));
  //   throw new Error(errorData.message || "Failed to fetch customers");
  // }

  const payload = res.data;

  const rawUsers = payload?.data?.users || [];
  return rawUsers.map(mapRawCustomerToCustomer);
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
