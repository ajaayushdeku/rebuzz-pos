type ApiResult<T = unknown> =
  | { success: true; data: T }
  | { success: false; error: string };

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "https://appapi.rebuzzpos.com";

/**
 * Step 1: Send a reset token to the user's email (POST)
 */
export const sendResetToken = async (
  email: string,
): Promise<ApiResult<{ message: string }>> => {
  try {
    const res = await fetch(`${API_URL}/business/auth/user/reset`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });

    const data = await res.json();

    if (!res.ok) {
      return {
        success: false,
        error: data?.error ?? data?.message ?? "Failed to send reset email",
      };
    }

    // Check if the API returned status: "fail" in the response body
    if (data?.status === "fail") {
      return {
        success: false,
        error:
          data?.data?.message ??
          data?.data ??
          data?.message ??
          "Failed to send reset email",
      };
    }

    return { success: true, data };
  } catch (error) {
    console.error("Send reset token error:", error);
    return {
      success: false,
      error: "Network error. Please try again.",
    };
  }
};

/**
 * Step 2: Reset the password using the token (PUT)
 */
export const resetPassword = async (payload: {
  email: string;
  token: string;
  password: string;
  confirm_password: string;
}): Promise<ApiResult<{ message: string }>> => {
  try {
    const res = await fetch(`${API_URL}/business/auth/user/reset`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = await res.json();

    if (!res.ok) {
      return {
        success: false,
        error: data?.error ?? data?.message ?? "Failed to reset password",
      };
    }

    return { success: true, data };
  } catch (error) {
    console.error("Reset password error:", error);
    return {
      success: false,
      error: "Network error. Please try again.",
    };
  }
};
