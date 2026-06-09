"use client";

import { useEffect } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Dashboard error:", error);
  }, [error]);

  return (
    <div className="min-h-[60vh] flex items-center justify-center px-6">
      <div className="text-center max-w-sm">
        {/* Icon */}
        <div className="w-14 h-14 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-5">
          <AlertTriangle size={24} className="text-red-500" />
        </div>

        {/* Text */}
        <h2 className="text-gray-900 font-semibold text-lg mb-2">
          Something went wrong
        </h2>
        <p className="text-gray-500 text-sm leading-relaxed mb-1">
          We couldn&lsqou;t load this part of your dashboard.
        </p>
        {error.message && (
          <p className="text-gray-400 text-xs bg-gray-50 border border-gray-100 rounded-lg px-3 py-2 mt-2 mb-6 font-mono break-words">
            {error.message}
          </p>
        )}
        {!error.message && <div className="mb-6" />}

        {/* Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-2">
          <button
            onClick={reset}
            className="flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors w-full sm:w-auto justify-center"
          >
            <RefreshCw size={14} />
            Try again
          </button>

          <a
            href="/dashboard"
            className="flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-gray-600 border border-gray-200 hover:bg-gray-50 rounded-xl transition-colors w-full sm:w-auto justify-center"
          >
            Go to dashboard
          </a>
        </div>
      </div>
    </div>
  );
}
