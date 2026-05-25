import axios from "axios";

const BASE = process.env.NEXT_PUBLIC_API_URL;

type ApiResult<T = unknown> =
  | { success: true; data: T }
  | { success: false; error: string };

const extractError = (data: {
  data: string | { message?: string } | Record<string, string>;
}): string => {
  if (typeof data.data === "string") return data.data;
  if (typeof data.data?.message === "string") return data.data.message;
  return Object.values(data.data as Record<string, string>).join(", ");
};

export async function verifyToken(
  slug: string,
  email: string,
  token: string,
): Promise<ApiResult> {
  try {
    const res = await axios.post(
      `${BASE}/${slug}/auth/email_token`,
      { email, token },
      {
        headers: {
          "Content-Type": "application/json",
        },
      },
    );

    const data = res.data;

    // if (!res.ok)
    //   return {
    //     success: false,
    //     error: data?.message ?? `Error ${res.status}`,
    //   };

    if (data.status === "fail")
      return {
        success: false,
        error: extractError(data),
      };

    return { success: true, data };
  } catch {
    return {
      success: false,
      error: "Network error. Please try again.",
    };
  }
}

export async function resendToken(
  slug: string,
  email: string,
): Promise<ApiResult> {
  try {
    const res = await axios.post(
      `${BASE}/${slug}/auth/email_token`,
      { email },
      {
        headers: {
          "Content-Type": "application/json",
        },
      },
    );

    const data = res.data;

    // if (!res.ok)
    //   return {
    //     success: false,
    //     error: data?.message ?? `Error ${res.status}`,
    //   };

    if (data.status === "fail")
      return {
        success: false,
        error: extractError(data),
      };

    return { success: true, data };
  } catch {
    return {
      success: false,
      error: "Failed to resend code. Please try again.",
    };
  }
}
