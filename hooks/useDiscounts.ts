import {
  createDiscount,
  fetchDiscounts,
  updateDiscount,
  deleteDiscount,
} from "@/services/apiDiscounts.client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";

// Cache the Fetched Discount Coupons
export const useDiscounts = () => {
  return useQuery({
    queryKey: ["discount"],
    queryFn: fetchDiscounts,

    staleTime: 20 * 1000,
  });
};

// Cached the Created New Discount Coupon
export const useCreateDiscount = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createDiscount,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["discount"],
      });
      toast.success("Discount created successfully");
    },
  });
};

// Update Discount Coupon
export const useUpdateDiscount = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateDiscount,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["discount"],
      });
      toast.success("Discount updated successfully");
    },
  });
};

// Delete Discount Coupon
export const useDeleteDiscount = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteDiscount,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["discount"],
      });
      toast.success("Discount deleted successfully");
    },
  });
};
