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

/**
 * One panel, isolated.
 *
 * The error boundary is the part that earns its keep today: every wrapper on
 * this page fetches independently, and without a boundary one throwing takes
 * the whole page down with it. Only a single panel was wrapped before.
 *
 * The Suspense boundary is inert while the wrappers use `useQuery`, which
 * reports `isLoading` rather than suspending. It is here so that moving a
 * wrapper to `useSuspenseQuery` — or splitting it into its own lazily imported
 * module — starts streaming with no further change to this page.
 */
function Panel({ children }: { children: React.ReactNode }) {
  return (
    <ChartErrorBoundary>
      <Suspense fallback={<ChartSkeleton />}>{children}</Suspense>
    </ChartErrorBoundary>
  );
}

function getDefaultDateRange(): DateRangeValue {
  const today = new Date();
  const end = today.toISOString().split("T")[0];
  const start = new Date(today);
  start.setDate(today.getDate() - 29);
  return { startDate: start.toISOString().split("T")[0], endDate: end };
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
            Tax Analytics
          </h1>

          <p className="text-xs text-gray-400 mt-0.5 ">
            Overview of tax collected, refunded, and categorized
          </p>
        </div>
        <DateRangeFilter
          value={dateRange}
          onChange={setDateRange}
          storageKey="rebuzz-tax-analytics-date-filter"
        />
      </div>

      <div className="space-y-6 mt-6">
        {/* Taxable vs Non-Taxable - full width */}
        <Panel>
          <TaxableVsNonTaxableWrapper
            startDate={dateRange.startDate}
            endDate={dateRange.endDate}
          />
        </Panel>

        {/* Tax Breakdown (by applied rate) - full width */}
        <Panel>
          <TaxRatedBreakdownWrapper />
        </Panel>

        {/* Grid for remaining cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Highest Tax Generated */}
          <Panel>
            <HighestTaxGeneratedWrapper
              startDate={dateRange.startDate}
              endDate={dateRange.endDate}
            />
          </Panel>

          {/* Tax by Category */}
          <Panel>
            <TaxByCategoryWrapper
              startDate={dateRange.startDate}
              endDate={dateRange.endDate}
            />
          </Panel>
        </div>

        {/* Tax on Refunded Bills - full width */}
        <Panel>
          <TaxOnRefundedBillsWrapper
            startDate={dateRange.startDate}
            endDate={dateRange.endDate}
          />
        </Panel>

        <Panel>
          <WhatYouActuallyOweWrapper />
        </Panel>

        <Panel>
          <VatStatsWrapper />
        </Panel>

        {/* What Changed & Why + Taxable vs Exempt - full width */}
        <Panel>
          <WhatChangedAndWhyWrapper />
        </Panel>

        {/* VAT Trend Charts - 2 column grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Panel>
            <MonthlyTaxTrendChartWrapper />
          </Panel>
          <Panel>
            <VATTrendChartWrapper />
          </Panel>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
          <Panel>
            <VAT20ReturnSummaryWrapper />
          </Panel>
          <Panel>
            <FilingCalendarWrapper />
          </Panel>
        </div>

        {/* Supplementary tax cards - 3 column grid */}
        <div className="grid grid-cols-1 md:grid-cols-1 lg:grid-cols-1">
          <Panel>
            <TDSOnRentWrapper />
          </Panel>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
          <Panel>
            <VATUnclaimedBackWrapper />
          </Panel>
          <Panel>
            <NoVATPurchasesWrapper />
          </Panel>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-1 lg:grid-cols-1">
          <Panel>
            <TDSReceivableWrapper />
          </Panel>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-1 lg:grid-cols-1">
          <h2 className="flex flex-row items-center text-xs font-bold text-gray-500 uppercase tracking-widest mb-4">
            Income Tax <div className="h-px flex-1 bg-gray-200 ml-3" />
          </h2>
          <Panel>
            <IncomeTaxProvisionWrapper />
          </Panel>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-1 lg:grid-cols-1">
          <Panel>
            <AdvanceTaxInstallmentsWrapper />
          </Panel>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-1 lg:grid-cols-1">
          <h2 className="flex flex-row items-center text-xs font-bold text-gray-500 uppercase tracking-widest mb-4">
            Reconciliation & Audit
            <div className="h-px flex-1 bg-gray-200 ml-3" />
          </h2>
          <Panel>
            <TaxReconciliationWrapper />
          </Panel>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-1 lg:grid-cols-1">
          <Panel>
            <TaxAuditLogWrapper />
          </Panel>
        </div>
      </div>
    </div>
  );
}
