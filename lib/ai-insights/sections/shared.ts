/**
 * Pieces every AI Insights section shares: date windows, the sales report's
 * row shape, a few number helpers, matching a sales row to a menu product,
 * and the shape a section's route returns.
 *
 * Pure and free of server imports, so the page can use the types and the
 * tests can use the functions.
 */

// ── Windows ───────────────────────────────────────────────────────────────

/** Days in a section's window, and in the window it is compared with. */
export const SECTION_WINDOW_DAYS = 30;

export interface DateWindow {
  startDate: string;
  endDate: string;
}

export interface SalesWindows {
  current: DateWindow;
  previous: DateWindow;
}

export function shiftIsoDate(iso: string, days: number): string {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d + days)).toISOString().slice(0, 10);
}

/**
 * The last 30 days including today, and the 30 days before those.
 *
 * A fixed window rather than a date filter: advice needs enough sales behind
 * it to mean something, and it should not change — or cost another AI call —
 * every time someone flips a filter.
 */
export function salesWindows(today: string): SalesWindows {
  const currentStart = shiftIsoDate(today, -(SECTION_WINDOW_DAYS - 1));
  return {
    current: { startDate: currentStart, endDate: today },
    previous: {
      startDate: shiftIsoDate(currentStart, -SECTION_WINDOW_DAYS),
      endDate: shiftIsoDate(currentStart, -1),
    },
  };
}

// ── The sales report ──────────────────────────────────────────────────────

/**
 * One row of the sales-by-item report.
 *
 * One product can arrive as several rows — per price, per payment method, per
 * customisation — so rows are merged by name before anything is judged.
 * `price` is the unit price after discount and before tax; `totalRevenue`
 * includes tax; `netProfit` is `(price − costPrice) × count`.
 */
export interface SalesByItemRow {
  itemName?: string;
  category?: string;
  price?: number;
  costPrice?: number;
  count?: number;
  totalRevenue?: number;
  totalTax?: number;
  netProfit?: number;
  itemDiscount?: number;
}

// ── Numbers ───────────────────────────────────────────────────────────────

export const num = (value: unknown) =>
  typeof value === "number" && Number.isFinite(value) ? value : 0;

export const round1 = (value: number) => Math.round(value * 10) / 10;

/** Percentage change, or null when there was nothing to compare with. */
export function changePct(current: number, previous: number): number | null {
  return previous > 0 ? round1(((current - previous) / previous) * 100) : null;
}

export const whole = (value: number) =>
  Math.round(value).toLocaleString("en-US", { maximumFractionDigits: 0 });

/**
 * "Rs 1,200", and "-Rs 40" for a loss — the sign before the symbol.
 *
 * Written "Rs -40" before, which reads as a price of minus forty rather than
 * forty lost, and the model copied it into its sentences. The rest of the app
 * already puts the sign first (see `formatCurrencySymbol`).
 */
export function formatMoney(symbol: string, value: number): string {
  const text = `${symbol} ${whole(Math.abs(value))}`;
  return value < 0 && Math.round(Math.abs(value)) > 0 ? `-${text}` : text;
}

export const signed = (pct: number) => `${pct > 0 ? "+" : ""}${pct}%`;

/** Units a week over a window of `days`. */
export const perWeek = (units: number, days = SECTION_WINDOW_DAYS) =>
  round1((units / days) * 7);

// ── The menu ──────────────────────────────────────────────────────────────

/** A product on the menu, as the AI sections need it. */
export interface MenuProduct {
  id: string;
  name: string;
  categoryName: string | null;
  /** The product's price, or its cheapest variant's when it has variants. */
  price: number;
  /** Zero when no cost price was entered. */
  costPrice: number;
  description: string;
  isAvailable: boolean;
  /** Units on hand, or null when stock is not tracked. */
  stock: number | null;
  variantNames: string[];
}

export const normalizeName = (name: string) =>
  name.trim().replace(/\s+/g, " ").toLowerCase();

/**
 * Finds the menu product a sales row belongs to.
 *
 * An exact name first, then the longest product name that starts the row's
 * name at a word boundary, so "Momo (Buff)" and "Momo [Buff]" count towards
 * Momo while "Coke Zero" does not count towards Coke. Variants are judged as
 * their product here: a slow item is a menu decision, and the menu lists the
 * product.
 */
export function productMatcher(products: MenuProduct[]) {
  const exact = new Map(products.map((p) => [normalizeName(p.name), p]));
  const byLength = [...products].sort((a, b) => b.name.length - a.name.length);

  return (rowName: string): MenuProduct | null => {
    const key = normalizeName(rowName);
    const hit = exact.get(key);
    if (hit) return hit;

    for (const product of byLength) {
      const prefix = normalizeName(product.name);
      if (!prefix || !key.startsWith(prefix)) continue;
      const boundary = key.charAt(prefix.length);
      if (boundary === "" || !/[a-z0-9]/.test(boundary)) return product;
    }
    return null;
  };
}

export interface ProductSales {
  units: number;
  /** Before tax. */
  sales: number;
}

/**
 * The sales report added up per menu product, keyed by product id.
 *
 * Rows that match no product — a deleted item, a custom one-off — are left
 * out: there is no menu decision to make about them.
 */
export function salesByProduct(
  rows: SalesByItemRow[],
  match: (rowName: string) => MenuProduct | null,
): Map<string, ProductSales> {
  const totals = new Map<string, ProductSales>();
  for (const row of rows) {
    const product = match(row.itemName ?? "");
    if (!product) continue;
    const entry = totals.get(product.id) ?? { units: 0, sales: 0 };
    entry.units += num(row.count);
    entry.sales += num(row.totalRevenue) - num(row.totalTax);
    totals.set(product.id, entry);
  }
  return totals;
}

/** Margin on the menu price, or null when no cost price was entered. */
export function menuMarginPct(product: MenuProduct): number | null {
  return product.costPrice > 0 && product.price > 0
    ? round1(((product.price - product.costPrice) / product.price) * 100)
    : null;
}

// ── What a section's route returns ────────────────────────────────────────

export interface AiSectionResult<T> {
  items: T[];
  windows: SalesWindows;
  /**
   * Why there is nothing to show without an error. In both cases no AI call
   * was made: there was nothing to analyse, or nothing worth flagging.
   */
  reason?: "NO_SALES" | "NOTHING_FLAGGED";
  model?: string;
  generatedAt?: string;
  /** True when this answer was served from the day's cache, at no cost. */
  cached?: boolean;
  /**
   * True when this is the last answer the service had rather than a fresh one:
   * the model in use returned nothing usable, or the hourly limit was spent.
   * `model` and `generatedAt` then describe whoever wrote it, and when.
   */
  stale?: boolean;
  /** Why a fresh answer could not be had, in the usual error vocabulary. */
  staleReason?: string;
}

/** A single emoji from the model, or the fallback when it sent anything else. */
export function emojiOr(value: unknown, fallback: string): string {
  if (typeof value !== "string") return fallback;
  const trimmed = value.trim();
  // Short, and no letters or digits: an emoji (possibly with a joiner or
  // variation selector), not a word.
  return trimmed && trimmed.length <= 8 && !/[\p{L}\p{N}]/u.test(trimmed)
    ? trimmed
    : fallback;
}

/**
 * Real names put back into the model's text.
 *
 * The model only ever sees people as short codes ("s1332jr", "cyaxai4"), and
 * is asked to write {name} where a name belongs. It does not always: it
 * sometimes copies the code it was given ("s1332jr takes 76% of orders").
 * So both are replaced — {name} with `name`, and every code in `names` with
 * the person it stands for — and a code can never reach a card.
 */
export function putNamesBack(
  text: string,
  name: string,
  names: Map<string, string>,
): string {
  let out = text.replace(/\{name\}/gi, name);
  // Codes are letters and digits only, so they go into the pattern as they
  // are; anything else is skipped rather than escaped.
  const codes = [...names.keys()]
    .filter((code) => /^[a-z0-9]+$/i.test(code))
    .sort((a, b) => b.length - a.length);
  if (codes.length > 0) {
    const byLower = new Map(
      [...names].map(([code, person]) => [code.toLowerCase(), person]),
    );
    out = out.replace(
      new RegExp(`\\b(${codes.join("|")})\\b`, "gi"),
      (code) => byLower.get(code.toLowerCase()) ?? code,
    );
  }
  return out;
}

/** A string from the model, trimmed and capped, or null when unusable. */
export function textOr(value: unknown, max: number): string | null {
  return typeof value === "string" && value.trim()
    ? value.trim().slice(0, max)
    : null;
}
