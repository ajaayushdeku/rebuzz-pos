export default function StatSkeleton() {
  return (
    <div className="border w-full px-3 md:px-6 py-4 md:py-6 rounded-lg shadow-md animate-pulse">
      {/* Label + icon row */}
      <div className="flex justify-between items-end">
        <div className="h-3 w-24 bg-gray-100 rounded" />
        <div className="w-4 h-4 bg-gray-100 rounded mb-1" />
      </div>

      {/* Value */}
      <div className="py-4">
        <div className="h-7 w-32 bg-gray-100 rounded mb-3" />

        <div className="flex items-center gap-1.5">
          <div className="w-4 h-4 bg-gray-100 rounded" />
          <div className="h-3 w-8 bg-gray-100 rounded" />
          <div className="h-3 w-28 bg-gray-100 rounded" />
        </div>
      </div>
    </div>
  );
}
