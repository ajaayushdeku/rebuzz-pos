"use client";

import { Suspense, useState } from "react";
import {
  DateRangeFilter,
  type DateRangeValue,
} from "@/components/dashboardComponents/staffDash/DateRangeFilter";
import {
  TaxableVsNonTaxableWrapper,
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
  TDSReceivableWrapper,
  IncomeTaxProvisionWrapper,
  AdvanceTaxInstallmentsWrapper,
  TaxReconciliationWrapper,
  WhatYouActuallyOweWrapper,
  TaxAuditLogWrapper,
  TaxRatedBreakdownWrapper,
} from "@/components/componentWrappers/TaxAnalyticsWrappers";
import ChartErrorBoundary from "@/components/ui/charterrorboundary";
import ChartSkeleton from "@/components/ui/chartskeleton";
import TaxRateBreakdown from "@/components/dashboardComponents/taxAnalytics/TaxRateBreakdown";

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
    <div className="min-h-screen bg-50 px-6 py-8 md:px-10">
      {/* ── Header ── */}
      <div className="w-full flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-200">
        <div>
          <h1 className="font-bold text-xl md:text-2xl truncate">
            Tax Analytics (Still in Production)
          </h1>

          <p className="text-xs text-gray-400 mt-0.5">
            Overview of tax collected, refunded, and categorized
          </p>
        </div>
        <DateRangeFilter value={dateRange} onChange={setDateRange} />
      </div>

      <div className="space-y-6 mt-6">
        {/* Taxable vs Non-Taxable - full width */}
        <TaxableVsNonTaxableWrapper
          startDate={dateRange.startDate}
          endDate={dateRange.endDate}
        />

        {/* Tax Breakdown (by applied rate) - full width */}
        <TaxRatedBreakdownWrapper />

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

        <WhatYouActuallyOweWrapper />
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

        <div className="grid grid-cols-1 md:grid-cols-1 lg:grid-cols-1">
          <TDSReceivableWrapper />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-1 lg:grid-cols-1">
          <h2 className="flex flex-row items-center text-xs font-bold text-gray-500 uppercase tracking-widest mb-4">
            Income Tax <div className="h-px flex-1 bg-gray-200 ml-3" />
          </h2>
          <IncomeTaxProvisionWrapper />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-1 lg:grid-cols-1">
          <AdvanceTaxInstallmentsWrapper />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-1 lg:grid-cols-1">
          <h2 className="flex flex-row items-center text-xs font-bold text-gray-500 uppercase tracking-widest mb-4">
            Reconciliation & Audit
            <div className="h-px flex-1 bg-gray-200 ml-3" />
          </h2>
          <TaxReconciliationWrapper />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-1 lg:grid-cols-1">
          <TaxAuditLogWrapper />
        </div>
      </div>
    </div>
  );
}
