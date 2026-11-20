"use client";

import { useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";

import {
  CalendarDays,
  CheckCircle2,
  Clock3,
  Filter,
  History,
  Loader2,
  Search,
  ThumbsDown,
  X,
} from "lucide-react";

import { useCustomerRetentionFeedbackHistory } from "@/hooks/useCustomerRetentionFeedback";

import type {
  CustomerRetentionFeedback,
  RetentionFeedbackDecision,
  RetentionFeedbackHistoryFilter,
} from "@/services/apiCustomerRetentionFeedback.client";

type Props = {
  onClose: () => void;
};

type DecisionFilter = RetentionFeedbackDecision | "all";

const PAGE_SIZE = 10;

const dateFormatter = new Intl.DateTimeFormat(undefined, {
  day: "numeric",
  month: "short",
  year: "numeric",
  hour: "numeric",
  minute: "2-digit",
});

function formatDate(date: string) {
  const parsed = new Date(date);

  if (Number.isNaN(parsed.getTime())) return "Unknown date";

  return dateFormatter.format(parsed);
}

function DecisionBadge({ decision }: { decision: RetentionFeedbackDecision }) {
  const approved = decision === "approved";

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-semibold ${
        approved
          ? "border border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-400/20 dark:bg-emerald-400/10 dark:text-emerald-300"
          : "border border-red-200 bg-red-50 text-red-700 dark:border-red-400/20 dark:bg-red-400/10 dark:text-red-300"
      }`}
    >
      {approved ? <CheckCircle2 size={11} /> : <ThumbsDown size={11} />}

      {approved ? "Approved" : "Disapproved"}
    </span>
  );
}

export default function CustomerRetentionFeedbackHistoryModal({
  onClose,
}: Props) {
  const [decision, setDecision] = useState<DecisionFilter>("all");

  const [searchInput, setSearchInput] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");

  // Empty array means all styles are selected.
  const [selectedStyles, setSelectedStyles] = useState<string[]>([]);

  const [page, setPage] = useState(1);

  const [items, setItems] = useState<CustomerRetentionFeedback[]>([]);

  // Lock background scrolling and support Escape.
  useEffect(() => {
    const previousOverflow = document.body.style.overflow;

    document.body.style.overflow = "hidden";

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose]);

  // Only decision and search are sent to the backend.
  // Style filtering is intentionally handled locally.
  const filters = useMemo<RetentionFeedbackHistoryFilter>(
    () => ({
      page,
      limit: PAGE_SIZE,
      decision,
      search: appliedSearch,
    }),
    [page, decision, appliedSearch],
  );

  const historyQuery = useCustomerRetentionFeedbackHistory(filters);

  // Lightweight count requests for the three tabs.
  const allCountQuery = useCustomerRetentionFeedbackHistory({
    page: 1,
    limit: 1,
    decision: "all",
  });

  const approvedCountQuery = useCustomerRetentionFeedbackHistory({
    page: 1,
    limit: 1,
    decision: "approved",
  });

  const disapprovedCountQuery = useCustomerRetentionFeedbackHistory({
    page: 1,
    limit: 1,
    decision: "disapproved",
  });

  // Accumulate records when loading subsequent pages.
  useEffect(() => {
    const newItems = historyQuery.data?.items;

    if (!newItems) return;

    setItems((previous) => {
      if (page === 1) return newItems;

      const existingIds = new Set(previous.map((item) => item._id));

      return [
        ...previous,
        ...newItems.filter((item) => !existingIds.has(item._id)),
      ];
    });
  }, [historyQuery.data, page]);

  // Build style options from the records already loaded.
  const styleOptions = useMemo(() => {
    const uniqueStyles = new Map<string, string>();

    items.forEach((item) => {
      if (item.styleId) {
        uniqueStyles.set(item.styleId, item.styleTitle || item.styleId);
      }
    });

    return Array.from(uniqueStyles, ([id, title]) => ({
      id,
      title,
    })).sort((a, b) => a.title.localeCompare(b.title));
  }, [items]);

  // Apply selected styles locally without making another API request.
  const filteredItems = useMemo(() => {
    if (selectedStyles.length === 0) return items;

    const selectedStyleIds = new Set(selectedStyles);

    return items.filter(
      (item) => item.styleId && selectedStyleIds.has(item.styleId),
    );
  }, [items, selectedStyles]);

  const isInitialLoading = historyQuery.isLoading;
  const isError = historyQuery.isError;

  const canLoadMore = page < (historyQuery.data?.pagination.totalPages ?? 1);

  function resetAndApply(nextDecision: DecisionFilter, nextSearch: string) {
    // Always clear the local style filter, but don't clear the records when
    // the backend query itself is unchanged.
    setSelectedStyles([]);

    const queryChanged =
      nextDecision !== decision || nextSearch !== appliedSearch;

    if (!queryChanged) return;

    setItems([]);
    setPage(1);
    setDecision(nextDecision);
    setAppliedSearch(nextSearch);
  }

  function handleSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    resetAndApply(decision, searchInput.trim());
  }

  function handleClearFilters() {
    setSelectedStyles([]);
    setSearchInput("");

    // Only reset the API query if the applied search actually changes.
    if (appliedSearch) {
      resetAndApply(decision, "");
    }
  }

  const tabs: {
    id: DecisionFilter;
    label: string;
    count: number;
  }[] = [
    {
      id: "all",
      label: "All",
      count: allCountQuery.data?.pagination.total ?? 0,
    },
    {
      id: "approved",
      label: "Approved",
      count: approvedCountQuery.data?.pagination.total ?? 0,
    },
    {
      id: "disapproved",
      label: "Disapproved",
      count: disapprovedCountQuery.data?.pagination.total ?? 0,
    },
  ];

  const hasActiveFilters = selectedStyles.length > 0 || Boolean(appliedSearch);

  const hasNoStyleMatches = items.length > 0 && filteredItems.length === 0;

  useEffect(() => {
    const normalizedSearch = searchInput.trim();

    if (normalizedSearch === appliedSearch) return;

    const timeout = window.setTimeout(() => {
      resetAndApply(decision, normalizedSearch);
    }, 450);

    return () => window.clearTimeout(timeout);
  }, [searchInput, appliedSearch, decision]);

  const isSearchDebouncing = searchInput.trim() !== appliedSearch;

  const isSearching =
    Boolean(appliedSearch) && !isSearchDebouncing && historyQuery.isFetching;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-5"
      role="presentation"
    >
      {/* Overlay */}
      <button
        type="button"
        aria-label="Close feedback history"
        onClick={onClose}
        className="absolute inset-0 cursor-default bg-black/50 "
      />

      {/* Modal */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="retention-history-title"
        className="
          relative z-10 flex w-full max-w-3xl
          max-h-[90vh] flex-col overflow-hidden
          rounded-2xl border border-[#e8eaed]
          bg-white shadow-2xl shadow-black/20
          dark:border-[#293750]
          dark:bg-[#182338]
        "
      >
        {/* Header */}
        <div className="flex shrink-0 items-center justify-between gap-3 border-b border-[#edf0f3] px-5 py-4 dark:border-white/10 sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-blue-200 bg-blue-50 text-blue-600 dark:border-blue-400/20 dark:bg-blue-400/10 dark:text-blue-300">
              <History size={19} />
            </div>

            <div className="min-w-0">
              <h2
                id="retention-history-title"
                className="text-[15px] font-bold text-[#303846] dark:text-[#e8ecf4]"
              >
                Feedback history
              </h2>

              <p className="mt-0.5 text-[11px] text-[#89909c] dark:text-[#9ca9bc]">
                Review previously approved and rejected messages
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="
              flex h-8 w-8 shrink-0 items-center justify-center
              rounded-lg text-[#89909c]
              transition-colors hover:bg-[#f1f3f6]
              hover:text-[#343a46]
              dark:hover:bg-white/10 dark:hover:text-white
            "
          >
            <X size={17} />
          </button>
        </div>

        {/* Tabs */}
        <div className="shrink-0 border-b border-[#edf0f3] px-5 dark:border-white/10 sm:px-6">
          <div className="relative grid grid-cols-3">
            {/* Sliding active indicator */}
            <span
              className="absolute bottom-0 left-0 h-0.5 w-1/3 rounded-full bg-[#244074] transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] dark:bg-blue-400"
              style={{
                transform: `translateX(${
                  tabs.findIndex((tab) => tab.id === decision) * 100
                }%)`,
              }}
            />

            {tabs.map((tab) => {
              const active = decision === tab.id;

              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => resetAndApply(tab.id, appliedSearch)}
                  className={`
                    relative flex items-center justify-center gap-2
                    py-3.5 text-[12px] font-semibold
                    transition-colors duration-200
                    ${
                      active
                        ? "text-[#244074] dark:text-blue-300"
                        : "text-[#858d9a] hover:text-[#424955] dark:text-[#9ca9bc] dark:hover:text-white"
                    }
                  `}
                >
                  {tab.label}

                  <span
                    className={`
                      rounded-full px-1.5 py-0.5 text-[10px] tabular-nums
                      transition-all duration-200
                      ${
                        active
                          ? "bg-blue-50 text-blue-700 dark:bg-blue-400/15 dark:text-blue-300"
                          : "bg-[#f1f3f6] text-[#858d9a] dark:bg-white/[0.06] dark:text-[#9ca9bc]"
                      }
                    `}
                  >
                    {tab.count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Filters */}
        <div className="shrink-0 space-y-3 border-b border-[#edf0f3] px-5 py-4 dark:border-white/10 sm:px-6">
          <form onSubmit={handleSearch} className="flex gap-2">
            <div className="relative min-w-0 flex-1">
              <Search
                size={15}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9299a5]"
              />

              <input
                value={searchInput}
                onChange={(event) => setSearchInput(event.target.value)}
                placeholder="Search feedback messages..."
                className="
                  h-10 w-full rounded-lg
                  border border-[#e5e8ed]
                  bg-[#fafbfc] pl-9 pr-3
                  text-[12px] text-[#343a46]
                  outline-none transition-all
                  placeholder:text-[#a0a7b2]
                  focus:border-blue-400 focus:ring-2 focus:ring-blue-100
                  dark:border-[#293750]
                  dark:bg-[#151e30]
                  dark:text-[#e8ecf4]
                  dark:placeholder:text-[#78859a]
                  dark:focus:border-blue-400/50
                  dark:focus:ring-blue-400/10
                "
              />
            </div>

            <button
              type="submit"
              className="
                flex h-10 shrink-0 items-center gap-1.5
                rounded-lg bg-[#244074] px-3.5
                text-[11px] font-semibold text-white
                transition-colors hover:bg-[#1c345f]
              "
            >
              <Search size={13} />
              Search
            </button>
          </form>

          <div className="flex min-h-4 items-center justify-between gap-2 px-1">
            <p className="text-[10px] text-[#929baa] dark:text-[#8491a6]">
              {isSearchDebouncing
                ? "Updating search..."
                : appliedSearch
                  ? `Results for "${appliedSearch}"`
                  : "Search across your feedback messages"}
            </p>

            {(isSearchDebouncing || isSearching) && (
              <span className="inline-flex shrink-0 items-center gap-1.5 text-[10px] font-medium text-[#244074] dark:text-blue-300">
                <Loader2 size={11} className="animate-spin" />
                {isSearchDebouncing ? "Waiting..." : "Searching..."}
              </span>
            )}
          </div>

          <div className="flex flex-wrap items-start justify-between gap-3">
            {/* Style filter */}
            <div className="min-w-0 flex-1 space-y-2.5">
              <div className="flex items-center gap-0">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center  text-[#7b8798] dark:text-[#9ca9bc]">
                  <Filter size={13} />
                </div>

                <span className="text-[10px] font-semibold uppercase tracking-wide text-[#929baa] dark:text-[#8491a6]">
                  Filter by style
                </span>

                {selectedStyles.length > 0 && (
                  <span className="ml-2 rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-semibold text-blue-700 dark:bg-blue-400/10 dark:text-blue-300">
                    {selectedStyles.length} selected
                  </span>
                )}
              </div>

              <div className="flex flex-wrap gap-1.5">
                <button
                  type="button"
                  aria-pressed={selectedStyles.length === 0}
                  onClick={() => setSelectedStyles([])}
                  className={`
                    rounded-lg border px-2.5 py-1.5
                    text-[10px] font-semibold
                    transition-all duration-200
                    ${
                      selectedStyles.length === 0
                        ? "border-[#244074] bg-[#244074] text-white shadow-sm dark:border-blue-400 dark:bg-blue-400/15 dark:text-blue-300"
                        : "border-[#e5e8ed] bg-white text-[#778194] hover:border-blue-300 hover:text-[#244074] dark:border-white/10 dark:bg-white/[0.03] dark:text-[#9ca9bc] dark:hover:border-blue-400/40 dark:hover:text-blue-300"
                    }
                  `}
                >
                  All styles
                </button>

                {styleOptions.map((style) => {
                  const active = selectedStyles.includes(style.id);

                  return (
                    <button
                      key={style.id}
                      type="button"
                      aria-pressed={active}
                      onClick={() => {
                        setSelectedStyles((previous) =>
                          active
                            ? previous.filter((id) => id !== style.id)
                            : [...previous, style.id],
                        );
                      }}
                      className={`
                        rounded-lg border px-2.5 py-1.5
                        text-[10px] font-semibold
                        transition-all duration-200
                        ${
                          active
                            ? "border-blue-300 bg-blue-50 text-blue-700 dark:border-blue-400/30 dark:bg-blue-400/10 dark:text-blue-300"
                            : "border-[#e5e8ed] bg-white text-[#778194] hover:border-blue-300 hover:text-[#244074] dark:border-white/10 dark:bg-white/[0.03] dark:text-[#9ca9bc] dark:hover:border-blue-400/40 dark:hover:text-blue-300"
                        }
                      `}
                    >
                      {style.title}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Clear all active filters */}
            {hasActiveFilters && (
              <button
                type="button"
                onClick={handleClearFilters}
                className="
                  inline-flex h-8 shrink-0 items-center gap-1.5
                  rounded-lg px-2.5
                  text-[11px] font-semibold
                  text-[#7b8798]
                  transition-all duration-200
                  hover:bg-red-50 hover:text-red-600
                  dark:text-[#9ca9bc]
                  dark:hover:bg-red-400/10 dark:hover:text-red-300
                "
              >
                <X size={12} />
                Clear filters
              </button>
            )}
          </div>
        </div>

        {/* History list */}
        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4 sm:px-6">
          {isInitialLoading ? (
            <div className="flex min-h-[240px] flex-col items-center justify-center gap-3">
              <Loader2
                size={23}
                className="animate-spin text-blue-600 dark:text-blue-300"
              />

              <p className="text-[12px] text-[#89909c] dark:text-[#9ca9bc]">
                Loading feedback history...
              </p>
            </div>
          ) : isError ? (
            <div className="flex min-h-[240px] flex-col items-center justify-center text-center">
              <p className="text-[13px] font-semibold text-[#424955] dark:text-[#e8ecf4]">
                Couldn&lsquo;t load feedback history
              </p>

              <p className="mt-1 text-[11px] text-[#89909c] dark:text-[#9ca9bc]">
                {historyQuery.error instanceof Error
                  ? historyQuery.error.message
                  : "Please try again."}
              </p>

              <button
                type="button"
                onClick={() => historyQuery.refetch()}
                className="mt-4 rounded-lg bg-[#244074] px-4 py-2 text-[11px] font-semibold text-white hover:bg-[#1c345f]"
              >
                Try again
              </button>
            </div>
          ) : items.length === 0 ? (
            <div className="feedback-content-enter flex min-h-[260px] flex-col items-center justify-center text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#f1f3f6] text-[#9299a5] dark:bg-white/[0.06] dark:text-[#8491a6]">
                <History size={21} />
              </div>

              <p className="mt-4 text-[13px] font-semibold text-[#424955] dark:text-[#e8ecf4]">
                No feedback found
              </p>

              <p className="mt-1 max-w-xs text-[11px] leading-relaxed text-[#89909c] dark:text-[#9ca9bc]">
                {appliedSearch
                  ? `No messages found for "${appliedSearch}". Try another keyword.`
                  : "Approved and disapproved messages will appear here once feedback is submitted."}
              </p>
            </div>
          ) : hasNoStyleMatches ? (
            <div
              key={selectedStyles.join("-")}
              className="feedback-content-enter flex min-h-[260px] flex-col items-center justify-center text-center"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#f1f3f6] text-[#9299a5] dark:bg-white/[0.06] dark:text-[#8491a6]">
                <Filter size={21} />
              </div>

              <p className="mt-4 text-[13px] font-semibold text-[#424955] dark:text-[#e8ecf4]">
                No matching styles
              </p>

              <p className="mt-1 max-w-xs text-[11px] leading-relaxed text-[#89909c] dark:text-[#9ca9bc]">
                No loaded feedback messages match the selected styles. Try
                selecting different styles or load more records.
              </p>

              <button
                type="button"
                onClick={() => setSelectedStyles([])}
                className="mt-4 rounded-lg border border-[#e2e6ed] px-3.5 py-2 text-[11px] font-semibold text-[#596579] transition-colors hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700 dark:border-[#293750] dark:text-[#aab4c4] dark:hover:border-blue-400/40 dark:hover:bg-blue-400/10 dark:hover:text-blue-300"
              >
                Clear style selection
              </button>
            </div>
          ) : (
            <div
              key={`${decision}-${appliedSearch}-${selectedStyles.join(",")}`}
              className="space-y-3 feedback-content-enter"
            >
              {filteredItems.map((item, index) => {
                const approved = item.decision === "approved";

                return (
                  <article
                    key={item._id}
                    className="
    group relative grid grid-cols-[4px_minmax(0,1fr)]
    overflow-hidden rounded-xl
    border border-[#E5EAF1]
    bg-gradient-to-br from-white to-[#FAFCFF]
    shadow-[0_2px_10px_rgba(35,55,85,0.035)]
    transition-all duration-300
    hover:-translate-y-0.5
    hover:border-[#CCD7E6]
    hover:shadow-[0_8px_24px_rgba(35,55,85,0.075)]
    dark:border-[#30425C]
    dark:from-[#1D2B42]
    dark:to-[#19263B]
    dark:shadow-[0_3px_12px_rgba(0,0,0,0.12)]
    dark:hover:border-[#435A79]
    dark:hover:shadow-[0_10px_28px_rgba(0,0,0,0.22)]
  "
                    style={{
                      animationDelay: `${Math.min(index * 35, 210)}ms`,
                    }}
                  >
                    {/* Status rail */}
                    <div
                      className={
                        approved
                          ? "bg-[#159B70] dark:bg-[#34D399]"
                          : "bg-[#DB596E] dark:bg-[#FB8294]"
                      }
                    />

                    <div className="min-w-0 p-4 sm:p-5">
                      {/* Top metadata */}
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div className="flex min-w-0 flex-wrap items-center gap-2">
                          <span
                            className={`
            inline-flex items-center gap-1.5
            text-[10px] font-bold uppercase tracking-[0.08em]
            ${
              approved
                ? "text-[#13865F] dark:text-[#55DDAA]"
                : "text-[#CE4C63] dark:text-[#FF92A1]"
            }
          `}
                          >
                            <span
                              className={`h-1.5 w-1.5 rounded-full ${
                                approved
                                  ? "bg-[#159B70] dark:bg-[#34D399]"
                                  : "bg-[#DB596E] dark:bg-[#FB8294]"
                              }`}
                            />

                            {approved ? "Approved" : "Disapproved"}
                          </span>

                          <span className="h-3 w-px bg-[#E3E8EF] dark:bg-[#3B4D67]" />

                          <span className="max-w-[180px] truncate text-[10px] font-medium text-[#718096] dark:text-[#AAB9CD]">
                            {item.styleTitle || item.styleId || "Unknown style"}
                          </span>
                        </div>

                        <span className="inline-flex shrink-0 items-center gap-1.5 text-[10px] font-medium text-[#8995A6] dark:text-[#91A2B8]">
                          <Clock3 size={12} />
                          {formatDate(item.updatedAt || item.createdAt)}
                        </span>
                      </div>

                      {/* Message */}
                      <div className="relative mt-4">
                        <span
                          aria-hidden="true"
                          className={`
          absolute -left-0.5 -top-3
          select-none font-serif text-[34px]
          leading-none opacity-40
          ${
            approved
              ? "text-[#159B70] dark:text-[#34D399]"
              : "text-[#DB596E] dark:text-[#FB8294]"
          }
        `}
                        >
                          “
                        </span>

                        <p className="whitespace-pre-wrap break-words pl-5 text-[12px] leading-[1.9] text-[#35445A] dark:text-[#DCE5F0]">
                          {item.message}
                        </p>
                      </div>

                      {/* Rejection reason */}
                      {!approved && item.rejectionReason && (
                        <div className="mt-4 border-l-2 border-[#E6A0AA] py-1 pl-3 dark:border-[#C9687C]">
                          <p className="text-[9px] font-bold uppercase tracking-[0.1em] text-[#C74D63] dark:text-[#FF92A1]">
                            Why it was rejected
                          </p>

                          <p className="mt-1 whitespace-pre-wrap break-words text-[11px] leading-relaxed text-[#8D5965] dark:text-[#D8AAB3]">
                            {item.rejectionReason}
                          </p>
                        </div>
                      )}

                      {/* Footer */}
                      <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-dashed border-[#E3E8EF] pt-3 dark:border-[#35465F]">
                        <div className="flex items-center gap-2 text-[10px] text-[#8793A5] dark:text-[#9EADC1]">
                          <CalendarDays size={12} />

                          <span>{item.periodKind}</span>

                          <span className="text-[#C1CAD6] dark:text-[#566A85]">
                            /
                          </span>

                          <span className="font-medium text-[#5E6C82] dark:text-[#C0CDDC]">
                            {item.periodId}
                          </span>
                        </div>

                        <span
                          className={`text-[9px] font-semibold tracking-wide ${
                            approved
                              ? "text-[#13865F] dark:text-[#55DDAA]"
                              : "text-[#CE4C63] dark:text-[#FF92A1]"
                          }`}
                        >
                          {approved ? "APPROVED FEEDBACK" : "REJECTED FEEDBACK"}
                        </span>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}

          {/* Load more */}
          {!isError && canLoadMore && (
            <div className="flex justify-center pt-5">
              <button
                type="button"
                disabled={historyQuery.isFetching}
                onClick={() => setPage((previous) => previous + 1)}
                className="
                  inline-flex items-center gap-2
                  rounded-lg border border-[#e2e6ed]
                  bg-white px-4 py-2.5
                  text-[11px] font-semibold text-[#596579]
                  transition-colors hover:border-blue-300
                  hover:bg-blue-50 hover:text-blue-700
                  disabled:cursor-not-allowed disabled:opacity-50
                  dark:border-[#293750]
                  dark:bg-[#182338]
                  dark:text-[#aab4c4]
                  dark:hover:border-blue-400/40
                  dark:hover:bg-blue-400/10
                  dark:hover:text-blue-300
                "
              >
                {historyQuery.isFetching ? (
                  <>
                    <Loader2 size={13} className="animate-spin" />
                    Loading...
                  </>
                ) : (
                  "Load more"
                )}
              </button>
            </div>
          )}

          {!isError && items.length > 0 && (
            <p className="mt-4 text-center text-[10px] text-[#9299a5] dark:text-[#8491a6]">
              Showing {filteredItems.length} matching records from{" "}
              {items.length} loaded ·{" "}
              {historyQuery.data?.pagination.total ?? items.length} total
              records
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
