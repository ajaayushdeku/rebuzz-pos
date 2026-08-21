/**
 * `salesByAllEmployee` reports one row per (employee, name-at-time-of-sale).
 * An employee who is renamed mid-period therefore comes back as two rows that
 * share an `_id` — for example:
 *
 *   { _id: "6a86bc…", name: "AJDEKU DEMON",  totalSales: 4, totalRevenue: 5629.25 }
 *   { _id: "6a86bc…", name: "Barsha Gurung", totalSales: 6, totalRevenue: 3604.50 }
 *
 * Left unmerged that one person is counted as two: charts draw two series,
 * per-employee maxima are understated (5629.25 instead of 9233.75 above), and
 * any `Map` keyed on `_id` silently keeps only the last row it saw.
 *
 * Every consumer of that endpoint has to merge, so the merge lives here rather
 * than being reimplemented per call site.
 */

/** The fields the merge touches. Callers keep whatever else they carry. */
export type MergeableEmployeeSales<TBill> = {
  _id: string;
  totalSales?: number;
  totalRevenue?: number;
  totalRefunds?: number;
  refundedAmount?: number;
  bills?: TBill[];
};

/**
 * Collapse duplicate rows onto one row per `_id`, summing the totals and
 * concatenating the bills.
 *
 * The surviving `name` is whichever row came first, which may be the employee's
 * *old* name — resolve the display name from the live user records instead
 * (see `fetchEmployeeNameMap` in services/dashboardServices/apiStaff.ts).
 */
export function mergeEmployeeSalesById<
  TBill,
  T extends MergeableEmployeeSales<TBill>,
>(employees: T[]): T[] {
  const merged = new Map<string, T>();

  for (const employee of employees) {
    const existing = merged.get(employee._id);

    if (!existing) {
      merged.set(employee._id, {
        ...employee,
        bills: [...(employee.bills ?? [])],
      });
      continue;
    }

    existing.totalSales =
      (existing.totalSales ?? 0) + (employee.totalSales ?? 0);
    existing.totalRevenue =
      (existing.totalRevenue ?? 0) + (employee.totalRevenue ?? 0);
    existing.totalRefunds =
      (existing.totalRefunds ?? 0) + (employee.totalRefunds ?? 0);
    existing.refundedAmount =
      (existing.refundedAmount ?? 0) + (employee.refundedAmount ?? 0);
    existing.bills = [...(existing.bills ?? []), ...(employee.bills ?? [])];
  }

  return Array.from(merged.values());
}
