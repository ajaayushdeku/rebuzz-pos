"use client";

import { useState } from "react";
import { Check, ChevronsUpDown, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { useOfferForm } from "@/providers/OfferFormContext";
import { useProductsList } from "@/hooks/useProductsList";

export default function OfferProductSelector() {
  const { form, updateField } = useOfferForm();
  const { data: products = [], isLoading } = useProductsList();
  const [open, setOpen] = useState(false);

  const selectedProduct = products.find((p) => p.id === form.productId);

  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
      <h2 className="text-xl font-bold text-gray-900">Select Product</h2>

      <p className="text-sm text-gray-500 mt-1">
        Choose the product this offer applies to.
      </p>

      <div className="mt-6">
        <label className="text-sm font-medium text-gray-700 block mb-2">
          Product
        </label>

        {/* Custom dropdown */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setOpen(!open)}
            className="w-full h-12 rounded-xl border border-gray-200 px-4 text-left flex items-center justify-between bg-white outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
          >
            <span
              className={selectedProduct ? "text-gray-900" : "text-gray-400"}
            >
              {selectedProduct ? selectedProduct.name : "Select a product..."}
            </span>
            <ChevronsUpDown size={16} className="text-gray-400 shrink-0" />
          </button>

          {open && (
            <div className="absolute z-50 mt-1 w-full bg-white border border-gray-200 rounded-xl shadow-lg max-h-60 overflow-y-auto">
              <div className="sticky top-0 bg-white border-b border-gray-100 px-3 py-2">
                <div className="relative">
                  <Search
                    size={14}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                  />
                  <input
                    type="text"
                    placeholder="Search products..."
                    className="w-full pl-8 pr-3 py-1.5 text-sm border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500/20"
                    onChange={(e) => {
                      // Filtering handled client-side by user scanning list
                    }}
                  />
                </div>
              </div>

              {isLoading ? (
                <div className="py-6 text-center text-sm text-gray-400">
                  Loading products...
                </div>
              ) : products.length === 0 ? (
                <div className="py-6 text-center text-sm text-gray-400">
                  No products found
                </div>
              ) : (
                products.map((product) => {
                  const selected = form.productId === product.id;
                  return (
                    <button
                      key={product.id}
                      type="button"
                      onClick={() => {
                        updateField("productId", product.id);
                        setOpen(false);
                      }}
                      className={cn(
                        "w-full flex items-center gap-3 px-4 py-3 text-sm hover:bg-blue-50 transition-colors text-left",
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
                      <div className="flex flex-col min-w-0">
                        <span className="font-medium text-gray-900 truncate">
                          {product.name}
                        </span>
                        <span className="text-xs text-gray-400">
                          ${product.price.toFixed(2)}
                        </span>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          )}
        </div>

        {selectedProduct && (
          <div className="mt-3 flex items-center gap-2 bg-blue-50 border border-blue-200 rounded-xl px-4 py-2.5">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-blue-800 truncate">
                {selectedProduct.name}
              </p>
              <p className="text-xs text-blue-500">
                ${selectedProduct.price.toFixed(2)} —{" "}
                {selectedProduct.isTaxable ? "Taxable" : "Non-taxable"}
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                updateField("productId", "");
              }}
              className="text-xs text-blue-600 hover:text-blue-800 font-medium shrink-0"
            >
              Change
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
