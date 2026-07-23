"use client";

import { Loader2 } from "lucide-react";

import { ExpenseTrackerProvider, useTracker } from "@/providers/ExpenseContext";
import ExpenseBudgetGauges from "@/components/expenses/ExpenseBudgetGauges";
import BudgetVsActual from "@/components/expenses/BudgetVsActual";
import MonthlyExpenseTrend from "@/components/expenses/MonthlyExpenseTrend";
import CashFlowTrend from "@/components/expenses/CashFlowTrend";
import WhereMoneyGoes from "@/components/expenses/WhereMoneyGoes";
import CostHealth from "@/components/expenses/CostHealth";
import HiddenCostLeaks from "@/components/expenses/HiddenCostLeaks";

function ExpenseAnalyticsPage() {
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
        </div>

        {/* ── Charts & visual analytics ── */}
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
      <ExpenseAnalyticsPage />
    </ExpenseTrackerProvider>
  );
}
