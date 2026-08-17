"use client";

import * as React from "react";
import { format } from "date-fns";
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

export type DateRangeValue = {
  startDate: string;
  endDate: string;
};

type DateMode = "single" | "range";

const PRESET_RANGES = [
  { value: "24h", label: "Today" },
  { value: "week", label: "Last 7 Days" },
  { value: "month", label: "Last 30 Days" },
  { value: "threemonth", label: "Last 3 Months" },
  { value: "sixmonth", label: "Last 6 Months" },
  { value: "year", label: "Last Year" },
];

function toDateStr(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function parseDateStr(str: string): Date | undefined {
  const d = new Date(str);
  if (isNaN(d.getTime())) return undefined;
  return d;
}

function findMatchingPreset(startDate: string, endDate: string): string {
  for (const { value } of PRESET_RANGES) {
    const range = getPresetRange(value);
    if (range.startDate === startDate && range.endDate === endDate) {
      return value;
    }
  }
  return "";
}

function getPresetRange(range: string): { startDate: string; endDate: string } {
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
      // Calendar month: 1st of current month
      // start = new Date(today.getFullYear(), today.getMonth(), 1);
      // ── New rolling 30-day period ──
      start = new Date(today);
      start.setDate(today.getDate() - 89);
      break;
    }
    case "sixmonth": {
      // ── Previous calendar-based implementation retained for future use. ──
      // Calendar month: 1st of current month
      // start = new Date(today.getFullYear(), today.getMonth(), 1);
      // ── New rolling 30-day period ──
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

  return { startDate: toDateStr(start), endDate: end };
}

export function DateRangeFilter({
  value,
  onChange,
  showPresets = true,
  storageKey,
}: {
  value: DateRangeValue;
  onChange: (value: DateRangeValue) => void;
  showPresets?: boolean;
  storageKey?: string;
}) {
  const isSingle = value.startDate === value.endDate;
  const [mode, setMode] = React.useState<DateMode>(
    isSingle ? "single" : "range",
  );
  const [preset, setPreset] = React.useState("");

  const [open, setOpen] = React.useState(false);

  const [tempStartDate, setTempStartDate] = React.useState<Date | undefined>(
    value.startDate ? new Date(value.startDate) : undefined,
  );
  const [tempEndDate, setTempEndDate] = React.useState<Date | undefined>(
    value.endDate ? new Date(value.endDate) : undefined,
  );

  const [startInput, setStartInput] = React.useState(value.startDate || "");
  const [endInput, setEndInput] = React.useState(value.endDate || "");

  // ── Persist selected filter to localStorage so it survives page refresh ──
  React.useEffect(() => {
    if (!storageKey) return;
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const parsed = JSON.parse(saved) as DateRangeValue;
        if (parsed.startDate && parsed.endDate) {
          onChange(parsed);
        }
      }
    } catch {
      // Ignore malformed storage data
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storageKey]);

  React.useEffect(() => {
    if (open) {
      setTempStartDate(value.startDate ? new Date(value.startDate) : undefined);
      setTempEndDate(value.endDate ? new Date(value.endDate) : undefined);
      setStartInput(value.startDate || "");
      setEndInput(value.endDate || "");
      // Sync the preset dropdown with the currently applied filter
      if (value.startDate && value.endDate) {
        const matched = findMatchingPreset(value.startDate, value.endDate);
        setPreset(matched);
      }
    }
  }, [open]);

  React.useEffect(() => {
    if (!open) {
      setTempStartDate(value.startDate ? new Date(value.startDate) : undefined);
      setTempEndDate(value.endDate ? new Date(value.endDate) : undefined);
      setStartInput(value.startDate || "");
      setEndInput(value.endDate || "");
    }
  }, [value.startDate, value.endDate]);

  const applyFilters = (params: DateRangeValue) => {
    onChange(params);
    if (storageKey) {
      try {
        localStorage.setItem(storageKey, JSON.stringify(params));
      } catch {
        // Ignore storage errors
      }
    }
    setOpen(false);
  };

  const handlePresetChange = (value: string) => {
    setPreset(value);
    const range = getPresetRange(value);
    setTempStartDate(new Date(range.startDate));
    setTempEndDate(new Date(range.endDate));
    setStartInput(range.startDate);
    setEndInput(range.endDate);
    applyFilters(range);
  };

  const handleStartInputChange = (newValue: string) => {
    setStartInput(newValue);
    const parsed = parseDateStr(newValue);
    if (parsed) {
      setTempStartDate(parsed);
      if (mode === "single") {
        setTempEndDate(parsed);
        setEndInput(newValue);
      }
    }
  };

  const handleEndInputChange = (newValue: string) => {
    setEndInput(newValue);
    const parsed = parseDateStr(newValue);
    if (parsed) {
      setTempEndDate(parsed);
    }
  };

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

  const displayText = (() => {
    if (value.startDate && value.endDate) {
      if (value.startDate === value.endDate) {
        return format(new Date(value.startDate), "MMM d, yyyy");
      }
      return `${format(new Date(value.startDate), "MMM d, yyyy")}  –  ${format(new Date(value.endDate), "MMM d, yyyy")}`;
    }
    const foundPreset = PRESET_RANGES.find((r) => r.value === "month");
    return foundPreset?.label ?? "Select date";
  })();

  return (
    <div className="flex items-center gap-2">
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              "w-[190px] justify-start text-left text-[12px] font-normal h-9",
              !value.startDate && "text-muted-foreground",
            )}
          >
            <CalendarIcon className="mr-1 h-4 w-4" />
            {displayText}
          </Button>
        </DialogTrigger>

        <DialogContent
          showCloseButton={false}
          className="w-[calc(300vw-2rem)] sm:w-[720px] sm:max-w-[720px] p-0 gap-0 rounded-2xl shadow-xl bg-white"
        >
          {/* Two columns from sm up: calendar on the left, controls on the
              right. Stacked, this ran ~600px tall and filled a laptop viewport;
              side by side it is roughly half that, and the extra width is what
              pays for it. */}
          <div className="grid gap-5 p-5 sm:grid-cols-[minmax(0,1fr)_280px]">
            {/* Calendar — `p-0` drops the component's own p-3, which was adding
                24px of height inside an already tall modal. */}
            <div>
              {mode === "single" ? (
                <Calendar
                  mode="single"
                  selected={tempStartDate}
                  onSelect={handleSingleDateSelect}
                  defaultMonth={tempStartDate}
                  className="p-0 mx-auto [--cell-size:--spacing(13)] [&_[data-day]]:text-[15px] [&_th]:text-[13px]"
                  disabled={(date) => date > new Date()}
                />
              ) : (
                <Calendar
                  mode="range"
                  selected={{ from: tempStartDate, to: tempEndDate }}
                  onSelect={handleRangeSelect}
                  defaultMonth={tempStartDate}
                  numberOfMonths={1}
                  className="p-0 mx-auto [--cell-size:--spacing(13)] [&_[data-day]]:text-[15px] [&_th]:text-[13px]"
                  disabled={(date) => date > new Date()}
                />
              )}
            </div>

            <div className="flex flex-col gap-3 sm:border-l sm:border-gray-100 sm:pl-5">
              {/* Mode toggle — the app's pill tab treatment, matching the
                  Recent Transactions / settings tab bars. */}
              <div
                role="tablist"
                aria-label="Date selection mode"
                className="flex items-center gap-1 rounded-full bg-[#e4f2fe] p-1"
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
                    "flex flex-1 items-center justify-center gap-1.5 rounded-full px-3 py-2 text-[13px] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-[#e4f2fe]",
                    mode === "single"
                      ? "bg-white font-bold text-blue-950 shadow-sm"
                      : "font-semibold text-blue-800 hover:text-blue-950",
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
                    "flex flex-1 items-center justify-center gap-1.5 rounded-full px-3 py-2 text-[13px] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-[#e4f2fe]",
                    mode === "range"
                      ? "bg-white font-bold text-blue-950 shadow-sm"
                      : "font-semibold text-blue-800 hover:text-blue-950",
                  )}
                >
                  <CalendarRange size={14} className="shrink-0" />
                  Range
                </button>
              </div>

              {/* Preset dropdown */}
              {showPresets && (
                <FilterSelect
                  value={preset || "month"}
                  options={PRESET_RANGES}
                  onChange={handlePresetChange}
                  placeholder="Quick select"
                  className="w-full"
                />
              )}

              {/* Date input fields — stacked, since the column is narrow. */}
              <div className="flex flex-col gap-2.5">
                <div>
                  <label className="text-[11px] font-medium uppercase tracking-[0.06em] text-slate-400 block mb-1.5">
                    {mode === "single" ? "Date" : "Start Date"}
                  </label>
                  <input
                    type="date"
                    value={startInput}
                    onChange={(e) => handleStartInputChange(e.target.value)}
                    onBlur={handleStartBlur}
                    className="w-full h-9 px-3 text-xs tracking-[0.06em] border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                {mode === "range" && (
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">
                      End Date
                    </label>
                    <input
                      type="date"
                      value={endInput}
                      onChange={(e) => handleEndInputChange(e.target.value)}
                      className="w-full h-9 px-3 text-xs tracking-[0.06em] border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Apply / Cancel buttons — same pair the confirm dialogs use. */}
          <div className="flex items-center gap-2.5 px-5 py-4 border-t border-gray-100 bg-gray-50 rounded-b-2xl">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="flex-1 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-[13px] font-semibold text-gray-700 transition hover:border-gray-300 hover:bg-gray-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-400"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleApply}
              disabled={!canApply}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-[13px] font-bold text-white shadow-md transition hover:bg-blue-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
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
