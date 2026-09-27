"use client";

import LoadingState from "@/components/ui/LoadingState";

import { ExpenseTrackerProvider, useTracker } from "@/providers/ExpenseContext";
import ExpenseTrackerStats from "@/components/expenses/ExpenseTrackerStats";
import ExpenseIncomeForm from "@/components/expenses/ExpenseIncomeForm";
import BudgetForm from "@/components/expenses/BudgetForm";
import PurposeSummaryTables from "@/components/expenses/PurposeSummeryTables";
import RecentTransactions from "@/components/expenses/RecentTransactions";
import ExpenseMonthYearFilter from "@/components/expenses/ExpenseMonthYearFilter";
import PageHeader from "@/components/ui/PageHeader";

function ExpenseRecordsPage() {
  const { isLoading } = useTracker();

  return (
    <div className="min-h-screen bg-surface-page px-6 py-8 md:px-10">
      {/* ── Header ── */}
      <PageHeader
        title="Expense & Income"
        subtitle="Record transactions, budgets and track your business cash flow"
        actions={
          <>
            <ExpenseMonthYearFilter />
            <BudgetForm />
            <ExpenseIncomeForm />
          </>
        }
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
