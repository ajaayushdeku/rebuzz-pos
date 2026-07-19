import { ComponentHeader } from "@/components/ComponentHeader";
import { MergedSalesItem } from "@/services/apiInventory";

const MAX_BARS = 8;

function getBarColor(index: number, count: number, max: number): string {
  const ratio = count / max;
  if (ratio >= 0.6) return "#22c55e"; // fast — green
  if (ratio >= 0.3) return "#3b82f6"; // normal — blue
  return "#f59e0b"; // slow — amber
}

export default function StockMovementChart({
  items,
}: {
  items: MergedSalesItem[];
}) {
  const chartItems = items.slice(0, MAX_BARS);
  const max = Math.max(...chartItems.map((i) => i.count), 1);

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 flex-1">
      <div className="mb-6">
        <ComponentHeader
          title="Stock Movement Chart"
          subHeader=" Units sold per item – fast vs slow movers (Past 30days)"
        />
      </div>

      {chartItems.length === 0 ? (
        <div className="flex items-center justify-center py-10 text-gray-400 text-sm">
          No sales data available
        </div>
      ) : (
        <>
          <div className="space-y-3">
            {chartItems.map((item, idx) => {
              const pct = (item.count / max) * 100;
              return (
                <div key={item.name} className="flex items-center gap-3">
                  <span className="text-xs text-gray-500 w-15 text-right shrink-0 leading-tight truncate">
                    {item.name}
                  </span>
                  <div className="flex-1 bg-gray-100 rounded-full h-4 relative overflow-hidden">
                    <div
                      className="h-4 rounded-full transition-all duration-700"
                      style={{
                        width: `${pct}%`,
                        backgroundColor: getBarColor(idx, item.count, max),
                      }}
                    />
                  </div>
                  <span className="text-xs text-gray-400 w-8 text-right shrink-0">
                    {item.count}
                  </span>
                </div>
              );
            })}
          </div>

          {/* X-axis */}
          <div className="flex items-center gap-3 mt-4">
            <div className="w-24 shrink-0" />

            <div className="flex-1 flex justify-between">
              {[
                0,
                Math.round(max * 0.25),
                Math.round(max * 0.5),
                Math.round(max * 0.75),
                max,
              ].map((v) => (
                <span key={v} className="text-xs text-gray-400">
                  {v}
                </span>
              ))}
            </div>

            <div className="w-8 shrink-0" />
          </div>
        </>
      )}
    </div>
  );
}
