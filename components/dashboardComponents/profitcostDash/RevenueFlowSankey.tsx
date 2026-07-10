"use client";

import { ResponsiveContainer, Sankey, Tooltip } from "recharts";

import { useCurrency } from "@/providers/CurrencyContext";
import { formatCurrencySymbol } from "@/utils/helper";
import { revenueFlowMockData } from "@/lib/mockData/mock-finance-data";
import LockDimFeactureOverlay from "@/components/LockDimFeactureOverlay";

export default function RevenueFlowSankey() {
  const { currency } = useCurrency();

  // Recharts Sankey expects link source/target as node indices, but the mock
  // data uses string ids — map ids → indices so the diagram resolves correctly.
  const { nodes, links, grossRevenue } = revenueFlowMockData;
  const idToIndex = new Map(nodes.map((n, i) => [n.id, i]));
  const sankeyData = {
    nodes: nodes.map((n) => ({ ...n })),
    links: links.map((l) => ({
      source: idToIndex.get(l.source) ?? 0,
      target: idToIndex.get(l.target) ?? 0,
      value: l.value,
    })),
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 md:p-6 w-full relative select-none">
      {/* Lock overlay */}
      <LockDimFeactureOverlay component_name="Revenue Flow Sankey" />

      {/* Header */}
      <div className="mb-6">
        <h2 className="text-base md:text-lg font-semibold text-gray-900 tracking-tight">
          Revenue Flow (Sankey Diagram)
        </h2>

        <p className="text-xs text-gray-400 mt-0.5">
          Visualizing how Gross Revenue distributes into expenses and Net Profit
        </p>
      </div>

      <div className=" h-[520px]">
        <ResponsiveContainer width="100%" height="100%">
          <Sankey
            data={sankeyData}
            nodePadding={55}
            nodeWidth={10}
            margin={{
              top: 10,
              right: 180,
              left: 80,
              bottom: 20,
            }}
            linkCurvature={0.5}
            iterations={64}
            node={(props: any) => {
              const { x, y, width, height, payload } = props;

              return (
                <g>
                  <rect
                    x={x}
                    y={y}
                    width={width}
                    height={height}
                    rx={4}
                    fill={payload.color}
                  />

                  <text
                    x={x + width + 10}
                    y={y + height / 2 - 3}
                    fill="#374151"
                    fontSize={13}
                    fontWeight={600}
                  >
                    {payload.name}
                  </text>

                  <text
                    x={x + width + 10}
                    y={y + height / 2 + 13}
                    fill="#64748B"
                    fontSize={10}
                  >
                    {formatCurrencySymbol(
                      payload.value ?? grossRevenue,
                      currency.symbol,
                      currency.locale,
                    )}
                  </text>
                </g>
              );
            }}
            link={{
              stroke: "#abaeb3",
              fill: "none",
              opacity: 0.65,
            }}
          >
            <Tooltip
              contentStyle={{ fontSize: 12 }}
              formatter={(value) =>
                formatCurrencySymbol(
                  Number(value ?? 0),
                  currency.symbol,
                  currency.locale,
                )
              }
            />
          </Sankey>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
