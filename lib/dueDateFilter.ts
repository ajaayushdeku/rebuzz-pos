import { daysFromNepalToday, nepalDateString } from "@/lib/nepalDate";
import type { FilterSelectOption } from "@/components/ui/FilterSelect";

/**
 * Buckets a due date can fall into, for the invoice and credit lists.
 *
 * Deliberately non-overlapping and exhaustive: every row lands in exactly one,
 * so picking each in turn walks the whole list with nothing seen twice and
 * nothing missed. A "due within 7 days" that also caught today would have
 * broken both halves of that.
 *
 * The boundary at a week is where "soon" stops being useful — beyond it the
 * answer is the same however far out the date is.
 */
export type DueDateFilter =
  "all" | "overdue" | "today" | "soon" | "later" | "none";

const SOON_DAYS = 7;

export const DUE_DATE_FILTER_OPTIONS: FilterSelectOption[] = [
  { value: "all", label: "All due dates" },
  { value: "overdue", label: "Overdue" },
  { value: "today", label: "Due today" },
  { value: "soon", label: `Due in ${SOON_DAYS} days` },
  { value: "later", label: "Due later" },
  { value: "none", label: "No due date" },
];

/**
 * Whether a raw due date from the API belongs in the chosen bucket.
 *
 * Takes the raw value rather than a parsed date so callers cannot forget the
 * Nepal conversion — a row filtered on the UTC string would land in the wrong
 * bucket for every date near midnight.
 */
export function matchesDueDateFilter(
  rawDueDate: string | null | undefined,
  filter: DueDateFilter,
): boolean {
  if (filter === "all") return true;

  const days = daysFromNepalToday(nepalDateString(rawDueDate));

  // No date, or one we could not read. Either way there is nothing to compare,
  // so it belongs only in the bucket that asks for exactly that.
  if (days === null) return filter === "none";

  switch (filter) {
    case "overdue":
      return days < 0;
    case "today":
      return days === 0;
    case "soon":
      return days >= 1 && days <= SOON_DAYS;
    case "later":
      return days > SOON_DAYS;
    case "none":
      return false;
    default:
      return true;
  }
}
