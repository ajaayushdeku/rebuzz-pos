"use client";

import { useMemo, useState } from "react";
import { Search, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { useOfferForm, type ItemScope } from "@/providers/OfferFormContext";
import { useProductsList } from "@/hooks/useProductsList";

const SCOPES: { id: ItemScope; title: string; subtitle: string }[] = [
  { id: "all", title: "All items", subtitle: "Applies to entire menu" },
  { id: "category", title: "A category", subtitle: "e.g. Hot Beverages" },
  { id: "specific", title: "Specific items", subtitle: "Select individual items" },
];

export default function OfferItems() {
  const { form, updateField } = useOfferForm();
  const { data: products = [], isLoading } = useProductsList();
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return q ? products.filter((p) => p.name.toLowerCase().includes(q)) : products;
  }, [products, query]);

  return (
    <div className="space-y-4">
      {/* Scope selector */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {SCOPES.map((s) => {
          const active = form.itemScope === s.id;
          return (
            <button
              key={s.id}
              type="button"
              onClick={() => updateField("itemScope", s.id)}
              className={`text-left rounded-xl border p-3.5 transition-all ${
                active
                  ? "border-blue-500 ring-2 ring-blue-500/20 bg-blue-50/40"
                  : "border-gray-200 hover:border-gray-300"
              }`}
            >
              <p className="text-sm font-semibold text-gray-800">{s.title}</p>
              <p className="text-xs text-gray-400 mt-0.5">{s.subtitle}</p>
            </button>
          );
        })}
      </div>

      {/* Category (UI-only) */}
      {form.itemScope === "category" && (
        <div>
          <label className="text-xs font-medium text-gray-500 block mb-1.5">
            Choose a category
          </label>
          <div className="relative">
            <Search
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <input
              type="text"
              value={form.category}
              onChange={(e) => updateField("category", e.target.value)}
              placeholder="Search categories (e.g. Hot Beverages)..."
              className="w-full h-11 pl-9 pr-4 rounded-xl border border-gray-200 text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>
        </div>
      )}

      {/* Specific product → payload productId */}
      {form.itemScope === "specific" && (
        <div>
          <label className="text-xs font-medium text-gray-500 block mb-1.5">
            Choose a product
          </label>
          <div className="relative mb-2">
            <Search
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search products..."
              className="w-full h-11 pl-9 pr-4 rounded-xl border border-gray-200 text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>

          <div className="max-h-56 overflow-y-auto rounded-xl border border-gray-100 divide-y divide-gray-50">
            {isLoading ? (
              <p className="py-6 text-center text-sm text-gray-400">
                Loading products...
              </p>
            ) : filtered.length === 0 ? (
              <p className="py-6 text-center text-sm text-gray-400">
                No products found
              </p>
            ) : (
              filtered.map((product) => {
                const selected = form.productId === product.id;
                return (
                  <button
                    key={product.id}
                    type="button"
                    onClick={() => updateField("productId", product.id)}
                    className={cn(
                      "w-full flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-blue-50 transition-colors text-left",
                      selected && "bg-blue-50",
                    )}
                  >
                    <Check
                      size={16}
                      className={cn(
                        "shrink-0",
                        selected ? "text-blue-600 opacity-100" : "opacity-0",
                      )}
                    />
                    <span className="flex-1 min-w-0 font-medium text-gray-900 truncate">
                      {product.name}
                    </span>
                    <span className="text-xs text-gray-400 shrink-0">
                      ${product.price.toFixed(2)}
                    </span>
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
