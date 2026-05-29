"use client";

import { useState, useMemo } from "react";
import { Search, Check, Coins } from "lucide-react";
import { useCurrency } from "@/providers/CurrencyContext";
import toast from "react-hot-toast";

const CURRENCIES = [
  {
    code: "USD",
    symbol: "$",
    name: "United States Dollar",
    country: "United States",
    flag: "🇺🇸",
  },
  {
    code: "NPR",
    symbol: "Rs",
    name: "Nepalese Rupee",
    country: "Nepal",
    flag: "🇳🇵",
  },
  {
    code: "INR",
    symbol: "₹",
    name: "Indian Rupee",
    country: "India",
    flag: "🇮🇳",
  },
  {
    code: "EUR",
    symbol: "€",
    name: "Euro",
    country: "European Union",
    flag: "🇪🇺",
  },
  {
    code: "GBP",
    symbol: "£",
    name: "British Pound",
    country: "United Kingdom",
    flag: "🇬🇧",
  },
  {
    code: "AUD",
    symbol: "A$",
    name: "Australian Dollar",
    country: "Australia",
    flag: "🇦🇺",
  },
  {
    code: "CAD",
    symbol: "C$",
    name: "Canadian Dollar",
    country: "Canada",
    flag: "🇨🇦",
  },
  {
    code: "JPY",
    symbol: "¥",
    name: "Japanese Yen",
    country: "Japan",
    flag: "🇯🇵",
  },
  {
    code: "CNY",
    symbol: "¥",
    name: "Chinese Yuan",
    country: "China",
    flag: "🇨🇳",
  },
  {
    code: "SGD",
    symbol: "S$",
    name: "Singapore Dollar",
    country: "Singapore",
    flag: "🇸🇬",
  },
  {
    code: "AED",
    symbol: "د.إ",
    name: "UAE Dirham",
    country: "United Arab Emirates",
    flag: "🇦🇪",
  },
  {
    code: "SAR",
    symbol: "﷼",
    name: "Saudi Riyal",
    country: "Saudi Arabia",
    flag: "🇸🇦",
  },
];

export default function CurrencyPage() {
  const { currency, setCurrency } = useCurrency();
  const [search, setSearch] = useState("");

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
    setCurrency(code);
    toast.success(`Currency changed to ${code}`);
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
      <div className="flex items-center gap-3 mb-5">
        <div className="w-9 h-9 bg-blue-100 rounded-lg flex items-center justify-center">
          <Coins size={16} className="text-blue-600" />
        </div>
        <div>
          <h2 className="text-base font-semibold text-gray-900">
            Change Currency
          </h2>
          <p className="text-xs text-gray-400">
            Select your preferred currency
          </p>
        </div>
      </div>

      {/* Current */}
      <div className="bg-blue-50 border border-blue-100 rounded-xl px-4 py-3 mb-4 flex items-center gap-3">
        <span className="text-2xl">
          {CURRENCIES.find((c) => c.code === currency.code)?.flag ?? "🌐"}
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
          className="w-full pl-8 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
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
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg border text-left transition-colors ${
                isActive
                  ? "border-blue-500 bg-blue-50"
                  : "border-gray-100 hover:border-gray-200 hover:bg-gray-50"
              }`}
            >
              <span className="text-xl shrink-0">{c.flag}</span>
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
  );
}
