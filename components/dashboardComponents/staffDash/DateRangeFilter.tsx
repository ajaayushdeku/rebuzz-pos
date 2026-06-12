"use client";

import * as React from "react";
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

export type DateRangeValue = {
  startDate: string;
  endDate: string;
};

type DateMode = "single" | "range";

const PRESET_RANGES = [
  { value: "24h", label: "Today" },
  { value: "week", label: "This Week" },
  { value: "month", label: "This Month" },
  { value: "year", label: "This Year" },
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

function getPresetRange(range: string): { startDate: string; endDate: string } {
  const today = new Date();
  const end = toDateStr(today);
  let start: Date;

  switch (range) {
    case "24h":
      start = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      break;
    case "week": {
      start = new Date(today);
      start.setDate(today.getDate() - today.getDay());
      break;
    }
    case "month":
      start = new Date(today.getFullYear(), today.getMonth(), 1);
      break;
    case "year":
      start = new Date(today.getFullYear(), 0, 1);
      break;
    default:
      start = new Date(today.getFullYear(), today.getMonth(), 1);
  }

  return { startDate: toDateStr(start), endDate: end };
}

export function DateRangeFilter({
  value,
  onChange,
  showPresets = true,
}: {
  value: DateRangeValue;
  onChange: (value: DateRangeValue) => void;
  showPresets?: boolean;
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

  React.useEffect(() => {
    if (open) {
      setTempStartDate(value.startDate ? new Date(value.startDate) : undefined);
      setTempEndDate(value.endDate ? new Date(value.endDate) : undefined);
      setStartInput(value.startDate || "");
      setEndInput(value.endDate || "");
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
      return `${format(new Date(value.startDate), "MMM d")} – ${format(new Date(value.endDate), "MMM d, yyyy")}`;
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
              "w-[220px] justify-start text-left font-normal h-9",
              !value.startDate && "text-muted-foreground",
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
                  value={preset || "month"}
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
