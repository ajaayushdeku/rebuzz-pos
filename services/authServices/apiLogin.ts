import { LoginResponse } from "@/lib/types/auth";

type LoginPayload = {
  email_or_phone: string;
  password: string;
  deviceToken: string;
};

type ApiResult<T = unknown> =
  | { success: true; data: T }
  /**
   * `forbidden` marks the one failure that is not about the credentials: the
   * password was right and the account is simply not allowed in. The caller
   * shows the reason on its own page rather than as a form error, so it is
   * kept separate from `error` instead of being matched on wording.
   */
  | { success: false; error: string; forbidden?: boolean };

const extractError = (data: {
  data: string | { message?: string } | Record<string, string>;
}): string => {
  if (typeof data.data === "string") return data.data;
  if (typeof data.data?.message === "string") return data.data.message;
  return Object.values(data.data as Record<string, string>).join(", ");
};

const loginUser = async (
  // slug: string,
  payload: LoginPayload,
): Promise<ApiResult<LoginResponse["data"]>> => {
  try {
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const data = await res.json();

    if (!res.ok) {
      return {
        success: false,
        error: data?.error ?? data?.message,
        forbidden: res.status === 403 && data?.forbidden === true,
        // `Request failed with status ${res.status}`,
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
    console.error("Login error:", error);
    return {
      success: false,
      error: "Network error. Please try again.",
    };
  }
};

export default loginUser;
