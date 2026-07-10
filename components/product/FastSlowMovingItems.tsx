"use client";

import { Flame, TrendingDown } from "lucide-react";
import LockDimFeactureOverlay from "../LockDimFeactureOverlay";

type MovingItem = {
  name: string;
  category: string;
  sold: number;
  changePct: number;
  changeDir: "up" | "down";
};

const FAST_ITEMS: MovingItem[] = [
  {
    name: "Almond Croissant",
    category: "Bakery",
    sold: 48,
    changePct: 22,
    changeDir: "up",
  },
  {
    name: "Blueberry Muffin",
    category: "Bakery",
    sold: 36,
    changePct: 14,
    changeDir: "up",
  },
];

const SLOW_ITEMS: MovingItem[] = [
  {
    name: "Gluten-Free Brownie",
    category: "Bakery",
    sold: 8,
    changePct: 8,
    changeDir: "down",
  },
  {
    name: "Herbal Tea Scone",
    category: "Bakery",
    sold: 5,
    changePct: 12,
    changeDir: "down",
  },
];

function ItemRow({ item, type }: { item: MovingItem; type: "fast" | "slow" }) {
  const isFast = type === "fast";
  const barColor = isFast ? "bg-green-500" : "bg-amber-400";
  const pctColor = isFast ? "text-green-500" : "text-red-500";
  const arrowColor = isFast ? "text-green-400" : "text-amber-500";
  //   const ArrowUp = () => <span className={`text-base ${arrowColor}`}>↗</span>;
  //   const ArrowDown = () => <span className={`text-base ${arrowColor}`}>↘</span>;

  return (
    <div
      className={`flex items-center justify-between p-3 rounded-xl border ${
        isFast
          ? "border-green-100 bg-green-50/30"
          : "border-amber-100 bg-amber-50/30"
      }`}
    >
      <div className="flex items-center gap-2.5">
        <div className={`w-1 h-9 rounded-full ${barColor}`} />
        <div>
          <p className="text-sm font-semibold text-gray-900">{item.name}</p>
          <p className="text-[11px] text-gray-400">{item.category}</p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <div className="text-right">
          <p className="text-sm font-bold text-gray-900">{item.sold} sold</p>
          <p className={`text-[11px] font-semibold ${pctColor}`}>
            {isFast ? "+" : "-"}
            {item.changePct}%
          </p>
        </div>
        {isFast ? (
          <span className={`text-base ${arrowColor}`}>↗</span>
        ) : (
          <span className={`text-base ${arrowColor}`}>↘</span>
        )}
      </div>
    </div>
  );
}

const Panel = ({
  type,
  items,
}: {
  type: "fast" | "slow";
  items: MovingItem[];
}) => {
  const isFast = type === "fast";
  return (
    <div
      className={`bg-white rounded-2xl border p-5 flex flex-col gap-4 ${
        isFast ? "border-green-200" : "border-amber-200"
      }`}
    >
      <div>
        <div className="flex items-center gap-2 mb-0.5">
          {isFast ? (
            <Flame size={15} className="text-green-600" />
          ) : (
            <TrendingDown size={15} className="text-amber-500" />
          )}
          <h3
            className={`text-sm font-bold ${isFast ? "text-green-700" : "text-amber-600"}`}
          >
            {isFast ? "Fast Moving Items" : "Slow Moving Items"}
          </h3>
        </div>
        <p className="text-xs text-gray-400">
          {isFast
            ? "Your bestsellers — keep stocked and consider expanding"
            : "These need attention — consider a promo or recipe change"}
        </p>
      </div>
      <div className="space-y-2">
        {items.map((item) => (
          <ItemRow key={item.name} item={item} type={type} />
        ))}
      </div>
    </div>
  );
};

export default function FastSlowMovingItems() {
  return (
    <div className="relative grid grid-cols-1 md:grid-cols-2 gap-4">
      <LockDimFeactureOverlay component_name="Fast and Slow Moving Items" />
      <Panel type="fast" items={FAST_ITEMS} />
      <Panel type="slow" items={SLOW_ITEMS} />
    </div>
  );
}
