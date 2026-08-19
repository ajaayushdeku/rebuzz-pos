"use client";

import { Loader2 } from "lucide-react";

interface LoadingStateProps {
  message?: string;
}

/**
 * Full-width loading panel for a page section.
 *
 * Deliberately the same card shell as {@link ErrorState} — the two occupy the
 * same slot below the header, so matching padding and borders stop the page
 * from jumping when a load resolves into a failure.
 */
export default function LoadingState({
  message = "Loading...",
}: LoadingStateProps) {
  return (
    <div className="flex items-center justify-center gap-2 bg-white px-6 py-16 text-center">
      <Loader2 size={18} className="animate-spin text-blue-500" />
      <span className="text-sm text-gray-500">{message}</span>
    </div>
  );
}
