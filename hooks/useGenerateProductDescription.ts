"use client";

import { useMutation } from "@tanstack/react-query";

import {
  generateProductDescription,
  type GenerateProductDescriptionPayload,
} from "@/services/apiGenerateProductDescription";

export const useGenerateProductDescription = () => {
  return useMutation({
    mutationFn: (payload: GenerateProductDescriptionPayload) =>
      generateProductDescription(payload),
  });
};
