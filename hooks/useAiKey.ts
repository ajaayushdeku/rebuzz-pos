"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  fetchAiKeyStatus,
  fetchAiModels,
  removeAiKey,
  saveAiKey,
  switchAiProvider,
  updateAiModel,
  type AiKeyStatus,
  type AiModelList,
} from "@/services/apiAiKey.client";

const AI_KEY_QUERY = ["ai-key-status"];
/**
 * Keyed by provider: each one's key has its own model list, and a switch that
 * served the other provider's list would offer models the new key cannot call.
 */
const AI_MODELS_QUERY = ["ai-models"];
const aiModelsQuery = (provider?: string) =>
  provider ? [...AI_MODELS_QUERY, provider] : AI_MODELS_QUERY;

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

/**
 * Whether this business has an AI provider key saved, for hiding AI features
 * that cannot run without one.
 *
 * Reads the same status query as the settings screen, so saving or removing a
 * key there updates every gate at once — the save and remove hooks invalidate
 * it, and invalidation refetches every mounted reader whatever its settings.
 *
 * With its own freshness settings, though. The sidebar mounts this on every
 * page, and the settings screen's `staleTime: 0` would refetch the status on
 * each window focus — a round trip to the AI service and on to the POS API —
 * for a value that only changes through that screen.
 *
 * False while the answer is loading and false if the AI service cannot be
 * reached. A link to a feature that could only show an error is worse than no
 * link, and one that appears and then vanishes is worse still.
 */
export function useHasSavedAiKey(): boolean {
  const { data } = useQuery<AiKeyStatus>({
    queryKey: AI_KEY_QUERY,
    queryFn: fetchAiKeyStatus,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
    retry: false,
  });
  return data?.configured === true;
}

/**
 * The name of the provider answering insights — "Google Gemini", "Groq" — for
 * saying whose AI wrote a card.
 *
 * The label comes from the service's own catalogue rather than a list here, so
 * a provider added server-side is named correctly without a frontend change.
 * Null while loading, or if the service cannot be reached: a card footer
 * should say less rather than guess.
 *
 * Same freshness settings as `useHasSavedAiKey`, for the same reason — this
 * mounts on every insight section, and the value only changes in settings.
 */
export function useAiProviderLabel(): string | null {
  const { data } = useQuery<AiKeyStatus>({
    queryKey: AI_KEY_QUERY,
    queryFn: fetchAiKeyStatus,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
    retry: false,
  });
  if (!data?.provider) return null;
  return (
    data.providers?.find((p) => p.id === data.provider)?.label ?? data.provider
  );
}

export function useSaveAiKey() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ apiKey, provider }: { apiKey: string; provider?: string }) =>
      saveAiKey(apiKey, provider),
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

/**
 * Switch to a provider whose key is already saved.
 *
 * The status changes wholesale — provider, model and mask all belong to the
 * new provider — so the answer replaces the cached status rather than patching
 * it, and the model lists are refetched.
 */
export function useSwitchAiProvider() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: switchAiProvider,
    onSuccess: (data) => {
      queryClient.setQueryData(AI_KEY_QUERY, data);
      queryClient.invalidateQueries({ queryKey: AI_KEY_QUERY });
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
 * Switch the model recorded for the provider in use, via the settings PATCH.
 * The key itself never moves.
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
 * The models the stored key can actually call, as the provider reports them.
 *
 * Only enabled when a key is configured — the backend answers 404 otherwise,
 * so the query is disabled rather than left to run and fail on every mount.
 */
export function useAiModels(enabled: boolean, provider?: string) {
  return useQuery<AiModelList>({
    queryKey: aiModelsQuery(provider),
    queryFn: () => fetchAiModels(provider),
    enabled,
    staleTime: 5 * 60 * 1000,
    retry: false,
  });
}
