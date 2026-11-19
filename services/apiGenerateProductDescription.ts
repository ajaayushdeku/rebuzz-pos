export type GenerateProductDescriptionPayload = {
  productName: string;
  category: string;
};

export type GenerateProductDescriptionResponse = {
  productName: string;
  category: string;
  description: string;
};

export const generateProductDescription = async (
  payload: GenerateProductDescriptionPayload,
): Promise<GenerateProductDescriptionResponse> => {
  const res = await fetch("/api/generate-description", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const error = await res.json().catch(() => null);

    throw new Error(error?.message || "Failed to generate product description");
  }

  const json = await res.json();

  return json;
};
