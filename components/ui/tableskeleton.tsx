export default function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-6 w-full animate-pulse dark:bg-[#161d2e] dark:border-white/10">
      {/* Header */}
      <div className="h-4 w-36 bg-gray-100 rounded mb-1 dark:bg-white/10" />
      <div className="h-3 w-52 bg-gray-100 rounded mb-6 dark:bg-white/10" />

      {/* Table header row */}
      <div className="flex gap-4 mb-3 px-2">
        <div className="h-3 w-24 bg-gray-100 rounded dark:bg-white/10" />
        <div className="h-3 w-16 bg-gray-100 rounded ml-auto dark:bg-white/10" />
        <div className="h-3 w-16 bg-gray-100 rounded dark:bg-white/10" />
        <div className="h-3 w-16 bg-gray-100 rounded dark:bg-white/10" />
      </div>

      {/* Divider */}
      <div className="h-px bg-gray-100 mb-3 dark:bg-white/10" />

      {/* Table rows */}
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 py-2.5 px-2">
          {/* Avatar + name */}
          <div className="flex items-center gap-2 flex-1">
            <div className="w-8 h-8 rounded-full bg-gray-100 shrink-0 dark:bg-white/10" />
            <div className="h-3 w-24 bg-gray-100 rounded dark:bg-white/10" />
          </div>
          {/* Columns */}
          <div className="h-3 w-16 bg-gray-100 rounded dark:bg-white/10" />
          <div className="h-3 w-16 bg-gray-100 rounded dark:bg-white/10" />
          {/* Badge */}
          <div className="h-5 w-14 bg-gray-100 rounded-full dark:bg-white/10" />
        </div>
      ))}
    </div>
  );
}
