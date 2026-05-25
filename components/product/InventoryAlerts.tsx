import {
  getStockStatus,
  InventoryItem,
} from "@/lib/mockData/mock-inventory-data";
import { AlertCircle } from "lucide-react";

export default function InventoryAlerts({ items }: { items: InventoryItem[] }) {
  const critical = items.filter(
    (i) => i.usesStocks && getStockStatus(i) === "critical",
  );

  if (critical.length === 0) return null;

  return (
    <div className="space-y-3 mb-6">
      <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm">
        <AlertCircle size={16} className="text-red-500 mt-0.5 shrink-0" />
        <p className="text-gray-700">
          <span className="font-semibold text-red-600">Low Stock Alert: </span>
          {critical.map((i) => `${i.name}`).join(", ")} are below safety
          thresholds.
        </p>
      </div>
    </div>
  );
}
