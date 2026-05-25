export type Tax = {
  _id: string;
  name: string;
  isEnabled: boolean;
  rate: number;
};

export type GroupedTax = {
  _id: string;
  name: string;
  taxIds: string[];
  isEnabled: boolean;
};

export type TaxSettings = {
  mode: "none" | "exclusive" | "inclusive";
  isAddonTaxEnabled: boolean;
};

export type TaxResponse = {
  taxes: Tax[];
  groupedTaxes: GroupedTax[];
  taxSettings: TaxSettings;
};

type TaxPayload = {
  taxes: {
    name: string;
    rate: number;
    _id: null;
    adminId: null;
    isSelected: boolean;
    isEnabled: boolean;
    isToogleLoading: boolean;
  }[];
};

// Fetch/Get All Taxes
export const fetchTaxes = async (): Promise<TaxResponse> => {
  const res = await fetch("/api/taxes");
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.message || "Failed to fetch taxes");
  }

  const json = await res.json();

  // console.log("Tax API test data:", json);
  return {
    taxes: json?.data?.tax[0]?.taxes ?? [],
    groupedTaxes: json?.data?.tax[0]?.groupedTaxes ?? [],
    taxSettings: json?.data?.tax[0]?.taxSettings ?? {
      mode: "none",
      isAddonTaxEnabled: false,
    },
  };
};

// Create New Tax Rate
export const createTaxes = async (taxData: any): Promise<Tax> => {
  const res = await fetch("/api/taxes", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(taxData),
  });

  if (!res.ok) throw new Error("Failed to create tax rate");
  return res.json();
};

// export const createTaxes = async (payload: {
//   taxes: {
//     name: string;
//     rate: number;
//     _id: null;
//     adminId: null;
//     isSelected: boolean;
//     isEnabled: boolean;
//     isToogleLoading: boolean;
//   }[];
// }): Promise<void> => {
//   const res = await fetch("/api/taxes/create", {
//     method: "POST",
//     headers: { "Content-Type": "application/json" },
//     body: JSON.stringify(payload),
//   });
//   if (!res.ok) throw new Error("Failed to create tax");
// };

export const createGroupTax = async (payload: {
  groupName: string;
  groupedTaxes: string[];
}): Promise<void> => {
  const res = await fetch("/api/taxes/group", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error("Failed to create group tax");
};

// Update the Tax Settings
export const updateTaxSettings = async (payload: {
  mode: "none" | "exclusive" | "inclusive";
  isAddonTaxEnabled: boolean;
}): Promise<TaxSettings> => {
  const res = await fetch("/api/taxes/settings", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!res.ok) throw new Error("Failed to update tax settings");

  const json = await res.json();
  return json?.data?.taxSettings;
};

// Enable/Disable the Taxes to Apply to the invoice
export const toggleTaxEnabled = async (
  taxId: string,
  isEnabled: boolean,
): Promise<void> => {
  const res = await fetch(`/api/taxes/${taxId}/enable-disable`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ isEnabled }),
  });

  if (!res.ok) throw new Error("Failed to toggle tax");
};
