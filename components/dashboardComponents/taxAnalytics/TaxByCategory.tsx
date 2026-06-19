"use client";

import { useCurrency } from "@/providers/CurrencyContext";
import { formatCurrencySymbol } from "@/utils/helper";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Rectangle,
} from "recharts";
import type { BarShapeProps } from "recharts";
import type {
  NameType,
  Payload,
  ValueType,
} from "recharts/types/component/DefaultTooltipContent";

interface CategoryTaxItem {
  category: string;
  revenue: number;
  taxAmount: number;
}

const CustomTooltip = ({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Payload<ValueType, NameType>[];
  label?: string;
}) => {
  const { currency } = useCurrency();
  if (!active || !payload?.length) return null;
  const tax = payload.find((p) => p.dataKey === "taxAmount");
  const rev = payload.find((p) => p.dataKey === "revenue");
  return (
    <div className="bg-white rounded-xl px-4 py-3 shadow-lg border border-gray-100">
      <p className="text-gray-400 text-xs mb-2 font-medium">{label}</p>
      <div className="flex items-center justify-between gap-4 text-xs">
        <span className="text-gray-600">Tax</span>
        <span className="font-bold text-blue-600">
          {formatCurrencySymbol(
            (tax?.value as number) ?? 0,
            currency.symbol,
            currency.locale,
          )}
        </span>
      </div>
      <div className="flex items-center justify-between gap-4 text-xs mt-1">
        <span className="text-gray-600">Revenue</span>
        <span className="font-bold text-gray-800">
          {formatCurrencySymbol(
            (rev?.value as number) ?? 0,
            currency.symbol,
            currency.locale,
          )}
        </span>
      </div>
    </div>
  );
};

const TaxBar = (props: BarShapeProps) => (
  <Rectangle {...props} radius={[4, 4, 0, 0]} fill="#6E93FF" />
);

const TaxByCategory = ({ data }: { data: CategoryTaxItem[] }) => {
  const { currency } = useCurrency();

  if (data.length === 0) {
    return (
      <p className="text-xs text-gray-400 text-center py-8">
        No category tax data available
      </p>
    );
  }

  return (
    <div className="h-56">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          margin={{ top: 10, right: 10, left: 10, bottom: 10 }}
          barCategoryGap="25%"
        >
          <CartesianGrid vertical={false} stroke="#f3f4f6" />
          <XAxis
            dataKey="category"
            axisLine={false}
            tickLine={false}
            tick={{ fill: "#9ca3af", fontSize: 11 }}
            dy={8}
            interval={0}
            tickFormatter={(val: string) =>
              val.length > 10 ? val.slice(0, 9) + "…" : val
            }
          />
          <YAxis
            axisLine={false}
            tickLine={false}
            tick={{ fill: "#9ca3af", fontSize: 12 }}
            width={50}
            tickFormatter={(v: number) =>
              v >= 1000 ? `${(v / 1000).toFixed(0)}k` : `${v}`
            }
          />
          <Tooltip
            content={<CustomTooltip />}
            cursor={{ fill: "rgba(0,0,0,0.03)" }}
          />
          <Bar dataKey="taxAmount" name="Tax Amount" shape={TaxBar} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default TaxByCategory;
