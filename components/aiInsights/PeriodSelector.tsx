"use client";

import { CalendarRange, Check, Loader2 } from "lucide-react";

import { FilterSelect } from "@/components/ui/FilterSelect";
import { usePeriodList } from "@/hooks/usePeriodInsights";
import type { PeriodKind } from "@/services/apiPeriodInsights.client";

/**
 * Which completed period the page is describing.
 *
 * Two controls, because they answer different questions: the kind (monthly,
 * quarterly, yearly) is a choice people make rarely, and the period within it is
 * the one they move through. So the kinds are a visible row and the periods a
 * dropdown — the same dropdown the invoice and dashboard filters use.
 *
 * The list comes from the service, which owns the calendar: ids, labels and date
 * ranges all arrive from it. Nothing here does date arithmetic, so there is no
 * second definition of "September" to drift over the +05:45 boundary.
 *
 * Each period says how much of it has been generated, because that is what
 * decides whether choosing it will cost anything.
 */
export default function PeriodSelector({
  kind,
  periodId,
  onChange,
}: {
  kind: PeriodKind;
  /** The chosen period, or null while the default is still being fetched. */
  periodId: string | null;
  onChange: (next: { kind: PeriodKind; periodId: string }) => void;
}) {
  const { data, isLoading, isError } = usePeriodList(kind);

  const periods = data?.periods ?? [];
  const current = periods.find((p) => p.id === periodId) ?? periods[0];
  const total = data?.totalSections ?? 0;

  const options = periods.map((period) => {
    const isReady = total > 0 && period.generatedSections >= total;
    const ready =
      period.generatedSections === 0
        ? "not generated"
        : isReady
          ? "ready"
          : `${period.generatedSections} of ${total}`;
    return {
      value: period.id,
      label: `${period.label} · ${ready}`,
      suffix: isReady ? (
        <span className="inline-flex shrink-0 items-center gap-0.5 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
          <Check className="h-3 w-3" aria-hidden />
          Ready
        </span>
      ) : period.generatedSections > 0 ? (
        <span className="shrink-0 text-[11px] font-medium text-gray-400 dark:text-[#7b869b]">
          {period.generatedSections}/{total}
        </span>
      ) : undefined,
    };
  });

  return (
    <div className="sticky top-0 z-20 -mx-2 rounded-2xl border border-[#e3e3e3]/90 bg-white/95 p-3 shadow-md shadow-slate-900/[0.04] backdrop-blur-xl sm:-mx-3 sm:p-4 dark:border-white/10 dark:bg-[#161d2e]/95 dark:shadow-black/20">
      <div className="flex flex-wrap items-center justify-between gap-3 sm:gap-4">
        <div className="min-w-0">
          <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-[#7b8494] dark:text-[#9aa6bd]">
            <CalendarRange className="h-3.5 w-3.5 text-[#E26924]" aria-hidden />
            Analytics period
          </p>

          {/* The kinds. A row rather than a dropdown: there are three, they
              never change, and seeing all three explains what the page offers. */}
          <div className="mt-2 inline-flex max-w-full overflow-x-auto rounded-xl border border-[#e3e7ef] bg-[#f4f6fa] p-1 dark:border-white/10 dark:bg-[#0f1420]/70">
            {(
              data?.kinds ?? [{ kind: "month" as PeriodKind, label: "Monthly" }]
            ).map((option) => {
              const active = option.kind === kind;
              return (
                <button
                  key={option.kind}
                  type="button"
                  aria-pressed={active}
                  onClick={() =>
                    // No period id yet for the new kind: `latest` lets the
                    // service pick its most recent completed one.
                    !active &&
                    onChange({ kind: option.kind, periodId: "latest" })
                  }
                  className={`cursor-pointer rounded-md px-3 py-1.5 text-[12px] font-medium transition ${
                    active
                      ? "bg-white text-[#1b2537] shadow-sm ring-1 ring-black/[0.04] dark:bg-[#26334b] dark:text-[#f0f3f8] dark:ring-white/[0.06]"
                      : "text-[#697386] hover:bg-white/70 hover:text-[#27364e] dark:text-[#a9b4c7] dark:hover:bg-white/5 dark:hover:text-[#e8ecf4]"
                  }`}
                >
                  {option.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex min-w-0 w-full flex-col items-stretch gap-1.5 sm:w-[280px]">
          <FilterSelect
            value={current?.id ?? ""}
            options={options}
            onChange={(id) => onChange({ kind, periodId: id })}
            placeholder={isLoading ? "Loading periods…" : "No periods"}
            disabled={isLoading || options.length === 0}
            // Period labels are names and counts, not words to capitalise.
            preserveCase
            ariaLabel="Period"
          />

          {/* The exact dates, because "September 2026" is not the same thing as
              1–30 September to someone checking a figure against a report. */}
          <p className="flex flex-wrap items-center justify-end gap-1.5 pr-1 text-right text-[11px] text-[#858d9b] dark:text-[#9aa6bd]">
            {isLoading && (
              <Loader2 className="h-3 w-3 animate-spin" aria-hidden />
            )}
            {isError
              ? "Periods could not be loaded."
              : current
                ? `${current.from} to ${current.to}`
                : "—"}
            {current && current.generatedSections >= total && total > 0 && (
              <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-300">
                <Check className="h-3 w-3" aria-hidden />
                all generated
              </span>
            )}
          </p>
        </div>
      </div>
    </div>
  );
}
