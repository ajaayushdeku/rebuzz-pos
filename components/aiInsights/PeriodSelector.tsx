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
    const ready =
      period.generatedSections === 0
        ? "not generated"
        : period.generatedSections >= total
          ? "ready"
          : `${period.generatedSections} of ${total}`;
    return { value: period.id, label: `${period.label} · ${ready}` };
  });

  return (
    <div className="rounded-2xl border border-[#e3e3e3] bg-white p-4 dark:border-white/10 dark:bg-[#161d2e]">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="min-w-0">
          <p className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-[0.06em] text-[#9aa0a6] dark:text-[#9aa6bd]">
            <CalendarRange className="h-3.5 w-3.5" aria-hidden />
            Analytics period
          </p>

          {/* The kinds. A row rather than a dropdown: there are three, they
              never change, and seeing all three explains what the page offers. */}
          <div className="mt-2 inline-flex rounded-lg border border-[#dadce0] bg-[#f8f9fa] p-0.5 dark:border-white/15 dark:bg-white/5">
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
                      ? "bg-white text-[#3c4043] shadow-sm dark:bg-white/10 dark:text-[#e8ecf4]"
                      : "text-[#5f6368] hover:text-[#3c4043] dark:text-[#a9b4c7] dark:hover:text-[#e8ecf4]"
                  }`}
                >
                  {option.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex min-w-0 flex-col items-stretch gap-1.5 sm:w-[260px]">
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
          <p className="flex items-center gap-1.5 text-right text-[11px] text-[#9aa0a6] dark:text-[#9aa6bd]">
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
