"use client";

import { useState, useMemo } from "react";
import { Search, Check, Coins, Loader2 } from "lucide-react";
import { useCurrency } from "@/providers/CurrencyContext";
import toast from "react-hot-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

const CURRENCIES = [
  {
    code: "NPR",
    symbol: "Rs",
    name: "Nepalese Rupee",
    country: "Nepal",
    countryCode: "np",
  },
  {
    code: "USD",
    symbol: "$",
    name: "United States Dollar",
    country: "United States",
    countryCode: "us",
  },
  {
    code: "INR",
    symbol: "₹",
    name: "Indian Rupee",
    country: "India",
    countryCode: "in",
  },
  {
    code: "EUR",
    symbol: "€",
    name: "Euro",
    country: "European Union",
    countryCode: "eu",
  },
  {
    code: "GBP",
    symbol: "£",
    name: "British Pound",
    country: "United Kingdom",
    countryCode: "gb",
  },
  {
    code: "AUD",
    symbol: "A$",
    name: "Australian Dollar",
    country: "Australia",
    countryCode: "au",
  },
  {
    code: "CAD",
    symbol: "C$",
    name: "Canadian Dollar",
    country: "Canada",
    countryCode: "ca",
  },
  {
    code: "JPY",
    symbol: "¥",
    name: "Japanese Yen",
    country: "Japan",
    countryCode: "jp",
  },
  {
    code: "CNY",
    symbol: "¥",
    name: "Chinese Yuan",
    country: "China",
    countryCode: "cn",
  },
  {
    code: "SGD",
    symbol: "S$",
    name: "Singapore Dollar",
    country: "Singapore",
    countryCode: "sg",
  },
  {
    code: "AED",
    symbol: "د.إ",
    name: "UAE Dirham",
    country: "United Arab Emirates",
    countryCode: "ae",
  },
  {
    code: "SAR",
    symbol: "﷼",
    name: "Saudi Riyal",
    country: "Saudi Arabia",
    countryCode: "sa",
  },
  {
    code: "NZD",
    symbol: "NZ$",
    name: "New Zealand Dollar",
    country: "New Zealand",
    countryCode: "nz",
  },
  {
    code: "KRW",
    symbol: "₩",
    name: "South Korean Won",
    country: "South Korea",
    countryCode: "kr",
  },
  {
    code: "MYR",
    symbol: "RM",
    name: "Malaysian Ringgit",
    country: "Malaysia",
    countryCode: "my",
  },
  {
    code: "THB",
    symbol: "฿",
    name: "Thai Baht",
    country: "Thailand",
    countryCode: "th",
  },
  {
    code: "PHP",
    symbol: "₱",
    name: "Philippine Peso",
    country: "Philippines",
    countryCode: "ph",
  },
  {
    code: "CHF",
    symbol: "CHF",
    name: "Swiss Franc",
    country: "Switzerland",
    countryCode: "ch",
  },
  {
    code: "SEK",
    symbol: "kr",
    name: "Swedish Krona",
    country: "Sweden",
    countryCode: "se",
  },
  {
    code: "HKD",
    symbol: "HK$",
    name: "Hong Kong Dollar",
    country: "Hong Kong",
    countryCode: "hk",
  },
  {
    code: "BRL",
    symbol: "R$",
    name: "Brazilian Real",
    country: "Brazil",
    countryCode: "br",
  },
];

export default function CurrencyPage() {
  const { currency, setCurrency } = useCurrency();
  const [search, setSearch] = useState("");
  const [confirmTarget, setConfirmTarget] = useState<{
    code: string;
    symbol: string;
    name: string;
    country: string;
    countryCode: string;
  } | null>(null);
  const [saving, setSaving] = useState(false);

  const filtered = useMemo(
    () =>
      CURRENCIES.filter(
        (c) =>
          c.name.toLowerCase().includes(search.toLowerCase()) ||
          c.code.toLowerCase().includes(search.toLowerCase()) ||
          c.country.toLowerCase().includes(search.toLowerCase()),
      ),
    [search],
  );

  const handleSelect = (code: string) => {
    const found = CURRENCIES.find((c) => c.code === code);
    if (found) setConfirmTarget(found);
  };

  const handleConfirm = () => {
    if (!confirmTarget) return;
    setSaving(true);
    // Apply immediately then reload so all rendered amounts refresh.
    setCurrency(confirmTarget.code);
    toast.success(`Currency changed to ${confirmTarget.code}`);
    setConfirmTarget(null);
    window.location.reload();
  };

  return (
    <div className="min-h-screen bg-50 px-6 py-8 md:px-10">
      <div className="w-full mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 pb-4 border-b border-gray-200">
          <div className="flex flex-row items-center gap-3">
            <div className="w-9 h-9 bg-blue-100 rounded-lg flex flex-row items-center justify-center">
              <Coins size={16} className="text-blue-600" />
            </div>
            <div>
              <h1 className="font-bold text-xl md:text-2xl truncate">
                Change Currency
              </h1>
              <p className="text-xs text-gray-400 mt-0.5">
                Select your preferred currency
              </p>
            </div>
          </div>
        </div>

        {/* Current */}
        <div className="bg-blue-50 border border-blue-100 rounded-xl px-4 py-3 mb-8 flex items-center gap-3">
          <span className="w-9 h-6 rounded-xs overflow-hidden shrink-0 ring-1 ring-black/5">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={`https://flagcdn.com/w40/${CURRENCIES.find((c) => c.code === currency.code)?.countryCode ?? "np"}.png`}
              alt={currency.code}
              className="w-full h-full object-cover"
              loading="lazy"
            />
          </span>
          <div>
            <p className="text-xs text-blue-500 font-medium">Active Currency</p>
            <p className="text-sm font-semibold text-blue-800">
              {currency.code} —{" "}
              {CURRENCIES.find((c) => c.code === currency.code)?.name}
            </p>
          </div>
        </div>

        {/* Search */}
        <div className="relative mb-4">
          <Search
            size={13}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
          />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search currencies..."
            className="w-full pl-8 pr-3 py-2 text-[13px] border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* List */}
        <div className="space-y-1.5 max-h-96 overflow-y-auto pr-1">
          {filtered.map((c) => {
            const isActive = c.code === currency.code;
            return (
              <button
                key={c.code}
                onClick={() => handleSelect(c.code)}
                className={`w-full flex items-center gap-4 px-3 py-2.5 rounded-lg border text-left transition-colors ${
                  isActive
                    ? "border-blue-500 bg-blue-50"
                    : "border-gray-100 hover:border-gray-200 hover:bg-gray-50"
                }`}
              >
                <span className="w-8 h-5 rounded-xs overflow-hidden shrink-0 ring-1 ring-black/5">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={`https://flagcdn.com/w40/${c.countryCode}.png`}
                    alt={c.code}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-gray-800">
                      {c.code}
                    </span>
                    <span className="text-xs text-gray-400">{c.symbol}</span>
                  </div>
                  <p className="text-xs text-gray-400 truncate">
                    {c.country} — {c.name}
                  </p>
                </div>
                {isActive && (
                  <Check size={15} className="text-blue-600 shrink-0" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Confirmation modal */}
      <Dialog
        open={!!confirmTarget}
        onOpenChange={(o) => !o && !saving && setConfirmTarget(null)}
      >
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <div className="mx-auto w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center mb-2 overflow-hidden">
              {confirmTarget && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={`https://flagcdn.com/w80/${confirmTarget.countryCode}.png`}
                  alt={confirmTarget.code}
                  className="w-full h-full object-cover"
                />
              )}
            </div>
            <DialogTitle className="text-center text-base font-semibold">
              Change Currency?
            </DialogTitle>
            <DialogDescription className="text-center text-sm text-gray-500">
              Switch your active currency to{" "}
              <span className="font-semibold text-gray-800">
                {confirmTarget?.code} ({confirmTarget?.symbol})
              </span>
              ?
            </DialogDescription>
          </DialogHeader>

          {confirmTarget && (
            <p className="text-xs text-gray-400 text-center -mt-1">
              {confirmTarget.country} — {confirmTarget.name}
            </p>
          )}

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setConfirmTarget(null)}
              disabled={saving}
              className="text-sm rounded-lg flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={handleConfirm}
              disabled={saving}
              className="bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg flex-1"
            >
              {saving ? (
                <span className="flex items-center gap-1.5">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Changing...
                </span>
              ) : (
                "Confirm"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
