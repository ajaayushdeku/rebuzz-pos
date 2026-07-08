"use client";

import { useState, useEffect } from "react";
import {
  DateRangeFilter,
  type DateRangeValue,
} from "@/components/dashboardComponents/staffDash/DateRangeFilter";
import TaxableVsNonTaxableItems from "@/components/dashboardComponents/taxAnalytics/TaxableVsNonTaxableItems";
import { useTaxableBreakdown } from "@/hooks/useTaxableBreakdown";
import { useHighestTaxItems } from "@/hooks/useHighestTaxItems";
import TaxStats from "@/components/dashboardComponents/taxAnalytics/TaxStats";
import HighestTaxGenerated from "@/components/dashboardComponents/taxAnalytics/HighestTaxGenerated";
import TaxByCategory from "@/components/dashboardComponents/taxAnalytics/TaxByCategory";
import TaxOnRefundedBills from "@/components/dashboardComponents/taxAnalytics/TaxOnRefundedBills";
import VatStatCard from "../dashboardComponents/taxAnalytics/VatStatCard";
import { vatStats } from "../dashboardComponents/taxAnalytics/MiniTrendChart";
import VATTrendChart from "../dashboardComponents/taxAnalytics/VATTrendChart";
import MonthlyTaxTrendChart from "../dashboardComponents/taxAnalytics/MonthlyTaxTrendChart";
import WhatChangedAndWhy from "../dashboardComponents/taxAnalytics/WhatChangedAndWhy";
import TDSOnRent from "../dashboardComponents/taxAnalytics/TDSOnRent";
import TaxOnRefunds from "../dashboardComponents/taxAnalytics/TaxOnRefunds";
import VATUnclaimedBack from "../dashboardComponents/taxAnalytics/VATUnclaimedBack";
import NoVATPurchases from "../dashboardComponents/taxAnalytics/NoVATPurchase";
import VAT20ReturnSummary from "../dashboardComponents/taxAnalytics/VAT20ReturnSummary";
import FilingCalendar from "../dashboardComponents/taxAnalytics/FilingCalendar";
import LockDimFeactureOverlay from "../LockDimFeactureOverlay";
import TaxReconciliation from "../dashboardComponents/taxAnalytics/TaxReconciliation";
import IncomeTaxProvision from "../dashboardComponents/taxAnalytics/IncomeTaxProvision";
import AdvanceTaxInstallments from "../dashboardComponents/taxAnalytics/AdvanceTaxInstallments";
import TDSReceivable from "../dashboardComponents/taxAnalytics/TDSReceivable";
import TaxRateBreakdown from "../dashboardComponents/taxAnalytics/TaxRateBreakdown";
import WhatYouActuallyOwe from "../dashboardComponents/taxAnalytics/WhatYouActuallyOwe";
import TaxAuditLog from "../dashboardComponents/taxAnalytics/TaxAuditLog";

interface RefundBillWithTax {
  billNumber: string;
  refundedAmount: number;
  taxRefunded: number;
  reason: string;
  date: string;
}

function getDefaultDateRange(): DateRangeValue {
  const today = new Date();
  const end = today.toISOString().split("T")[0];
  const start = new Date(today.getFullYear(), today.getMonth(), 1)
    .toISOString()
    .split("T")[0];
  return { startDate: start, endDate: end };
}

// Mock data for components that don't have API endpoints yet
const MOCK_DATA = {
  taxableBreakdown: {
    taxableRevenue: 425000,
    taxableTaxAmount: 55250,
    nonTaxableRevenue: 125000,
  },
  taxStats: {
    regularTaxes: [
      {
        name: "VAT 13%",
        rate: 13,
        totalTaxAmount: 28500,
        transactionCount: 342,
      },
      { name: "VAT 5%", rate: 5, totalTaxAmount: 9800, transactionCount: 187 },
      {
        name: "Service Tax 10%",
        rate: 10,
        totalTaxAmount: 12400,
        transactionCount: 95,
      },
    ],
    groupTaxes: [
      { name: "Combined Tax A", totalTaxAmount: 8750, transactionCount: 64 },
      { name: "Mixed Rate Bundle", totalTaxAmount: 5200, transactionCount: 38 },
    ],
  },
  categoryTax: [
    { category: "Pizza", revenue: 142000, taxAmount: 18460 },
    { category: "Salads", revenue: 68500, taxAmount: 8905 },
    { category: "Appetizers", revenue: 52000, taxAmount: 6760 },
    { category: "Pasta", revenue: 47800, taxAmount: 6214 },
    { category: "Beverages", revenue: 38500, taxAmount: 5005 },
    { category: "Desserts", revenue: 22500, taxAmount: 2925 },
  ],
};

export function TaxableVsNonTaxableWrapper({
  range = "month",
  startDate,
  endDate,
}: {
  range?: string;
  startDate?: string;
  endDate?: string;
}) {
  const effectiveStart = startDate || getDefaultDateRange().startDate;
  const effectiveEnd = endDate || getDefaultDateRange().endDate;

  const { data, isLoading } = useTaxableBreakdown(effectiveStart, effectiveEnd);

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
      <h2 className="text-sm font-semibold text-gray-800 mb-4">
        Taxable & Non-Taxable Items
      </h2>
      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <TaxableVsNonTaxableItems
          data={
            data || {
              taxableRevenue: 0,
              taxableTaxAmount: 0,
              nonTaxableRevenue: 0,
              taxableItems: [],
              nonTaxableItems: [],
            }
          }
        />
      )}
    </div>
  );
}

export function VatStatsWrapper() {
  return (
    <div className="relative lg:grid lg:grid-cols-4 lg:gap-3 flex gap-3 overflow-x-auto pb-3 px-2 sm:px-0 lg:overflow-visible scrollbar-custom">
      <LockDimFeactureOverlay component_name="VAT Stat Cards" />
      {vatStats.map((card) => (
        <VatStatCard key={card.id} stat={card} />
      ))}
    </div>
  );
}

export function TaxStatsWrapper({
  range = "month",
  startDate,
  endDate,
}: {
  range?: string;
  startDate?: string;
  endDate?: string;
}) {
  // TODO: Replace with real API call when endpoint is available
  const data = MOCK_DATA.taxStats;

  return (
    <div className="  bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
      <h2 className="text-sm font-semibold text-gray-800 mb-4">
        Tax Stats (Mock Data)
      </h2>
      <TaxStats data={data} />
    </div>
  );
}

export function HighestTaxGeneratedWrapper({
  range = "month",
  startDate,
  endDate,
}: {
  range?: string;
  startDate?: string;
  endDate?: string;
}) {
  const effectiveStart = startDate || getDefaultDateRange().startDate;
  const effectiveEnd = endDate || getDefaultDateRange().endDate;

  const { data, isLoading, isError } = useHighestTaxItems(
    effectiveStart,
    effectiveEnd,
  );

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
      <h2 className="text-sm font-semibold text-gray-800 mb-4">
        Highest Tax Generated
      </h2>
      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : isError ? (
        <p className="text-xs text-red-400 text-center py-8">
          Failed to load tax data
        </p>
      ) : (
        <HighestTaxGenerated data={data ?? []} />
      )}
    </div>
  );
}

export function TaxByCategoryWrapper({
  range = "month",
  startDate,
  endDate,
}: {
  range?: string;
  startDate?: string;
  endDate?: string;
}) {
  const [categoryData, setCategoryData] = useState<CategoryTaxItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCategoryData = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams({
          startDate: startDate || getDefaultDateRange().startDate,
          endDate: endDate || getDefaultDateRange().endDate,
        });
        const res = await fetch(
          `/api/report/taxByCategory?${params.toString()}`,
        );
        if (!res.ok) throw new Error("Failed to fetch");
        const data = await res.json();
        // The API returns the data in the correct format already
        setCategoryData(data);
      } catch (error) {
        console.error("Failed to fetch category data:", error);
        setCategoryData([]);
      } finally {
        setLoading(false);
      }
    };

    fetchCategoryData();
  }, [startDate, endDate]);

  return (
    <>
      {/* <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5"> */}
      {/* <h2 className="text-sm font-semibold text-gray-800 mb-4">
        Tax by Category
      </h2> */}
      {loading ? (
        <div className="flex items-center justify-center py-8">
          <div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : (
        // <TaxByCategory data={categoryData} />

        <TaxByCategory />
      )}
      {/* </div> */}
    </>
  );
}

interface CategoryTaxItem {
  category: string;
  revenue: number;
  taxAmount: number;
}

export function TaxOnRefundedBillsWrapper({
  range = "month",
  startDate,
  endDate,
}: {
  range?: string;
  startDate?: string;
  endDate?: string;
}) {
  const [refundBills, setRefundBills] = useState<RefundBillWithTax[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRefundBills = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams({
          startDate: startDate || getDefaultDateRange().startDate,
          endDate: endDate || getDefaultDateRange().endDate,
        });
        const res = await fetch(`/api/tax/refunded-bills?${params.toString()}`);
        if (!res.ok) throw new Error("Failed to fetch");
        const data = await res.json();
        setRefundBills(data);
      } catch (error) {
        console.error("Failed to fetch refunded bills:", error);
        setRefundBills([]);
      } finally {
        setLoading(false);
      }
    };

    fetchRefundBills();
  }, [startDate, endDate]);

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
      <h2 className="text-sm font-semibold text-gray-800 mb-4">
        Tax on Refunded Bills
      </h2>
      {loading ? (
        <div className="flex items-center justify-center py-8">
          <div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : (
        <TaxOnRefundedBills data={refundBills} />
      )}
    </div>
  );
}

export function WhatYouActuallyOweWrapper() {
  return <WhatYouActuallyOwe />;
}

export function VATTrendChartWrapper() {
  return <VATTrendChart />;
}

export function MonthlyTaxTrendChartWrapper() {
  return <MonthlyTaxTrendChart />;
}

export function WhatChangedAndWhyWrapper() {
  return <WhatChangedAndWhy />;
}

export function TaxRatedBreakdownWrapper() {
  return <TaxRateBreakdown />;
}

export function TDSOnRentWrapper() {
  return <TDSOnRent />;
}

export function TaxOnRefundsWrapper() {
  return <TaxOnRefunds />;
}

export function VATUnclaimedBackWrapper() {
  return <VATUnclaimedBack />;
}

export function NoVATPurchasesWrapper() {
  return <NoVATPurchases />;
}

export function VAT20ReturnSummaryWrapper() {
  return <VAT20ReturnSummary />;
}

export function FilingCalendarWrapper() {
  return <FilingCalendar />;
}

export function TaxReconciliationWrapper() {
  return <TaxReconciliation />;
}

export function IncomeTaxProvisionWrapper() {
  return <IncomeTaxProvision />;
}

export function AdvanceTaxInstallmentsWrapper() {
  return <AdvanceTaxInstallments />;
}

export function TDSReceivableWrapper() {
  return <TDSReceivable />;
}

export function TaxAuditLogWrapper() {
  return <TaxAuditLog />;
}
