import {
  Customer,
  mapRawCustomerToCustomer,
  RawCustomerListResponse,
} from "@/lib/types/customer";
import { authHeaders } from "./authServices/session";
import axios from "axios";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

const BASE = process.env.NEXT_PUBLIC_API_URL;

export const fetchCustomers = async (): Promise<Customer[]> => {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;

  const res = await axios.get(`${BASE}/business/users/roles/user`, {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });

  // if (!res.ok) throw new Error(`Failed to fetch customers: ${res.status}`);

  const data: RawCustomerListResponse = res.data;

  return data.data.users.map((rawItem) => mapRawCustomerToCustomer(rawItem));
};
