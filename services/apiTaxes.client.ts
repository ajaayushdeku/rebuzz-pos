export type Tax = {
  _id: string;
  name: string;
  isEnabled: boolean;
  rate: number;
  _docId?: string;
};

export type GroupedTax = {
  _id: string;
  name: string;
  taxIds: string[];
  isEnabled: boolean;
  _docId?: string;
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

// type TaxPayload = {
//   taxes: {
//     name: string;
//     rate: number;
//     _id: null;
//     adminId: null;
//     isSelected: boolean;
//     isEnabled: boolean;
//     isToogleLoading: boolean;
//   }[];
// };

// Fetch/Get All Taxes
export const fetchTaxes = async (): Promise<TaxResponse> => {
  const res = await fetch("/api/taxes");
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.message || "Failed to fetch taxes");
  }

  const json = await res.json();

  const parent = json?.data?.tax?.[0];
  const docId: string | undefined = parent?._id;
  const rawTaxes: Tax[] = parent?.taxes ?? [];
  const rawGrouped: GroupedTax[] = parent?.groupedTaxes ?? [];

  return {
    taxes: rawTaxes.map((t) => ({ ...t, _docId: docId })),
    groupedTaxes: rawGrouped.map((g) => ({ ...g, _docId: docId })),
    taxSettings: parent?.taxSettings ?? {
      mode: "none",
      isAddonTaxEnabled: false,
    },
  };
};

// Create New Tax Rate
// eslint-disable-next-line @typescript-eslint/no-explicit-any
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

// Update Normal Tax
export const updateNormalTax = async ({
  docId,
  taxId,
  payload,
}: {
  docId: string;
  taxId: string;
  payload: { name: string; rate: number };
}): Promise<Record<string, unknown>> => {
  const res = await fetch(`/api/taxes/${docId}/normal/${taxId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.message || "Failed to update tax");
  }
  return res.json();
};

// Delete Normal Tax
export const deleteNormalTax = async ({
  docId,
  taxId,
}: {
  docId: string;
  taxId: string;
}): Promise<Record<string, unknown>> => {
  const res = await fetch(`/api/taxes/${docId}/normal/${taxId}`, {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.message || "Failed to delete tax");
  }
  return res.json();
};

// Update Group Tax
export const updateGroupTax = async ({
  docId,
  groupId,
  payload,
}: {
  docId: string;
  groupId: string;
  payload: { name: string; taxIds: string[] };
}): Promise<Record<string, unknown>> => {
  const res = await fetch(`/api/taxes/${docId}/group/${groupId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.message || "Failed to update group tax");
  }
  return res.json();
};

// Delete Group Tax
export const deleteGroupTax = async ({
  docId,
  groupId,
}: {
  docId: string;
  groupId: string;
}): Promise<Record<string, unknown>> => {
  const res = await fetch(`/api/taxes/${docId}/group/${groupId}`, {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.message || "Failed to delete group tax");
  }
  return res.json();
};
