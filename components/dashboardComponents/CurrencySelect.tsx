"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCurrency } from "@/providers/CurrencyContext";

export default function CurrencySelect() {
  const { currency, currencies, setCurrency } = useCurrency();

  return (
    <Select value={currency.code} onValueChange={setCurrency}>
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
