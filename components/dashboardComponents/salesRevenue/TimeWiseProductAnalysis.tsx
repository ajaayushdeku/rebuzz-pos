"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { mockTimeWiseProductData } from "@/lib/mockData/mockInsightData";
import { useCurrency } from "@/providers/CurrencyContext";
import { formatCurrency } from "@/utils/helper";

export default function TimeWiseProductAnalysis() {
  const { currency } = useCurrency();

  return (
    <Card className="rounded-2xl">
      <CardHeader className="pb-4">
        <CardTitle className="text-xl">Time-Wise Product Analysis</CardTitle>
        <p className="text-sm text-muted-foreground">
          Top performing products specific to times of day
        </p>
      </CardHeader>

      <CardContent>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {mockTimeWiseProductData.map((item) => (
            <div
              key={item.period}
              className="rounded-xl border p-5 hover:bg-muted/30 transition"
            >
              <p className="text-xs font-semibold uppercase tracking-wide text-primary">
                {item.title}
              </p>

              <h3 className="mt-4 text-xl font-semibold">{item.productName}</h3>

              <div className="mt-6 flex justify-between">
                <span className="text-muted-foreground">
                  {item.unitsSold} units
                </span>

                <span className="font-semibold text-green-600">
                  {formatCurrency(item.revenue, currency)}
                </span>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
