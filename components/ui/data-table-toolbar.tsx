"use client";

import * as React from "react";
import { Table } from "@tanstack/react-table";
import { X } from "lucide-react";
import { DateRange } from "react-day-picker";
import { format } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";

import { FilterConfig } from "@/lib/datatable";

type DataTableToolbarProps<TData> = {
  table: Table<TData>;
  searchColumn?: string;
  searchPlaceholder?: string;
  filters?: FilterConfig[];
  showDateFilter?: boolean;
  showColumnToggle?: boolean;
};

export function DataTableToolbar<TData>({
  table,
  searchColumn,
  searchPlaceholder = "Search...",
  filters,
  showDateFilter = false,
  showColumnToggle = false,
}: DataTableToolbarProps<TData>) {
  const [dateRange, setDateRange] =
    React.useState<DateRange | undefined>();

  // Dynamically check filter values for each FilterConfig
  const activeFilterCounts = filters?.map(
    (f) => ({
      columnId: f.columnId,
      count:
        (
          table
            .getColumn(f.columnId)
            ?.getFilterValue() as
            | string[]
            | undefined
        )?.length ?? 0,
    }),
  );

  const isFiltered =
    activeFilterCounts?.some(
      (f) => f.count > 0,
    ) || dateRange?.from;

  function toggleValue(
    current: string[],
    value: string,
    columnId: string,
  ) {
    const next = current.includes(value)
      ? current.filter((v) => v !== value)
      : [...current, value];
    table
      .getColumn(columnId)
      ?.setFilterValue(
        next.length ? next : undefined,
      );
  }

  function clearAll() {
    filters?.forEach((f) =>
      table
        .getColumn(f.columnId)
        ?.setFilterValue(undefined),
    );
    if (showDateFilter) {
      table
        .getColumn("date")
        ?.setFilterValue(undefined);
      setDateRange(undefined);
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-2 py-4">
      {/* Search */}
      {searchColumn && (
        <Input
          placeholder={searchPlaceholder}
          value={
            (table
              .getColumn(searchColumn)
              ?.getFilterValue() as string) ?? ""
          }
          onChange={(e) =>
            table
              .getColumn(searchColumn)
              ?.setFilterValue(e.target.value)
          }
          className="max-w-xs"
        />
      )}

      {/* Date Range — only renders if showDateFilter is true */}
      {showDateFilter && (
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm">
              {dateRange?.from
                ? dateRange.to
                  ? `${format(dateRange.from, "MMM d")} – ${format(dateRange.to, "MMM d, yyyy")}`
                  : format(
                      dateRange.from,
                      "MMM d, yyyy",
                    )
                : "Date range"}
            </Button>
          </PopoverTrigger>
          <PopoverContent
            className="w-auto p-0"
            align="start"
          >
            <Calendar
              mode="range"
              selected={dateRange}
              onSelect={(range) => {
                setDateRange(range);
                table
                  .getColumn("date")
                  ?.setFilterValue(
                    range
                      ? {
                          from: range.from,
                          to: range.to,
                        }
                      : undefined,
                  );
              }}
              numberOfMonths={2}
            />
            {dateRange?.from && (
              <div className="border-t p-2">
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full"
                  onClick={() => {
                    setDateRange(undefined);
                    table
                      .getColumn("date")
                      ?.setFilterValue(undefined);
                  }}
                >
                  Clear dates
                </Button>
              </div>
            )}
          </PopoverContent>
        </Popover>
      )}

      {/* Generic filter dropdowns — one per FilterConfig */}
      {filters?.map((filter) => {
        const selected =
          (table
            .getColumn(filter.columnId)
            ?.getFilterValue() as string[]) ?? [];
        return (
          <DropdownMenu key={filter.columnId}>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                {filter.label}
                {selected.length > 0 && (
                  <>
                    <Separator
                      orientation="vertical"
                      className="mx-2 h-4"
                    />
                    <Badge variant="secondary">
                      {selected.length}
                    </Badge>
                  </>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              <DropdownMenuLabel>
                Filter by{" "}
                {filter.label.toLowerCase()}
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              {filter.options.map((option) => (
                <DropdownMenuCheckboxItem
                  key={option}
                  checked={selected.includes(
                    option,
                  )}
                  onCheckedChange={() =>
                    toggleValue(
                      selected,
                      option,
                      filter.columnId,
                    )
                  }
                  className="capitalize"
                >
                  {option}
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        );
      })}

      {/* Column Visibility */}

      {showColumnToggle && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="ml-auto"
            >
              Columns
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {table
              .getAllColumns()
              .filter((col) => col.getCanHide())
              .map((col) => (
                <DropdownMenuCheckboxItem
                  key={col.id}
                  className="capitalize"
                  checked={col.getIsVisible()}
                  onCheckedChange={(value) =>
                    col.toggleVisibility(!!value)
                  }
                >
                  {col.id}
                </DropdownMenuCheckboxItem>
              ))}
          </DropdownMenuContent>
        </DropdownMenu>
      )}

      {/* Reset */}
      {isFiltered && (
        <Button
          variant="ghost"
          size="sm"
          onClick={clearAll}
        >
          Reset <X className="ml-1 h-4 w-4" />
        </Button>
      )}
    </div>
  );
}
