"use client";

import { ExpenseTrackerProvider } from "@/providers/ExpenseContext";
import ExpenseTrackerStats from "@/components/expenses/ExpenseTrackerStats";
import ExpenseIncomeForm from "@/components/expenses/ExpenseIncomeForm";
import PurposeSummaryTables from "@/components/expenses/PurposeSummeryTables";
import RecentTransactions from "@/components/expenses/RecentTransactions";

function TrackerPage() {
  return (
    <div className="min-h-screen bg-gray-50 px-6 py-8 md:px-10">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">
            Expense & Income
          </h1>
          <p className="text-sm text-gray-400 mt-0.5">
            Track your personal cash flow
          </p>
        </div>

        {/* Stats + Form row */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
          <div className="lg:col-span-3">
            <ExpenseTrackerStats />
          </div>

          <div className="lg:col-span-2">
            <ExpenseIncomeForm />
          </div>
        </div>

        {/* Purpose summary tables */}
        <PurposeSummaryTables />

        {/* Recent transactions */}
        <RecentTransactions />
      </div>
    </div>
  );
}

export default function Page() {
  return (
    <ExpenseTrackerProvider>
      <TrackerPage />
    </ExpenseTrackerProvider>
  );
}
