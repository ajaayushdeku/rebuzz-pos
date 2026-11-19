"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  deleteCustomerRetentionFeedback,
  fetchCustomerRetentionFeedback,
  saveCustomerRetentionFeedback,
  type CustomerRetentionFeedback,
  type SaveRetentionFeedbackInput,
} from "@/services/apiCustomerRetentionFeedback.client";

import { AiInsightsError } from "@/services/apiAiInsights.client";

import type { PeriodKind } from "@/services/apiPeriodInsights.client";

export const retentionFeedbackKeys = {
  all: ["customer-retention-feedback"] as const,

  period: (kind: PeriodKind, periodId: string) =>
    [...retentionFeedbackKeys.all, "period", kind, periodId] as const,

  preferences: () => [...retentionFeedbackKeys.all, "preferences"] as const,
};

/** Read saved feedback for the currently selected completed period. */
export function useCustomerRetentionFeedback(
  kind: PeriodKind,
  periodId: string,
) {
  return useQuery({
    queryKey: retentionFeedbackKeys.period(kind, periodId),
    queryFn: () => fetchCustomerRetentionFeedback(kind, periodId),
    enabled: Boolean(periodId),
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
    retry: false,
  });
}

/** Save or update a decision for a message. */
export function useSaveCustomerRetentionFeedback() {
  const queryClient = useQueryClient();

  return useMutation<
    CustomerRetentionFeedback,
    AiInsightsError,
    SaveRetentionFeedbackInput
  >({
    mutationFn: saveCustomerRetentionFeedback,

    onSuccess: (saved, input) => {
      queryClient.setQueryData<CustomerRetentionFeedback[]>(
        retentionFeedbackKeys.period(input.kind, input.periodId),
        (previous = []) => {
          const exists = previous.some(
            (entry) => entry.messageId === saved.messageId,
          );

          return exists
            ? previous.map((entry) =>
                entry.messageId === saved.messageId ? saved : entry,
              )
            : [...previous, saved];
        },
      );

      // Keep business-wide learning data fresh for when the preferences
      // endpoint is used by the retention prompt.
      void queryClient.invalidateQueries({
        queryKey: retentionFeedbackKeys.preferences(),
      });
    },

    retry: false,
  });
}

/** Remove a previously saved decision for a message. */
export function useDeleteCustomerRetentionFeedback() {
  const queryClient = useQueryClient();

  return useMutation<
    void,
    AiInsightsError,
    { kind: PeriodKind; periodId: string; messageId: string }
  >({
    mutationFn: deleteCustomerRetentionFeedback,

    onSuccess: (_data, input) => {
      queryClient.setQueryData<CustomerRetentionFeedback[]>(
        retentionFeedbackKeys.period(input.kind, input.periodId),
        (previous = []) =>
          previous.filter((entry) => entry.messageId !== input.messageId),
      );

      void queryClient.invalidateQueries({
        queryKey: retentionFeedbackKeys.preferences(),
      });
    },

    retry: false,
  });
}
