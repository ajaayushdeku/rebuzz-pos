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

export function CalendarDateFilter() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Read current values from URL
  const currentStartDate = searchParams.get("startDate") ?? "";
  const currentEndDate = searchParams.get("endDate") ?? "";
  const currentPreset = searchParams.get("range") ?? "";

  // Determine mode: if startDate/endDate are present → custom mode, else preset
  const hasCustom = !!currentStartDate || !!currentEndDate;
  const [mode, setMode] = React.useState<DateMode>(
    hasCustom ? "single" : "range",
  );
  const [preset, setPreset] = React.useState(currentPreset || "month");

  // For the popover
  const [open, setOpen] = React.useState(false);

  // Parse selected dates
  const [startDate, setStartDate] = React.useState<Date | undefined>(
    hasCustom ? new Date(currentStartDate) : undefined,
  );
  const [endDate, setEndDate] = React.useState<Date | undefined>(
    hasCustom ? new Date(currentEndDate) : undefined,
  );

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
    setStartDate(new Date(startDate));
    setEndDate(new Date(endDate));
  };

  const handleCustomDateSelect = (date: Date | undefined) => {
    if (!date) return;

    if (mode === "single") {
      const dateStr = toDateStr(date);
      setStartDate(date);
      setEndDate(date);
      setOpen(false);
      applyFilters({ startDate: dateStr, endDate: dateStr });
    }
  };

  const handleRangeSelect = (range: { from?: Date; to?: Date } | undefined) => {
    if (!range?.from || !range?.to) return;

    setStartDate(range.from);
    setEndDate(range.to);
    setOpen(false);
    applyFilters({
      startDate: toDateStr(range.from),
      endDate: toDateStr(range.to),
    });
  };

  // Determine display text
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
      {/* Mode Toggle - Single vs Range */}
      <div className="flex items-center rounded-lg border border-gray-200 bg-white p-0.5">
        <button
          type="button"
          onClick={() => setMode("single")}
          className={cn(
            "px-3 py-1.5 text-xs font-medium rounded-md transition-colors",
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
            "px-3 py-1.5 text-xs font-medium rounded-md transition-colors",
            mode === "range"
              ? "bg-blue-600 text-white shadow-sm"
              : "text-gray-500 hover:text-gray-700",
          )}
        >
          Range
        </button>
      </div>

      {/* Preset dropdown (always shown, but when range+preset selected it acts as quick select) */}
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

      {/* Calendar picker */}
      <Popover open={open} onOpenChange={setOpen}>
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
          {mode === "single" ? (
            <Calendar
              mode="single"
              selected={startDate}
              onSelect={handleCustomDateSelect}
              defaultMonth={startDate}
            />
          ) : (
            <Calendar
              mode="range"
              selected={{ from: startDate, to: endDate }}
              onSelect={handleRangeSelect}
              defaultMonth={startDate}
              numberOfMonths={2}
            />
          )}
        </PopoverContent>
      </Popover>
    </div>
  );
}
