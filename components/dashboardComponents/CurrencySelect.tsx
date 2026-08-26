"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import toast from "react-hot-toast";

import { useCurrency } from "@/providers/CurrencyContext";

export default function CurrencySelect() {
  const { currency, currencies, setCurrency, isSaving } = useCurrency();

  // `setCurrency` now saves to the business, so a rejection has to be caught
  // here — an unhandled one from an event handler surfaces as a console error
  // and the user sees nothing.
  const handleChange = (code: string) => {
    setCurrency(code).catch((err: unknown) =>
      toast.error(
        err instanceof Error ? err.message : "Failed to change currency",
      ),
    );
  };

  return (
    <Select
      value={currency.code}
      onValueChange={handleChange}
      disabled={isSaving}
    >
      <SelectTrigger className="w-32 text-sm">
        <SelectValue />
      </SelectTrigger>

      <SelectContent>
        {currencies.map((c) => (
          <SelectItem key={c.code} value={c.code}>
            {c.symbol} {c.code}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
