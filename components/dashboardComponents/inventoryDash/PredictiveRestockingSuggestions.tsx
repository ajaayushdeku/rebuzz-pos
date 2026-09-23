import { PackageCheck, Pin, PackagePlus } from "lucide-react";
import { InventoryItem } from "@/services/apiInventory";
import { MergedSalesItem } from "@/services/apiInventory";
import { CHART_PALETTE, ChartCard } from "../chartCard";
import { nameTokens } from "@/lib/salesVelocity";
import { formatVariantName } from "@/utils/helper";

type Priority = "High" | "Medium" | "Low";

type Suggestion = {
  name: string;
  suggestedRestock: number;
  priority: Priority;
  reason: string;
};

/** One thing that holds stock: a plain product, or one variant of a product. */
type StockUnit = {
  name: string;
  inStock: number;
  lowStock: number;
  /** Units sold in the sales window, 0 when no sales row matched. */
  unitsSold: number;
};

/**
 * Every stock-holding unit in the inventory, with its sales.
 *
 * A product with variants keeps its stock on the variants, and its own
 * `inStock` reads 0. Evaluating the product row therefore flagged every such
 * product as below threshold — a "restock" suggestion for something with
 * shelves full of each variant — while the variants that actually were low
 * never appeared. Each variant is evaluated on its own stock instead, the
 * same way the stock alerts and the product grid on this page already do.
 *
 * Sales are matched by name tokens, the rule the product grid uses, so
 * "Momo [Buff]", "Momo (buff)" and "Momo - Buff" all find the Buff variant's
 * row and the two panels cannot disagree about what sold. Rows that spell the
 * same item differently are summed.
 *
 * When the sales report gives only a product-level row, it is not handed to
 * each variant. That total covers every variant, so copying it would multiply
 * the product's demand by its variant count and flag them all as fast movers.
 * Such variants are judged on their stock threshold alone.
 */
function stockUnits(
  inventory: InventoryItem[],
  sales: MergedSalesItem[],
): StockUnit[] {
  const soldByTokens = new Map<string, number>();
  for (const row of sales) {
    const key = nameTokens(row.name);
    soldByTokens.set(key, (soldByTokens.get(key) ?? 0) + row.count);
  }
  const soldFor = (name: string) => soldByTokens.get(nameTokens(name)) ?? 0;

  const units: StockUnit[] = [];

  for (const item of inventory) {
    // A product the business does not count has no stock to run out of, and
    // neither do its variants: their figures only mean something when the
    // product is tracked.
    if (!item.usesStocks) continue;

    const variants = item.variants ?? [];

    if (variants.length === 0) {
      units.push({
        name: item.name,
        inStock: item.inStock,
        lowStock: item.lowStock,
        unitsSold: soldFor(item.name),
      });
      continue;
    }

    for (const variant of variants) {
      // A variant switched off is not being sold, so its empty shelf is not a
      // gap to fill.
      if (!variant.isAvailable) continue;

      const name = formatVariantName(item.name, variant.optionValues);
      // A variant with no option values carries the bare product name, whose
      // sales row is the whole product's. That is only this variant's own
      // figure when it is the product's only variant.
      const hasOwnName =
        variant.optionValues.length > 0 || variants.length === 1;

      units.push({
        name,
        inStock: variant.inStock,
        lowStock: variant.lowStock,
        unitsSold: hasOwnName ? soldFor(name) : 0,
      });
    }
  }

  return units;
}

function deriveSuggestions(
  inventory: InventoryItem[],
  sales: MergedSalesItem[],
): Suggestion[] {
  const suggestions: Suggestion[] = [];

  stockUnits(inventory, sales).forEach((item) => {
    const dailyVelocity = item.unitsSold / 7;
    const daysOfStock = dailyVelocity > 0 ? item.inStock / dailyVelocity : 999;

    if (item.inStock <= item.lowStock) {
      // Critical — below threshold
      const restock = Math.ceil(item.lowStock * 3 - item.inStock);
      suggestions.push({
        name: item.name,
        // At least one. With no threshold set and nothing on hand, the target
        // works out to zero and the row read "+0 units" beside an empty shelf.
        // Variants often have no threshold, so this became common once they
        // were evaluated.
        suggestedRestock: Math.max(restock, 1),
        priority: daysOfStock < 2 ? "High" : "Medium",
        // Empty first: with sales and nothing on hand, the run-out estimate
        // is zero hours, and "could run out in 0h" describes a shelf that
        // already has.
        reason:
          item.inStock <= 0
            ? "Out of stock"
            : daysOfStock < 2
              ? `Below safety stock – could run out in ${Math.round(daysOfStock * 24)}h at current demand`
              : `Below minimum threshold (${item.lowStock} units)`,
      });
    } else if (dailyVelocity > 0 && daysOfStock < 5) {
      // Running low relative to velocity
      const restock = Math.ceil(dailyVelocity * 14 - item.inStock);
      suggestions.push({
        name: item.name,
        suggestedRestock: Math.max(restock, 1),
        priority: daysOfStock < 3 ? "High" : "Medium",
        reason: `At current sales velocity, stock lasts ~${Math.round(daysOfStock)} days`,
      });
    } else if (item.unitsSold > 15 && item.inStock < item.lowStock * 2) {
      // Fast mover approaching low
      suggestions.push({
        name: item.name,
        suggestedRestock: Math.ceil(item.lowStock * 2),
        priority: "Low",
        reason: `High demand item – predictive restock recommended`,
      });
    }
  });

  // Sort by priority
  const order: Record<Priority, number> = { High: 0, Medium: 1, Low: 2 };
  return suggestions
    .sort((a, b) => order[a.priority] - order[b.priority])
    .slice(0, 6);
}

const priorityStyles: Record<Priority, string> = {
  High: "border border-red-200 bg-red-50 text-red-600",
  Medium: "border border-blue-200 bg-blue-50 text-blue-600",
  Low: "border border-gray-200 bg-gray-50 text-gray-500",
};

const pinColors: Record<Priority, string> = {
  High: "text-red-500",
  Medium: "text-blue-500",
  Low: "text-gray-400",
};

export default function PredictiveRestockingSuggestions({
  inventory,
  sales,
}: {
  inventory: InventoryItem[];
  sales: MergedSalesItem[];
}) {
  const suggestions = deriveSuggestions(inventory, sales);

  return (
    <ChartCard
      icon={PackagePlus}
      // Indigo, as before: Tailwind's indigo-600 / indigo-200 / indigo-50.
      iconColor="#4f46e5"
      iconBorder="#c7d2fe"
      iconBg="#eef2ff"
      title="Predictive Restocking Suggestions"
      info={{
        heading: "Reading this table",
        // From deriveSuggestions above.
        body: "An item appears when it is at or below its low-stock threshold, or when its recent sales would empty the shelf within five days. The suggested amount tops a below-threshold item up to three times its threshold, and a fast-selling one up to about two weeks of demand. Variants are judged on their own stock, and the six most urgent are shown.",
      }}
      subtitle="Restock recommendations based on current stock levels & sales velocity"
    >
      {suggestions.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <div className="mb-2 flex h-14 w-14 items-center justify-center rounded-full bg-green-50">
            <PackageCheck size={24} className="text-green-600" />
          </div>
          <p className="text-sm" style={{ color: CHART_PALETTE.title }}>
            All stock levels are healthy
          </p>
          <p className="mt-1 text-xs" style={{ color: CHART_PALETTE.subtitle }}>
            No items are running low right now
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          <table className="w-full min-w-[300px] text-sm">
            <thead>
              <tr
                className="border-b text-left"
                style={{
                  borderColor: CHART_PALETTE.grid,
                  color: CHART_PALETTE.axis,
                }}
              >
                <th className="px-4 pb-2.5 pt-1 text-[11px] font-normal">
                  Item
                </th>
                <th className="px-4 pb-2.5 pt-1 text-center text-[11px] font-normal">
                  Suggested restock
                </th>
                <th className="px-4 pb-2.5 pt-1 text-[11px] font-normal">
                  Priority
                </th>
                <th className="px-4 pb-2.5 pt-1 text-[11px] font-normal">
                  Reason
                </th>
              </tr>
            </thead>
            <tbody>
              {suggestions.map((item, idx) => (
                <tr
                  key={idx}
                  className="border-b transition-colors last:border-0 hover:bg-[#f8f9fa]"
                  style={{ borderColor: CHART_PALETTE.grid }}
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Pin
                        size={13}
                        className={`shrink-0 ${pinColors[item.priority]}`}
                      />
                      <span
                        className="text-[13px]"
                        style={{ color: CHART_PALETTE.title }}
                      >
                        {item.name}
                      </span>
                    </div>
                  </td>

                  <td
                    className="px-4 py-3 text-center text-[13px] font-medium tabular-nums"
                    style={{ color: CHART_PALETTE.title }}
                  >
                    +{item.suggestedRestock}{" "}
                    {item.suggestedRestock === 1 ? "unit" : "units"}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2 py-0.5 text-[11px] ${priorityStyles[item.priority]}`}
                    >
                      {item.priority}
                    </span>
                  </td>
                  <td
                    className="max-w-xs px-4 py-3 text-[11px]"
                    style={{ color: CHART_PALETTE.subtitle }}
                  >
                    {item.reason}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </ChartCard>
  );
}
