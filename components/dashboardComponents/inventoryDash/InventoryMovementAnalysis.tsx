import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { MergedSalesItem } from "@/services/apiInventory";

const classifyItems = (items: MergedSalesItem[]) => {
  if (items.length === 0) return { fast: [], normal: [], slow: [] };

  const max = items[0].count; // already sorted desc
  const fast: string[] = [];
  const normal: string[] = [];
  const slow: string[] = [];

  items.forEach((item) => {
    const ratio = item.count / max;
    if (ratio >= 0.6) fast.push(item.name);
    else if (ratio >= 0.25) normal.push(item.name);
    else slow.push(item.name);
  });

  return { fast, normal, slow };
};

const getTrend = (items: MergedSalesItem[], keys: string[]): number => {
  const subset = items.filter((i) => keys.includes(i.name));
  const totalRevenue = subset.reduce((s, i) => s + i.totalRevenue, 0);
  const totalCost = subset.reduce(
    (s, i) => s + (i.totalRevenue - i.netProfit),
    0,
  );
  if (totalCost === 0) return 0;
  return Math.round(((totalRevenue - totalCost) / totalCost) * 100);
};

const InventoryMovementAnalysis = ({ items }: { items: MergedSalesItem[] }) => {
  const { fast, normal, slow } = classifyItems(items);
  const fastTrend = getTrend(items, fast);
  const slowTrend = getTrend(items, slow);

  const categories = [
    {
      label: "Fast Moving",
      color: "text-green-600",
      badge: fastTrend >= 0 ? `+${fastTrend}%` : `${fastTrend}%`,
      badgeColor: "bg-green-500 text-white",
      icon: TrendingUp,
      names: fast,
      note: fast.join(", ") || "—",
    },
    {
      label: "Normal Velocity",
      color: "text-blue-600",
      badge: "Stable",
      badgeColor: "bg-blue-500 text-white",
      icon: Minus,
      names: normal,
      note: normal.join(", ") || "—",
    },
    {
      label: "Slow Moving",
      color: "text-amber-600",
      badge: slowTrend >= 0 ? `+${slowTrend}%` : `${slowTrend}%`,
      badgeColor: "bg-amber-100 text-amber-700 border border-amber-300",
      icon: TrendingDown,
      names: slow,
      note:
        slow.length > 0
          ? `${slow.join(", ")} (low velocity)`
          : "None identified",
    },
  ];

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 flex-1">
      <div className="mb-6">
        <h2 className="text-sm font-bold text-gray-900">
          Inventory Movement Analysis
        </h2>
        <p className="text-xs text-gray-400 mb-5">
          Fast-moving vs slow-moving categorization
        </p>
      </div>

      {items.length === 0 ? (
        <div className="flex items-center justify-center py-10 text-gray-400 text-sm">
          No sales data available
        </div>
      ) : (
        <div className="space-y-4">
          {categories.map(
            ({ label, color, badge, badgeColor, icon: Icon, note }) => (
              <div
                key={label}
                className="border-b border-gray-100 pb-4 last:border-0 last:pb-0"
              >
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-1.5">
                    <Icon size={14} className={color} />
                    <span className={`text-sm font-semibold ${color}`}>
                      {label}
                    </span>
                  </div>
                  <span
                    className={`text-xs font-bold px-2 py-0.5 rounded-full ${badgeColor}`}
                  >
                    {badge}
                  </span>
                </div>
                <p className="text-xs text-gray-400 ml-5 leading-relaxed">
                  {note}
                </p>
              </div>
            ),
          )}
        </div>
      )}
    </div>
  );
};

export default InventoryMovementAnalysis;
