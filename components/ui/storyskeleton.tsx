/** Matches AIBusinessStory — full-width story card (header + status chips + text + priority + footer). */
export default function StorySkeleton() {
  return (
    <div className="bg-white w-full rounded-2xl border border-gray-100 shadow-sm overflow-hidden animate-pulse">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 px-6 pt-5 pb-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-gray-100 shrink-0" />
          <div>
            <div className="h-3.5 w-40 bg-gray-100 rounded mb-2" />
            <div className="h-3 w-28 bg-gray-100 rounded" />
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-8 h-8 rounded-lg bg-gray-100" />
          <div className="w-8 h-8 rounded-lg bg-gray-100" />
        </div>
      </div>

      {/* Status strip — vibe chip + summary counters */}
      <div className="flex flex-wrap items-center gap-2 px-6 pb-4">
        <div className="h-6 w-24 bg-gray-100 rounded-full" />
        <div className="h-6 w-20 bg-gray-100 rounded-full" />
        <div className="h-6 w-24 bg-gray-100 rounded-full" />
        <div className="h-6 w-24 bg-gray-100 rounded-full" />
      </div>

      {/* Story body — flowing text paragraphs, then the priority callout */}
      <div className="px-6 pb-5 space-y-3">
        <div className="space-y-2.5">
          <div className="h-3 w-full bg-gray-100 rounded" />
          <div className="h-3 w-11/12 bg-gray-100 rounded" />
        </div>
        <div className="space-y-2.5">
          <div className="h-3 w-full bg-gray-100 rounded" />
          <div className="h-3 w-10/12 bg-gray-100 rounded" />
          <div className="h-3 w-2/3 bg-gray-100 rounded" />
        </div>
        <div className="h-20 rounded-xl bg-gray-100" />
      </div>

      {/* Footer */}
      <div className="border-t border-gray-100 bg-gray-50/60 px-6 py-3 flex items-center justify-between">
        <div className="h-3 w-32 bg-gray-100 rounded" />
        <div className="h-3 w-36 bg-gray-100 rounded" />
      </div>
    </div>
  );
}
