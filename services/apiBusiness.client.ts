// import axios from "axios";

// interface Business {
//   _id: string;
//   businessName: string;
//   adminId: string;
//   address: string;
//   panNumber: number;
//   owner: string;
//   businessType: string;
//   showInOrdering: boolean;
//   phoneNumber: string;
//   accurateLocation: string;
//   email?: string;
//   logo?: string;
// }
// export type BusinessFormValues = {
//   businessName: string;
//   address: string;
//   accurateLocation?: string;
//   phoneNumber: string;
//   panNo: number;
//   owner: string;
//   businessType: string;
//   logo?: File | null;
// };

// export const fetchBusinessData = async (): Promise<Business> => {
//   const res = await axios.get("/api/business");

//   // if (!res.ok) {
//   //   const errorData = await res.json().catch(() => ({}));
//   //   throw new Error(errorData.message || "Failed to fetch business data");
//   // }
//   const rawData = res.data;
//   const data = rawData?.data?.business || [];
//   return data;
// };

// export const updateBusinessData = async (businessData: BusinessFormValues) => {
//   const res = await axios.put("/api/business", businessData, {
//     headers: {
//       "Content-Type": "application/json",
//     },
//   });

//   const result = res.data;
//   // if (!res.ok || result.status !== "success") {
//   //   throw new Error(result.message || "Failed to update business data");
//   // }
//   return result;
// };

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
  email?: string;
  logo?: string;
}

export type BusinessFormValues = {
  businessName: string;
  address: string;
  accurateLocation?: string;
  phoneNumber: string;
  panNo: number;
  owner: string;
  businessType: string;
  logo?: File | null; // ← add logo field
};

export const fetchBusinessData = async (): Promise<Business> => {
  const res = await axios.get("/api/business");
  const rawData = res.data;
  return rawData?.data?.business || [];
};

export const updateBusinessData = async (businessData: BusinessFormValues) => {
  // ── Build FormData so the logo file can be sent ───────────────────────
  const formData = new FormData();
  formData.append("businessName", businessData.businessName);
  formData.append("address", businessData.address);
  formData.append("phoneNumber", businessData.phoneNumber);
  formData.append("panNo", String(businessData.panNo));
  formData.append("owner", businessData.owner);
  formData.append("businessType", businessData.businessType);

  if (businessData.accurateLocation) {
    formData.append("accurateLocation", businessData.accurateLocation);
  }

  // Only append logo if a new file was selected
  if (businessData.logo instanceof File) {
    formData.append("logo", businessData.logo);
  }

  const res = await axios.put("/api/business", formData, {
    headers: {
      // Don't set Content-Type manually — axios sets it with the boundary
      "Content-Type": "multipart/form-data",
    },
  });

  return res.data;
};
