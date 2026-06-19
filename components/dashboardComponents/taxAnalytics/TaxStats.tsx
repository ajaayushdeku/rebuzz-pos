"use client";

import { useCurrency } from "@/providers/CurrencyContext";
import { formatCurrencySymbol } from "@/utils/helper";
import { Percent, Receipt, Layers } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Rectangle,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import type { BarRectangleItem } from "recharts";
import type {
  NameType,
  Payload,
  ValueType,
} from "recharts/types/component/DefaultTooltipContent";

interface RegularTaxStat {
  name: string;
  rate: number;
  totalTaxAmount: number;
  transactionCount: number;
}

interface GroupTaxStat {
  name: string;
  totalTaxAmount: number;
  transactionCount: number;
}

interface TaxStatsData {
  regularTaxes: RegularTaxStat[];
  groupTaxes: GroupTaxStat[];
}

const REGULAR_COLORS = ["#3B82F6", "#60A5FA", "#93C5FD"];
const GROUP_COLORS = ["#8B5CF6", "#A78BFA"];

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
  return (
    <div className="bg-white rounded-xl px-4 py-3 shadow-lg border border-gray-100">
      <p className="text-gray-400 text-xs mb-2 font-medium">{label}</p>
      {payload.map((entry) => (
        <div
          key={entry.dataKey as string}
          className="flex items-center justify-between gap-4 text-xs"
        >
          <span className="text-gray-600">{entry.name}</span>
          <span className="font-bold" style={{ color: entry.color as string }}>
            {formatCurrencySymbol(
              entry.value as number,
              currency.symbol,
              currency.locale,
            )}
          </span>
        </div>
      ))}
    </div>
  );
};

const TaxBar = (props: BarRectangleItem) => (
  <Rectangle {...props} radius={[4, 4, 0, 0]} />
);

const TaxStats = ({ data }: { data: TaxStatsData }) => {
  const { currency } = useCurrency();

  const totalRegular = data.regularTaxes.reduce(
    (s, t) => s + t.totalTaxAmount,
    0,
  );
  const totalGrouped = data.groupTaxes.reduce(
    (s, t) => s + t.totalTaxAmount,
    0,
  );

  const regularChartData = data.regularTaxes.map((t) => ({
    name: t.name,
    amount: t.totalTaxAmount,
  }));

  const groupChartData = data.groupTaxes.map((t) => ({
    name: t.name,
    amount: t.totalTaxAmount,
  }));

  const comparisonData = [
    { name: "Regular Tax", amount: totalRegular },
    { name: "Group Tax", amount: totalGrouped },
  ];

  return (
    <div className="space-y-6">
      {/* Comparison bar chart */}
      <div>
        <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
          Regular vs Group Tax
        </h4>
        <div className="h-32">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={comparisonData}
              margin={{ top: 5, right: 5, left: 5, bottom: 5 }}
              barCategoryGap="30%"
            >
              <CartesianGrid vertical={false} stroke="#f3f4f6" />
              <XAxis
                dataKey="name"
                axisLine={false}
                tickLine={false}
                tick={{ fill: "#9ca3af", fontSize: 11 }}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fill: "#9ca3af", fontSize: 11 }}
                width={45}
                tickFormatter={(v: number) =>
                  v >= 1000 ? `${(v / 1000).toFixed(0)}k` : `${v}`
                }
              />
              <Tooltip
                content={<CustomTooltip />}
                cursor={{ fill: "rgba(0,0,0,0.03)" }}
              />
              <Bar
                dataKey="amount"
                name="Amount"
                fill="#6E93FF"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Regular & Group Taxes side by side */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
        {/* Regular Taxes */}
        <div>
          <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-1.5">
            <Receipt size={13} className="text-blue-500" />
            Regular Taxes
          </h4>

          {/* Pie chart on top */}
          <div className="h-28 mb-2">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={regularChartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={22}
                  outerRadius={38}
                  paddingAngle={3}
                  dataKey="amount"
                  nameKey="name"
                >
                  {regularChartData.map((_, i) => (
                    <Cell
                      key={i}
                      fill={REGULAR_COLORS[i % REGULAR_COLORS.length]}
                      stroke="none"
                    />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* List below */}
          <div className="space-y-1.5">
            {data.regularTaxes.map((tax, i) => (
              <div key={tax.name} className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <span
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: REGULAR_COLORS[i] }}
                  />
                  <span className="text-xs text-gray-600">{tax.name}</span>
                </div>
                <div className="text-right">
                  <span className="text-xs font-semibold text-gray-800">
                    {formatCurrencySymbol(
                      tax.totalTaxAmount,
                      currency.symbol,
                      currency.locale,
                    )}
                  </span>
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-between items-center mt-2 pt-2 border-t border-gray-100">
            <span className="text-xs text-gray-500">Regular Tax Total</span>
            <span className="text-sm font-bold text-blue-600">
              {formatCurrencySymbol(
                totalRegular,
                currency.symbol,
                currency.locale,
              )}
            </span>
          </div>
        </div>

        {/* Group Taxes */}
        <div>
          <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-1.5">
            <Layers size={13} className="text-purple-500" />
            Group Taxes
          </h4>

          {data.groupTaxes.length > 0 ? (
            <>
              {/* Pie chart on top */}
              <div className="h-28 mb-2">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={groupChartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={22}
                      outerRadius={38}
                      paddingAngle={3}
                      dataKey="amount"
                      nameKey="name"
                    >
                      {groupChartData.map((_, i) => (
                        <Cell
                          key={i}
                          fill={GROUP_COLORS[i % GROUP_COLORS.length]}
                          stroke="none"
                        />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              {/* List below */}
              <div className="space-y-1.5">
                {data.groupTaxes.map((tax, i) => (
                  <div
                    key={tax.name}
                    className="flex items-center justify-between"
                  >
                    <div className="flex items-center gap-1.5">
                      <span
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: GROUP_COLORS[i] }}
                      />
                      <span className="text-xs text-gray-600">{tax.name}</span>
                    </div>
                    <span className="text-xs font-semibold text-gray-800">
                      {formatCurrencySymbol(
                        tax.totalTaxAmount,
                        currency.symbol,
                        currency.locale,
                      )}
                    </span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <p className="text-xs text-gray-400 text-center py-3">
              No group tax data
            </p>
          )}

          <div className="flex justify-between items-center mt-2 pt-2 border-t border-gray-100">
            <span className="text-xs text-gray-500">Group Tax Total</span>
            <span className="text-sm font-bold text-purple-600">
              {formatCurrencySymbol(
                totalGrouped,
                currency.symbol,
                currency.locale,
              )}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TaxStats;
