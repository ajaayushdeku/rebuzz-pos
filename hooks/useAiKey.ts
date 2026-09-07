"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  fetchAiKeyStatus,
  removeAiKey,
  saveAiKey,
  type AiKeyStatus,
} from "@/services/apiAiKey.client";

const AI_KEY_QUERY = ["ai-key-status"];

export function useAiKeyStatus() {
  return useQuery<AiKeyStatus>({
    queryKey: AI_KEY_QUERY,
    queryFn: fetchAiKeyStatus,
    // Whether a key exists gates a whole feature, so it must not be served
    // stale straight after the user has added or removed one.
    staleTime: 0,
    retry: false,
  });
}

export function useSaveAiKey() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: saveAiKey,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: AI_KEY_QUERY });
    },
  });
}

export function useRemoveAiKey() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: removeAiKey,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: AI_KEY_QUERY });
    },
  });
}
