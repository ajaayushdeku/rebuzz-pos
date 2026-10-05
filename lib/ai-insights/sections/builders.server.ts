import type { Draft, PeriodDescriptor } from "@/lib/ai-insights/periodData.server";
import {
  alreadyShownBriefing,
  currencySymbol,
  fetchCustomerHistory,
  fetchCustomers,
  fetchEmployees,
  fetchMenu,
  fetchReportBills,
  fetchSalesRows,
  fetchSalesRowsByWindow,
} from "@/lib/ai-insights/sections/posData.server";
import {
  HOUR_PLAYBOOK_PROMPT,
  HOUR_PLAYBOOK_SCHEMA,
  HOUR_PLAYBOOK_VERSION,
  buildHourFacts,
  hourBriefing,
  parseHourPlaybook,
} from "@/lib/ai-insights/sections/hourPlaybook";
import {
  RETENTION_PROMPT,
  RETENTION_SCHEMA,
  RETENTION_VERSION,
  buildRetentionFacts,
  parseRetention,
  retentionBriefing,
  retentionWindow,
  usualOrderFrom,
  type CustomerBill,
} from "@/lib/ai-insights/sections/retention";
import {
  STAFFING_PROMPT,
  STAFFING_SCHEMA,
  STAFFING_VERSION,
  buildStaffingFacts,
  parseStaffing,
  staffingBriefing,
  type StaffBill,
} from "@/lib/ai-insights/sections/staffing";
import {
  MENU_SUGGESTIONS_PROMPT,
  MENU_SUGGESTIONS_SCHEMA,
  MENU_SUGGESTIONS_VERSION,
  buildMenuFacts,
  menuBriefing,
  parseMenuSuggestions,
} from "@/lib/ai-insights/sections/menuSuggestions";
import {
  SALES_RECOMMENDATIONS_PROMPT,
  SALES_RECOMMENDATIONS_SCHEMA,
  SALES_RECOMMENDATIONS_VERSION,
  buildSalesFacts,
  parseSalesRecommendations,
  salesBriefing,
} from "@/lib/ai-insights/sections/salesRecommendations";
import {
  SLOW_ITEMS_PROMPT,
  SLOW_ITEMS_SCHEMA,
  SLOW_ITEMS_VERSION,
  buildSlowItemsFacts,
  parseSlowItems,
  slowItemsBriefing,
} from "@/lib/ai-insights/sections/slowItems";
import {
  PRICING_PROMPT,
  PRICING_SCHEMA,
  PRICING_VERSION,
  buildPricingFacts,
  parsePricing,
  pricingBriefing,
} from "@/lib/ai-insights/sections/pricing";
import type { DateWindow, SalesWindows } from "@/lib/ai-insights/sections/shared";

/**
 * How each section turns a period into something the model can answer.
 *
 * One builder per section, all with the same signature, so the route that drives
 * them knows nothing about any of them: it resolves the period, picks the
 * builder, and hands the result to `generateSection`. Adding a section is an
 * entry in `BUILDERS`.
 *
 * What a builder does *not* do is decide whether to generate. That belongs to the
 * route, which has already asked whether an answer is stored — and when one is,
 * none of this runs and no POS report is fetched at all. Under the old day-scoped
 * flow those reports were read on every visit; pricing alone read thirteen.
 *
 * The existing section code is reused exactly as it is. `buildPricingFacts`,
 * `pricingBriefing` and `parsePricing` are the same functions the day-scoped
 * route calls; only the windows they are given have changed, from "the last 30
 * days" to the period's own.
 */

export interface BuilderContext {
  token: string;
  period: PeriodDescriptor;
  /** The period, and the one before it — the baseline every section compares to. */
  windows: SalesWindows;
  /** The period cut up for sections that read a timeline: weeks, or months. */
  slices: DateWindow[];
  /** Cards already on screen, when a further batch is being asked for. */
  exclude: string[];
  /**
   * Which batch is being asked for — 0 for the first answer.
   *
   * Only the sections that append batches use it, and they use it in their card
   * ids: the store drops an appended card whose id it has already seen, so a
   * prefix that stayed the same would make every further batch vanish.
   */
  batch: number;
}

/** A section ready to be generated. */
export interface BuiltSection {
  promptVersion: string;
  systemInstruction: string;
  responseSchema: object;
  briefing: string;
  /** The figures behind the answer, stored so it stays explicable later. */
  basis: Record<string, unknown>;
  /** Anything the UI reads beside the cards — the windows described, mainly. */
  extra?: Record<string, unknown> | null;
  /**
   * The join: the model's answer becomes the cards the UI reads.
   *
   * This is where each section's own `parse*` runs. It has to happen here, while
   * the facts are in hand: the model answers against anonymised references, and
   * the item names, prices and numbers come from the data — so the answer alone
   * cannot be stored and read back later.
   */
  resolve: (answer: unknown, draft: Draft) => unknown[];
}

/**
 * Nothing to analyse.
 *
 * Returned instead of a briefing when the period holds no sales. Stored as a fact
 * so the page can say so and never ask again, and no provider is called — with no
 * figures, a model can only invent.
 */
export interface EmptySection {
  empty: true;
  reason: string;
  /**
   * The section's real prompt version, even though no prompt was used.
   *
   * It is part of the stored key. Recording "no sales" under some other version
   * would leave the next `ensure` — which asks under the real one — finding
   * nothing and generating anyway, which is the one thing this is meant to stop.
   */
  promptVersion: string;
  basis?: Record<string, unknown>;
}

export type SectionBuilder = (
  context: BuilderContext,
) => Promise<BuiltSection | EmptySection>;

export const isEmptySection = (
  built: BuiltSection | EmptySection,
): built is EmptySection => "empty" in built;

/**
 * Pricing Opportunities.
 *
 * Reads the period slice by slice — weeks within a month, months within a
 * quarter or year — because the whole point is a timeline: what happened after a
 * price moved, how much of an item sold discounted, what sells below cost. The
 * report carries no dates on its rows, only one row per price an item sold at, so
 * asking it per slice is what turns those rows into a history.
 */
const pricing: SectionBuilder = async ({ token, period, windows, slices }) => {
  const [weekly, menu] = await Promise.all([
    fetchSalesRowsByWindow(token, slices),
    fetchMenu(token),
  ]);

  const facts = buildPricingFacts(weekly, menu, slices);

  if (facts.itemsSold === 0) {
    return {
      empty: true,
      reason: "NO_SALES",
      promptVersion: PRICING_VERSION,
      basis: { itemsSold: 0, slices: slices.length, from: period.from, to: period.to },
    };
  }

  return {
    promptVersion: PRICING_VERSION,
    systemInstruction: PRICING_PROMPT,
    responseSchema: PRICING_SCHEMA,
    briefing: pricingBriefing(facts, await currencySymbol()),
    basis: {
      itemsSold: facts.itemsSold,
      candidates: facts.candidates.length,
      slices: slices.length,
      from: period.from,
      to: period.to,
    },
    // The same `windows` shape the day-scoped route returned, so the cards render
    // unchanged — it is the period's own window now rather than a rolling month.
    extra: { windows },
    /**
     * Ids are prefixed with the period rather than a timestamp.
     *
     * The old prefix was the generation time, which changed on every answer. A
     * stored insight is read many times, and the page keys dismissals on these
     * ids — so they have to be the same ones tomorrow.
     */
    resolve: (answer) => parsePricing(answer, facts, `pricing-${period.id}`),
  };
};

/**
 * Slow Movers.
 *
 * Needs both windows: an item is slow *compared with* what it did before. The
 * comparison is the period against the period before it — September against
 * August — rather than against a rolling month, which is the whole reason the
 * service hands both windows over.
 */
const slowItems: SectionBuilder = async ({ token, period, windows }) => {
  const [menu, current, previous] = await Promise.all([
    fetchMenu(token),
    fetchSalesRows(token, windows.current),
    fetchSalesRows(token, windows.previous),
  ]);

  const facts = buildSlowItemsFacts(menu, current, previous, windows);

  // Nothing sold in either window: every item would read as slow, which says
  // nothing about the menu.
  const soldBefore = previous.some((row) => (row.count ?? 0) > 0);
  if (facts.totalUnits === 0 && !soldBefore) {
    return {
      empty: true,
      reason: "NO_SALES",
      promptVersion: SLOW_ITEMS_VERSION,
      basis: { totalUnits: 0, from: period.from, to: period.to },
    };
  }
  if (facts.candidates.length === 0) {
    // Sales happened and nothing stood out. Worth storing as its own answer: the
    // page can say so, and it is not the same as having no data.
    return {
      empty: true,
      reason: "NOTHING_FLAGGED",
      promptVersion: SLOW_ITEMS_VERSION,
      basis: { totalUnits: facts.totalUnits, candidates: 0, from: period.from, to: period.to },
    };
  }

  return {
    promptVersion: SLOW_ITEMS_VERSION,
    systemInstruction: SLOW_ITEMS_PROMPT,
    responseSchema: SLOW_ITEMS_SCHEMA,
    briefing: slowItemsBriefing(facts, await currencySymbol()),
    basis: {
      totalUnits: facts.totalUnits,
      candidates: facts.candidates.length,
      from: period.from,
      to: period.to,
    },
    extra: { windows },
    resolve: (answer) =>
      parseSlowItems(answer, facts.candidates, `slow-${period.id}`),
  };
};

/**
 * Menu Ideas.
 *
 * Only the period itself: an idea for a new dish follows from what sold well,
 * not from what sold less than last month.
 *
 * Offers further batches, which is why the id prefix carries the batch number —
 * the store de-duplicates appended cards by id, so a prefix that did not change
 * would make every new batch look like a repeat and be dropped.
 */
const menuSuggestions: SectionBuilder = async ({
  token,
  period,
  windows,
  exclude,
  batch,
}) => {
  const [menu, current] = await Promise.all([
    fetchMenu(token),
    fetchSalesRows(token, windows.current),
  ]);

  const facts = buildMenuFacts(menu, current, windows);

  if (facts.bestSellers.length === 0) {
    return {
      empty: true,
      reason: "NO_SALES",
      promptVersion: MENU_SUGGESTIONS_VERSION,
      basis: { bestSellers: 0, from: period.from, to: period.to },
    };
  }

  return {
    promptVersion: MENU_SUGGESTIONS_VERSION,
    systemInstruction: MENU_SUGGESTIONS_PROMPT,
    responseSchema: MENU_SUGGESTIONS_SCHEMA,
    briefing:
      menuBriefing(facts, await currencySymbol()) +
      // What is already on screen, so a further batch is new rather than the
      // same ideas worded differently.
      alreadyShownBriefing(exclude.length ? { exclude } : null),
    basis: {
      bestSellers: facts.bestSellers.length,
      from: period.from,
      to: period.to,
    },
    extra: { windows },
    resolve: (answer) =>
      parseMenuSuggestions(
        answer,
        menu,
        batch > 0 ? `menu-${period.id}-b${batch}` : `menu-${period.id}`,
        exclude,
      ),
  };
};

/**
 * Sales Recommendations.
 *
 * Both windows, for the same reason as Slow Movers: a recommendation rests on
 * what changed. Also offers further batches.
 */
const salesRecommendations: SectionBuilder = async ({
  token,
  period,
  windows,
  exclude,
  batch,
}) => {
  const [current, previous] = await Promise.all([
    fetchSalesRows(token, windows.current),
    fetchSalesRows(token, windows.previous),
  ]);

  const facts = buildSalesFacts(current, previous, windows);

  if (facts.totals.units === 0) {
    return {
      empty: true,
      reason: "NO_SALES",
      promptVersion: SALES_RECOMMENDATIONS_VERSION,
      basis: { units: 0, from: period.from, to: period.to },
    };
  }

  return {
    promptVersion: SALES_RECOMMENDATIONS_VERSION,
    systemInstruction: SALES_RECOMMENDATIONS_PROMPT,
    responseSchema: SALES_RECOMMENDATIONS_SCHEMA,
    briefing:
      salesBriefing(facts, await currencySymbol()) +
      alreadyShownBriefing(exclude.length ? { exclude } : null),
    basis: {
      units: facts.totals.units,
      sales: facts.totals.sales,
      from: period.from,
      to: period.to,
    },
    extra: { windows },
    resolve: (answer) =>
      parseSalesRecommendations(
        answer,
        batch > 0 ? `sales-${period.id}-b${batch}` : `sales-${period.id}`,
        exclude,
      ),
  };
};

/**
 * Customer Retention.
 *
 * The only section that needs history from *before* the period: "last seen 60
 * days ago" cannot be answered from September alone. So the bills are read over
 * retention's own lookback ending on the period's last day, and the period's end
 * is the date everything is measured from — on a September card, "45 days since
 * their last visit" means 45 days before 30 September, not before today.
 */
const retention: SectionBuilder = async ({ token, period, windows }) => {
  // The reference date, and the end of the lookback. Not today: a historical
  // period's figures must not drift as the calendar moves on.
  const asOf = period.to;

  const [customers, bills] = await Promise.all([
    fetchCustomers(token),
    fetchReportBills<CustomerBill>(token, retentionWindow(asOf)),
  ]);

  if (!bills.some((b) => b.customerId)) {
    return {
      empty: true,
      reason: "NO_SALES",
      promptVersion: RETENTION_VERSION,
      basis: { bills: bills.length, named: 0, from: period.from, to: period.to },
    };
  }

  const candidates = buildRetentionFacts(asOf, customers, bills);
  if (candidates.length === 0) {
    return {
      empty: true,
      reason: "NOTHING_FLAGGED",
      promptVersion: RETENTION_VERSION,
      basis: { customers: customers.length, candidates: 0, from: period.from, to: period.to },
    };
  }

  // What each flagged customer usually orders: one small request each, only for
  // the handful that will appear on the page.
  const histories = await Promise.all(
    candidates.map((c) => fetchCustomerHistory(token, c.customerId)),
  );
  candidates.forEach((candidate, index) => {
    candidate.usualOrder = usualOrderFrom(histories[index]);
  });

  return {
    promptVersion: RETENTION_VERSION,
    systemInstruction: RETENTION_PROMPT,
    responseSchema: RETENTION_SCHEMA,
    briefing: retentionBriefing(candidates, asOf, await currencySymbol()),
    basis: {
      customers: customers.length,
      candidates: candidates.length,
      asOf,
      from: period.from,
      to: period.to,
    },
    extra: { windows },
    resolve: (answer) => parseRetention(answer, candidates),
  };
};

/**
 * Hour Playbook.
 *
 * Per-hour figures over the period, so the window is the period itself —
 * `buildHourFacts` would otherwise average the 28 days before its reference date
 * and call that a quarter.
 */
const hourPlaybook: SectionBuilder = async ({ token, period, windows }) => {
  const periodWindow = { startDate: period.from, endDate: period.to };

  const [bills, menu, salesRows] = await Promise.all([
    fetchReportBills(token, periodWindow),
    fetchMenu(token),
    fetchSalesRows(token, windows.current),
  ]);

  const facts = buildHourFacts(
    period.to,
    bills,
    menu,
    salesRows,
    windows,
    periodWindow,
  );

  if (!facts.enoughData) {
    return {
      empty: true,
      reason: "NO_SALES",
      promptVersion: HOUR_PLAYBOOK_VERSION,
      basis: { totalOrders: facts.totalOrders, from: period.from, to: period.to },
    };
  }
  if (facts.slots.length === 0) {
    return {
      empty: true,
      reason: "NOTHING_FLAGGED",
      promptVersion: HOUR_PLAYBOOK_VERSION,
      basis: {
        totalOrders: facts.totalOrders,
        slots: 0,
        from: period.from,
        to: period.to,
      },
    };
  }

  return {
    promptVersion: HOUR_PLAYBOOK_VERSION,
    systemInstruction: HOUR_PLAYBOOK_PROMPT,
    responseSchema: HOUR_PLAYBOOK_SCHEMA,
    briefing: hourBriefing(facts, await currencySymbol()),
    basis: {
      totalOrders: facts.totalOrders,
      tradingDays: facts.tradingDays,
      slots: facts.slots.length,
      from: period.from,
      to: period.to,
    },
    extra: { windows },
    resolve: (answer) => parseHourPlaybook(answer, facts),
  };
};

/**
 * Staffing.
 *
 * Same reason as the hour playbook: the window is the period, not the 28 days
 * `buildStaffingFacts` would otherwise choose for itself.
 */
const staffing: SectionBuilder = async ({ token, period, windows }) => {
  const periodWindow = { startDate: period.from, endDate: period.to };

  const [bills, employees] = await Promise.all([
    fetchReportBills<StaffBill>(token, periodWindow),
    // The staff list only adds context; a failure leaves it empty rather than
    // losing the section.
    fetchEmployees(token).catch(() => []),
  ]);

  const facts = buildStaffingFacts(period.to, bills, employees, periodWindow);

  if (!facts.enoughData) {
    return {
      empty: true,
      reason: "NO_SALES",
      promptVersion: STAFFING_VERSION,
      basis: {
        totalOrders: facts.totalOrders,
        tradingDays: facts.tradingDays,
        from: period.from,
        to: period.to,
      },
    };
  }
  if (facts.candidates.length === 0) {
    return {
      empty: true,
      reason: "NOTHING_FLAGGED",
      promptVersion: STAFFING_VERSION,
      basis: {
        totalOrders: facts.totalOrders,
        candidates: 0,
        from: period.from,
        to: period.to,
      },
    };
  }

  return {
    promptVersion: STAFFING_VERSION,
    systemInstruction: STAFFING_PROMPT,
    responseSchema: STAFFING_SCHEMA,
    briefing: staffingBriefing(facts, await currencySymbol()),
    basis: {
      totalOrders: facts.totalOrders,
      tradingDays: facts.tradingDays,
      staffListSize: facts.staffListSize,
      candidates: facts.candidates.length,
      from: period.from,
      to: period.to,
    },
    extra: { windows },
    resolve: (answer) => parseStaffing(answer, facts),
  };
};

/**
 * Every period-scoped section, by name.
 *
 * `festival-prep` is absent on purpose: it advises on *coming* festivals, so it
 * has no period to describe and stays on the day-scoped route.
 */
export const BUILDERS: Record<string, SectionBuilder> = {
  pricing,
  "slow-items": slowItems,
  "menu-suggestions": menuSuggestions,
  "sales-recommendations": salesRecommendations,
  retention,
  "hour-playbook": hourPlaybook,
  staffing,
};

export const getBuilder = (section: string): SectionBuilder | null =>
  Object.hasOwn(BUILDERS, section) ? BUILDERS[section] : null;
