"use client";

import { Suspense } from "react";
import dynamic from "next/dynamic";

import { ExpenseTrackerProvider, useTracker } from "@/providers/ExpenseContext";
import {
  BudgetVsActualSkeleton,
  CashFlowTrendSkeleton,
  ExpenseAnalyticsSkeleton,
  ExpenseBudgetGaugesSkeleton,
  ExpenseCardSkeleton,
  ExpensesByCategorySkeleton,
  MonthlyExpenseTrendSkeleton,
} from "@/components/expenses/ExpenseAnalyticsSkeletons";
import ChartErrorBoundary from "@/components/ui/charterrorboundary";
import ExpenseMonthYearFilter from "@/components/expenses/ExpenseMonthYearFilter";
import BudgetForm from "@/components/expenses/BudgetForm";
import ExpenseIncomeForm from "@/components/expenses/ExpenseIncomeForm";
import { useCashFlowTrend } from "@/hooks/useCashFlowTrend";

/**
 * Panels are imported lazily, which is what gives `<Suspense>` something to
 * catch on a client page.
 *
 * `useQuery` never suspends — it reports `isLoading` and renders — so a
 * Suspense boundary around a panel that only fetches would never show its
 * fallback. A dynamic import does suspend, so each panel arrives in its own
 * chunk and its skeleton is shown while that chunk loads. These are all
 * Recharts panels, and the chart library is the heaviest thing on the page.
 */
const CashFlowTrend = dynamic(
  () => import("@/components/expenses/CashFlowTrend"),
);
const ExpensesByCategory = dynamic(
  () => import("@/components/expenses/ExpensesByCategory"),
);
const MonthlyExpenseTrend = dynamic(
  () => import("@/components/expenses/MonthlyExpenseTrend"),
);
const BudgetVsActual = dynamic(
  () => import("@/components/expenses/BudgetVsActual"),
);
const ExpenseBudgetGauges = dynamic(
  () => import("@/components/expenses/ExpenseBudgetGauges"),
);
const CostHealth = dynamic(() => import("@/components/expenses/CostHealth"));
const WhereMoneyGoes = dynamic(
  () => import("@/components/expenses/WhereMoneyGoes"),
);
const HiddenCostLeaks = dynamic(
  () => import("@/components/expenses/HiddenCostLeaks"),
);

/**
 * One panel: its own error boundary so a single failure can't blank the page,
 * and its own Suspense boundary so it appears as soon as its chunk lands.
 */
function Panel({
  fallback,
  children,
}: {
  fallback: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <ChartErrorBoundary>
      <Suspense fallback={fallback}>{children}</Suspense>
    </ChartErrorBoundary>
  );
}

function ExpenseAnalyticsPage() {
  const { isLoading } = useTracker();
  const { isLoading: isLast6monthLoading } = useCashFlowTrend();

  return (
    <div className="min-h-screen bg-50 px-6 py-8 md:px-10">
      <div className="w-full mx-auto flex flex-col gap-6">
        {/* ── Header ── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-200">
          <div>
            <h1 className="font-bold text-xl md:text-2xl truncate">
              Expense Analytics
            </h1>
            <p className="text-xs text-gray-400 mt-0.5">
              Visual breakdown of your spending, budgets and cash flow
            </p>
          </div>
          <div className="flex items-center gap-2">
            <ExpenseMonthYearFilter />
            <BudgetForm />
            <ExpenseIncomeForm />
          </div>
        </div>

        {/* The data gates stay: they cover the fetch, while Suspense covers the
            chunk. A panel needs both before it has anything to draw. */}
        <Panel fallback={<CashFlowTrendSkeleton />}>
          {/* {isLast6monthLoading ? <CashFlowTrendSkeleton /> : <CashFlowTrend />} */}
          <CashFlowTrend />
        </Panel>

        <Panel fallback={<ExpensesByCategorySkeleton />}>
          {/* {isLoading ? <ExpensesByCategorySkeleton /> : <ExpensesByCategory />} */}
          <ExpensesByCategory />
        </Panel>

        <Panel fallback={<MonthlyExpenseTrendSkeleton />}>
          {/* {isLast6monthLoading ? (
            <MonthlyExpenseTrendSkeleton />
          ) : (
            <MonthlyExpenseTrend />
          )} */}
          <MonthlyExpenseTrend />
        </Panel>

        {/* ── Charts & visual analytics ── */}
        {/* {isLoading ? (
          <ExpenseAnalyticsSkeleton />
        ) : (
          <> */}
        <Panel fallback={<BudgetVsActualSkeleton />}>
          <BudgetVsActual />
        </Panel>

        <Panel fallback={<ExpenseBudgetGaugesSkeleton />}>
          <ExpenseBudgetGauges />
        </Panel>

        <Panel fallback={<ExpenseCardSkeleton />}>
          <CostHealth />
        </Panel>

        <Panel fallback={<ExpenseCardSkeleton />}>
          <WhereMoneyGoes />
        </Panel>

        <Panel fallback={<ExpenseCardSkeleton />}>
          <HiddenCostLeaks />
        </Panel>
        {/* </>
        )} */}
      </div>
    </div>
  );
}

export default function Page() {
  return (
    <ExpenseTrackerProvider>
      <ExpenseAnalyticsPage />
    </ExpenseTrackerProvider>
  );
}
