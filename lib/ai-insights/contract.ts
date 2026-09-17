/**
 * AI Insights - Contract & Types
 * 
 * Single source of truth for:
 * - Briefing data format (what the dashboard sends to Gemini)
 * - Response types (what Gemini returns, what the frontend renders)
 * - System prompt and JSON schema (re-exported from system-prompt.ts)
 * 
 * Sync requirements:
 * - backend/src/services/gemini.js uses AI_INSIGHTS_RESPONSE_SCHEMA
 * - backend/src/routes/aiInsights.js accepts systemInstruction & responseSchema
 * - Frontend components render AiInsightsResponse
 */

// Re-export system prompt and schema from dedicated file
export { AI_SYSTEM_PROMPT, AI_INSIGHTS_RESPONSE_SCHEMA } from "./system-prompt";

// ============================================================================
// BRIEFING DATA FORMAT - What the frontend sends to Gemini
// ============================================================================

/**
 * BriefingData - The structured data collected from the dashboard
 * that will be sent to Gemini for analysis.
 * 
 * This represents all the analytical data currently shown on the overview dashboard.
 */
export interface BriefingData {
  // Period identification
  periodStart: string;           // ISO date: "2026-02-09"
  periodEnd: string;             // ISO date: "2026-02-15"
  periodLabel: string;           // Human readable: "Last 7 days", "This month", "Today"
  viewMode: "live" | "yesterday"; // Whether showing live data or yesterday's analysis
  
  /**
   * The business's currency, when the browser reports one.
   *
   * The cards render the model's text, so the symbol must be part of the
   * briefing: absent it, Gemini writes bare numbers. Optional — a session
   * without the cookie (or a code the list no longer knows) simply omits it
   * and the model stays quiet about currency.
   */
  currency?: {
    /** ISO code, e.g. "NPR". */
    code: string;
    /** Native symbol, e.g. "रू". */
    symbol: string;
  };

  // Headline statistics (from OverviewStatBoxGrid)
  stats: {
    totalSales: number;          // Total revenue for period
    totalOrders: number;         // Total number of orders
    productsSold: number;        // Total items sold
    netProfit: number;           // Net profit (revenue - costs)
    
    // Comparison with previous period (for trend analysis)
    previousSales?: number;      // Previous period's sales
    previousOrders?: number;     // Previous period's orders  
    previousProfit?: number;     // Previous period's profit
  };
  
  // Winning stats (from WinningStatBox)
  winningStats: {
    topSellingProduct: string;   // Name of top product
    peakHour: string;            // Busiest hour (e.g., "10am - 11am")
    bestDay: string;             // Best day of week (e.g., "Sunday")
    salesStreak: string;         // Current streak (e.g., "5 days")
  };
  
  /**
   * Top products (from TopItems component).
   *
   * `category` and `profit` are optional because the endpoint feeding the Top
   * Items card (`getTopProducts`) returns neither. A builder must omit them
   * rather than pass "" or 0: an absent figure tells the model to stay quiet
   * about margin, whereas a zero is an assertion it would report as fact.
   */
  topProducts: Array<{
    name: string;
    unitsSold: number;
    revenue: number;
    category?: string;
    profit?: number;
  }>;

  /**
   * Hourly sales pattern (from HourlySalesChart).
   *
   * `orders` is optional: `HourlyData` is assembled from bills and carries
   * revenue only. No per-hour order count exists to pass, and the previously
   * required field would have forced one to be invented.
   */
  hourlySales: Array<{
    hour: string;                // Hour label: "7am", "8am", etc.
    revenue: number;             // Revenue for that hour
    orders?: number;
  }>;

  /**
   * Daily revenue pattern (from WeeklyRevenueChart). Same reasoning as above:
   * `DataPoint` carries no per-day order count.
   */
  dailySales: Array<{
    day: string;                 // Day name: "Mon", "Tue", etc.
    revenue: number;             // Revenue for that day
    orders?: number;
  }>;
  
  // Recent transactions (from RecentTransactions component)
  recentTransactions: Array<{
    id: string;
    invoiceName: string;         // The ticket's name, from `bill.ticketName` — not a customer field
    amount: string;              // Amount as string (e.g., "55.50")
    paymentMethod: string;       // "Cash", "Card", etc.
    items: Array<{
      name: string;
      quantity: number;
      unitPrice: number;
    }>;
    status: string;              // "completed", "refunded", etc.
    timestamp: string;           // Time only: "09:50", "16:30"
  }>;
  
  /**
   * Customer insights (from the customer dashboard, when available).
   *
   * `newCustomers` and `repeatCustomers` are optional: `getCustomerStats`
   * returns total members, active-in-period customers, points redeemed and
   * points per member only. Neither figure can be derived from those without
   * guessing, so they are omitted when unknown.
   *
   * At-risk customers come from `getAtRiskCustomers`, which reports a spending
   * band rather than a last-visit date or a lifetime total -- hence those two
   * fields being optional here.
   */
  customerInsights?: {
    totalMembers: number;        // Total loyalty members
    activeThisPeriod: number;    // Active in current period
    newCustomers?: number;       // New customers this period
    repeatCustomers?: number;    // Returning customers
    topCustomers?: Array<{
      name: string;
      visits: number;
      totalSpent: number;
      loyaltyTier?: string;
    }>;
    atRiskCustomers?: Array<{
      name: string;
      /** Spending band, e.g. "High" -- the only risk signal that endpoint gives. */
      spendLevel?: string;
      lastVisit?: string;
      totalSpent?: number;
    }>;
  };

  /**
   * Inventory alerts (from LowStockAlerts component, if available).
   *
   * `category` is optional: a product with no category assigned reports none,
   * and an empty string would read to the model as a category named "".
   */
  lowStockAlerts?: Array<{
    name: string;
    currentStock: number;
    threshold: number;
    category?: string;
  }>;

  /**
   * Category performance (from SalesCategoryChart, if available).
   *
   * `percentOfTotal` is computed by the builder from the revenue it holds, so
   * it is always present. `unitsSold` is optional because the sales-by-category
   * endpoint reports revenue and net profit, not units. `orders` carries the
   * endpoint's `totalSales`, which is a count of sales, not money.
   */
  categoryPerformance?: Array<{
    category: string;
    revenue: number;
    percentOfTotal: number;
    orders?: number;
    unitsSold?: number;
  }>;
}

// ============================================================================
// BRIEFING SECTIONS - Constants for section headers in the briefing text
// ============================================================================

/**
 * Section headers used in the briefing text.
 * Each section is delimited with these headers in square brackets
 * so Gemini can easily parse and understand the structure.
 */
export const BRIEFING_SECTIONS = {
  PERIOD: "PERIOD",
  HEADLINE_STATS: "HEADLINE_STATS",
  COMPARISON: "COMPARISON",
  WINNING_STATS: "WINNING_STATS",
  TOP_PRODUCTS: "TOP_PRODUCTS",
  HOURLY_PATTERN: "HOURLY_PATTERN",
  DAILY_PATTERN: "DAILY_PATTERN",
  RECENT_TRANSACTIONS: "RECENT_TRANSACTIONS",
  CUSTOMER_INSIGHTS: "CUSTOMER_INSIGHTS",
  LOW_STOCK_ALERTS: "LOW_STOCK_ALERTS",
  CATEGORY_PERFORMANCE: "CATEGORY_PERFORMANCE",
  INSTRUCTION: "INSTRUCTION",
} as const;

export type BriefingSectionKey = keyof typeof BRIEFING_SECTIONS;

// ============================================================================
// RESPONSE TYPES - What Gemini returns and what the frontend renders
// ============================================================================
//
// These mirror the JSON schema in system-prompt.ts (AI_INSIGHTS_RESPONSE_SCHEMA).
// Keep them in sync: the UI components (AIBusinessStory, BusinessInsightsAlerts)
// render these exact shapes.

export type StoryView = "live" | "yesterday";

export type StorySegmentColor = "default" | "green" | "red";

export interface StorySegment {
  text: string;
  color: StorySegmentColor;
}

export interface StoryPriority {
  label: string;
  text: string;
}

export interface AiStory {
  view: StoryView;
  title: string;
  subtitle: string;
  vibe: string;
  segments: StorySegment[];
  /** Gemini may return null when there is no single action worth prioritising. */
  priority: StoryPriority | null;
}

export type InsightType = "success" | "warning" | "info";

export interface AiInsight {
  type: InsightType;
  text: string;
}

export type AlertType = "danger" | "warning" | "info";

export type AlertIcon = "alert" | "package" | "user";

export interface AiAlert {
  type: AlertType;
  icon: AlertIcon;
  title: string;
  subtitle: string;
}

/**
 * The full structured response from the AI insights endpoint.
 * `story` drives the AI Business Story card; `insights` + `alerts` drive the
 * Business Insights & Alerts card.
 */
export interface AiInsightsResponse {
  story: AiStory;
  insights: AiInsight[];
  alerts: AiAlert[];
}

// ============================================================================
// REQUEST TYPES - What the frontend sends to the AI backend
// ============================================================================

/**
 * Body for POST /api/ai-insights on the AI backend.
 *
 * `briefing` is required (max 16,000 chars, trimmed, 400 BRIEFING_TOO_LONG
 * beyond that). `systemInstruction` (max 4,000 chars) and `responseSchema`
 * default to AI_SYSTEM_PROMPT and AI_INSIGHTS_RESPONSE_SCHEMA in the caller
 * when omitted — but note that omitting `responseSchema` makes the backend
 * return raw prose instead of the parsed object, so it should always be sent.
 */
export interface AiInsightsRequest {
  briefing: string;
  systemInstruction?: string;
  responseSchema?: unknown;
}

/** Token accounting for the business's own quota (null when unavailable). */
export interface AiInsightsUsage {
  promptTokens: number | null;
  outputTokens: number | null;
  totalTokens: number | null;
}

/**
 * The `data` envelope the backend actually returns on success:
 * `{ data: { insights, model, usage, generatedAt } }`.
 *
 * `insights` is the parsed object when a `responseSchema` was supplied, and
 * raw text otherwise — so a caller that always sends the schema can narrow it.
 */
export interface AiInsightsEnvelope {
  insights: AiInsightsResponse | string;
  model: string;
  usage: AiInsightsUsage;
  generatedAt: string;
}

/** Shape of a successful POST /api/ai-insights response. */
export interface AiInsightsApiResponse {
  data: AiInsightsEnvelope;
}

/**
 * Error codes the insights route can answer with.
 * 400 — malformed request; 424 — merchant-side precondition missing;
 * 429 — per-business rate limit (INSIGHTS_RATE_LIMIT, VERIFY_RATE_LIMIT);
 * 500 — stored key cannot be decrypted; 502 — upstream Gemini failure.
 */
export type AiInsightsErrorCode =
  | "BRIEFING_REQUIRED"
  | "BRIEFING_TOO_LONG"
  | "INSTRUCTION_TOO_LONG"
  | "NOT_CONFIGURED"
  | "AI_DISABLED"
  | "KEY_UNREADABLE"
  | "GEMINI_MALFORMED_RESPONSE"
  | "GEMINI_EMPTY_RESPONSE"
  | "GEMINI_MODEL_UNAVAILABLE"
  | "GEMINI_KEY_INVALID"
  | "GEMINI_QUOTA_EXCEEDED"
  | "GEMINI_RATE_LIMIT"
  | "GEMINI_UNAVAILABLE"
  | "INSIGHTS_RATE_LIMIT"
  | "VERIFY_RATE_LIMIT";

/** Shape of an error response. `raw` is only sent for malformed model output. */
export interface AiInsightsApiError {
  error: AiInsightsErrorCode;
  raw?: string;
  /**
   * Seconds to wait before retrying. Only sent with 429 rate-limit answers;
   * mirrors the backend's Retry-After header for clients that read the body.
   */
  retryAfter?: number;
}


