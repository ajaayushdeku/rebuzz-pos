"use client";

import LoadingState from "@/components/ui/LoadingState";

import { ExpenseTrackerProvider, useTracker } from "@/providers/ExpenseContext";
import ExpenseTrackerStats from "@/components/expenses/ExpenseTrackerStats";
import ExpenseIncomeForm from "@/components/expenses/ExpenseIncomeForm";
import BudgetForm from "@/components/expenses/BudgetForm";
import PurposeSummaryTables from "@/components/expenses/PurposeSummeryTables";
import RecentTransactions from "@/components/expenses/RecentTransactions";
import ExpenseMonthYearFilter from "@/components/expenses/ExpenseMonthYearFilter";

function ExpenseRecordsPage() {
  const { isLoading } = useTracker();

  return (
    <div className="min-h-screen bg-surface-page px-6 py-8 md:px-10">
      {/* ── Header ── */}
      <div className="flex flex-col justify-between gap-4 pb-5 sm:flex-row sm:items-end">
        <div className="min-w-0">
          <h1 className="truncate text-[22px] font-semibold tracking-[1px] text-[#3c4043] md:text-[26px]">
            Expense & Income
          </h1>
          <p className="mt-1 max-w-xl text-[12px] leading-relaxed text-[#5f6368]">
            Record transactions, budgets and track your business cash flow
          </p>
        </div>
        <div className="flex items-center gap-2">
          <ExpenseMonthYearFilter />
          <BudgetForm />
          <ExpenseIncomeForm />
        </div>
      </div>

      <div
        aria-hidden
        className="mb-6 h-px w-full bg-gradient-to-r from-[#dadce0] via-[#e8eaed] to-transparent"
      />

      <div className="w-full mx-auto space-y-4">
        {/* ── Records ── */}
        {isLoading ? (
          <LoadingState message="Loading your expense data..." />
        ) : (
          <>
            <ExpenseTrackerStats />
            <PurposeSummaryTables />

            {/* Horizontal divider */}
            <div className="border-t border-gray-200 my-6" />

            <RecentTransactions />
          </>
        )}
      </div>
    </div>
  );
}

export default function Page() {
  return (
    <ExpenseTrackerProvider>
      <ExpenseRecordsPage />
    </ExpenseTrackerProvider>
  );
}
