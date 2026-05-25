"use client";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center h-96 gap-4">
      <p className="text-gray-700 font-semibold">
        Something went wrong loading your
        dashboard
      </p>
      <p className="text-gray-400 text-sm">
        {error.message}
      </p>
      <button
        onClick={reset}
        className="px-4 py-2 text-sm text-white bg-blue-500 hover:bg-blue-600 rounded-xl transition-colors"
      >
        Try again
      </button>
    </div>
  );
}
