"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Calendar as CalendarIcon,
  CalendarDays,
  CalendarRange,
  Check,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { FilterSelect } from "@/components/ui/FilterSelect";
import { cn } from "@/lib/utils";
import { formatDateRangeLabel } from "@/utils/helper";

type DateMode = "single" | "range";

const PRESET_RANGES = [
  { value: "24h", label: "Today" },
  { value: "week", label: "Last 7 Days" },
  { value: "month", label: "Last 30 Days" },
  { value: "threemonth", label: "Last 3 Months" },
  { value: "sixmonth", label: "Last 6 Months" },
  { value: "year", label: "Last Year" },
];

const STORAGE_KEY = "rebuzz-calendar-date-filter";

function toDateStr(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function parseDateStr(str: string): Date | undefined {
  const d = new Date(str);
  if (isNaN(d.getTime())) return undefined;
  return d;
}

function getPresetRange(range: string): {
  startDate: string;
  endDate: string;
  comparisonStartDate?: string;
  comparisonEndDate?: string;
} {
  const today = new Date();
  const end = toDateStr(today);
  let start: Date;

  switch (range) {
    case "24h":
      start = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      break;
    case "week": {
      // ── Previous calendar-based implementation retained for future use. ──
      // Calendar week: Sunday to Saturday
      // const calendarWeekStart = new Date(today);
      // calendarWeekStart.setDate(today.getDate() - today.getDay());
      // start = calendarWeekStart;
      // ── New rolling 7-day period ──
      start = new Date(today);
      start.setDate(today.getDate() - 6);
      break;
    }
    case "month": {
      // ── Previous calendar-based implementation retained for future use. ──
      // Calendar month: 1st of current month
      // start = new Date(today.getFullYear(), today.getMonth(), 1);
      // ── New rolling 30-day period ──
      start = new Date(today);
      start.setDate(today.getDate() - 29);
      break;
    }
    case "threemonth": {
      // ── Previous calendar-based implementation retained for future use. ──
      // Calendar last 3 months: 3 months from current day
      // start = new Date(today.getFullYear(), today.getMonth(), 3);
      // ── New rolling 90-day period ──
      start = new Date(today);
      start.setDate(today.getDate() - 89);
      break;
    }
    case "sixmonth": {
      // ── Previous calendar-based implementation retained for future use. ──
      // Calendar last 6 months: 6 months from current day
      // start = new Date(today.getFullYear(), today.getMonth(), 6);
      // ── New rolling 180-day period ──
      start = new Date(today);
      start.setDate(today.getDate() - 179);
      break;
    }
    case "year": {
      // ── Previous calendar-based implementation retained for future use. ──
      // Calendar year: Jan 1 of current year
      // start = new Date(today.getFullYear(), 0, 1);
      // ── New rolling 365-day period ──
      start = new Date(today);
      start.setDate(today.getDate() - 364);
      break;
    }
    default:
      start = new Date(today.getFullYear(), today.getMonth(), 1);
  }

  const result: {
    startDate: string;
    endDate: string;
    comparisonStartDate?: string;
    comparisonEndDate?: string;
  } = {
    startDate: toDateStr(start),
    endDate: end,
  };

  // Add comparison period (same duration, immediately preceding)
  const diffMs = today.getTime() - start.getTime();
  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

  // For "24h" (Today), comparison should be exactly 1 day (yesterday)
  // For other ranges, use the calculated diffDays
  const comparisonDays = range === "24h" ? 1 : diffDays;

  const comparisonEnd = new Date(start);
  comparisonEnd.setDate(comparisonEnd.getDate() - 1);
  const comparisonStart = new Date(comparisonEnd);
  comparisonStart.setDate(comparisonStart.getDate() - comparisonDays + 1);

  result.comparisonStartDate = toDateStr(comparisonStart);
  result.comparisonEndDate = toDateStr(comparisonEnd);

  return result;
}

export function CalendarDateFilter({
  showPresets = true,
}: {
  showPresets?: boolean;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Read current values from URL
  const currentStartDate = searchParams.get("startDate") ?? "";
  const currentEndDate = searchParams.get("endDate") ?? "";
  const currentPreset = searchParams.get("range") ?? "";

  // Determine mode
  const hasCustom = !!currentStartDate || !!currentEndDate;
  const [mode, setMode] = React.useState<DateMode>(
    hasCustom ? "range" : "range",
  );
  const [preset, setPreset] = React.useState(currentPreset || "month");

  // Dialog open state
  const [open, setOpen] = React.useState(false);

  // Temporary local state for date selection
  const [tempStartDate, setTempStartDate] = React.useState<Date | undefined>(
    hasCustom ? new Date(currentStartDate) : undefined,
  );
  const [tempEndDate, setTempEndDate] = React.useState<Date | undefined>(
    hasCustom ? new Date(currentEndDate) : undefined,
  );

  // Text input values (YYYY-MM-DD format)
  const [startInput, setStartInput] = React.useState(
    hasCustom ? currentStartDate : "",
  );
  const [endInput, setEndInput] = React.useState(
    hasCustom ? currentEndDate : "",
  );

  // ── Restore saved filter from localStorage on mount (if no URL params) ──
  React.useEffect(() => {
    if (!currentStartDate && !currentEndDate && !currentPreset) {
      try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
          const parsed = JSON.parse(saved) as {
            startDate?: string;
            endDate?: string;
            range?: string;
            comparisonStartDate?: string;
            comparisonEndDate?: string;
          };
          if (parsed.range) {
            const sp = new URLSearchParams(searchParams.toString());
            sp.set("range", parsed.range);
            if (parsed.comparisonStartDate && parsed.comparisonEndDate) {
              sp.set("comparisonStartDate", parsed.comparisonStartDate);
              sp.set("comparisonEndDate", parsed.comparisonEndDate);
            }
            router.replace(`?${sp.toString()}`);
          } else if (parsed.startDate && parsed.endDate) {
            const sp = new URLSearchParams(searchParams.toString());
            sp.set("startDate", parsed.startDate);
            sp.set("endDate", parsed.endDate);
            router.replace(`?${sp.toString()}`);
          }
        }
      } catch {
        // Ignore malformed storage data
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Reset temp state when dialog opens
  const handleOpenChange = (isOpen: boolean) => {
    if (isOpen) {
      if (currentStartDate && currentEndDate) {
        setTempStartDate(new Date(currentStartDate));
        setTempEndDate(new Date(currentEndDate));
        setStartInput(currentStartDate);
        setEndInput(currentEndDate);
      } else {
        setTempStartDate(undefined);
        setTempEndDate(undefined);
        setStartInput("");
        setEndInput("");
      }
    }
    setOpen(isOpen);
  };

  const applyFilters = (params: {
    startDate?: string;
    endDate?: string;
    range?: string;
    comparisonStartDate?: string;
    comparisonEndDate?: string;
  }) => {
    const sp = new URLSearchParams(searchParams.toString());
    sp.delete("startDate");
    sp.delete("endDate");
    sp.delete("range");
    sp.delete("comparisonStartDate");
    sp.delete("comparisonEndDate");

    if (params.range) {
      sp.set("range", params.range);
    } else if (params.startDate && params.endDate) {
      sp.set("startDate", params.startDate);
      sp.set("endDate", params.endDate);
    }

    if (params.comparisonStartDate && params.comparisonEndDate) {
      sp.set("comparisonStartDate", params.comparisonStartDate);
      sp.set("comparisonEndDate", params.comparisonEndDate);
    }

    // ── Persist to localStorage so it survives page refresh ──
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(params));
    } catch {
      // Ignore storage errors
    }

    router.push(`?${sp.toString()}`);
    setOpen(false);
  };

  const handlePresetChange = (value: string) => {
    setPreset(value);
    const { startDate, endDate, comparisonStartDate, comparisonEndDate } =
      getPresetRange(value);
    setTempStartDate(new Date(startDate));
    setTempEndDate(new Date(endDate));
    setStartInput(startDate);
    setEndInput(endDate);
    applyFilters({ range: value, comparisonStartDate, comparisonEndDate });
  };

  // Handle text input changes
  const handleStartInputChange = (value: string) => {
    setStartInput(value);
    const parsed = parseDateStr(value);
    if (parsed) {
      setTempStartDate(parsed);
      if (mode === "single") {
        setTempEndDate(parsed);
        setEndInput(value);
      }
    }
  };

  const handleEndInputChange = (value: string) => {
    setEndInput(value);
    const parsed = parseDateStr(value);
    if (parsed) {
      setTempEndDate(parsed);
    }
  };

  // Handle blur for start input — if end is empty, set it to match in single mode
  const handleStartBlur = () => {
    if (mode === "single" && startInput) {
      setEndInput(startInput);
      setTempEndDate(parseDateStr(startInput));
    }
  };

  const handleSingleDateSelect = (date: Date | undefined) => {
    if (!date) return;
    setTempStartDate(date);
    setTempEndDate(date);
    setStartInput(toDateStr(date));
    setEndInput(toDateStr(date));
  };

  const handleRangeSelect = (range: { from?: Date; to?: Date } | undefined) => {
    if (range?.from) {
      setTempStartDate(range.from);
      setStartInput(toDateStr(range.from));
    }
    if (range?.to) {
      setTempEndDate(range.to);
      setEndInput(toDateStr(range.to));
    }
    if (range?.from && !range?.to) {
      setTempEndDate(undefined);
      setEndInput("");
    }
  };

  const handleApply = () => {
    if (mode === "single") {
      const d = parseDateStr(startInput) || tempStartDate;
      if (d) {
        const dateStr = toDateStr(d);
        setTempStartDate(d);
        setTempEndDate(d);
        setStartInput(dateStr);
        setEndInput(dateStr);
        applyFilters({ startDate: dateStr, endDate: dateStr });
      }
    } else {
      const start = parseDateStr(startInput) || tempStartDate;
      const end = parseDateStr(endInput) || tempEndDate;
      if (start && end) {
        const [s, e] = start <= end ? [start, end] : [end, start];
        setTempStartDate(s);
        setTempEndDate(e);
        setStartInput(toDateStr(s));
        setEndInput(toDateStr(e));
        applyFilters({ startDate: toDateStr(s), endDate: toDateStr(e) });
      }
    }
  };

  const canApply =
    mode === "single"
      ? !!parseDateStr(startInput) || !!tempStartDate
      : !!parseDateStr(startInput) && !!parseDateStr(endInput);

  // Determine display text from URL params
  const displayText = (() => {
    if (currentStartDate && currentEndDate) {
      if (currentStartDate === currentEndDate) {
        return formatDateRangeLabel(currentStartDate, currentStartDate);
      }
      // Was dropping the start year unconditionally, so a range crossing into
      // a new year read as though both ends sat in the later one.
      return formatDateRangeLabel(currentStartDate, currentEndDate);
    }
    if (currentPreset) {
      return (
        PRESET_RANGES.find((r) => r.value === currentPreset)?.label ??
        "This Month"
      );
    }
    return "Select date";
  })();

  return (
    <div className="flex min-w-0 items-center gap-2">
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              "h-9 min-w-0 max-w-full justify-start gap-1.5 px-2.5 text-left text-[13px] font-normal sm:w-[210px] sm:px-3",
              "dark:border-white/15 dark:bg-white/5 dark:text-[#c3ccdc] dark:hover:bg-white/10 dark:hover:text-[#e8ecf4]",
              !currentStartDate &&
                !currentPreset &&
                "text-muted-foreground dark:text-[#7b869b]",
            )}
          >
            <CalendarIcon className="h-4 w-4 shrink-0 dark:text-[#9aa6bd]" />

            <span className="min-w-0 truncate hidden sm:block sm:ml-1">
              {displayText}
            </span>
          </Button>
        </DialogTrigger>

        <DialogContent
          showCloseButton={false}
          className={cn(
            "w-[calc(100vw-1rem)] max-w-[calc(100vw-1rem)]",
            "max-h-[calc(80dvh-1rem)] overflow-y-auto",
            "gap-0 rounded-2xl bg-white  p-0 shadow-xl",
            "dark:bg-[#161d2e]",
            "sm:w-[720px] sm:max-w-[720px]",
            "sm:max-h-[calc(100dvh-2rem)]",
          )}
        >
          {/* Main content */}

          <div
            className={cn(
              "grid gap-4 p-3.5",
              "sm:grid-cols-[minmax(0,1fr)_280px] sm:gap-5 sm:p-5",
            )}
          >
            {/* Calendar — `p-0` drops the component's own p-3, which was adding
                24px of height inside an already tall modal. */}
            <div className="min-w-0">
              {mode === "single" ? (
                <Calendar
                  mode="single"
                  selected={tempStartDate}
                  onSelect={handleSingleDateSelect}
                  defaultMonth={tempStartDate}
                  className={cn(
                    "mx-auto p-0",
                    "[--cell-size:--spacing(11)]",
                    "[&_[data-day]]:text-[12px]",
                    "[&_th]:text-[11px]",
                    "sm:[--cell-size:--spacing(13)]",
                    "sm:[&_[data-day]]:text-[13px]",
                    "sm:[&_th]:text-[11px]",
                  )}
                  disabled={(date) => date > new Date()}
                />
              ) : (
                <Calendar
                  mode="range"
                  selected={{ from: tempStartDate, to: tempEndDate }}
                  onSelect={handleRangeSelect}
                  defaultMonth={tempStartDate}
                  numberOfMonths={1}
                  className={cn(
                    "mx-auto p-0",
                    "[--cell-size:--spacing(11)]",
                    "[&_[data-day]]:text-[12px]",
                    "[&_th]:text-[11px]",
                    "sm:[--cell-size:--spacing(13)]",
                    "sm:[&_[data-day]]:text-[13px]",
                    "sm:[&_th]:text-[11px]",
                  )}
                  disabled={(date) => date > new Date()}
                />
              )}
            </div>

            {/* Controls */}
            <div
              className={cn(
                "flex min-w-0 flex-col gap-3",
                "border-t border-gray-100 pt-3",
                "dark:border-white/10",
                "sm:border-l sm:border-t-0 sm:pl-5 sm:pt-0",
              )}
            >
              {/* Mode toggle — the app's pill tab treatment, matching the
                  Recent Transactions / settings tab bars. */}
              <div
                role="tablist"
                aria-label="Date selection mode"
                className="flex items-center gap-1 rounded-full bg-[#e4f2fe] p-1 dark:bg-white/10"
              >
                <button
                  type="button"
                  role="tab"
                  aria-selected={mode === "single"}
                  onClick={() => {
                    setMode("single");
                    const d = tempStartDate || parseDateStr(startInput);
                    if (d) {
                      setTempEndDate(d);
                      setEndInput(toDateStr(d));
                    }
                  }}
                  className={cn(
                    "flex  flex-1 items-center justify-center gap-1.5 rounded-full px-3 py-2 text-[13px] transition-colors",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500",
                    mode === "single"
                      ? "bg-white font-bold text-blue-950 shadow-sm dark:bg-[#161d2e] dark:text-[#e8ecf4]"
                      : "font-semibold text-blue-800 hover:text-blue-950 dark:text-[#a8c4ee] dark:hover:text-white",
                  )}
                >
                  <CalendarDays size={14} className="shrink-0" />
                  Single
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={mode === "range"}
                  onClick={() => setMode("range")}
                  className={cn(
                    "flex flex-1 items-center justify-center gap-1.5 rounded-full px-3 py-2 text-[13px] transition-colors",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500",
                    mode === "range"
                      ? "bg-white font-bold text-blue-950 shadow-sm dark:bg-[#161d2e] dark:text-[#e8ecf4]"
                      : "font-semibold text-blue-800 hover:text-blue-950 dark:text-[#a8c4ee] dark:hover:text-white",
                  )}
                >
                  <CalendarRange size={14} className="shrink-0" />
                  Range
                </button>
              </div>

              {/* Preset dropdown */}
              {showPresets && (
                <FilterSelect
                  value={currentPreset || "month"}
                  options={PRESET_RANGES}
                  onChange={handlePresetChange}
                  placeholder="Quick select"
                  className="w-full"
                  menuClassName="min-w-full"
                />
              )}

              {/* Date input fields — stacked, since the column is narrow. */}
              <div
                className={cn(
                  "grid gap-2.5",
                  mode === "range" ? "grid-cols-1" : "grid-cols-1",
                  "sm:grid-cols-1",
                )}
              >
                {/* Start */}
                <div className="min-w-0">
                  <label className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.06em] text-slate-400 dark:text-[#7b869b]">
                    {mode === "single" ? "Date" : "Start date"}
                  </label>

                  <input
                    type="date"
                    value={startInput}
                    onChange={(e) => handleStartInputChange(e.target.value)}
                    onBlur={handleStartBlur}
                    className={cn(
                      "h-9 w-full min-w-0 rounded-lg border border-gray-200 bg-white px-2.5 text-xs tracking-wide",
                      "focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500",
                      "dark:border-white/15 dark:bg-white/5 dark:text-[#e8ecf4]",
                      "[&::-webkit-calendar-picker-indicator]:cursor-pointer",
                      "[&::-webkit-calendar-picker-indicator]:opacity-60",
                      "hover:[&::-webkit-calendar-picker-indicator]:opacity-100",
                      "dark:[&::-webkit-calendar-picker-indicator]:invert",
                    )}
                  />
                </div>

                {/* End */}
                {mode === "range" && (
                  <div className="min-w-0">
                    <label className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.06em] text-slate-400 dark:text-[#7b869b]">
                      End date
                    </label>

                    <input
                      type="date"
                      value={endInput}
                      onChange={(e) => handleEndInputChange(e.target.value)}
                      className={cn(
                        "h-9 w-full min-w-0 rounded-lg border border-gray-200 bg-white px-2.5 text-xs tracking-wide",
                        "focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500",
                        "dark:border-white/15 dark:bg-white/5 dark:text-[#e8ecf4]",
                        "[&::-webkit-calendar-picker-indicator]:cursor-pointer",
                        "[&::-webkit-calendar-picker-indicator]:opacity-60",
                        "hover:[&::-webkit-calendar-picker-indicator]:opacity-100",
                        "dark:[&::-webkit-calendar-picker-indicator]:invert",
                        "dark:[&::-webkit-calendar-picker-indicator]:text-white",
                      )}
                    />
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Apply / Cancel buttons — same pair the confirm dialogs use. */}
          <div
            className={cn(
              "flex items-center gap-2 border-t border-gray-100 bg-gray-50 px-3 py-3",
              "dark:border-white/10 dark:bg-white/5",
              "sm:gap-2.5 sm:px-5 sm:py-4",
            )}
          >
            <button
              type="button"
              onClick={() => setOpen(false)}
              className={cn(
                "h-10 flex-1 rounded-xl border border-gray-200 bg-white px-3 text-[12px] font-semibold text-gray-700",
                "transition hover:border-gray-300 hover:bg-gray-50",
                "focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-400",
                "dark:border-white/15 dark:bg-[#161d2e] dark:text-[#c3ccdc]",
                "dark:hover:border-white/25 dark:hover:bg-white/10",
              )}
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={handleApply}
              disabled={!canApply}
              className={cn(
                "flex h-10 flex-1 items-center justify-center gap-2 rounded-xl bg-blue-600 px-3 text-[12px] font-bold text-white shadow-sm",
                "transition hover:bg-blue-700",
                "focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2",
                "disabled:cursor-not-allowed disabled:opacity-50",
              )}
            >
              <Check className="h-4 w-4" />
              Apply
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
