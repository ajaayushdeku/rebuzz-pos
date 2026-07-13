"use client";

import { useState, useEffect } from "react";
import {
  DateRangeFilter,
  type DateRangeValue,
} from "@/components/dashboardComponents/staffDash/DateRangeFilter";
import TaxableVsNonTaxableItems from "@/components/dashboardComponents/taxAnalytics/TaxableVsNonTaxableItems";
import { useTaxableBreakdown } from "@/hooks/useTaxableBreakdown";
import { useHighestTaxItems } from "@/hooks/useHighestTaxItems";
import { useTaxByCategory } from "@/hooks/useTaxByCategory";
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

  const { data, isLoading, isError } = useTaxableBreakdown(
    effectiveStart,
    effectiveEnd,
  );

  return (
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
      isLoading={isLoading}
      isError={isError}
    />
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
    <HighestTaxGenerated
      data={data ?? []}
      isLoading={isLoading}
      isError={isError}
    />
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
  const effectiveStart = startDate || getDefaultDateRange().startDate;
  const effectiveEnd = endDate || getDefaultDateRange().endDate;

  const { data, isLoading, isError } = useTaxByCategory(
    effectiveStart,
    effectiveEnd,
  );

  return (
    <TaxByCategory data={data ?? []} isLoading={isLoading} isError={isError} />
  );
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
  const [error, setError] = useState(false);

  useEffect(() => {
    const fetchRefundBills = async () => {
      setLoading(true);
      setError(false);
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
        setError(true);
        setRefundBills([]);
      } finally {
        setLoading(false);
      }
    };

    fetchRefundBills();
  }, [startDate, endDate]);

  return (
    <TaxOnRefundedBills
      data={refundBills}
      isLoading={loading}
      isError={error}
    />
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
