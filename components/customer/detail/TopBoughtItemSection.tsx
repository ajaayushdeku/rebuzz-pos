"use client";

import { useEffect, useMemo, useState } from "react";
import { Award, Package, ShoppingBag, Sparkles } from "lucide-react";

import { ChartCard } from "@/components/dashboardComponents/chartCard";
import TablePagination from "@/components/ui/TablePagination";

import type { PurchaseHistoryItem } from "./customerDetailHelpers";
import { getTopBoughtItems } from "./topBoughtItemHelpers";

interface TopBoughtItemSectionProps {
  history: PurchaseHistoryItem[];
  loading: boolean;
}

const PAGE_SIZE = 5;

const FEATURED_STYLES = [
  {
    label: "MOST PURCHASED",
    rankColor: "text-amber-700 dark:text-amber-300",
    rankBg: "bg-amber-100 dark:bg-amber-400/15",
    border: "border-amber-200/80 dark:border-amber-400/20",
    background:
      "bg-gradient-to-r from-amber-50/80 to-white dark:from-amber-400/[0.07] dark:to-transparent",
    accent: "bg-amber-400",
    quantityColor: "text-amber-700 dark:text-amber-300",
    bar: "bg-amber-400",
  },
  {
    label: "2ND MOST PURCHASED",
    rankColor: "text-slate-600 dark:text-slate-300",
    rankBg: "bg-slate-100 dark:bg-slate-400/15",
    border: "border-slate-200 dark:border-slate-400/20",
    background:
      "bg-gradient-to-r from-slate-50/90 to-white dark:from-slate-400/[0.06] dark:to-transparent",
    accent: "bg-slate-400",
    quantityColor: "text-slate-700 dark:text-slate-200",
    bar: "bg-slate-400",
  },
  {
    label: "3RD MOST PURCHASED",
    rankColor: "text-orange-700 dark:text-orange-300",
    rankBg: "bg-orange-100 dark:bg-orange-400/15",
    border: "border-orange-200/80 dark:border-orange-400/20",
    background:
      "bg-gradient-to-r from-orange-50/80 to-white dark:from-orange-400/[0.06] dark:to-transparent",
    accent: "bg-orange-400",
    quantityColor: "text-orange-700 dark:text-orange-300",
    bar: "bg-orange-400",
  },
] as const;

export default function TopBoughtItemSection({
  history,
  loading,
}: TopBoughtItemSectionProps) {
  const [page, setPage] = useState(0);

  const items = useMemo(() => getTopBoughtItems(history), [history]);

  const totalPages = Math.max(1, Math.ceil(items.length / PAGE_SIZE));

  const safePage = Math.min(page, totalPages - 1);

  const paginatedItems = items.slice(
    safePage * PAGE_SIZE,
    safePage * PAGE_SIZE + PAGE_SIZE,
  );

  const highestQuantity = items[0]?.totalQuantity ?? 1;

  useEffect(() => {
    setPage(0);
  }, [history]);

  return (
    <ChartCard
      icon={ShoppingBag}
      iconColor="#6366f1"
      iconBorder="#c7d2fe"
      iconBg="#eef2ff"
      title="Top Bought Items"
      info={{
        heading: "Understanding purchased items",
        body: "Items are ranked by the total quantity purchased across this customer's orders. Product variants are tracked separately, and refunded orders are excluded. The top three items receive additional visual emphasis.",
      }}
      subtitle="A breakdown of this customer's most frequently purchased products"
      className="mt-6"
      buttons={
        !loading && items.length > 0 ? (
          <span className="inline-flex items-center gap-1.5 rounded-full border border-indigo-100 bg-indigo-50 px-3 py-1 text-[11px] font-semibold text-indigo-600 dark:border-indigo-400/20 dark:bg-indigo-400/10 dark:text-indigo-300">
            <Package size={12} />
            {items.length} {items.length === 1 ? "item" : "items"}
          </span>
        ) : undefined
      }
    >
      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, index) => (
            <div
              key={index}
              className="flex animate-pulse items-center gap-3 rounded-xl border border-[#e8eaed] p-3 dark:border-white/10"
            >
              <div className="h-10 w-10 shrink-0 rounded-xl bg-gray-100 dark:bg-white/10" />

              <div className="min-w-0 flex-1 space-y-2">
                <div className="h-3 w-36 rounded bg-gray-100 dark:bg-white/10" />
                <div className="h-2.5 w-24 rounded bg-gray-100 dark:bg-white/10" />
              </div>

              <div className="h-9 w-16 rounded-lg bg-gray-100 dark:bg-white/10" />
            </div>
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="mb-3 flex h-16 w-16 items-center justify-center rounded-2xl border border-[#e8eaf0] bg-[#f7f8fa] dark:border-white/10 dark:bg-white/[0.04]">
            <Package size={25} className="text-[#9aa0a6] dark:text-[#9aa6bd]" />
          </div>

          <p className="text-sm font-semibold text-[#3c4043] dark:text-[#e8ecf4]">
            No purchased items yet
          </p>

          <p className="mt-1 max-w-[250px] text-xs leading-relaxed text-[#9aa0a6] dark:text-[#9aa6bd]">
            Purchased products will appear here once this customer places an
            order
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {/* Item list */}

          <div className="space-y-2">
            {paginatedItems.map((item, index) => {
              const rank = safePage * PAGE_SIZE + index + 1;
              const featured = rank <= 3;
              const style = featured ? FEATURED_STYLES[rank - 1] : null;

              const quantityPercentage = Math.max(
                4,
                (item.totalQuantity / highestQuantity) * 100,
              );

              return (
                <div
                  key={item.key}
                  className={[
                    "group relative overflow-hidden rounded-xl border transition-all duration-200",
                    featured
                      ? `${style!.border} ${style!.background} shadow-[0_1px_3px_rgba(0,0,0,0.025)]`
                      : "border-[#e8eaed] bg-white hover:border-[#cfd5df] hover:bg-[#fafbfc] dark:border-white/10 dark:bg-transparent dark:hover:border-white/20 dark:hover:bg-white/[0.025]",
                  ].join(" ")}
                >
                  {featured && (
                    <div
                      className={`absolute inset-y-0 left-0 w-[3px] ${style!.accent}`}
                    />
                  )}

                  <div className="flex items-center gap-2.5 px-3 py-2.5 sm:px-3.5">
                    {/* Ranking */}
                    <div
                      className={[
                        "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg",
                        featured
                          ? style!.rankBg
                          : "bg-[#f3f4f6] dark:bg-white/[0.06]",
                      ].join(" ")}
                    >
                      {featured ? (
                        <Award
                          size={16}
                          strokeWidth={2}
                          className={style!.rankColor}
                        />
                      ) : (
                        <span className="text-[11px] font-semibold tabular-nums text-[#8b929e] dark:text-[#9aa6bd]">
                          {rank.toString().padStart(2, "0")}
                        </span>
                      )}
                    </div>

                    {/* Product information */}
                    <div className="min-w-0 flex-1">
                      <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-0.5">
                        <p className="truncate text-[12px] font-semibold text-[#303746] dark:text-[#e8ecf4]">
                          {item.productName}
                        </p>

                        {featured && (
                          <span
                            className={`inline-flex shrink-0 items-center gap-1 rounded px-1.5 py-0.5 text-[8px] font-bold tracking-wide ${style!.rankBg} ${style!.rankColor}`}
                          >
                            {rank === 1 && <Sparkles size={9} />}
                            {style!.label}
                          </span>
                        )}
                      </div>

                      <div className="mt-1 flex min-w-0 items-center gap-2.5 text-[10px] text-[#858c99] dark:text-[#9aa6bd]">
                        <span className="truncate">
                          {item.variantName
                            ? `Variant: ${item.variantName}`
                            : "Standard product"}
                        </span>

                        <span className="h-3 w-px shrink-0 bg-[#dfe2e8] dark:bg-white/15" />

                        <span className="inline-flex shrink-0 items-center gap-1">
                          <ShoppingBag size={10} />
                          {item.totalOrders}{" "}
                          {item.totalOrders === 1 ? "order" : "orders"}
                        </span>
                      </div>
                    </div>

                    {/* Quantity */}
                    <div className="w-[68px] shrink-0 text-right sm:w-[78px]">
                      <p
                        className={[
                          "text-[15px] font-bold leading-tight tabular-nums",
                          featured
                            ? style!.quantityColor
                            : "text-[#303746] dark:text-[#e8ecf4]",
                        ].join(" ")}
                      >
                        {item.totalQuantity.toLocaleString()}
                      </p>

                      <p className="mt-0.5 text-[8px] font-medium uppercase tracking-wide text-[#969daa] dark:text-[#8995aa]">
                        Units
                      </p>

                      <div className="mt-1.5 ml-auto h-1 w-full overflow-hidden rounded-full bg-[#e9ebf0] dark:bg-white/10">
                        <div
                          className={`h-full rounded-full transition-all ${
                            featured ? style!.bar : "bg-indigo-400/70"
                          }`}
                          style={{
                            width: `${quantityPercentage}%`,
                          }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Same pagination component and pattern as OrderHistorySection */}
          {totalPages > 1 && (
            <div className="border-t border-[#e8eaed] pt-3 dark:border-white/10">
              <TablePagination
                page={safePage}
                totalPages={totalPages}
                total={items.length}
                noun="items"
                onPageChange={setPage}
              />
            </div>
          )}
        </div>
      )}
    </ChartCard>
  );
}
