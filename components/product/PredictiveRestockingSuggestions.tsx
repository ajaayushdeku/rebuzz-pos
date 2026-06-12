import { Pin } from "lucide-react";
import { InventoryItem } from "@/services/apiInventory";
import { MergedSalesItem } from "@/services/apiInventory";

type Priority = "High" | "Medium" | "Low";

type Suggestion = {
  name: string;
  suggestedRestock: number;
  priority: Priority;
  reason: string;
};

function deriveSuggestions(
  inventory: InventoryItem[],
  sales: MergedSalesItem[],
): Suggestion[] {
  const suggestions: Suggestion[] = [];

  inventory.forEach((item) => {
    if (!item.usesStocks) return;

    const salesData = sales.find(
      (s) => s.name.toLowerCase() === item.name.toLowerCase(),
    );
    const dailyVelocity = salesData ? salesData.count / 7 : 0;
    const daysOfStock = dailyVelocity > 0 ? item.inStock / dailyVelocity : 999;

    if (item.inStock <= item.lowStock) {
      // Critical — below threshold
      const restock = Math.ceil(item.lowStock * 3 - item.inStock);
      suggestions.push({
        name: item.name,
        suggestedRestock: restock,
        priority: daysOfStock < 2 ? "High" : "Medium",
        reason:
          daysOfStock < 2
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
    } else if (
      salesData &&
      salesData.count > 15 &&
      item.inStock < item.lowStock * 2
    ) {
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
      <h3 className="text-sm font-semibold text-gray-900 mb-0.5">
        Predictive Restocking Suggestions
      </h3>
      <p className="text-xs text-gray-400 mb-5">
        Restock recommendations based on current stock levels & sales velocity
      </p>

      {suggestions.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-x-auto">
          All stock levels are healthy
        </div>
      ) : (
        // <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-x-auto">
        <div className="bg-white  overflow-x-auto">
          <table className="w-full text-sm min-w-[700px]">
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
                    +{item.suggestedRestock} units
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
