"use client";

import { Suspense, useState } from "react";
import {
  DateRangeFilter,
  type DateRangeValue,
} from "@/components/dashboardComponents/staffDash/DateRangeFilter";
import {
  TaxableVsNonTaxableWrapper,
  TaxStatsWrapper,
  HighestTaxGeneratedWrapper,
  TaxByCategoryWrapper,
  TaxOnRefundedBillsWrapper,
  VatStatsWrapper,
  VATTrendChartWrapper,
  MonthlyTaxTrendChartWrapper,
  WhatChangedAndWhyWrapper,
  TDSOnRentWrapper,
  TaxOnRefundsWrapper,
  VATUnclaimedBackWrapper,
  NoVATPurchasesWrapper,
  VAT20ReturnSummaryWrapper,
  FilingCalendarWrapper,
} from "@/components/componentWrappers/TaxAnalyticsWrappers";
import ChartErrorBoundary from "@/components/ui/charterrorboundary";
import ChartSkeleton from "@/components/ui/chartskeleton";

function getDefaultDateRange(): DateRangeValue {
  const today = new Date();
  const end = today.toISOString().split("T")[0];
  const start = new Date(today.getFullYear(), today.getMonth(), 1)
    .toISOString()
    .split("T")[0];
  return { startDate: start, endDate: end };
}

export default function TaxAnalyticsPage() {
  const [dateRange, setDateRange] = useState<DateRangeValue>(
    getDefaultDateRange(),
  );

  return (
    <div className="px-6 py-8 md:px-10">
      <div className="w-full mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-gray-900 tracking-tight">
              Tax Analytics (Still in Production)
            </h1>
            <p className="text-xs text-gray-400 mt-0.5">
              Overview of tax collected, refunded, and categorized
            </p>
          </div>
          <DateRangeFilter value={dateRange} onChange={setDateRange} />
        </div>

        <VatStatsWrapper />

        {/* What Changed & Why + Taxable vs Exempt - full width */}
        <ChartErrorBoundary>
          <Suspense fallback={<ChartSkeleton />}>
            <WhatChangedAndWhyWrapper />
          </Suspense>
        </ChartErrorBoundary>

        {/* VAT Trend Charts - 2 column grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <VATTrendChartWrapper />
          <MonthlyTaxTrendChartWrapper />
        </div>

        {/* Taxable vs Non-Taxable - full width */}
        <TaxableVsNonTaxableWrapper
          startDate={dateRange.startDate}
          endDate={dateRange.endDate}
        />

        {/* Tax Stats - full width */}
        <TaxStatsWrapper
          startDate={dateRange.startDate}
          endDate={dateRange.endDate}
        />

        {/* Grid for remaining cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Highest Tax Generated */}
          <HighestTaxGeneratedWrapper
            startDate={dateRange.startDate}
            endDate={dateRange.endDate}
          />

          {/* Tax by Category */}
          <TaxByCategoryWrapper
            startDate={dateRange.startDate}
            endDate={dateRange.endDate}
          />
        </div>

        {/* Tax on Refunded Bills - full width */}
        <TaxOnRefundedBillsWrapper
          startDate={dateRange.startDate}
          endDate={dateRange.endDate}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
          <VAT20ReturnSummaryWrapper />
          <FilingCalendarWrapper />
        </div>

        {/* Supplementary tax cards - 3 column grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
          <TDSOnRentWrapper />
          <TaxOnRefundsWrapper />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
          <VATUnclaimedBackWrapper />
          <NoVATPurchasesWrapper />
        </div>
      </div>
    </div>
  );
}
