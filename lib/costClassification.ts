/**
 * Fixed vs variable cost classification for expense purposes.
 *
 * Extracted from CostHealth so that every component reasoning about cost
 * behaviour — the cost-health cards, break-even, and anything added later —
 * answers "is this fixed?" the same way. Two copies of this heuristic would
 * quietly diverge, and the first symptom would be two cards on the same page
 * disagreeing about payroll.
 *
 * Purposes are user-created free text, so this is a heuristic over names and
 * icons, not a guarantee. Callers that care about the residue should use
 * `classifyExpenses`, which reports what it could not place.
 */

/** Icons that represent fixed costs (don't change much month to month). */
const FIXED_ICON_KEYS = new Set([
  "home",
  "lightbulb",
  "school",
  "monitor_heart",
  "smartphone",
  "book",
]);

/** Purpose-name fragments that indicate a cost which recurs regardless of sales. */
const FIXED_NAME_FRAGMENTS = [
  "rent",
  "housing",
  "utilities",
  "insurance",
  "subscription",
  "phone",
  "internet",
  "education",
  "health",
  // Payroll counts as fixed here: staff are paid whether or not the tills ring.
  // Prime-cost analysis treats labour as controllable instead — same money,
  // different question — so keep that distinction in the caller, not here.
  "salary",
];

export function isFixedCost(icon: string, name: string): boolean {
  const iconKey = (icon || "").toLowerCase();
  if (FIXED_ICON_KEYS.has(iconKey)) return true;

  const nameKey = (name || "").toLowerCase();
  return FIXED_NAME_FRAGMENTS.some((fragment) => nameKey.includes(fragment));
}

/** Whether a purpose name or icon was recognised by either rule above. */
export function isRecognisedCostPurpose(icon: string, name: string): boolean {
  return isFixedCost(icon, name);
}

export interface ExpenseForClassification {
  amount: number;
  /** Purpose name, already resolved from the purpose id. */
  name: string;
  /** Purpose icon key, already resolved from the purpose id. */
  icon: string;
}

export interface ClassifiedExpenses {
  fixed: number;
  variable: number;
  /**
   * Purpose names that matched no fixed-cost rule and were therefore counted
   * as variable.
   *
   * Surfaced rather than swallowed because the fallback is not neutral: an
   * unrecognised fixed cost lands in `variable`, which lowers the break-even
   * point and makes the business look safer than it is. Callers should show
   * this count so the optimism is visible.
   */
  unclassified: string[];
}

/**
 * Split expense amounts into fixed and variable, reporting what fell through.
 */
export function classifyExpenses(
  expenses: ExpenseForClassification[],
): ClassifiedExpenses {
  let fixed = 0;
  let variable = 0;
  const unclassified = new Set<string>();

  for (const expense of expenses) {
    const amount = Number(expense.amount) || 0;
    if (isFixedCost(expense.icon, expense.name)) {
      fixed += amount;
    } else {
      variable += amount;
      if (expense.name) unclassified.add(expense.name);
    }
  }

  return { fixed, variable, unclassified: Array.from(unclassified) };
}
