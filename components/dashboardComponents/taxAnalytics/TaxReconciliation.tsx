"use client";

import { CheckCircle2 } from "lucide-react";
import { mockTaxReconciliationData } from "@/lib/mockData/mock-tax-data";
import LockDimFeactureOverlay from "@/components/LockDimFeactureOverlay";

function fmtRs(v: number) {
  return `Rs ${v.toLocaleString()}`;
}

export default function TaxReconciliation() {
  const d = mockTaxReconciliationData;

  const steps = [
    { label: "Collected", value: fmtRs(d.collected), operator: null },
    { label: "VAT Paid", value: fmtRs(d.vatPaid), operator: "−" },
    { label: "Refunds", value: fmtRs(d.refunds), operator: "−" },
    { label: "Remitted", value: fmtRs(d.remitted), operator: "−" },
  ];

  return (
    <div className="relative bg-white rounded-2xl border border-gray-200 shadow-sm p-5 flex flex-col gap-5">
      <LockDimFeactureOverlay component_name="Tax Reconciliation" />

      {/* Header */}
      <h2 className="text-sm font-bold text-gray-900">Tax Reconciliation</h2>

      {/* Equation row */}
      <div className="overflow-x-auto">
        <div className="flex items-center gap-2 min-w-max">
          {steps.map(({ label, value, operator }, i) => (
            <div key={label} className="flex items-center gap-2">
              {/* Operator */}
              {operator && (
                <span className="text-gray-300 text-base font-light select-none">
                  {operator}
                </span>
              )}

              {/* Metric box */}
              <div className="flex flex-col items-center gap-0.5 px-6 py-3 rounded-xl bg-gray-50 border border-gray-100 min-w-[140px]">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                  {label}
                </p>
                <p className="text-lg font-bold text-gray-900">{value}</p>
              </div>
            </div>
          ))}

          {/* Equals sign */}
          <span className="text-gray-300 text-base font-light select-none px-1">
            =
          </span>

          {/* Still Owed — highlighted */}
          <div className="flex flex-col items-center gap-0.5 px-6 py-3 rounded-xl border-2 border-blue-200 bg-blue-50 min-w-[160px]">
            <p className="text-[10px] font-bold text-blue-500 uppercase tracking-widest">
              Still Owed
            </p>
            <p className="text-xl font-bold text-blue-600">
              {fmtRs(d.stillOwed)}.00
            </p>
          </div>
        </div>
      </div>

      {/* Reconciliation status banner */}
      <div
        className={`flex items-start gap-3 rounded-xl px-4 py-3 border ${
          d.isReconciled
            ? "bg-green-50 border-green-200"
            : "bg-red-50 border-red-200"
        }`}
      >
        <CheckCircle2
          size={18}
          className={
            d.isReconciled
              ? "text-green-500 shrink-0 mt-0.5"
              : "text-red-500 shrink-0 mt-0.5"
          }
        />
        <div>
          <p
            className={`text-sm font-bold ${d.isReconciled ? "text-green-700" : "text-red-700"}`}
          >
            {d.isReconciled ? "Accounts Reconciled" : "Reconciliation Mismatch"}
          </p>
          <p
            className={`text-[11px] mt-0.5 ${d.isReconciled ? "text-green-600" : "text-red-600"}`}
          >
            {d.reconciliationMessage}
          </p>
        </div>
      </div>
    </div>
  );
}
