"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { format } from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

type DateMode = "single" | "range";

const PRESET_RANGES = [
  { value: "24h", label: "Today" },
  { value: "week", label: "Last 7 Days" },
  { value: "month", label: "Last 30 Days" },
  { value: "year", label: "Last Year" },
];

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
    case "month":
      // ── Previous calendar-based implementation retained for future use. ──
      // Calendar month: 1st of current month
      // start = new Date(today.getFullYear(), today.getMonth(), 1);
      // ── New rolling 30-day period ──
      start = new Date(today);
      start.setDate(today.getDate() - 29);
      break;
    case "year":
      // ── Previous calendar-based implementation retained for future use. ──
      // Calendar year: Jan 1 of current year
      // start = new Date(today.getFullYear(), 0, 1);
      // ── New rolling 365-day period ──
      start = new Date(today);
      start.setDate(today.getDate() - 364);
      break;
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
        return format(new Date(currentStartDate), "MMM d, yyyy");
      }
      return `${format(new Date(currentStartDate), "MMM d")} – ${format(new Date(currentEndDate), "MMM d, yyyy")}`;
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
    <div className="flex items-center gap-2">
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              "w-[220px] justify-start text-left font-normal h-9",
              !currentStartDate && !currentPreset && "text-muted-foreground",
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {displayText}
          </Button>
        </DialogTrigger>
        <DialogContent
          showCloseButton={false}
          className="w-[360px] sm:w-[375px] p-0 rounded-2xl shadow-xl bg-white"
        >
          <div className="pt-6 pb-2 px-6">
            {/* Mode Toggle */}
            <div className="flex w-full rounded-lg overflow-hidden border border-gray-200">
              <button
                type="button"
                onClick={() => {
                  setMode("single");
                  const d = tempStartDate || parseDateStr(startInput);
                  if (d) {
                    setTempEndDate(d);
                    setEndInput(toDateStr(d));
                  }
                }}
                className={cn(
                  "flex-1 py-2 text-sm font-medium transition-colors",
                  mode === "single"
                    ? "bg-blue-600 text-white shadow-sm"
                    : "bg-gray-50 text-gray-500 hover:text-gray-700 hover:bg-gray-100",
                )}
              >
                Single
              </button>
              <button
                type="button"
                onClick={() => setMode("range")}
                className={cn(
                  "flex-1 py-2 text-sm font-medium transition-colors",
                  mode === "range"
                    ? "bg-blue-600 text-white shadow-sm"
                    : "bg-gray-50 text-gray-500 hover:text-gray-700 hover:bg-gray-100",
                )}
              >
                Range
              </button>
            </div>

            {/* Preset dropdown */}
            {showPresets && (
              <div className="mt-3">
                <Select
                  value={currentPreset || "month"}
                  onValueChange={handlePresetChange}
                >
                  <SelectTrigger className="w-full h-10 text-sm border-gray-200 bg-white rounded-lg">
                    <SelectValue placeholder="Quick select" />
                  </SelectTrigger>
                  <SelectContent>
                    {PRESET_RANGES.map(({ value, label }) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Date input fields */}
            <div className="flex items-center gap-2 mt-3">
              <div className="flex-1">
                <label className="block text-xs text-gray-500 mb-1">
                  {mode === "single" ? "Date" : "Start Date"}
                </label>
                <input
                  type="date"
                  value={startInput}
                  onChange={(e) => handleStartInputChange(e.target.value)}
                  onBlur={handleStartBlur}
                  className="w-full h-9 px-3 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              {mode === "range" && (
                <div className="flex-1">
                  <label className="block text-xs text-gray-500 mb-1">
                    End Date
                  </label>
                  <input
                    type="date"
                    value={endInput}
                    onChange={(e) => handleEndInputChange(e.target.value)}
                    className="w-full h-9 px-3 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              )}
            </div>

            {/* Calendar */}
            <div className="w-full mt-3">
              {mode === "single" ? (
                <Calendar
                  mode="single"
                  selected={tempStartDate}
                  onSelect={handleSingleDateSelect}
                  defaultMonth={tempStartDate}
                  className="w-full"
                />
              ) : (
                <Calendar
                  mode="range"
                  selected={{ from: tempStartDate, to: tempEndDate }}
                  onSelect={handleRangeSelect}
                  defaultMonth={tempStartDate}
                  numberOfMonths={1}
                  className="w-full"
                />
              )}
            </div>
          </div>

          {/* Apply / Cancel buttons */}
          <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-gray-100 bg-gray-50 rounded-b-2xl">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setOpen(false)}
              className="text-gray-500 hover:text-gray-700 hover:bg-gray-200"
            >
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleApply}
              disabled={!canApply}
              className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg px-4"
            >
              Apply
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
