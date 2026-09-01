import {
  getStockStatus,
  InventoryItem,
} from "@/lib/mockData/mock-inventory-data";
import { TriangleAlert, PackageX, PackageMinus } from "lucide-react";

type AlertEntry = { name: string; inStock: number; lowStock: number };

// Severity groups, most urgent first. Each drives a colored section + chips.
const GROUP_META = {
  out: {
    label: "Out of stock",
    icon: PackageX,
    dot: "bg-red-500",
    chip: "bg-red-50 border-red-200 text-red-700",
    chipNum: "bg-red-100 text-red-700",
    header: "text-red-600",
  },
  low: {
    label: "Low stock",
    icon: PackageMinus,
    dot: "bg-amber-500",
    chip: "bg-amber-50 border-amber-200 text-amber-700",
    chipNum: "bg-amber-100 text-amber-700",
    header: "text-amber-600",
  },
} as const;

export default function InventoryAlerts({ items }: { items: InventoryItem[] }) {
  const out: AlertEntry[] = [];
  const low: AlertEntry[] = [];

  // A product with variances carries stock on the variants, not the base, so
  // evaluate each variant separately (inheriting the base name). Standalone
  // products are evaluated as-is.
  const collect = (name: string, item: InventoryItem) => {
    const status = getStockStatus(item);
    const entry = { name, inStock: item.inStock, lowStock: item.lowStock };
    if (status === "out") out.push(entry);
    else if (status === "critical") low.push(entry);
  };

  for (const item of items) {
    // A product the business does not count has no "out" and no "low" to
    // report — its zero means "not counted", not "empty shelf". That covers
    // its variants too: a variant's stock figure only means anything when the
    // parent product tracks stock, and the loop below would otherwise mark
    // them all out of stock.
    if (!item.usesStocks) continue;

    if (item.variants && item.variants.length > 0) {
      for (const v of item.variants) {
        const variantItem: InventoryItem = {
          ...item,
          inStock: v.inStock,
          lowStock: v.lowStock,
        };
        collect(
          v.optionValues.length > 0
            ? `${item.name} · ${v.optionValues.join(" · ")}`
            : item.name,
          variantItem,
        );
      }
    } else {
      collect(item.name, item);
    }
  }

  const total = out.length + low.length;
  if (total === 0) return null;

  const groups = [
    { key: "out" as const, entries: out },
    { key: "low" as const, entries: low },
  ].filter((g) => g.entries.length > 0);

  return (
    <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50/40 overflow-hidden">
      {/* Header — summary counts */}
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2 px-4 py-3 border-b border-amber-100">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-amber-100 flex items-center justify-center shrink-0">
            <TriangleAlert size={15} className="text-amber-600" />
          </div>
          <span className="text-sm font-semibold text-gray-800">
            Stock Alerts
          </span>
          <span className="text-xs text-gray-500">
            {total} item{total > 1 ? "s" : ""} need attention
          </span>
        </div>

        <div className="flex items-center gap-2 ml-auto">
          {groups.map(({ key, entries }) => {
            const meta = GROUP_META[key];
            return (
              <span
                key={key}
                className="inline-flex items-center gap-1.5 text-xs font-medium text-gray-600"
              >
                <span className={`w-2 h-2 rounded-full ${meta.dot}`} />
                {meta.label}
                <span className="font-semibold text-gray-800">
                  {entries.length}
                </span>
              </span>
            );
          })}
        </div>
      </div>

      {/* Grouped chips — scrolls once the list gets long so it never clusters */}
      <div className="px-4 py-3 space-y-3 max-h-56 overflow-y-auto">
        {groups.map(({ key, entries }) => {
          const meta = GROUP_META[key];
          const Icon = meta.icon;
          return (
            <div key={key} className="mb-6">
              <div
                className={`flex items-center gap-1.5 mb-2 text-[11px] font-semibold uppercase tracking-wide ${meta.header}`}
              >
                <Icon size={13} />
                {meta.label}
                <span className="text-gray-400 font-normal normal-case">
                  ({entries.length})
                </span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {entries.map((e, i) => (
                  <span
                    key={`${e.name}-${i}`}
                    className={`inline-flex items-center gap-1.5 rounded-lg border px-2 py-1 text-xs ${meta.chip}`}
                    title={`${e.name} — ${e.inStock} in stock (min ${e.lowStock})`}
                  >
                    <span className="font-medium max-w-[160px] truncate">
                      {e.name}
                    </span>
                    <span
                      className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${meta.chipNum}`}
                    >
                      {e.inStock}
                    </span>
                  </span>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
