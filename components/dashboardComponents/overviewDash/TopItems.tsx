"use client";

import { TrendingUp } from "lucide-react";
import { useCurrency } from "@/providers/CurrencyContext";
import { formatCurrencySymbol } from "@/utils/helper";

type Rank = 1 | 2 | 3;

export type TopProduct = {
  rank: Rank;
  productName: string;
  noOfSale: number;
  totalRevenue: number;
};

type TopProductProps = {
  topProducts: TopProduct[];
};

type SingleProductProps = {
  product: TopProduct;
};

const rankStyles: Record<Rank, { ring: string; text: string }> = {
  1: { ring: "ring-amber-200", text: "text-amber-500" },
  2: { ring: "ring-gray-200", text: "text-gray-500" },
  3: { ring: "ring-orange-200", text: "text-orange-500" },
};

const TopProductItem = ({ product }: SingleProductProps) => {
  const styles = rankStyles[product.rank];
  const { currency } = useCurrency();

  return (
    <div className="group flex items-center justify-between gap-3 py-3 border-b border-gray-100 last:border-0 transition-colors hover:bg-gray-50/50 -mx-2 px-2 rounded-md">
      <div className="flex items-center gap-3 min-w-0">
        <span
          className={`shrink-0 w-8 h-8 flex items-center justify-center rounded-full ring-1 ${styles.ring} bg-white text-sm font-semibold ${styles.text}`}
        >
          {product.rank}
        </span>
        <div className="min-w-0">
          <p className="font-medium text-xs text-gray-900 truncate">
            {product.productName}
          </p>
          <p className="text-xs text-gray-400 mt-0.5">
            {product.noOfSale} {product.noOfSale === 1 ? "sale" : "sales"}
          </p>
        </div>
      </div>
      <span className="shrink-0 text-xs font-semibold text-green-600">
        {/* {formatCurrency(product.totalRevenue, currency)} */}
        {formatCurrencySymbol(
          product.totalRevenue,
          currency.symbol,
          currency.locale,
        )}
      </span>
    </div>
  );
};

const TopItems = ({ topProducts }: TopProductProps) => {
  const hasData = topProducts && topProducts.length > 0;

  return (
    <div className="flex-1 bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow duration-300 p-4 md:p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div>
          <h2 className="text-base md:text-lg font-semibold text-gray-900 tracking-tight">
            Top 3 Items Today
          </h2>
          <p className="text-xs text-gray-400 mt-0.5">
            Best performers in today&lsquo;s session
          </p>
        </div>
        <div className="w-8 h-8 flex items-center justify-center rounded-lg bg-blue-50 text-blue-600">
          <TrendingUp size={16} strokeWidth={2.25} />
        </div>
      </div>

      {/* Divider */}
      <div className="h-px bg-gray-100 mb-1" />

      {/* Body */}
      {!hasData ? (
        <div className="flex flex-col items-center justify-center py-10 text-gray-400">
          <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center mb-2">
            <TrendingUp size={18} className="text-gray-300" />
          </div>
          <p className="text-sm">No sales data available</p>
        </div>
      ) : (
        <div className="mt-1">
          {topProducts.map((product) => (
            <TopProductItem key={product.rank} product={product} />
          ))}
        </div>
      )}
    </div>
  );
};

export default TopItems;
