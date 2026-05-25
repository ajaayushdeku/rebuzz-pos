"use client";

import {
  fetchBusinessData,
  updateBusinessData,
} from "@/services/apiBusiness.client";
import {
  QueryClient,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import toast from "react-hot-toast";

export const useBusiness = () => {
  return useQuery({
    queryKey: ["business-profile"],
    queryFn: fetchBusinessData,

    staleTime: Infinity,
  });
};

export function useUpdateBusiness() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateBusinessData,
    onSuccess: (result) => {
      queryClient.invalidateQueries({
        queryKey: ["business-profile"],
      });
      toast.success("Business updated successfully");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}
