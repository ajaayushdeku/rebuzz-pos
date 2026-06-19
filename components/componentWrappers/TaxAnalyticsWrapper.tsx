"use client";

import { useState, useMemo } from "react";
import {
  DateRangeFilter,
  type DateRangeValue,
} from "@/components/dashboardComponents/staffDash/DateRangeFilter";
import TaxableVsNonTaxableItems from "@/components/dashboardComponents/taxAnalytics/TaxableVsNonTaxableItems";
import TaxStats from "@/components/dashboardComponents/taxAnalytics/TaxStats";
import HighestTaxGenerated from "@/components/dashboardComponents/taxAnalytics/HighestTaxGenerated";
import TaxByCategory from "@/components/dashboardComponents/taxAnalytics/TaxByCategory";
import TaxOnRefundedBills from "@/components/dashboardComponents/taxAnalytics/TaxOnRefundedBills";

function getDefaultDateRange(): DateRangeValue {
  const today = new Date();
  const end = today.toISOString().split("T")[0];
  const start = new Date(today.getFullYear(), today.getMonth(), 1)
    .toISOString()
    .split("T")[0];
  return { startDate: start, endDate: end };
}

/*
  Mock data — backend endpoints not yet available.
  Replace these with real API calls once the endpoints are ready.
*/

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
  highestTaxItems: [
    { name: "Margherita Pizza", totalTaxAmount: 12450, transactionCount: 210 },
    { name: "Pepperoni Pizza", totalTaxAmount: 10200, transactionCount: 178 },
    { name: "Caesar Salad", totalTaxAmount: 6800, transactionCount: 145 },
    { name: "Chicken Wings", totalTaxAmount: 5400, transactionCount: 98 },
    { name: "Spaghetti Bolognese", totalTaxAmount: 4200, transactionCount: 76 },
  ],
  categoryTax: [
    { category: "Pizza", revenue: 142000, taxAmount: 18460 },
    { category: "Salads", revenue: 68500, taxAmount: 8905 },
    { category: "Appetizers", revenue: 52000, taxAmount: 6760 },
    { category: "Pasta", revenue: 47800, taxAmount: 6214 },
    { category: "Beverages", revenue: 38500, taxAmount: 5005 },
    { category: "Desserts", revenue: 22500, taxAmount: 2925 },
  ],
  refundBills: [
    {
      billNumber: "INV-2024-0842",
      refundedAmount: 4500,
      taxRefunded: 585,
      reason: "Customer returned order",
      date: "2024-03-15",
    },
    {
      billNumber: "INV-2024-0791",
      refundedAmount: 3200,
      taxRefunded: 416,
      reason: "Wrong item delivered",
      date: "2024-03-14",
    },
    {
      billNumber: "INV-2024-0763",
      refundedAmount: 1800,
      taxRefunded: 234,
      reason: "Quality issue",
      date: "2024-03-12",
    },
    {
      billNumber: "INV-2024-0720",
      refundedAmount: 6200,
      taxRefunded: 806,
      reason: "Order cancelled by customer",
      date: "2024-03-10",
    },
  ],
};

export default function TaxAnalyticsWrapper() {
  const [dateRange, setDateRange] =
    useState<DateRangeValue>(getDefaultDateRange);

  const data = useMemo(() => MOCK_DATA, []);

  return (
    <div className="w-full mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-gray-900 tracking-tight">
            Tax Analytics ( Still in Production)
          </h1>
          <p className="text-sm text-gray-400 mt-0.5">
            Overview of tax collected, refunded, and categorized
          </p>
        </div>
        <div className="self-start sm:self-end shrink-0">
          <DateRangeFilter
            value={dateRange}
            onChange={setDateRange}
            showPresets
          />
        </div>
      </div>

      {/* Taxable vs Non-Taxable - full width */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <h2 className="text-sm font-semibold text-gray-800 mb-4">
          Taxable & Non-Taxable Items ( Mock Data )
        </h2>
        <TaxableVsNonTaxableItems data={data.taxableBreakdown} />
      </div>

      {/* Tax Stats - full width */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <h2 className="text-sm font-semibold text-gray-800 mb-4">
          Tax Stats ( Mock Data )
        </h2>
        <TaxStats data={data.taxStats} />
      </div>

      {/* Grid for remaining cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Highest Tax Generated */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <h2 className="text-sm font-semibold text-gray-800 mb-4">
            Highest Tax Generated ( Mock Data )
          </h2>
          <HighestTaxGenerated data={data.highestTaxItems} />
        </div>

        {/* Tax by Category */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <h2 className="text-sm font-semibold text-gray-800 mb-4">
            Tax by Category ( Mock Data )
          </h2>
          <TaxByCategory data={data.categoryTax} />
        </div>
      </div>

      {/* Tax on Refunded Bills - full width */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <h2 className="text-sm font-semibold text-gray-800 mb-4">
          Tax on Refunded Bills ( Mock Data )
        </h2>
        <TaxOnRefundedBills data={data.refundBills} />
      </div>
    </div>
  );
}
