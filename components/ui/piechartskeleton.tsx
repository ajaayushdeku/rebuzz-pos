// components/ui/PieChartSkeleton.tsx
export default function PieChartSkeleton() {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-6 w-full animate-pulse dark:bg-[#161d2e] dark:border-white/10">
      {/* Header */}
      <div className="h-4 w-36 bg-gray-100 rounded mb-1 dark:bg-white/10" />
      <div className="h-3 w-52 bg-gray-100 rounded mb-6 dark:bg-white/10" />

      {/* Donut */}
      <div className="flex items-center justify-center py-2">
        <div className="relative w-41 h-41">
          {/* Outer ring */}
          <div className="w-full h-full rounded-full bg-gray-100 dark:bg-white/10" />
          {/* Inner cutout */}
          {/* The hole: a disc in the card's own colour, so it has to
              follow the card rather than staying white. */}
          <div className="absolute inset-6.75 rounded-full bg-white dark:bg-[#161d2e]" />
        </div>
      </div>

      {/* Legend rows */}
      <div className="mt-4 space-y-3 px-2">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex items-center justify-between">
            {/* Dot + label */}
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-gray-100 shrink-0 dark:bg-white/10" />
              <div className="h-3 w-20 bg-gray-100 rounded dark:bg-white/10" />
            </div>
            {/* Progress bar */}
            <div className="flex-1 mx-4 h-1.5 rounded-full bg-gray-100 dark:bg-white/10" />
            {/* Percentage */}
            <div className="h-3 w-8 bg-gray-100 rounded dark:bg-white/10" />
          </div>
        ))}
      </div>
    </div>
  );
}
