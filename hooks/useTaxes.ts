import {
  fetchTaxes,
  updateTaxSettings,
  toggleTaxEnabled,
  createTaxes,
  createGroupTax,
} from "@/services/apiTaxes.client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";

export const useTaxes = () => {
  return useQuery({
    queryKey: ["taxes"],
    queryFn: fetchTaxes,
    staleTime: 0,
  });
};

export const useCreateTax = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createTaxes,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["taxes"] });
      toast.success("Tax created successfully");
    },
    onError: () => toast.error("Failed to create tax"),
  });
};

export const useCreateGroupTax = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createGroupTax,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["taxes"] });
      toast.success("Group tax created successfully");
    },
    onError: () => toast.error("Failed to create group tax"),
  });
};

export const useUpdateTaxSettings = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateTaxSettings,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["taxes"] });
    },
    onError: () => toast.error("Failed to update tax settings"),
  });
};

export const useToggleTax = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ taxId, isEnabled }: { taxId: string; isEnabled: boolean }) =>
      toggleTaxEnabled(taxId, isEnabled),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["taxes"] });
    },
    onError: () => toast.error("Failed to update tax"),
  });
};
