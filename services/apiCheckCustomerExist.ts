type CheckCustomerPayload = {
  phone: string;
  countryCode: string;
};

type CheckResult =
  | { success: true; data: unknown }
  | { success: false; error: string };

const extractError = (data: {
  data: string | { message?: string } | Record<string, string>;
}): string => {
  if (typeof data.data === "string") return data.data;
  if (typeof data.data?.message === "string") return data.data.message;
  return Object.values(data.data as Record<string, string>).join(", ");
};

const checkCustomerExist = async (
  payload: CheckCustomerPayload,
): Promise<CheckResult> => {
  try {
    const res = await fetch("/api/customers/check", {
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
        error: data?.message ?? `Request failed with status ${res.status}`,
      };
    }

    if (data.status === "Failure") {
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

export default checkCustomerExist;
