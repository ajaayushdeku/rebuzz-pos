"use client";

import { useEffect, useState, useCallback } from "react";
import toast from "react-hot-toast";
import { LogOut, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

import ShiftOpenForm from "@/components/expenses/shift/ShiftOpenForm";
import ShiftStatsPanel from "@/components/expenses/shift/ShiftStats";
import ExpenseForm from "@/components/expenses/shift/ExpenseForm";
import CurrentShiftTransactions from "@/components/expenses/shift/CurrentShiftTransactions";
import ShiftCloseModal from "@/components/expenses/shift/ShiftCloseModal";

import {
  fetchCurrentShift,
  openShift,
  closeShift,
  fetchShiftTransactions,
} from "@/services/apiShift.client";

import type { ShiftStats } from "@/lib/types/shift";
import type { Transaction } from "@/lib/types/shift";
import BillTable from "@/components/expenses/shift/BillTable";

export default function ExpensesPage() {
  const [shift, setShift] = useState<ShiftStats | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [pageLoading, setPageLoading] = useState(true);
  const [openingShift, setOpeningShift] = useState(false);
  const [showCloseModal, setShowCloseModal] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // ── Fetch helpers ────────────────────────────────────────────────────────

  const loadShift = useCallback(async () => {
    const data = await fetchCurrentShift();
    setShift(data);
  }, []);

  const loadTransactions = useCallback(async () => {
    const data = await fetchShiftTransactions();
    setTransactions(data);
  }, []);

  const refreshAll = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([loadShift(), loadTransactions()]);
    setRefreshing(false);
  }, [loadShift, loadTransactions]);

  // ── Initial load ─────────────────────────────────────────────────────────

  useEffect(() => {
    const init = async () => {
      setPageLoading(true);
      await loadShift();
      setPageLoading(false);
    };
    init();
  }, []);

  // Load transactions when shift becomes active
  useEffect(() => {
    if (!shift?.shiftId) return;

    const fetchTransactions = async () => {
      await loadTransactions();
    };

    fetchTransactions();
  }, [shift?.shiftId, loadTransactions]);

  // ── Handlers ─────────────────────────────────────────────────────────────

  const handleOpenShift = async (openingCash: number) => {
    setOpeningShift(true);
    try {
      const data = await openShift(openingCash);
      await loadShift();
      toast.success(`Shift opened — ${data.employeeName}`);
    } catch {
      toast.error("Failed to open shift. Please try again.");
    } finally {
      setOpeningShift(false);
    }
  };

  const handleCloseShift = async (closingCash: number) => {
    await closeShift(closingCash);
    setShift(null);
    setTransactions([]);
    toast.success("Shift closed successfully");
  };

  const handleExpenseCreated = async () => {
    await Promise.all([loadShift(), loadTransactions()]);
    toast.success("Transaction added");
  };

  // ── Loading ───────────────────────────────────────────────────────────────

  if (pageLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex items-center gap-2 text-gray-400 text-sm">
          <RefreshCw size={16} className="animate-spin" />
          Loading...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="md:text-4xl text-3xl font-bold text-gray-900">
            Expenses & Shifts
          </h1>
          <p className="text-sm text-gray-400 mt-0.5">
            Manage shift cash flow and track transactions
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={refreshAll}
            disabled={refreshing}
            className="text-sm border-gray-200 text-gray-600 rounded-lg px-3 py-2"
          >
            <RefreshCw size={14} className={refreshing ? "animate-spin" : ""} />
          </Button>
          {shift && (
            <Button
              onClick={() => setShowCloseModal(true)}
              variant="outline"
              className="flex items-center gap-2 text-sm border-red-200 text-red-600 hover:bg-red-50 rounded-lg px-4 py-2"
            >
              <LogOut size={14} />
              Close Shift
            </Button>
          )}
        </div>
      </div>

      {/* ── No active shift ── */}
      {!shift && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <ShiftOpenForm onOpen={handleOpenShift} isLoading={openingShift} />
        </div>
      )}

      {/* ── Active shift ── */}
      {shift && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-5">
          <ShiftStatsPanel shift={shift} />

          <ExpenseForm
            shiftId={shift.shiftId}
            onCreated={handleExpenseCreated}
          />
        </div>
      )}

      {shift && <CurrentShiftTransactions transactions={transactions} />}

      {/* ── Expense history table ── */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
        <div className="mb-4">
          <h3 className="text-sm font-semibold text-gray-900">
            Expense History
          </h3>
          <p className="text-xs text-gray-400 mt-0.5">
            All transactions across shifts
          </p>
        </div>
        <BillTable />
      </div>

      {/* Close shift modal */}
      {shift && (
        <ShiftCloseModal
          open={showCloseModal}
          onClose={() => setShowCloseModal(false)}
          expectedAmount={shift.expectedAmount}
          onConfirm={handleCloseShift}
        />
      )}
    </div>
  );
}
