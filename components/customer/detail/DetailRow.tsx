import type { ReactNode } from "react";

/**
 * Icon, small caps label, value — the row shape used by both the customer
 * information card and the loyalty card's quick stats, which had two identical
 * copies of this markup.
 */
export default function DetailRow({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value: ReactNode;
}) {
  return (
    <div className="flex items-start gap-3 border-b border-gray-50 py-2.5 last:border-b-0">
      <div className="mt-0.5 shrink-0 text-gray-400">{icon}</div>
      <div className="min-w-0 flex-1">
        <p className="text-[10px] font-medium uppercase tracking-wider text-gray-400">
          {label}
        </p>
        <p className="break-words text-sm font-medium text-gray-900">
          {value ?? "—"}
        </p>
      </div>
    </div>
  );
}
