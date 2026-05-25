import axios from "axios";

const BASE = process.env.NEXT_PUBLIC_API_URL;

type RegisterPayload = {
  name: string;
  email: string;
  phone: string;
  password: string;
  confirm_password: string;
};

type RegisterResult =
  | { success: true; data: unknown }
  | { success: false; error: string };

const extractError = (data: {
  data: string | { message?: string } | Record<string, string>;
}): string => {
  if (typeof data.data === "string") return data.data;
  if (typeof data.data?.message === "string") return data.data.message;
  return Object.values(data.data as Record<string, string>).join(", ");
};

const registerUser = async (
  businessSlug: string,
  payload: RegisterPayload,
): Promise<RegisterResult> => {
  try {
    const res = await axios.post(
      //   `https://appapi.rebuzzpos.com/api/java/auth/register`,
      `${BASE}/${businessSlug}/auth/register/pos`,
      // `https://appapi.rebuzzpos.com/api/${businessSlug}/auth/register`,
      {
        id: "",
        address: "",
        ...payload,
      },
      {
        headers: {
          "Content-Type": "application/json",
        },
      },
    );

    const data = res.data;

    // if (!res.ok) {
    //   return {
    //     success: false,
    //     error: data?.message ?? `Request failed with status ${res.status}`,
    //   };
    // }
    if (data.status === "fail") {
      return {
        success: false,
        error: extractError(data),
      };
    }

    return { success: true, data };
  } catch (error) {
    console.log(error);
    return {
      success: false,
      error: "Network error. Please try again.",
    };
  }
};

export default registerUser;
