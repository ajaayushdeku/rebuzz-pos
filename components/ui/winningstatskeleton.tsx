/** Matches WinningStatBox — a tall, solid, rounded-2xl coloured tile. */
export default function WinningStatSkeleton() {
  return (
    <div className="relative w-full px-6 pt-4 pb-6 bg-gray-200 rounded-2xl overflow-hidden lg:min-h-[180px] sm:min-h-[120px] flex flex-col justify-center animate-pulse dark:bg-white/10">
      {/* Ghost icon top-right */}
      <div className="absolute -top-2 -right-2 w-20 h-20 rounded-2xl bg-gray-300/50 dark:bg-white/15" />

      <div className="relative z-10">
        {/* Label */}
        <div className="h-3 w-24 bg-gray-300/70 rounded mb-5 dark:bg-white/15" />

        <div className="flex flex-row justify-between items-center">
          <div>
            {/* Value */}
            <div className="h-6 w-28 bg-gray-300/80 rounded mb-2 dark:bg-white/15" />
            {/* Footer */}
            <div className="h-3 w-20 bg-gray-300/60 rounded dark:bg-white/15" />
          </div>
          {/* Icon */}
          <div className="w-10 h-10 rounded-lg bg-gray-300/60 dark:bg-white/15" />
        </div>
      </div>
    </div>
  );
}
