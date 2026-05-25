const BAR_HEIGHTS = [65, 85, 50, 90, 70, 55, 80];

const ChartSkeleton = () => {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-6 w-full h-64 animate-pulse">
      <div className="h-4 w-32 bg-gray-100 rounded mb-2" />
      <div className="h-3 w-48 bg-gray-100 rounded mb-6" />
      <div className="flex items-end gap-2 h-32">
        {BAR_HEIGHTS.map((height, i) => (
          <div
            key={i}
            className="flex-1 bg-gray-100 rounded-t"
            style={{ height: `${height}%` }}
          />
        ))}
      </div>
    </div>
  );
};

export default ChartSkeleton;
