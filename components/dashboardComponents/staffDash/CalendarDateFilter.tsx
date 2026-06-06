"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { format } from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
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
  { value: "week", label: "This Week" },
  { value: "month", label: "This Month" },
  { value: "year", label: "This Year" },
];

function toDateStr(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
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

  // Determine mode: if startDate/endDate are present → custom mode, else preset
  const hasCustom = !!currentStartDate || !!currentEndDate;
  const [mode, setMode] = React.useState<DateMode>(
    hasCustom ? "range" : "range",
  );
  const [preset, setPreset] = React.useState(currentPreset || "month");

  // For the popover
  const [open, setOpen] = React.useState(false);

  // Temporary local state for date selection (only applied on "Apply" click)
  const [tempStartDate, setTempStartDate] = React.useState<Date | undefined>(
    hasCustom ? new Date(currentStartDate) : undefined,
  );
  const [tempEndDate, setTempEndDate] = React.useState<Date | undefined>(
    hasCustom ? new Date(currentEndDate) : undefined,
  );

  // Reset temp state when popover opens
  const handleOpenChange = (isOpen: boolean) => {
    if (isOpen) {
      // Sync temp state with current applied state
      if (currentStartDate && currentEndDate) {
        setTempStartDate(new Date(currentStartDate));
        setTempEndDate(new Date(currentEndDate));
      } else {
        setTempStartDate(undefined);
        setTempEndDate(undefined);
      }
    }
    setOpen(isOpen);
  };

  const applyFilters = (params: {
    startDate?: string;
    endDate?: string;
    range?: string;
  }) => {
    const sp = new URLSearchParams(searchParams.toString());
    sp.delete("startDate");
    sp.delete("endDate");
    sp.delete("range");

    if (params.range) {
      sp.set("range", params.range);
    } else if (params.startDate && params.endDate) {
      sp.set("startDate", params.startDate);
      sp.set("endDate", params.endDate);
    }

    router.push(`?${sp.toString()}`);
    setOpen(false);
  };

  const handlePresetChange = (value: string) => {
    setPreset(value);
    const { startDate, endDate } = getPresetRange(value);
    applyFilters({ range: value });
    setTempStartDate(new Date(startDate));
    setTempEndDate(new Date(endDate));
  };

  const handleSingleDateSelect = (date: Date | undefined) => {
    if (!date) return;
    // In single mode, set both start and end to the same date in temp state
    setTempStartDate(date);
    setTempEndDate(date);
  };

  const handleRangeSelect = (range: { from?: Date; to?: Date } | undefined) => {
    if (range?.from) setTempStartDate(range.from);
    if (range?.to) setTempEndDate(range.to);
    // If only "from" selected, clear "to" so user can pick end date
    if (range?.from && !range?.to) {
      setTempEndDate(undefined);
    }
  };

  const handleApply = () => {
    if (mode === "single") {
      if (tempStartDate) {
        const dateStr = toDateStr(tempStartDate);
        applyFilters({ startDate: dateStr, endDate: dateStr });
      }
    } else {
      // Range mode
      if (tempStartDate && tempEndDate) {
        // Ensure start is before end
        const [start, end] =
          tempStartDate <= tempEndDate
            ? [tempStartDate, tempEndDate]
            : [tempEndDate, tempStartDate];
        setTempStartDate(start);
        setTempEndDate(end);
        applyFilters({
          startDate: toDateStr(start),
          endDate: toDateStr(end),
        });
      }
    }
  };

  const canApply =
    mode === "single" ? !!tempStartDate : !!tempStartDate && !!tempEndDate;

  // Determine display text from URL params (the actually applied filter)
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
      {/* Preset dropdown (hidden when showPresets=false) */}
      {showPresets && (
        <Select
          value={currentPreset || "month"}
          onValueChange={handlePresetChange}
        >
          <SelectTrigger className="w-[140px] h-9 text-sm">
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
      )}

      {/* Calendar picker with Apply button and Single/Range toggle inside */}
      <Popover open={open} onOpenChange={handleOpenChange}>
        <PopoverTrigger asChild>
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
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <div>
            {/* Mode Toggle - Single vs Range (inside popover) */}
            <div className="flex items-center justify-center gap-1 p-3 pb-0">
              <div className="flex items-center rounded-lg border border-gray-200 bg-gray-50 p-0.5">
                <button
                  type="button"
                  onClick={() => setMode("single")}
                  className={cn(
                    "px-3 py-1 text-xs font-medium rounded-md transition-colors",
                    mode === "single"
                      ? "bg-blue-600 text-white shadow-sm"
                      : "text-gray-500 hover:text-gray-700",
                  )}
                >
                  Single
                </button>
                <button
                  type="button"
                  onClick={() => setMode("range")}
                  className={cn(
                    "px-3 py-1 text-xs font-medium rounded-md transition-colors",
                    mode === "range"
                      ? "bg-blue-600 text-white shadow-sm"
                      : "text-gray-500 hover:text-gray-700",
                  )}
                >
                  Range
                </button>
              </div>
            </div>

            {mode === "single" ? (
              <Calendar
                mode="single"
                selected={tempStartDate}
                onSelect={handleSingleDateSelect}
                defaultMonth={tempStartDate}
              />
            ) : (
              <Calendar
                mode="range"
                selected={{ from: tempStartDate, to: tempEndDate }}
                onSelect={handleRangeSelect}
                defaultMonth={tempStartDate}
                numberOfMonths={2}
              />
            )}

            {/* Apply / Cancel buttons */}
            <div className="flex items-center justify-end gap-2 p-3 border-t border-gray-100">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setOpen(false)}
                className="text-gray-500"
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleApply}
                disabled={!canApply}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                Apply
              </Button>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
