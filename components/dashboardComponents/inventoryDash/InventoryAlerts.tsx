import {
  getStockStatus,
  InventoryItem,
} from "@/lib/mockData/mock-inventory-data";
import { TriangleAlert, PackageX, PackageMinus } from "lucide-react";
import { CHART_PALETTE, ChartCard } from "../chartCard";

type AlertEntry = { name: string; inStock: number; lowStock: number };

// Severity groups, most urgent first. Each drives a coloured section + chips.
const GROUP_META = {
  out: {
    label: "Out of stock",
    icon: PackageX,
    dot: "bg-red-500",
    chip: "border-red-200 bg-red-50 text-red-700",
    chipNum: "bg-red-100 text-red-700",
    header: "text-red-600",
  },
  low: {
    label: "Low stock",
    icon: PackageMinus,
    dot: "bg-amber-500",
    chip: "border-amber-200 bg-amber-50 text-amber-700",
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
    <div className="mb-4">
      <ChartCard
        icon={TriangleAlert}
        // Amber, as before: Tailwind's amber-600 / amber-200 / amber-50.
        iconColor="#d97706"
        iconBorder="#fde68a"
        iconBg="#fffbeb"
        title="Stock Alerts"
        info={{
          heading: "Reading this card",
          // From the loop above: variants are judged on their own stock.
          body: "Products at or below their low-stock threshold, and those with nothing left. A product with variants is checked one variant at a time, so the name shown is the variant. Products you do not count are left out — their zero means “not tracked”, not “empty shelf”. The number on each chip is what is on hand.",
        }}
        subtitle={`${total} item${total > 1 ? "s" : ""} need attention`}
        controls={
          <div className="flex items-center gap-3">
            {groups.map(({ key, entries }) => {
              const meta = GROUP_META[key];
              return (
                <span
                  key={key}
                  className="inline-flex items-center gap-1.5 text-xs"
                  style={{ color: CHART_PALETTE.axis }}
                >
                  <span className={`h-2 w-2 rounded-full ${meta.dot}`} />
                  {meta.label}
                  <span
                    className="tabular-nums"
                    style={{ color: CHART_PALETTE.title }}
                  >
                    {entries.length}
                  </span>
                </span>
              );
            })}
          </div>
        }
      >
        {/* Grouped chips — scrolls once the list gets long so it never clusters */}
        <div className="max-h-56 space-y-4 overflow-y-auto">
          {groups.map(({ key, entries }) => {
            const meta = GROUP_META[key];
            const Icon = meta.icon;
            return (
              <div key={key}>
                <div
                  className={`mb-2 flex items-center gap-1.5 text-[13px] ${meta.header}`}
                >
                  <Icon size={13} />
                  {meta.label}
                  <span style={{ color: CHART_PALETTE.subtitle }}>
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
                      <span className="max-w-[160px] truncate">{e.name}</span>
                      <span
                        className={`rounded-full px-1.5 py-0.5 text-[10px] tabular-nums ${meta.chipNum}`}
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
      </ChartCard>
    </div>
  );
}
