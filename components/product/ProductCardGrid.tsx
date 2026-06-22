"use client";

import { useState } from "react";

import { InventoryItem } from "@/lib/mockData/mock-inventory-data";
import ProductCard from "./ProductCard";

const INITIAL_COUNT = 8;
const LOAD_MORE_COUNT = 8;

const ProductCardGrid = ({ items }: { items: InventoryItem[] }) => {
  const [visibleCount, setVisibleCount] = useState(INITIAL_COUNT);

  const visibleItems = items.slice(0, visibleCount);

  const hasMore = visibleCount < items.length;
  const canHide = visibleCount > INITIAL_COUNT;

  const handleLoadMore = () => {
    setVisibleCount((prev) => Math.min(prev + LOAD_MORE_COUNT, items.length));
  };

  const handleHide = () => {
    setVisibleCount(INITIAL_COUNT);
  };

  return (
    <div>
      {/* Product Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-3">
        {visibleItems.map((item) => (
          <ProductCard key={item.id} item={item} />
        ))}
      </div>

      {/* Actions */}
      {(hasMore || canHide) && (
        <div className="flex items-center justify-center gap-3 mb-3">
          {hasMore && (
            <button
              onClick={handleLoadMore}
              className="px-4 py-2 rounded-lg border border-gray-200 bg-white text-xs font-medium text-gray-700 hover:bg-gray-50 transition"
            >
              Load More
            </button>
          )}

          {canHide && (
            <button
              onClick={handleHide}
              className="px-4 py-2 rounded-lg border border-gray-200 bg-gray-100 text-xs font-medium text-gray-700 hover:bg-gray-200 transition"
            >
              Hide
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default ProductCardGrid;
