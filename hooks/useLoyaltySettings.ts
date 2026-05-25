import { useQuery } from "@tanstack/react-query";
import {
  fetchLoyaltyPointSettings,
  LoyaltyPointSettings,
} from "@/services/apiLoyaltyPoint";

export const useLoyaltySettings = () => {
  return useQuery<LoyaltyPointSettings | null>({
    queryKey: ["loyalty-point"],
    queryFn: fetchLoyaltyPointSettings,
    staleTime: 5 * 60 * 1000,
  });
};
