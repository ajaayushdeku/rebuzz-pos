/** Matches AIBusinessStory — a w-[60%] text-story card (header + text lines + footer). */
export default function StorySkeleton() {
  return (
    <div className="bg-white w-[60%] rounded-2xl border border-gray-100 shadow-sm overflow-hidden animate-pulse">
      {/* Header */}
      <div className="flex items-center justify-between px-6 pt-5 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gray-100 shrink-0" />
          <div>
            <div className="h-3.5 w-40 bg-gray-100 rounded mb-2" />
            <div className="h-3 w-28 bg-gray-100 rounded" />
          </div>
        </div>
        <div className="h-6 w-16 bg-gray-100 rounded-full" />
      </div>

      {/* Story body — flowing text lines */}
      <div className="px-6 pb-4 space-y-2.5">
        <div className="h-3 w-full bg-gray-100 rounded" />
        <div className="h-3 w-11/12 bg-gray-100 rounded" />
        <div className="h-3 w-full bg-gray-100 rounded" />
        <div className="h-3 w-10/12 bg-gray-100 rounded" />
        <div className="h-3 w-2/3 bg-gray-100 rounded" />
      </div>

      {/* Footer nav */}
      <div className="border-t border-gray-100 px-6 py-4 flex items-center justify-center">
        <div className="h-3 w-48 bg-gray-100 rounded" />
      </div>
    </div>
  );
}
