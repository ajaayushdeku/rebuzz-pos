import axios from "axios";

interface Business {
  _id: string;
  businessName: string;
  adminId: string;
  address: string;
  panNumber: number;
  owner: string;
  businessType: string;
  showInOrdering: boolean;
  phoneNumber: string;
  accurateLocation: string;
}
type BusinessFormValues = {
  businessName: string;
  address: string;
  accurateLocation?: string;
  phoneNumber: string;

  panNumber: number;
  owner: string;
  businessType: string;
};

export const fetchBusinessData = async (): Promise<Business> => {
  const res = await axios.get("/api/business");

  // if (!res.ok) {
  //   const errorData = await res.json().catch(() => ({}));
  //   throw new Error(errorData.message || "Failed to fetch business data");
  // }
  const rawData = res.data;
  const data = rawData?.data?.business || [];
  return data;
};

export const updateBusinessData = async ({
  businessData,
}: {
  businessData: BusinessFormValues;
}) => {
  const res = await axios.put(
    "/api/business",
    { businessData },
    {
      headers: {
        "Content-Type": "application/json",
      },
    },
  );

  const result = res.data;
  // if (!res.ok || result.status !== "success") {
  //   throw new Error(result.message || "Failed to update business data");
  // }
  return result;
};
