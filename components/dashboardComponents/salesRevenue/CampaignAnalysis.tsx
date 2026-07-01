"use client";

import {
    ResponsiveContainer,
    LineChart,
    Line,
    XAxis,
    YAxis,
    Tooltip,
    CartesianGrid,
} from "recharts";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useCurrency } from "@/providers/CurrencyContext";
import { formatCurrency } from "@/utils/helper";
import { mockCampaignAnalysis } from "@/lib/mockData/mockInsightData";

export default function CampaignAnalysis() {
    const { currency } = useCurrency();

    return (
        <Card className="rounded-2xl h-full">
            <CardHeader>
                <CardTitle>
                    Campaign Analysis
                </CardTitle>

                <p className="text-sm text-muted-foreground">
                    Sales before, during and after the latest discount campaign
                </p>
            </CardHeader>

            <CardContent>

                <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={mockCampaignAnalysis.data}>
                            <CartesianGrid strokeDasharray="3 3" />

                            <XAxis dataKey="label" />

                            <YAxis
                                tickFormatter={(v) =>
                                    formatCurrency(v, currency)
                                }
                            />

                            <Tooltip
                                formatter={(value) =>
                                    typeof value === "number"
                                        ? formatCurrency(value, currency)
                                        : ""
                                }
                            />

                            <Line
                                dataKey="revenue"
                                type="monotone"
                                strokeWidth={3}
                                dot={{ r: 5 }}
                            />
                        </LineChart>
                    </ResponsiveContainer>
                </div>

                <div className="mt-6 flex flex-wrap gap-3">

                    <Badge variant="secondary">
                        ← Pre-campaign
                    </Badge>

                    <Badge>
                        🎯 During (+{mockCampaignAnalysis.campaignGrowth}%)
                    </Badge>

                    <Badge variant="outline">
                        → Post-campaign
                    </Badge>

                </div>

            </CardContent>
        </Card>
    );
}