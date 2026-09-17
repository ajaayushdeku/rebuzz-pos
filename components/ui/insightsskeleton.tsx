/** Matches BusinessInsightsAlerts — header + sectioned insight list + alert-card grid. */
export default function InsightsSkeleton() {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex flex-col gap-5 animate-pulse">
      {/* Header */}
      <div>
        <div className="h-3.5 w-48 bg-gray-100 rounded mb-2" />
        <div className="h-3 w-64 bg-gray-100 rounded" />
      </div>


      {/* First section: label + 4 insight rows across 2 columns */}
      <div className="h-2.5 w-36 bg-gray-100 rounded" />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="flex items-start gap-3 rounded-xl px-3.5 py-3 border border-gray-100 bg-gray-50"
          >
            <div className="w-4 h-4 rounded-full bg-gray-200 shrink-0 mt-0.5" />
            <div className="flex-1 space-y-1.5">
              <div className="h-2 w-20 bg-gray-200 rounded" />
              <div className="h-2.5 w-full bg-gray-200 rounded" />
              <div className="h-2.5 w-3/4 bg-gray-200 rounded" />
            </div>
          </div>
        ))}
      </div>

      {/* Second section: label + 3 alert cards across 3 columns */}
      <div className="h-2.5 w-28 bg-gray-100 rounded" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className="flex items-start gap-3 rounded-xl px-4 py-4 border border-gray-100 bg-gray-50"
          >
            <div className="w-9 h-9 rounded-lg bg-gray-200 shrink-0" />
            <div className="flex-1 space-y-1.5">
              <div className="h-2.5 w-20 bg-gray-200 rounded" />
              <div className="h-2 w-24 bg-gray-200 rounded" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
