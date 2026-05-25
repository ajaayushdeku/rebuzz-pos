import { Customer } from "@/lib/types/customer";

type RawProfileUser = {
  _id: string;
  name: string;
  email: string | null;
  phone: string;
  countryCode?: string;
  role?: string;
  emailVerified?: boolean;
  currency?: string;
  isSubscribed?: boolean;
  subscribeTo?: string;
  subscriptionType?: string;
  hasPrinter?: string;
  subscriptionRemaining?: number;
  showInOrdering?: boolean;
  note?: string | null;
  permissions?: string[];
  favourites?: string[];
};

type ProfileResponse = {
  status: string;
  data: {
    user: RawProfileUser;
  };
};

function mapRawProfileToCustomer(raw: RawProfileUser): Customer {
  return {
    id: raw._id,
    name: raw.name,
    email: raw.email,
    phone: raw.phone,
    numberOfPurchases: 0,
    totalDueAmount: 0,
    loyaltyPoint: 0,
    loyaltyStatus: "Bronze",
    note: raw.note ?? null,
    isDeactivated: false,
  };
}

export const fetchUserData = async (): Promise<Customer> => {
  const res = await fetch("/api/profile");

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.message || "Failed to fetch user data");
  }

  const payload: ProfileResponse = await res.json();
  const rawUser = payload?.data?.user;

  if (!rawUser) {
    throw new Error("Invalid profile response structure");
  }

  return mapRawProfileToCustomer(rawUser);
};
