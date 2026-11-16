import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import {
  createAddon,
  deleteAddon,
  fetchAddonById,
  fetchAddons,
  updateAddon,
} from "@/services/addons.client";
import { CreateAddonPayload, UpdateAddonPayload } from "@/lib/types/addons";

export const ADDONS_KEY = ["addons"] as const;

export const useAddons = () => {
  return useQuery({
    queryKey: ADDONS_KEY,
    queryFn: fetchAddons,
    staleTime: 60 * 1000,
    refetchOnWindowFocus: false,
  });
};

// Fetch one addon by ID
export const useAddon = (id: string, enabled = true) => {
  return useQuery({
    queryKey: [...ADDONS_KEY, id],
    queryFn: () => fetchAddonById(id),
    enabled: enabled && !!id,
    staleTime: 60 * 1000,
    refetchOnWindowFocus: false,
  });
};

export const useCreateAddon = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateAddonPayload) => createAddon(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ADDONS_KEY });
      toast.success("Addon created");
    },
    onError: () => {
      toast.error("Failed to create addon");
    },
  });
};

export const useUpdateAddon = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: UpdateAddonPayload) => updateAddon(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ADDONS_KEY });
      toast.success("Addon updated");
    },
    onError: () => {
      toast.error("Failed to update addon");
    },
  });
};

export const useDeleteAddon = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteAddon(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ADDONS_KEY });
      toast.success("Addon deleted");
    },
    onError: () => {
      toast.error("Failed to delete addon");
    },
  });
};
