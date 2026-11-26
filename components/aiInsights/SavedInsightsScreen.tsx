"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  Search,
  Archive,
  Trash2,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  ChevronUp,
  ChevronDown,
  Sparkles,
  RefreshCw,
  HeartHandshake,
  UtensilsCrossed,
  PackageSearch,
  Tags,
  Clock,
  ChartNoAxesCombined,
  Users,
  // GitBranch,
  // Layers,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import toast from "react-hot-toast";

import LoadingState from "@/components/ui/LoadingState";
import { DeleteConfirmDialog } from "@/components/DeleteConfirmDialog";

import {
  useSavedPeriodInsights,
  useDeletePeriodSection,
} from "@/hooks/usePeriodInsights";

import type {
  PeriodKind,
  SavedPeriodInsight,
} from "@/services/apiPeriodInsights.client";
import ColumnPicker, {
  readStoredColumns,
  storeColumns,
  type TableColumn,
} from "@/components/ui/ColumnPicker";
import { SECTION_ACCENTS } from "./PeriodProgressVisualizer";

type SortConfig = {
  key: "period" | "section" | "lastUpdatedAt" | "itemCount";
  direction: "asc" | "desc";
} | null;

const PAGE_SIZE = 10;

const SAVED_INSIGHT_COLUMNS: TableColumn[] = [
  { key: "period", label: "Period" },
  { key: "section", label: "Insight Section" },
  { key: "lastUpdatedAt", label: "Last Updated" },
  // { key: "versions", label: "Versions" },
  // { key: "currentversion", label: "Current Version" },
  { key: "provider", label: "Provider / Model" },
  { key: "itemCount", label: "Items" },
  { key: "actions", label: "Actions", locked: true },
];

const COLUMNS_STORAGE_KEY = "rebuzz-saved-insights-table-columns";

const MIN_COLUMNS = 3;

const COLUMN_WIDTHS: Record<string, string> = {
  period: "18%",
  section: "20%",
  lastUpdatedAt: "17%",
  // versions: "11%",
  // currentversion: "11%",
  provider: "19%",
  itemCount: "8%",
  actions: "7%",
};

const SECTION_ICONS: Record<string, LucideIcon> = {
  retention: HeartHandshake,
  "menu-suggestions": UtensilsCrossed,
  "slow-items": PackageSearch,
  pricing: Tags,
  "hour-playbook": Clock,
  "sales-recommendations": ChartNoAxesCombined,
  staffing: Users,
};

const SAVED_INSIGHT_SECTIONS = [
  "retention",
  "menu-suggestions",
  "slow-items",
  "pricing",
  "hour-playbook",
  "sales-recommendations",
  "staffing",
] as const;

const DEFAULT_SECTION_ACCENT = {
  icon: "bg-gray-100 text-gray-600 dark:bg-white/10 dark:text-gray-400",
  glow: "",
  border: "",
  text: "text-gray-600 dark:text-gray-400",
};

const PERIOD_OPTIONS: {
  value: PeriodKind | "";
  label: string;
}[] = [
  { value: "", label: "All periods" },
  { value: "month", label: "Monthly" },
  { value: "quarter", label: "Quarterly" },
  { value: "year", label: "Yearly" },
];

function formatSection(section: string) {
  return section
    .replace(/[-_]/g, " ")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function formatPeriod(item: SavedPeriodInsight) {
  if (item.periodKind === "month") {
    const date = new Date(`${item.periodId}-01T00:00:00`);

    if (!Number.isNaN(date.getTime())) {
      return date.toLocaleDateString("en", {
        month: "long",
        year: "numeric",
      });
    }
  }

  if (item.periodKind === "quarter") {
    return item.periodId.replace(/^(\d{4})-?Q([1-4])$/i, "$1 · Q$2");
  }

  return item.periodId;
}

function formatDate(value: string | null | undefined) {
  if (!value) return "—";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";

  return date.toLocaleDateString("en", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatDateTime(value: string | null | undefined) {
  if (!value) return "—";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";

  return date.toLocaleString("en", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function PeriodBadge({ kind }: { kind: PeriodKind }) {
  const styles: Record<PeriodKind, string> = {
    month:
      "border-blue-200/80 bg-blue-50/70 text-blue-700 dark:border-blue-400/20 dark:bg-blue-400/10 dark:text-blue-300",
    quarter:
      "border-violet-200/80 bg-violet-50/70 text-violet-700 dark:border-violet-400/20 dark:bg-violet-400/10 dark:text-violet-300",
    year: "border-emerald-200/80 bg-emerald-50/70 text-emerald-700 dark:border-emerald-400/20 dark:bg-emerald-400/10 dark:text-emerald-300",
  };

  const dotStyles: Record<PeriodKind, string> = {
    month: "bg-blue-500",
    quarter: "bg-violet-500",
    year: "bg-emerald-500",
  };

  const labels: Record<PeriodKind, string> = {
    month: "Monthly",
    quarter: "Quarterly",
    year: "Yearly",
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-md border px-2 py-1 text-[10px] font-semibold tracking-wide ${styles[kind]}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${dotStyles[kind]}`} />
      {labels[kind]}
    </span>
  );
}

function EmptyState({
  hasFilters,
  onClear,
}: {
  hasFilters: boolean;
  onClear: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-14 text-center">
      <div className="mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100 dark:bg-white/10">
        <Archive className="h-7 w-7 text-gray-400 dark:text-[#9aa6bd]" />
      </div>

      <p className="text-sm font-semibold text-gray-600 dark:text-[#c3ccdc]">
        {hasFilters ? "No matching insights" : "No saved insights yet"}
      </p>

      <p className="mt-1 max-w-sm text-xs text-gray-400 dark:text-[#7b869b]">
        {hasFilters
          ? "Try changing your search or filters to find saved insights."
          : "Generated period insights will appear here once they have been saved."}
      </p>

      {hasFilters && (
        <button
          type="button"
          onClick={onClear}
          className="mt-4 rounded-lg px-3 py-1.5 text-xs font-semibold text-blue-600 transition-colors hover:bg-blue-50 dark:text-[#a8c4ee] dark:hover:bg-blue-400/10"
        >
          Clear filters
        </button>
      )}
    </div>
  );
}

type FilterOption = {
  value: string;
  label: string;
  icon?: LucideIcon;
};

function FilterDropdown({
  value,
  options,
  onChange,
  className = "",
}: {
  value: string;
  options: FilterOption[];
  onChange: (value: string) => void;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find((option) => option.value === value);
  const SelectedIcon = selectedOption?.icon;

  useEffect(() => {
    const handlePointerDown = (event: PointerEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
      }
    };

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  return (
    <div
      ref={dropdownRef}
      className={`relative w-full sm:w-[150px] md:w-[170px] ${className}`}
    >
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
        className="flex w-full items-center justify-between gap-2 rounded-xl border border-gray-200 bg-white py-2.5 pl-3 pr-2.5 text-[13px] text-gray-600 transition focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-white/15 dark:bg-white/5 dark:text-[#a9b4c7]"
      >
        <span className="flex min-w-0 items-center gap-2">
          {SelectedIcon && (
            <SelectedIcon
              size={14}
              className="shrink-0 text-[#244074] dark:text-blue-300"
            />
          )}

          <span className="truncate">
            {selectedOption?.label ?? options[0]?.label}
          </span>
        </span>

        <ChevronDown
          size={14}
          className={`shrink-0 text-gray-400 transition-transform duration-200 ${
            open ? "rotate-180" : ""
          } dark:text-[#9aa6bd]`}
        />
      </button>

      <div
        role="listbox"
        className={`absolute z-30 mt-1.5 max-h-fit w-full origin-top overflow-y-auto rounded-md border border-gray-200 bg-white p-1 shadow-lg transition-all duration-200 dark:border-white/15 dark:bg-[#1b2436] ${
          open
            ? "pointer-events-auto translate-y-0 scale-100 opacity-100"
            : "pointer-events-none -translate-y-1 scale-95 opacity-0"
        }`}
      >
        {options.map((option) => {
          const OptionIcon = option.icon;

          return (
            <button
              key={option.value}
              type="button"
              role="option"
              aria-selected={value === option.value}
              onClick={() => {
                onChange(option.value);
                setOpen(false);
              }}
              className={`flex w-full cursor-pointer items-center gap-2.5 rounded-md px-3 py-2 text-left text-[13px] transition-colors ${
                value === option.value
                  ? "bg-blue-50 font-medium text-blue-700 dark:bg-blue-400/10 dark:text-blue-300"
                  : "text-gray-600 hover:bg-gray-100 dark:text-[#a9b4c7] dark:hover:bg-white/10"
              }`}
            >
              {OptionIcon && (
                <OptionIcon size={14} className="shrink-0 opacity-80" />
              )}

              <span className="truncate">{option.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default function SavedInsightsScreen({
  isAdmin = false,
}: {
  isAdmin?: boolean;
}) {
  const [search, setSearch] = useState("");
  const [periodKind, setPeriodKind] = useState<PeriodKind | "">("");
  const [section, setSection] = useState("");
  const [page, setPage] = useState(1);
  const [sortConfig, setSortConfig] = useState<SortConfig>({
    key: "lastUpdatedAt",
    direction: "desc",
  });

  const [deleteTarget, setDeleteTarget] = useState<SavedPeriodInsight | null>(
    null,
  );

  const [visibleColumns, setVisibleColumns] = useState<string[]>(() =>
    readStoredColumns(COLUMNS_STORAGE_KEY, SAVED_INSIGHT_COLUMNS, MIN_COLUMNS),
  );

  const shownColumns = new Set(visibleColumns);

  const showColumn = (key: string) =>
    shownColumns.has(key) ||
    (isAdmin &&
      SAVED_INSIGHT_COLUMNS.some(
        (column) => column.key === key && column.locked,
      ));

  const colCount = SAVED_INSIGHT_COLUMNS.filter((column) =>
    showColumn(column.key),
  ).length;

  const handleColumnsChange = (next: string[]) => {
    setVisibleColumns(next);
    storeColumns(COLUMNS_STORAGE_KEY, next);

    // Clear sorting if its column is hidden.
    setSortConfig((previous) => {
      if (!previous) return previous;

      return next.includes(previous.key) ? previous : null;
    });
  };

  // Fetch all saved insights. Search and filtering happen locally.
  const { data, isLoading, isFetching, isError, refetch } =
    useSavedPeriodInsights();

  const deleteMutation = useDeletePeriodSection();

  const allItems = data ?? [];

  // Apply search and filters to the complete dataset.
  const filteredItems = useMemo(() => {
    const query = search.trim().toLowerCase();

    return allItems.filter((item) => {
      const matchesPeriodKind = !periodKind || item.periodKind === periodKind;

      const matchesSection = !section || item.section === section;

      const periodName = formatPeriod(item).toLowerCase();
      const sectionName = formatSection(item.section).toLowerCase();

      const matchesSearch =
        !query ||
        periodName.includes(query) ||
        item.periodId.toLowerCase().includes(query) ||
        sectionName.includes(query) ||
        item.section.toLowerCase().includes(query);

      return matchesPeriodKind && matchesSection && matchesSearch;
    });
  }, [allItems, search, periodKind, section]);

  const total = filteredItems.length;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  // Sort all matching records before applying pagination.
  const sortedItems = useMemo(() => {
    if (!sortConfig) return filteredItems;

    return [...filteredItems].sort((a, b) => {
      const direction = sortConfig.direction === "asc" ? 1 : -1;

      switch (sortConfig.key) {
        case "period":
          return (
            direction *
            String(a.periodId).localeCompare(String(b.periodId), undefined, {
              numeric: true,
            })
          );

        case "section":
          return (
            direction *
            formatSection(a.section).localeCompare(formatSection(b.section))
          );

        case "itemCount":
          return direction * (a.itemCount - b.itemCount);

        case "lastUpdatedAt":
          return (
            direction *
            (new Date(a.lastUpdatedAt).getTime() -
              new Date(b.lastUpdatedAt).getTime())
          );

        default:
          return 0;
      }
    });
  }, [filteredItems, sortConfig]);

  // Display only the current page after filtering and sorting.
  const paginatedItems = useMemo(() => {
    const startIndex = (page - 1) * PAGE_SIZE;

    return sortedItems.slice(startIndex, startIndex + PAGE_SIZE);
  }, [sortedItems, page]);

  // Build dropdown options from every saved insight, not just the current page.
  const sectionOptions: FilterOption[] = [
    { value: "", label: "All sections" },
    ...SAVED_INSIGHT_SECTIONS.map((section) => ({
      value: section,
      label: formatSection(section),
      icon: SECTION_ICONS[section],
    })),
  ];

  const hasFilters = Boolean(search.trim() || periodKind || section);

  const clearFilters = () => {
    setSearch("");
    setPeriodKind("");
    setSection("");
    setPage(1);
    setSortConfig({
      key: "lastUpdatedAt",
      direction: "desc",
    });
  };

  const toggleSort = (key: NonNullable<SortConfig>["key"]) => {
    setSortConfig((previous) =>
      previous?.key === key
        ? {
            key,
            direction: previous.direction === "asc" ? "desc" : "asc",
          }
        : { key, direction: "asc" },
    );
  };

  const SortIcon = ({ colKey }: { colKey: NonNullable<SortConfig>["key"] }) => {
    if (sortConfig?.key !== colKey) {
      return <ArrowUpDown className="h-3 w-3 opacity-30" />;
    }

    return sortConfig.direction === "asc" ? (
      <ChevronUp className="h-3 w-3" />
    ) : (
      <ChevronDown className="h-3 w-3" />
    );
  };

  const confirmDelete = () => {
    if (!deleteTarget) return;

    deleteMutation.mutate(
      {
        kind: deleteTarget.periodKind,
        id: deleteTarget.periodId,
        section: deleteTarget.section,
      },
      {
        onSuccess: () => {
          toast.success("Saved insight deleted");
          setDeleteTarget(null);

          // If deleting the only row on the current page,
          // return to the previous page.
          if (paginatedItems.length === 1 && page > 1) {
            setPage((current) => current - 1);
          }
        },
        onError: () => {
          toast.error("Failed to delete saved insight");
        },
      },
    );
  };

  const changeSearch = (value: string) => {
    setSearch(value);
    setPage(1);
  };

  const changePeriod = (value: string) => {
    setPeriodKind(value as PeriodKind | "");
    setPage(1);
  };

  const changeSection = (value: string) => {
    setSection(value);
    setPage(1);
  };

  function getSectionIcon(section: string): LucideIcon {
    return SECTION_ICONS[section] ?? Sparkles;
  }

  function getSectionAccent(section: string) {
    return SECTION_ACCENTS[section] ?? DEFAULT_SECTION_ACCENT;
  }

  return (
    <>
      {/* Search and filters */}
      <div className="mb-4 mt-0 flex flex-col gap-3 lg:flex-row lg:items-center">
        {/* Search */}
        <div className="relative min-w-0 flex-1">
          <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400 dark:text-[#7b869b]" />

          <input
            value={search}
            onChange={(event) => changeSearch(event.target.value)}
            placeholder="Search by period or insight section..."
            className="w-full rounded-xl border border-gray-200 bg-white py-2.5 pl-9 pr-4 text-[13px] transition focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-white/15 dark:bg-white/5 dark:text-[#e8ecf4] dark:placeholder:text-[#7b869b]"
          />
        </div>

        {/* Filters */}
        <div className="flex w-full flex-row items-center justify-between gap-3 sm:w-fit">
          <FilterDropdown
            value={periodKind}
            options={PERIOD_OPTIONS}
            onChange={changePeriod}
          />

          <FilterDropdown
            value={section}
            options={sectionOptions}
            onChange={changeSection}
          />

          {hasFilters && (
            <button
              type="button"
              onClick={clearFilters}
              className="shrink-0 whitespace-nowrap rounded-xl border border-gray-200 px-3 py-2.5 text-[12px] font-medium text-gray-500 transition-colors hover:bg-gray-50 dark:border-white/15 dark:text-[#a9b4c7] dark:hover:bg-white/5"
            >
              Clear
            </button>
          )}

          <ColumnPicker
            columns={
              isAdmin
                ? SAVED_INSIGHT_COLUMNS
                : SAVED_INSIGHT_COLUMNS.filter((column) => !column.locked)
            }
            visible={visibleColumns}
            onChange={handleColumnsChange}
            minVisible={MIN_COLUMNS}
            className="w-full sm:w-[150px] md:w-[170px]"
          />
        </div>
      </div>

      {/* Summary */}
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-[12px] text-gray-500 dark:text-[#9aa6bd]">
          <Archive className="h-3.5 w-3.5" />
          <span>
            {total} saved insight{total === 1 ? "" : "s"}
          </span>
          {isFetching && !isLoading && (
            <RefreshCw className="h-3 w-3 animate-spin text-blue-500" />
          )}
        </div>

        {isAdmin && (
          <span className="text-[11px] text-gray-400 dark:text-[#7b869b]">
            Admin management
          </span>
        )}
      </div>

      {/* Table */}
      <div className="overflow-x-auto bg-white dark:bg-transparent">
        <table
          className="w-full table-fixed text-sm"
          style={{ minWidth: `${Math.max(760, colCount * 130)}px` }}
        >
          <colgroup>
            {SAVED_INSIGHT_COLUMNS.filter((column) =>
              showColumn(column.key),
            ).map((column) => (
              <col
                key={column.key}
                style={{ width: COLUMN_WIDTHS[column.key] }}
              />
            ))}
          </colgroup>

          <thead>
            <tr className="border-b border-[#e8eaed] text-[11px] tracking-wider text-[#5f6368] dark:border-white/10 dark:text-[#a9b4c7]">
              {showColumn("period") && (
                <th
                  className="cursor-pointer px-4 py-3 text-left font-normal hover:text-gray-700 dark:hover:text-[#e8ecf4]"
                  onClick={() => toggleSort("period")}
                >
                  <span className="flex items-center gap-1">
                    Period
                    {SortIcon({ colKey: "period" })}
                  </span>
                </th>
              )}

              {showColumn("section") && (
                <th
                  className="cursor-pointer px-4 py-3 text-left font-normal hover:text-gray-700 dark:hover:text-[#e8ecf4]"
                  onClick={() => toggleSort("section")}
                >
                  <span className="flex items-center gap-1">
                    Insight section
                    {SortIcon({ colKey: "section" })}
                  </span>
                </th>
              )}

              {showColumn("lastUpdatedAt") && (
                <th
                  className="cursor-pointer px-4 py-3 text-left font-normal hover:text-gray-700 dark:hover:text-[#e8ecf4]"
                  onClick={() => toggleSort("lastUpdatedAt")}
                >
                  <span className="flex items-center gap-1">
                    Last updated
                    {SortIcon({ colKey: "lastUpdatedAt" })}
                  </span>
                </th>
              )}

              {/* {showColumn("versions") && (
                <th className="px-4 py-3 text-center font-normal">Versions</th>
              )}

              {showColumn("currentversion") && (
                <th className="px-4 py-3 text-center font-normal">
                  Current Version
                </th>
              )} */}

              {showColumn("provider") && (
                <th className="px-4 py-3 text-left font-normal">
                  Provider / Model
                </th>
              )}

              {showColumn("itemCount") && (
                <th
                  className="cursor-pointer px-4 py-3 text-center font-normal hover:text-gray-700 dark:hover:text-[#e8ecf4]"
                  onClick={() => toggleSort("itemCount")}
                >
                  <span className="flex items-center justify-center gap-1">
                    Items
                    {SortIcon({ colKey: "itemCount" })}
                  </span>
                </th>
              )}

              {showColumn("actions") && isAdmin && (
                <th className="px-4 py-3 text-right font-normal">Actions</th>
              )}
            </tr>
          </thead>

          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={isAdmin ? 7 : 6}>
                  <LoadingState message="Loading saved insights..." />
                </td>
              </tr>
            ) : isError ? (
              <tr>
                <td colSpan={isAdmin ? 7 : 6} className="py-12 text-center">
                  <div className="flex flex-col items-center gap-3">
                    <p className="text-sm font-medium text-gray-500 dark:text-[#c3ccdc]">
                      Unable to load saved insights
                    </p>
                    <button
                      type="button"
                      onClick={() => refetch()}
                      className="rounded-lg bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700 transition hover:bg-blue-100 dark:bg-blue-400/10 dark:text-[#a8c4ee] dark:hover:bg-blue-400/20"
                    >
                      Try again
                    </button>
                  </div>
                </td>
              </tr>
            ) : paginatedItems.length === 0 ? (
              <tr>
                <td colSpan={isAdmin ? 7 : 6}>
                  <EmptyState hasFilters={hasFilters} onClear={clearFilters} />
                </td>
              </tr>
            ) : (
              paginatedItems.map((item) => (
                <tr
                  key={`${item.periodKind}-${item.periodId}-${item.section}`}
                  className="border-b border-gray-50 transition-colors last:border-0 hover:bg-gray-50/70 dark:border-white/5 dark:hover:bg-white/5"
                >
                  {/* Period */}
                  {showColumn("period") && (
                    <td className="px-4 py-3">
                      <div className="flex flex-col items-start gap-1.5">
                        <span className="text-[13px] font-semibold text-[#3c4043] dark:text-[#e8ecf4]">
                          {formatPeriod(item)}
                        </span>
                        <PeriodBadge kind={item.periodKind} />
                      </div>
                    </td>
                  )}

                  {/* Section */}
                  {showColumn("section") && (
                    <td className="px-4 py-3">
                      {(() => {
                        const SectionIcon = getSectionIcon(item.section);
                        const accent = getSectionAccent(item.section);

                        return (
                          <div className="flex min-w-0 items-center gap-2">
                            <span
                              className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${accent.icon}`}
                            >
                              <SectionIcon className="h-4 w-4" />
                            </span>

                            <span
                              className={`truncate text-[13px] font-medium ${accent.text}`}
                              title={formatSection(item.section)}
                            >
                              {formatSection(item.section)}
                            </span>
                          </div>
                        );
                      })()}
                    </td>
                  )}

                  {/* Last updated */}
                  {showColumn("lastUpdatedAt") && (
                    <td className="px-4 py-3">
                      <div className="flex flex-col gap-1">
                        <span className="text-[12px] font-medium text-[#3c4043] dark:text-[#e8ecf4]">
                          {formatDate(item.lastUpdatedAt)}
                        </span>
                        <span className="text-[10px] text-gray-400 dark:text-[#7b869b]">
                          {formatDateTime(item.lastUpdatedAt)}
                        </span>
                      </div>
                    </td>
                  )}

                  {/*
                  {showColumn("versions") && (
                    <td className="px-4 py-3 text-center">
                      <div className="inline-flex items-center gap-1.5">
                        <Layers className="h-3.5 w-3.5 text-slate-500 dark:text-slate-400" />

                        <span className="text-[12px] font-semibold tabular-nums text-slate-600 dark:text-slate-300">
                          {item.versionCount}
                        </span>
                      </div>
                    </td>
                  )}
                  {showColumn("currentversion") && (
                    <td className="px-4 py-3 text-center">
                      <div className="inline-flex items-center gap-1.5">
                        <GitBranch className="h-3.5 w-3.5 text-slate-500 dark:text-slate-400" />

                        <span className="text-[12px] font-semibold tabular-nums text-slate-600 dark:text-slate-300">
                          {item.promptVersion}
                        </span>
                      </div>
                    </td>
                  )} */}

                  {/* Provider / model */}
                  {showColumn("provider") && (
                    <td className="px-4 py-3">
                      <div className="flex min-w-0 flex-col gap-1">
                        <span className="truncate text-[12px] font-medium capitalize text-[#3c4043] dark:text-[#e8ecf4]">
                          {item.provider || "Unknown provider"}
                        </span>
                        <span
                          title={item.settingsModel || item.model || ""}
                          className="truncate text-[10px] text-gray-400 dark:text-[#7b869b]"
                        >
                          {item.settingsModel ||
                            item.model ||
                            "Model unavailable"}
                        </span>
                      </div>
                    </td>
                  )}

                  {/* Item count */}
                  {showColumn("itemCount") && (
                    <td className="px-4 py-3 text-center">
                      <span className="text-[13px] font-semibold tabular-nums text-[#3c4043] dark:text-[#e8ecf4]">
                        {item.itemCount}
                      </span>
                    </td>
                  )}

                  {/* Actions */}
                  {showColumn("actions") && isAdmin && (
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end">
                        <button
                          type="button"
                          onClick={() => setDeleteTarget(item)}
                          disabled={deleteMutation.isPending}
                          title="Delete saved insight"
                          aria-label={`Delete ${formatSection(item.section)} for ${formatPeriod(item)}`}
                          className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-red-50 hover:text-red-500 disabled:cursor-not-allowed disabled:opacity-40 dark:text-[#7b869b] dark:hover:bg-red-400/15 dark:hover:text-[#f87171]"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {!isLoading && !isError && total > 0 && (
        <div className="mt-4 flex items-center justify-between border-t border-gray-100 pt-3 dark:border-white/10">
          <button
            type="button"
            onClick={() => setPage((current) => Math.max(1, current - 1))}
            disabled={page <= 1}
            className={`flex items-center gap-1 rounded-lg px-3 py-1.5 text-[10px] font-medium transition-colors sm:text-xs ${
              page <= 1
                ? "cursor-not-allowed text-gray-300 dark:text-[#6b7588]"
                : "text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-[#a9b4c7] dark:hover:bg-white/10 dark:hover:text-[#e8ecf4]"
            }`}
          >
            <ChevronLeft className="h-3.5 w-3.5" />
            Previous
          </button>

          <span className="text-[10px] font-medium tabular-nums text-gray-400 dark:text-[#9aa6bd] sm:text-xs">
            Page {page} of {totalPages} · {total} insight
            {total === 1 ? "" : "s"}
          </span>

          <button
            type="button"
            onClick={() =>
              setPage((current) => Math.min(totalPages, current + 1))
            }
            disabled={page >= totalPages}
            className={`flex items-center gap-1 rounded-lg px-3 py-1.5 text-[10px] font-medium transition-colors sm:text-xs ${
              page >= totalPages
                ? "cursor-not-allowed text-gray-300 dark:text-[#6b7588]"
                : "text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-[#a9b4c7] dark:hover:bg-white/10 dark:hover:text-[#e8ecf4]"
            }`}
          >
            Next
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* Delete confirmation */}
      <DeleteConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => {
          if (!open && !deleteMutation.isPending) {
            setDeleteTarget(null);
          }
        }}
        icon={Archive}
        title="Delete saved insight?"
        description={
          deleteTarget
            ? `The ${formatSection(deleteTarget.section)} insight for ${formatPeriod(deleteTarget)} will be permanently deleted, including all ${deleteTarget.versionCount} prompt version${deleteTarget.versionCount === 1 ? "" : "s"}.`
            : ""
        }
        warning="This action cannot be undone."
        onConfirm={confirmDelete}
        isPending={deleteMutation.isPending}
      />
    </>
  );
}
