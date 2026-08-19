"use client";

import { AlertTriangle, RefreshCcw } from "lucide-react";

interface ErrorStateProps {
  /** What failed, in the user's terms — "Couldn't load invoices". */
  title?: string;
  message?: string;
  /** Wire to react-query's `refetch` to retry without a full page reload. */
  onRetry?: () => void;
  /** Set while the retry is in flight. */
  isRetrying?: boolean;
}

/**
 * Full-width error panel for a page section whose data failed to load.
 *
 * Sits *inside* the page shell rather than replacing it, so the header and
 * navigation stay put — a failed fetch shouldn't strand the user on a blank
 * screen with no way back.
 */
export default function ErrorState({
  title = "Something went wrong",
  message = "We couldn't load this data. Please try again.",
  onRetry,
  isRetrying = false,
}: ErrorStateProps) {
  return (
    <div className="flex flex-col items-center justify-center bg-white px-6 py-16 text-center">
      <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-red-50">
        <AlertTriangle size={24} className="text-red-500" />
      </div>

      <p className="text-sm font-semibold text-gray-900">{title}</p>
      <p className="mt-1 max-w-sm text-xs text-gray-400">{message}</p>

      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          disabled={isRetrying}
          className="mt-5 flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-[13px] font-semibold text-white shadow-sm transition hover:bg-blue-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <RefreshCcw size={14} className={isRetrying ? "animate-spin" : ""} />
          {isRetrying ? "Retrying..." : "Try again"}
        </button>
      )}
    </div>
  );
}
