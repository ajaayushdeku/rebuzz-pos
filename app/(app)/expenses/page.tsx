"use client";

import { ExpenseTrackerProvider } from "@/providers/ExpenseContext";
import ExpenseTrackerStats from "@/components/expenses/ExpenseTrackerStats";
import ExpenseIncomeForm from "@/components/expenses/ExpenseIncomeForm";
import PurposeSummaryTables from "@/components/expenses/PurposeSummeryTables";
import RecentTransactions from "@/components/expenses/RecentTransactions";

function TrackerPage() {
  return (
    <div className="min-h-screen bg-50 px-6 py-8 md:px-10">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* ── Header ─────────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="font-bold text-xl md:text-2xl truncate">
              Expense & Income
            </h1>
            <p className="text-sm text-gray-500 mt-0.5">
              Track your business cash flow
            </p>
          </div>
          <ExpenseIncomeForm />
        </div>

        {/* Stats + Donut chart */}
        <ExpenseTrackerStats />

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
