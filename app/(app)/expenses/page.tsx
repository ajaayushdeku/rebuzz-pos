"use client";

import { ExpenseTrackerProvider, useTracker } from "@/providers/ExpenseContext";
import ExpenseTrackerStats from "@/components/expenses/ExpenseTrackerStats";
import ExpenseIncomeForm from "@/components/expenses/ExpenseIncomeForm";
import BudgetForm from "@/components/expenses/BudgetForm";
import PurposeSummaryTables from "@/components/expenses/PurposeSummeryTables";
import RecentTransactions from "@/components/expenses/RecentTransactions";
import { Loader2 } from "lucide-react";
import ExpenseBudgetGauges from "@/components/expenses/ExpenseBudgetGauges";
import BudgetVsActual from "@/components/expenses/BudgetVsActual";
import MonthlyExpenseTrend from "@/components/expenses/MonthlyExpenseTrend";
import CashFlowTrend from "@/components/expenses/CashFlowTrend";
import WhereMoneyGoes from "@/components/expenses/WhereMoneyGoes";
import CostHealth from "@/components/expenses/CostHealth";
import HiddenCostLeaks from "@/components/expenses/HiddenCostLeaks";

function TrackerPage() {
  const { isLoading } = useTracker();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex items-center gap-2 text-gray-400 text-sm">
          <Loader2 size={16} className="animate-spin" />
          Loading your data...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-50 px-6 py-8 md:px-10">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="font-bold text-xl md:text-2xl truncate">
              Expense & Income
            </h1>
            <p className="text-xs text-gray-400 mt-0.5">
              Track your business cash flow
            </p>
          </div>
          <div className="flex items-center gap-2">
            <BudgetForm />
            <ExpenseIncomeForm />
          </div>
        </div>

        {/* Working Components */}
        <ExpenseTrackerStats />
        <PurposeSummaryTables />
        <RecentTransactions />

        {/* Locked Features */}
        <ExpenseBudgetGauges />

        <BudgetVsActual />

        <MonthlyExpenseTrend />

        <CashFlowTrend />

        <CostHealth />

        <WhereMoneyGoes />

        <HiddenCostLeaks />
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
