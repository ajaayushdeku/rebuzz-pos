"use client";

import { useState } from "react";
import {
  CalendarRange,
  Check,
  Loader2,
  SlidersHorizontal,
  ChevronDown,
} from "lucide-react";

import { FilterSelect } from "@/components/ui/FilterSelect";
import { usePeriodList } from "@/hooks/usePeriodInsights";
import type { PeriodKind } from "@/services/apiPeriodInsights.client";

export default function PeriodSelector({
  kind,
  periodId,
  onChange,
  showControls,
  onToggleControls,
}: {
  kind: PeriodKind;
  periodId: string | null;
  onChange: (next: { kind: PeriodKind; periodId: string }) => void;
  showControls: boolean;
  onToggleControls: () => void;
}) {
  const [isCollapsed, setIsCollapsed] = useState(false);

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

  const kinds = data?.kinds ?? [
    { kind: "month" as PeriodKind, label: "Monthly" },
  ];

  const allGenerated =
    !!current && total > 0 && current.generatedSections >= total;

  const toggleCollapsed = () => {
    if (!isCollapsed && showControls) {
      onToggleControls();
    }

    setIsCollapsed((previous) => !previous);
  };

  return (
    <div
      // className="
      //   sticky top-4 z-10
      //   -mx-2 sm:-mx-0
      //   rounded-xl border border-slate-200/80
      //   bg-white/95 px-2.5 py-2
      //   shadow-sm shadow-slate-900/[0.04]
      //   backdrop-blur-xl
      //   transition-shadow duration-200
      //   dark:border-white/10 dark:bg-[#161d2e]/95
      //   dark:shadow-black/20
      // "
      className="
        sticky top-3 z-10 -mx-2 sm:-mx-0 px-2.5 py-2 duration-200 bg-white/95  dark:bg-[#161d2e]/95
      "
    >
      {/* Compact header */}
      <div className="flex min-w-0 items-center justify-between gap-2">
        <button
          type="button"
          onClick={toggleCollapsed}
          aria-expanded={!isCollapsed}
          aria-label={
            isCollapsed
              ? "Expand analytics period selector"
              : "Collapse analytics period selector"
          }
          className="
            group flex min-w-0 flex-1 items-center gap-1.5
            rounded-lg text-left
            outline-none
            focus-visible:ring-2 focus-visible:ring-blue-400
          "
        >
          {/* <div
            className="
              flex h-8 w-8 shrink-0 items-center justify-center
            "
          >
            <CalendarRange
              className="h-4 w-4 text-blue-500 dark:text-blue-300"
              strokeWidth={2.1}
              aria-hidden
            />
          </div> */}

          <div className="min-w-0 flex-1 ml-1">
            <div className="flex min-w-0 items-center gap-2">
              <p className="truncate text-[13px] tracking-[0.04em] text-slate-800 dark:text-slate-100">
                Analytics period
              </p>

              <span className="h-1 w-1 shrink-0 rounded-full bg-blue-400" />
              <span className="shrink-0 text-[9px] font-semibold uppercase tracking-[0.2em] text-blue-600/80 dark:text-blue-300/80">
                History
              </span>
            </div>

            <p className="mt-0.5 truncate text-[10px] leading-none text-slate-500 dark:text-slate-400 tracking-[0.04em]">
              {isCollapsed
                ? (current?.label ??
                  (isLoading ? "Loading periods..." : "No period selected"))
                : "Choose your reporting period"}
            </p>
          </div>

          <ChevronDown
            size={16}
            className={`
              mr-1 shrink-0 text-slate-400
              transition-transform duration-300
              group-hover:text-[#244074]
              dark:group-hover:text-blue-300
              ${isCollapsed ? "" : "rotate-180"}
            `}
            aria-hidden
          />
        </button>

        {/* Secondary insights settings action */}
        {!isCollapsed && (
          <button
            type="button"
            onClick={onToggleControls}
            aria-expanded={showControls}
            aria-label={
              showControls ? "Hide insights settings" : "Show insights settings"
            }
            title={
              showControls ? "Hide insights settings" : "Insights settings"
            }
            className={`
              flex h-8 w-8 shrink-0 items-center justify-center
              rounded-lg border transition-all duration-200
              focus-visible:outline-none focus-visible:ring-2
              focus-visible:ring-blue-400
              ${
                showControls
                  ? "border-blue-200 bg-blue-50 text-[#244074] dark:border-blue-400/20 dark:bg-blue-400/10 dark:text-blue-300"
                  : "border-slate-200/80 bg-slate-50 text-slate-500 hover:border-slate-300 hover:bg-slate-100 hover:text-[#244074] dark:border-white/10 dark:bg-white/[0.03] dark:text-slate-400 dark:hover:bg-white/[0.07] dark:hover:text-blue-300"
              }
            `}
          >
            <SlidersHorizontal
              size={14}
              className={`transition-transform duration-200 ${
                showControls ? "rotate-90" : ""
              }`}
              aria-hidden
            />
          </button>
        )}
      </div>

      {/* Animated selector content */}
      <div
        className={`
          grid transition-[grid-template-rows,opacity,margin]
          duration-300 ease-in-out
          motion-reduce:transition-none
          ${
            isCollapsed
              ? "mt-0 grid-rows-[0fr] overflow-hidden opacity-0"
              : "relative z-30 mt-2 grid-rows-[1fr] overflow-visible opacity-100"
          }
        `}
        aria-hidden={isCollapsed}
        inert={isCollapsed}
      >
        <div className="min-h-0">
          {/* Period type and selected period */}
          <div className="relative z-30 grid min-w-0 grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] items-center gap-2">
            {/* Period types */}
            <div
              className="
                flex min-w-0 items-center overflow-x-auto
                rounded-lg border border-slate-200/80
                bg-slate-100/80 p-0.5
                [scrollbar-width:none] [&::-webkit-scrollbar]:hidden
                dark:border-[#293750] dark:bg-[#111b2d]
              "
            >
              {kinds.map((option) => {
                const active = option.kind === kind;

                return (
                  <button
                    key={option.kind}
                    type="button"
                    aria-pressed={active}
                    onClick={() =>
                      !active &&
                      onChange({
                        kind: option.kind,
                        periodId: "latest",
                      })
                    }
                    className={`
                      min-w-0 flex-1 shrink-0 cursor-pointer
                      whitespace-nowrap rounded-md px-2 py-2
                      text-[10px] font-semibold
                      transition-all duration-200
                      motion-reduce:transition-none
                      sm:px-2.5 sm:text-[11px]
                      ${
                        active
                          ? "bg-white text-[#244074] shadow-sm ring-1 ring-slate-200/70 dark:bg-[#263750] dark:text-[#e6efff] dark:ring-[#3a4d6b]"
                          : "text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-100"
                      }
                    `}
                  >
                    {option.label.replace("ly", "")}
                  </button>
                );
              })}
            </div>

            {/* Period dropdown */}
            <div className="relative z-40 min-w-0">
              <FilterSelect
                value={current?.id ?? ""}
                options={options}
                onChange={(id) => onChange({ kind, periodId: id })}
                placeholder={isLoading ? "Loading…" : "No periods"}
                disabled={isLoading || options.length === 0}
                preserveCase
                ariaLabel="Period"
                periodSelectorSpread="justify-between"
                menuClassName="w-max min-w-full sm:w-[280px] sm:min-w-full"
              />
            </div>
          </div>

          {/* Date range and generation status */}
          <div
            className="
              relative z-0 mt-2 flex min-w-0 items-center
              justify-between gap-2
              border-t border-slate-100 pt-2
              dark:border-white/[0.07]
            "
          >
            <div className="flex min-w-0 items-center gap-1.5 text-[10px] text-slate-500 dark:text-slate-400">
              {isLoading ? (
                <Loader2
                  className="h-3 w-3 shrink-0 animate-spin"
                  aria-hidden
                />
              ) : (
                <CalendarRange
                  className="h-3 w-3 shrink-0 text-slate-400 dark:text-slate-500"
                  aria-hidden
                />
              )}

              <span className="truncate">
                {isError
                  ? "Periods could not be loaded"
                  : current
                    ? `${current.from} – ${current.to}`
                    : "No period selected"}
              </span>
            </div>

            {allGenerated && (
              <span
                className="
                  inline-flex shrink-0 items-center gap-1
                  rounded-full bg-emerald-50 px-2 py-1
                  text-[9px] font-semibold text-emerald-700
                  dark:bg-emerald-400/10 dark:text-emerald-300
                "
              >
                <Check className="h-2.5 w-2.5" aria-hidden />
                Complete
              </span>
            )}

            {!allGenerated &&
              current &&
              current.generatedSections > 0 &&
              total > 0 && (
                <span className="shrink-0 text-[9px] font-medium tabular-nums text-slate-400 dark:text-slate-500">
                  {current.generatedSections}/{total} generated
                </span>
              )}
          </div>
        </div>
      </div>
    </div>
  );
}
