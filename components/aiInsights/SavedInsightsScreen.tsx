"use client";

import { useMemo, useState } from "react";
import {
  Search,
  Archive,
  Trash2,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  ChevronUp,
  ChevronDown,
  CalendarDays,
  Layers,
  Sparkles,
  RefreshCw,
} from "lucide-react";
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

type SortConfig = {
  key: "period" | "section" | "lastUpdatedAt" | "itemCount";
  direction: "asc" | "desc";
} | null;

const PAGE_SIZE = 10;

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
  const labels: Record<PeriodKind, string> = {
    month: "Monthly",
    quarter: "Quarterly",
    year: "Yearly",
  };

  return (
    <span className="inline-flex items-center rounded-full border border-blue-200 bg-blue-50 px-2 py-0.5 text-[10px] font-semibold text-blue-700 dark:border-blue-400/25 dark:bg-blue-400/10 dark:text-[#a8c4ee]">
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

  const queryParams = useMemo(
    () => ({
      ...(periodKind ? { kind: periodKind } : {}),
      ...(section ? { section } : {}),
      ...(search.trim() ? { search: search.trim() } : {}),
      page,
      limit: PAGE_SIZE,
    }),
    [periodKind, section, search, page],
  );

  const { data, isLoading, isFetching, isError, refetch } =
    useSavedPeriodInsights(queryParams);

  const deleteMutation = useDeletePeriodSection();

  const items = data?.items ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.max(1, data?.totalPages ?? 1);

  // Use the section values returned by the API instead of assuming
  // particular section identifiers.
  const sectionOptions = useMemo(
    () =>
      Array.from(new Set(items.map((item) => item.section))).sort((a, b) =>
        formatSection(a).localeCompare(formatSection(b)),
      ),
    [items],
  );

  const sortedItems = useMemo(() => {
    if (!sortConfig) return items;

    return [...items].sort((a, b) => {
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
  }, [items, sortConfig]);

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

          // If the current page only contained the deleted row,
          // move back one page rather than leaving an empty page.
          if (items.length === 1 && page > 1) {
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

  return (
    <>
      {/* Search and filters */}
      <div className="mb-4 mt-6 flex flex-col gap-3 lg:flex-row lg:items-center">
        <div className="relative min-w-0 flex-1">
          <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400 dark:text-[#7b869b]" />

          <input
            value={search}
            onChange={(event) => changeSearch(event.target.value)}
            placeholder="Search by period or insight section..."
            className="w-full rounded-xl border border-gray-200 bg-white py-2.5 pl-9 pr-4 text-[13px] transition focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-white/15 dark:bg-white/5 dark:text-[#e8ecf4] dark:placeholder:text-[#7b869b]"
          />
        </div>

        <div className="flex flex-col gap-2 sm:flex-row">
          <select
            value={periodKind}
            onChange={(event) => changePeriod(event.target.value)}
            className="min-w-0 rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-[12px] text-gray-600 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-500/20 dark:border-white/15 dark:bg-[#151d2d] dark:text-[#c3ccdc]"
          >
            {PERIOD_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>

          <select
            value={section}
            onChange={(event) => changeSection(event.target.value)}
            className="min-w-0 rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-[12px] text-gray-600 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-500/20 dark:border-white/15 dark:bg-[#151d2d] dark:text-[#c3ccdc]"
          >
            <option value="">All sections</option>

            {sectionOptions.map((option) => (
              <option key={option} value={option}>
                {formatSection(option)}
              </option>
            ))}
          </select>

          {hasFilters && (
            <button
              type="button"
              onClick={clearFilters}
              className="whitespace-nowrap rounded-xl border border-gray-200 px-3 py-2 text-[12px] font-medium text-gray-500 transition-colors hover:bg-gray-50 dark:border-white/15 dark:text-[#a9b4c7] dark:hover:bg-white/5"
            >
              Clear filters
            </button>
          )}
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
        <table className="w-full min-w-[900px] table-fixed text-sm">
          <colgroup>
            <col className="w-[18%]" />
            <col className="w-[20%]" />
            <col className="w-[17%]" />
            <col className="w-[11%]" />
            <col className="w-[19%]" />
            <col className="w-[8%]" />
            {isAdmin && <col className="w-[7%]" />}
          </colgroup>

          <thead>
            <tr className="border-b border-[#e8eaed] text-[11px] tracking-wider text-[#5f6368] dark:border-white/10 dark:text-[#a9b4c7]">
              <th
                className="cursor-pointer px-4 py-3 text-left font-normal hover:text-gray-700 dark:hover:text-[#e8ecf4]"
                onClick={() => toggleSort("period")}
              >
                <span className="flex items-center gap-1">
                  Period
                  {SortIcon({ colKey: "period" })}
                </span>
              </th>

              <th
                className="cursor-pointer px-4 py-3 text-left font-normal hover:text-gray-700 dark:hover:text-[#e8ecf4]"
                onClick={() => toggleSort("section")}
              >
                <span className="flex items-center gap-1">
                  Insight section
                  {SortIcon({ colKey: "section" })}
                </span>
              </th>

              <th
                className="cursor-pointer px-4 py-3 text-left font-normal hover:text-gray-700 dark:hover:text-[#e8ecf4]"
                onClick={() => toggleSort("lastUpdatedAt")}
              >
                <span className="flex items-center gap-1">
                  Last updated
                  {SortIcon({ colKey: "lastUpdatedAt" })}
                </span>
              </th>

              <th className="px-4 py-3 text-center font-normal">Versions</th>

              <th className="px-4 py-3 text-left font-normal">
                Provider / Model
              </th>

              <th
                className="cursor-pointer px-4 py-3 text-center font-normal hover:text-gray-700 dark:hover:text-[#e8ecf4]"
                onClick={() => toggleSort("itemCount")}
              >
                <span className="flex items-center justify-center gap-1">
                  Items
                  {SortIcon({ colKey: "itemCount" })}
                </span>
              </th>

              {isAdmin && (
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
            ) : sortedItems.length === 0 ? (
              <tr>
                <td colSpan={isAdmin ? 7 : 6}>
                  <EmptyState hasFilters={hasFilters} onClear={clearFilters} />
                </td>
              </tr>
            ) : (
              sortedItems.map((item) => (
                <tr
                  key={`${item.periodKind}-${item.periodId}-${item.section}`}
                  className="border-b border-gray-50 transition-colors last:border-0 hover:bg-gray-50/70 dark:border-white/5 dark:hover:bg-white/5"
                >
                  {/* Period */}
                  <td className="px-4 py-3">
                    <div className="flex flex-col items-start gap-1.5">
                      <span className="text-[13px] font-semibold text-[#3c4043] dark:text-[#e8ecf4]">
                        {formatPeriod(item)}
                      </span>
                      <PeriodBadge kind={item.periodKind} />
                    </div>
                  </td>

                  {/* Section */}
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-400/10 dark:text-[#a8c4ee]">
                        <Sparkles className="h-3.5 w-3.5" />
                      </span>

                      <span className="truncate text-[13px] font-medium text-[#3c4043] dark:text-[#e8ecf4]">
                        {formatSection(item.section)}
                      </span>
                    </div>
                  </td>

                  {/* Last updated */}
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

                  {/* Versions */}
                  <td className="px-4 py-3 text-center">
                    <span className="inline-flex items-center justify-center gap-1 rounded-full border border-purple-200 bg-purple-50 px-2 py-1 text-[11px] font-semibold tabular-nums text-purple-700 dark:border-purple-400/25 dark:bg-purple-400/10 dark:text-purple-300">
                      <Layers className="h-3 w-3" />
                      {item.versionCount}
                    </span>
                  </td>

                  {/* Provider / model */}
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

                  {/* Item count */}
                  <td className="px-4 py-3 text-center">
                    <span className="text-[13px] font-semibold tabular-nums text-[#3c4043] dark:text-[#e8ecf4]">
                      {item.itemCount}
                    </span>
                  </td>

                  {/* Actions */}
                  {isAdmin && (
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
