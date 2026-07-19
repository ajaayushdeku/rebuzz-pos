type CreateCustomerPayload = {
  name: string;
  email: string;
  phone: string;
  countryCode: string;
  customerPan?: string;
  role?: string;
  note?: string;
  /** Optional profile photo — sent as multipart/form-data when present. */
  image?: File | null;
};

type CreateResult =
  | { success: true; data: unknown }
  | { success: false; error: string };

const extractError = (data: {
  data: string | { message?: string } | Record<string, string>;
}): string => {
  if (typeof data.data === "string") return data.data;
  if (typeof data.data?.message === "string") return data.data.message;
  return Object.values(data.data as Record<string, string>).join(", ");
};

const createCustomer = async (
  payload: CreateCustomerPayload,
): Promise<CreateResult> => {
  try {
    const { image, ...fields } = payload;

    // With a photo the request must be multipart so the file survives the hop
    // to the backend; without one keep the simpler JSON body.
    let res: Response;
    if (image) {
      const formData = new FormData();
      for (const [key, value] of Object.entries(fields)) {
        if (value !== undefined && value !== null) {
          formData.append(key, String(value));
        }
      }
      formData.append("image", image, image.name);

      res = await fetch("/api/customers/create", {
        method: "POST",
        // No Content-Type header — fetch sets multipart/form-data with boundary
        body: formData,
      });
    } else {
      res = await fetch("/api/customers/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(fields),
      });
    }

    const data = await res.json();

    if (!res.ok) {
      return {
        success: false,
        error: data?.message ?? `Request failed with status ${res.status}`,
      };
    }

    if (data.status === "fail") {
      return {
        success: false,
        error: extractError(data),
      };
    }

    return { success: true, data };
  } catch (error) {
    console.error("Create customer error:", error);
    return {
      success: false,
      error: "Network error. Please try again.",
    };
  }
};

export default createCustomer;

// import axios from "axios";

// type CreateCustomerPayload = {
//   name: string;
//   email: string;
//   phone: string;
//   countryCode: string;
//   customerPan?: string;
//   role?: string;
//   note?: string;
// };

// type CreateResult =
//   | { success: true; data: unknown }
//   | { success: false; error: string };

// const extractError = (data: {
//   data: string | { message?: string } | Record<string, string>;
// }): string => {
//   if (typeof data.data === "string") return data.data;
//   if (typeof data.data?.message === "string") return data.data.message;
//   return Object.values(data.data as Record<string, string>).join(", ");
// };

// const createCustomer = async (
//   payload: CreateCustomerPayload,
// ): Promise<CreateResult> => {
//   try {
//     const res = await axios.post(
//       "/api/customers/create",
//       { payload },
//       {
//         headers: {
//           "Content-Type": "application/json",
//         },
//       },
//     );

//     const data = res.data;

//     if (data.status === "fail") {
//       return {
//         success: false,
//         error: extractError(data),
//       };
//     }

//     return { success: true, data };
//   } catch (error) {
//     console.error("Create customer error:", error);
//     return {
//       success: false,
//       error: "Network error. Please try again.",
//     };
//   }
// };

// export default createCustomer;
