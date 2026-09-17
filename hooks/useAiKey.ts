"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  fetchAiKeyStatus,
  fetchAiModels,
  removeAiKey,
  saveAiKey,
  updateAiModel,
  type AiKeyStatus,
  type AiModelList,
} from "@/services/apiAiKey.client";

const AI_KEY_QUERY = ["ai-key-status"];
const AI_MODELS_QUERY = ["ai-models"];

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
      // The model list belongs to a key, not to the business. Replacing a key
      // with one from another Google project left the old key's models in the
      // dropdown for the five minutes the list stays fresh — and picking one
      // of those would be refused.
      queryClient.invalidateQueries({ queryKey: AI_MODELS_QUERY });
    },
  });
}

export function useRemoveAiKey() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: removeAiKey,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: AI_KEY_QUERY });
      // No key, no models. Removed rather than invalidated: the query is
      // disabled without a key, so it would never refetch, and the stale list
      // would be served straight back if a key were saved within five minutes.
      queryClient.removeQueries({ queryKey: AI_MODELS_QUERY });
    },
  });
}

/**
 * Switch the stored `gemini.model` attribute via the settings PATCH. The key
 * itself never moves.
 */
export function useUpdateAiModel() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateAiModel,
    onSuccess: (data) => {
      queryClient.setQueryData(AI_KEY_QUERY, data);
      queryClient.invalidateQueries({ queryKey: AI_KEY_QUERY });
    },
  });
}

/**
 * The models the stored key can actually call, as Google reports them.
 *
 * Only enabled when a key is configured — the backend answers 404 otherwise,
 * so the query is disabled rather than left to run and fail on every mount.
 */
export function useAiModels(enabled: boolean) {
  return useQuery<AiModelList>({
    queryKey: AI_MODELS_QUERY,
    queryFn: fetchAiModels,
    enabled,
    staleTime: 5 * 60 * 1000,
    retry: false,
  });
}
