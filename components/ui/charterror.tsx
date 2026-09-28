interface ChartErrorProps {
  resetErrorBoundary?: () => void;
}

const ChartError = ({ resetErrorBoundary }: ChartErrorProps) => {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-6 w-full h-64 flex flex-col items-center justify-center gap-2 dark:bg-[#161d2e] dark:border-white/10">
      <p className="text-gray-600 font-medium text-sm dark:text-[#c3ccdc]">
        Failed to load chart
      </p>
      <p className="text-gray-400 text-xs dark:text-[#9aa6bd]">
        Please refresh the page
      </p>
      {resetErrorBoundary && (
        <button
          onClick={resetErrorBoundary}
          className="px-4 py-2 text-sm text-white bg-blue-500 hover:bg-blue-600 rounded-xl transition-colors"
        >
          Try again
        </button>
      )}
    </div>
  );
};

export default ChartError;
