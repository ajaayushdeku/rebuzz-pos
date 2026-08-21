/**
 * Fixed targets for the Performance Radar's *rate* metrics.
 *
 * The radar benchmarks two different kinds of metric two different ways:
 *
 *  - **Volumes** (revenue, orders, sales, customers) scale with business size,
 *    season and how many shifts a person worked, so no constant is right for
 *    long. Those are benchmarked peer-relative, against the best-performing
 *    employee in the same date range — see PerformanceRadar.
 *  - **Rates** (average order value, orders per bill, refund rate, shift
 *    length) are already normalised and therefore comparable between people.
 *    A fixed target is meaningful for those, and it lives here.
 *
 * These belong in business settings eventually — this file is the single place
 * to change them until then.
 */

/** Money targets, per currency, because 100 is trivial in NPR and steep in USD. */
const AVG_ORDER_VALUE_TARGET: Record<string, number> = {
  NPR: 1000,
  INR: 800,
  USD: 25,
  EUR: 25,
  GBP: 20,
  AUD: 35,
  CAD: 35,
  JPY: 3000,
  CNY: 150,
  SGD: 35,
  AED: 90,
  SAR: 90,
  NZD: 40,
  KRW: 30000,
  MYR: 100,
  THB: 800,
  PHP: 1200,
  CHF: 25,
  SEK: 250,
  HKD: 200,
  BRL: 120,
};

/** Used when the active currency has no entry above. */
const AVG_ORDER_VALUE_TARGET_DEFAULT = 25;

export function avgOrderValueTarget(currencyCode: string | undefined): number {
  if (!currencyCode) return AVG_ORDER_VALUE_TARGET_DEFAULT;
  return (
    AVG_ORDER_VALUE_TARGET[currencyCode.toUpperCase()] ??
    AVG_ORDER_VALUE_TARGET_DEFAULT
  );
}

export const PERFORMANCE_TARGETS = {
  /** Tickets raised per bill processed. */
  ordersPerSale: 3,

  /**
   * A full working shift, in minutes. The previous value here was 6000 —
   * 100 hours — which no one can average, so the axis sat at zero forever.
   */
  avgShiftMinutes: 480,
} as const;
