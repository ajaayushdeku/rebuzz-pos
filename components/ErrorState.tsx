import { AlertTriangle } from "lucide-react";

/* ── Error State ── */
export const ErrorState = ({ message }: { message: string }) => {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="w-14 h-14 rounded-2xl bg-red-50 flex items-center justify-center mb-4 ring-1 ring-red-100">
        <AlertTriangle size={26} className="text-red-400" />
      </div>
      <h3 className="text-sm font-semibold text-gray-800 mb-1">
        Unable to load hourly sales
      </h3>
      <p className="text-xs text-gray-400 max-w-xs leading-relaxed">
        {message}
      </p>
    </div>
  );
};
