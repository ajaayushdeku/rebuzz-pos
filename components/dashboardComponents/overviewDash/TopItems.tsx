"use client";

import { Trophy } from "lucide-react";
import { useCurrency } from "@/providers/CurrencyContext";
import { formatCurrencySymbol } from "@/utils/helper";
import {
  CHART_PALETTE,
  ChartCard,
} from "@/components/dashboardComponents/chartCard";

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

/** The medal colours, as a tinted disc framed in its own hue. */
const rankStyles: Record<Rank, string> = {
  1: "border-amber-200 bg-amber-50 text-amber-600",
  2: "border-gray-200 bg-gray-50 text-gray-600",
  3: "border-orange-200 bg-orange-50 text-orange-600",
};

const TopProductItem = ({ product }: SingleProductProps) => {
  const styles = rankStyles[product.rank];
  const { currency } = useCurrency();

  return (
    <div className="-mx-2 flex items-center justify-between gap-3 rounded-md border-b border-[#e8eaed] px-2 py-3 transition-colors last:border-0 hover:bg-[#f8f9fa]">
      <div className="flex min-w-0 items-center gap-3">
        <span
          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border text-sm font-semibold ${styles}`}
        >
          {product.rank}
        </span>
        <div className="min-w-0">
          <p
            className="truncate text-xs font-medium"
            style={{ color: CHART_PALETTE.title }}
          >
            {product.productName}
          </p>
          <p
            className="mt-0.5 text-[11px]"
            style={{ color: CHART_PALETTE.subtitle }}
          >
            {product.noOfSale} {product.noOfSale === 1 ? "sale" : "sales"}
          </p>
        </div>
      </div>
      <span
        className="shrink-0 text-xs font-semibold tabular-nums"
        style={{ color: CHART_PALETTE.good }}
      >
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
    <ChartCard
      icon={Trophy}
      // Amber, as before: Tailwind's amber-600 / amber-200 / amber-50.
      iconColor="#d97706"
      iconBorder="#fde68a"
      iconBg="#fffbeb"
      title="Top 3 Items Today"
      info={{
        heading: "Reading this card",
        // Today only, ranked by revenue.
        body: "The three products that brought in the most revenue today — not the date range at the top of the page. The figure on the right is each one's revenue; the line beneath the name is how many were sold.",
      }}
      subtitle="Best performers in today's session"
      className="flex-1"
    >
      {/* Body */}
      {!hasData ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-[#f1f3f4]">
            <Trophy size={24} className="text-gray-500" />
          </div>
          <p className="text-sm text-[#3c4043]">No sales yet</p>
          <p className="mt-1 text-xs text-[#9aa0a6]">
            Today&apos;s best sellers will appear here
          </p>
        </div>
      ) : (
        <div className="mt-1">
          {topProducts.map((product) => (
            <TopProductItem key={product.rank} product={product} />
          ))}
        </div>
      )}
    </ChartCard>
  );
};

export default TopItems;
