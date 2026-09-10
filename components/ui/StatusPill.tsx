"use client";

/**
 * The status chip the credit table introduced: a bordered, hatched pill.
 *
 * Extracted so the invoice and bill tables read the same rather than each
 * inventing its own badge — the same word meant the same thing in three
 * places and looked different in all three.
 *
 * The hatching is what separates it from a plain coloured badge. It survives
 * on a printed or greyscale copy, where a flat fill of the same lightness
 * would not.
 */
export type StatusTone =
  "positive" | "negative" | "neutral" | "warning" | "notice";

const TONES: Record<StatusTone, { className: string; rgb: string }> = {
  positive: {
    className: "text-green-700 border-green-200",
    rgb: "134, 239, 172",
  },
  negative: { className: "text-red-700 border-red-200", rgb: "252, 165, 165" },
  neutral: { className: "text-gray-600 border-gray-300", rgb: "156, 163, 175" },
  warning: {
    className: "text-orange-700 border-orange-200",
    rgb: "251, 146, 60",
  },
  notice: {
    className: "text-violet-700 border-violet-300",
    rgb: "167, 139, 250",
  },
};

/**
 * The tone a status word carries, for the statuses used across these tables.
 *
 * Unknown words fall to neutral rather than to a colour that would assert
 * something about a state nobody has described here.
 */
export function statusTone(status: string): StatusTone {
  switch (status.trim().toLowerCase()) {
    case "paid":
    case "completed":
      return "positive";
    case "unpaid":
    case "overdue":
    case "ongoing":
      return "negative";
    case "refunded":
      return "warning";
    case "credited":
      return "notice";
    default:
      return "neutral";
  }
}

export default function StatusPill({
  label,
  tone,
  className = "",
}: {
  label: string;
  /** Defaults to whatever `statusTone` makes of the label. */
  tone?: StatusTone;
  className?: string;
}) {
  const { className: toneClass, rgb } = TONES[tone ?? statusTone(label)];

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-sm text-xs font-semibold border capitalize relative overflow-hidden ${toneClass} ${className}`}
      style={{
        backgroundImage: `repeating-linear-gradient(45deg, transparent, transparent 2px, rgba(${rgb}, 0.2) 2px, rgba(${rgb}, 0.2) 4px)`,
        backgroundColor: `rgba(${rgb}, 0.3)`,
      }}
    >
      {label}
    </span>
  );
}
