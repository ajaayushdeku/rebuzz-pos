"use client";

import LockDimFeactureOverlay from "@/components/LockDimFeactureOverlay";
import { AlertTriangle, ChevronRight } from "lucide-react";

type StockAlert = {
  name: string;
  remaining: string;
  level: "critical" | "warning";
};

const MOCK_ALERTS: StockAlert[] = [
  { name: "Coffee Beans (Arabica)", remaining: "2 kg", level: "critical" },
  { name: "Milk (Full Cream)", remaining: "5 L", level: "warning" },
  { name: "Sugar Packets", remaining: "100 pcs", level: "warning" },
];

const LEVEL_STYLES = {
  critical: {
    badge: "bg-red-100 text-red-600",
    label: "critical",
  },
  warning: {
    badge: "bg-amber-100 text-amber-700",
    label: "warning",
  },
};

export default function LowStockAlerts() {
  return (
    <div className="relative bg-white rounded-2xl border-l-4 border-l-amber-400 border border-gray-100 shadow-sm p-5 flex flex-col gap-4">
      <LockDimFeactureOverlay component_name="Low Stock Alerts" />

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <AlertTriangle size={16} className="text-amber-500" />
          <div>
            <h2 className="text-sm font-bold text-gray-900">
              Low Stock Alerts
            </h2>
            <p className="text-xs text-gray-400 mt-0.5">
              Items running out soon
            </p>
          </div>
        </div>
        <button className="flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700 transition-colors">
          Restock <ChevronRight size={13} />
        </button>
      </div>

      {/* Alert rows */}
      <div className="space-y-2">
        {MOCK_ALERTS.map((alert) => {
          const s = LEVEL_STYLES[alert.level];
          return (
            <div
              key={alert.name}
              className="flex items-center justify-between py-3 border-b border-gray-50 last:border-0"
            >
              <div>
                <p className="text-sm font-semibold text-gray-900">
                  {alert.name}
                </p>
                <p className="text-xs text-gray-400 mt-0.5">
                  Remaining:{" "}
                  <span className="font-bold text-gray-700">
                    {alert.remaining}
                  </span>
                </p>
              </div>
              <span
                className={`text-[11px] font-semibold px-3 py-1 rounded-full ${s.badge}`}
              >
                {s.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
