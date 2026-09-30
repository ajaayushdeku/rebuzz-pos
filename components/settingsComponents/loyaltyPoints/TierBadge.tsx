import { createElement } from "react";
import { tierIcon, withTierDark } from "./loyaltyStatusConfig";

/**
 * The tier pill — icon, name, tinted ring. Shared by the ladder table and the
 * add/edit modal's preview so the preview cannot drift from the real thing.
 *
 * The dark half of the swatch is added here rather than by each caller. A
 * tier's colours are stored by the business, so they arrive as light-mode
 * classes (`bg-yellow-100 text-yellow-700`) with no dark partner; pairing them
 * at the one place that draws them means the table, the modal preview and any
 * future caller cannot disagree. `withTierDark` is idempotent, so a swatch that
 * already carries its dark half passes straight through.
 *
 * `createElement` rather than `const Icon = tierIcon(name)`: aliasing the
 * looked-up component into a capitalised binding during render reads as
 * defining a component and is flagged as such.
 */
export default function TierBadge({
  name,
  color,
  bgColor,
}: {
  name: string;
  /** Text colour class, e.g. "text-yellow-700". */
  color: string;
  /** Background class, e.g. "bg-yellow-100". */
  bgColor: string;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ring-current/25 ${withTierDark(
        bgColor,
      )} ${withTierDark(color)}`}
    >
      {createElement(tierIcon(name), { className: "h-3 w-3" })}
      {name}
    </span>
  );
}
