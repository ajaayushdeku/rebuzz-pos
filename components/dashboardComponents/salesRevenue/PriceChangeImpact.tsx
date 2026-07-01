"use client";

import { TrendingUp, TrendingDown } from "lucide-react";

import { ResponsiveContainer, LineChart, Line } from "recharts";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import { Badge } from "@/components/ui/badge";

import { useCurrency } from "@/providers/CurrencyContext";
import { formatCurrency } from "@/utils/helper";
import { mockPriceChangeImpact } from "@/lib/mockData/mockInsightData";

export default function PriceChangeImpact() {
  const { currency } = useCurrency();

  return (
    <Card className="rounded-2xl h-full">
      <CardHeader>
        <CardTitle>Price Change Impact</CardTitle>

        <p className="text-sm text-muted-foreground">
          Before vs after analysis of recent menu price updates
        </p>
      </CardHeader>

      <CardContent>
        <table className="w-full">
          <thead className="text-sm text-muted-foreground">
            <tr className="border-b">
              <th className="text-left py-3">Item</th>

              <th className="text-left">Price Update</th>

              <th className="text-left">Weekly Rev Impact</th>

              <th className="text-left">Volume Trend</th>

              <th className="text-right">Volume Δ</th>
            </tr>
          </thead>

          <tbody>
            {mockPriceChangeImpact.map((item) => {
              const positive = item.weeklyRevenueImpact > 0;

              return (
                <tr key={item.id} className="border-b last:border-0">
                  <td className="py-4">
                    <div className="font-medium">{item.productName}</div>

                    <div className="text-sm text-muted-foreground">
                      Updated {item.updatedDate}
                    </div>
                  </td>

                  <td>
                    <span className="line-through text-muted-foreground">
                      {formatCurrency(item.oldPrice, currency)}
                    </span>

                    <span className="mx-2">→</span>

                    <span className="font-semibold">
                      {formatCurrency(item.newPrice, currency)}
                    </span>
                  </td>

                  <td>
                    <Badge className={positive ? "bg-green-500" : "bg-red-500"}>
                      {positive ? "+" : ""}
                      {formatCurrency(item.weeklyRevenueImpact, currency)}
                      /week
                    </Badge>
                  </td>

                  <td className="w-28 h-14">
                    <ResponsiveContainer>
                      <LineChart
                        data={item.trend.map((v) => ({
                          value: v,
                        }))}
                      >
                        <Line dataKey="value" strokeWidth={2} dot={false} />
                      </LineChart>
                    </ResponsiveContainer>
                  </td>

                  <td className="text-right">
                    <Badge
                      variant="secondary"
                      className={
                        item.volumeChangePercent >= 0
                          ? "text-green-600"
                          : "text-red-600"
                      }
                    >
                      {item.volumeChangePercent >= 0 ? (
                        <TrendingUp className="mr-1 h-3 w-3" />
                      ) : (
                        <TrendingDown className="mr-1 h-3 w-3" />
                      )}
                      {item.volumeChangePercent}%
                    </Badge>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </CardContent>
    </Card>
  );
}
