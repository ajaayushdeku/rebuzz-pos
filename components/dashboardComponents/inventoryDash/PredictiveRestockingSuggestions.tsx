import { PackageCheck, Pin, PackagePlus } from "lucide-react";
import { InventoryItem } from "@/services/apiInventory";
import { MergedSalesItem } from "@/services/apiInventory";
import { ComponentHeader } from "@/components/ComponentHeader";
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
  High: "bg-red-100 text-red-600 font-semibold",
  Medium: "bg-blue-100 text-blue-600 font-semibold",
  Low: "bg-gray-100 text-gray-500 font-semibold",
};

const pinColors: Record<Priority, string> = {
  High: "text-red-400",
  Medium: "text-blue-400",
  Low: "text-gray-300",
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
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
      <div className="mb-6">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center shrink-0">
            <PackagePlus size={15} className="text-indigo-600" />
          </div>
          <ComponentHeader
            title="Predictive Restocking Suggestions"
            subHeader="Restock recommendations based on current stock levels & sales velocity"
          />
        </div>
      </div>

      {suggestions.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <div className="w-14 h-14 rounded-full bg-green-50 flex items-center justify-center mb-2">
            <PackageCheck size={24} className="text-green-500" />
          </div>
          <p className="text-sm font-medium text-gray-500">
            All stock levels are healthy
          </p>
          <p className="text-xs text-gray-400 mt-1">
            No items are running low right now
          </p>
        </div>
      ) : (
        // <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-x-auto">
        <div className="bg-white overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          <table className="w-full text-sm min-w-[300px]">
            <thead>
              <tr className="text-xs text-gray-400 border-b border-gray-100">
                <th className="text-left pb-3 pt-3 px-4 font-medium w-12">
                  Item
                </th>
                <th className="text-center pb-3 pt-3 px-4 font-medium">
                  Suggested Restock
                </th>
                <th className="text-left pb-3 pt-3 px-4 font-medium pl-4">
                  Priority
                </th>
                <th className="text-left pb-3 pt-3 px-4 font-medium pl-4">
                  Reason
                </th>
              </tr>
            </thead>
            <tbody>
              {suggestions.map((item, idx) => (
                <tr
                  key={idx}
                  className="border-b border-gray-50 last:border-0 hover:bg-gray-50 transition-colors"
                >
                  <td className="py-3 px-4 text-gray-400 text-xs">
                    <div className="flex items-center gap-2">
                      <Pin
                        size={13}
                        className={`shrink-0 ${pinColors[item.priority]}`}
                      />
                      <span className="font-medium text-gray-800">
                        {item.name}
                      </span>
                    </div>
                  </td>

                  <td className="py-3 text-center font-semibold text-gray-700">
                    +{item.suggestedRestock}{" "}
                    {item.suggestedRestock === 1 ? "unit" : "units"}
                  </td>
                  <td className="py-3 pl-4">
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full ${priorityStyles[item.priority]}`}
                    >
                      {item.priority}
                    </span>
                  </td>
                  <td className="py-3 pl-4 text-xs text-gray-400 max-w-xs">
                    {item.reason}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
