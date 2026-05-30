import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createTicket, updateTicket } from "@/services/apiTicket.client";
import toast from "react-hot-toast";

// Cache the created Invoice/Ticket
export const useCreateTicket = () => {
  return useMutation({
    mutationFn: createTicket,
    onSuccess: () => {
      toast.success("Invoice saved successfully!");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
};

// Cache the updated Invoice/Ticket
export const useUpdateTicket = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateTicket,
    onSuccess: (result, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["tickets"],
      });
      queryClient.invalidateQueries({
        queryKey: ["ticket", variables.invoiceNumber],
      });
      toast.success("Invoice updated successfully!");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
};
