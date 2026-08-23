import { createElement } from "react";
import { tierIcon } from "./loyaltyStatusConfig";

/**
 * The tier pill — icon, name, tinted ring. Shared by the ladder table and the
 * add/edit modal's preview so the preview cannot drift from the real thing.
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
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ring-current/25 ${bgColor} ${color}`}
    >
      {createElement(tierIcon(name), { className: "h-3 w-3" })}
      {name}
    </span>
  );
}
