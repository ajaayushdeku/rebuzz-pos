import type { LucideIcon } from "lucide-react";
import {
  BadgePercent,
  Boxes,
  Coins,
  Gift,
  Percent,
  ReceiptText,
  RotateCcw,
  Sparkles,
  Tag,
  Users,
} from "lucide-react";

/**
 * Everything the Help page says, as data.
 *
 * Written for the owner or manager — the person who sets the business up and
 * reads the dashboards — rather than for a cashier at the till.
 *
 * It lives in the repo on purpose: it ships and versions with the screens it
 * describes, so a guide cannot outlive the button it names. The cost is that
 * changing a sentence needs a deploy; if support ever needs to edit copy
 * themselves, this is the file to move behind an API.
 *
 * Every entry carries `keywords` for the page's search, holding the words a
 * merchant would actually type — "vat", "bill", "staff" — which are rarely
 * the words the app prints.
 */

export interface HelpGuide {
  id: string;
  title: string;
  /** One line: what this gets done. */
  summary: string;
  icon: LucideIcon;
  /** Where in the app it happens. Shown as a link. */
  href: string;
  hrefLabel: string;
  /** The steps, in order. Kept to what the screen actually asks for. */
  steps: string[];
  /** The part people get wrong, or wish they had known first. */
  note?: string;
  keywords: string[];
}

export interface HelpConcept {
  id: string;
  term: string;
  /** The explanation. Two or three sentences, no more. */
  body: string;
  /** What acting on the wrong idea would cost. */
  watchOut?: string;
  keywords: string[];
}

export interface HelpMetric {
  label: string;
  meaning: string;
  where: string;
}

// ── Task guides ───────────────────────────────────────────────────────────

export const HELP_GUIDES: HelpGuide[] = [
  {
    id: "first-invoice",
    title: "Create an invoice",
    summary: "Ring up a sale and record how it was paid.",
    icon: ReceiptText,
    href: "/invoices/add",
    hrefLabel: "New invoice",
    steps: [
      "Open Invoices and choose Create an invoice.",
      "Pick the customer, or leave it blank for a walk-in sale.",
      "Add each item and its quantity. Discounts and tax apply from your settings, so there is nothing to work out by hand.",
      "Record the payment, or leave it unpaid if the customer will settle later.",
    ],
    note: "An invoice left unpaid stays on the Invoices list. Moving it to Credit is a separate, deliberate step — see “Credit vs unpaid invoice”.",
    keywords: ["bill", "sale", "sell", "receipt", "checkout", "order"],
  },
  {
    id: "refund",
    title: "Refund an order",
    summary: "Return money on a completed sale, and see where it lands.",
    icon: RotateCcw,
    href: "/records/order-history",
    hrefLabel: "Order History",
    steps: [
      "Open Order History and find the transaction.",
      "Open the row and choose Refund.",
      "Confirm the amount.",
    ],
    note: "A refund is not a deletion. The original sale stays in your history, and the refund shows separately — which is why Revenue excludes refunds while Total Orders still counts them.",
    keywords: ["return", "money back", "cancel", "void", "refund rate"],
  },
  {
    id: "products-stock",
    title: "Add products and stock",
    summary: "Put items on the menu and keep their counts honest.",
    icon: Boxes,
    href: "/records/products",
    hrefLabel: "Products",
    steps: [
      "Open Products and choose Add new product.",
      "Give it a category — the dashboards group sales by category, so an uncategorised item is harder to read later.",
      "Set the cost price as well as the selling price. Without a cost, margin and profit cannot be calculated for that item.",
      "Record deliveries from Inventory → Add Stock.",
    ],
    note: "Your plan caps how many products you can hold. The ceiling is shown on the Products page before you reach it.",
    keywords: ["item", "menu", "inventory", "stock", "restock", "cost price"],
  },
  {
    id: "employees",
    title: "Add an employee",
    summary: "Give someone access, and decide how much they can see.",
    icon: Users,
    href: "/settings/employees",
    hrefLabel: "Manage Employees",
    steps: [
      "Open Settings → Manage Employees and choose Add New Employee.",
      "Enter their details and pick a role.",
      "Share the sign-in details with them.",
    ],
    note: "Role decides reach: an owner sees everything, while staff and basic accounts are limited. Their shifts and the bills they ring up appear on the Employees dashboard.",
    keywords: ["staff", "user", "role", "permission", "shift", "cashier"],
  },
  {
    id: "tax",
    title: "Set up tax",
    summary: "Switch tax on, and define the rates that apply.",
    icon: Percent,
    href: "/settings/tax",
    hrefLabel: "Tax Settings",
    steps: [
      "Open Settings → Tax.",
      "Add your rates. A standard tax is a single rate; a group tax combines several under one name.",
      "Turn Exclusive Tax on to start applying tax to invoices.",
      "Put your PAN or VAT number in Settings → Business so it prints on tax invoices.",
    ],
    note: "Exclusive means the tax is added on top of the price you set. With the switch off, no tax is applied at all.",
    keywords: ["vat", "pan", "gst", "rate", "group tax", "exclusive"],
  },
  {
    id: "discounts",
    title: "Create a discount",
    summary: "Define a reduction once and reuse it on invoices.",
    icon: Tag,
    href: "/settings/discount",
    hrefLabel: "Discount Settings",
    steps: [
      "Open Settings → Discount and create the discount.",
      "Choose whether it takes a percentage or a fixed amount off.",
      "Enable it to make it available on invoices.",
    ],
    note: "A discount that exists but is not enabled will not appear at the till.",
    keywords: ["offer", "percent", "reduction", "promo", "sale price"],
  },
  {
    id: "loyalty",
    title: "Set up loyalty points",
    summary: "Decide what customers earn, and what a point is worth.",
    icon: Gift,
    href: "/settings/loyalty-points",
    hrefLabel: "Loyalty Points",
    steps: [
      "Open Settings → Loyalty Point.",
      "Set how points are earned on a sale, and what they are worth when redeemed.",
      "Save. The rules apply to invoices from that moment on.",
    ],
    note: "Changing the rules does not restate points customers have already earned.",
    keywords: ["points", "rewards", "tier", "redeem", "regulars"],
  },
  {
    id: "offer",
    title: "Build an offer",
    summary: "Put together a promotion and preview it before it runs.",
    icon: BadgePercent,
    href: "/offers",
    hrefLabel: "Offer",
    steps: [
      "Open Offer and work through the four steps.",
      "Choose the dates it runs for.",
      "Check the preview — it shows the offer as a customer sees it.",
    ],
    keywords: ["promotion", "campaign", "deal", "marketing"],
  },
  {
    id: "ai-key",
    title: "Connect AI Insights",
    summary: "Add your own AI key so the insight sections read your data.",
    icon: Sparkles,
    href: "/settings/api-keys",
    hrefLabel: "API Keys",
    steps: [
      "Create a key with Google Gemini or OpenRouter. Both offer a free tier.",
      "Open Settings → API Keys, pick that provider and paste the key in.",
      "Choose a model. The list only shows models your key can actually use.",
    ],
    note: "Until a key is saved, the insight sections show example cards marked “Sample data”. Those name items and customers that are not yours — do not act on them.",
    keywords: ["gemini", "openrouter", "api", "insights", "model", "token"],
  },
  {
    id: "currency",
    title: "Change the currency",
    summary: "Set the symbol every figure in the app is shown in.",
    icon: Coins,
    href: "/settings/currency",
    hrefLabel: "Currency",
    steps: [
      "Open Settings → Currency.",
      "Search by currency, code or country, and select it.",
    ],
    note: "This changes how figures are displayed, not what they are worth. Past sales are not converted — a Rs 500 sale becomes $ 500, not its exchange value.",
    keywords: ["symbol", "rupee", "dollar", "exchange", "money"],
  },
];

// ── Concepts: the things that cause real mistakes ─────────────────────────

export const HELP_CONCEPTS: HelpConcept[] = [
  {
    id: "exclusive-tax",
    term: "Exclusive tax",
    body: "Exclusive means tax is added on top of the price you entered: a product priced at 100 with 13% tax is billed at 113. The switch in Tax Settings turns this on; with it off, invoices carry no tax at all.",
    watchOut:
      "If your shelf prices already include tax, switching Exclusive on charges it a second time. Enter prices before tax, and let the setting add it.",
    keywords: ["inclusive", "vat", "on top", "included", "13%"],
  },
  {
    id: "credit-vs-unpaid",
    term: "Credit vs unpaid invoice",
    body: "An unpaid invoice is a sale awaiting payment; it sits on the Invoices list. A credit is an invoice you have deliberately moved to the Credits page to track as an outstanding due — usually for a regular who settles periodically.",
    watchOut:
      "Moving an invoice to Credit does not chase it for you. The Credits page is where you see what is owed and by whom.",
    keywords: ["due", "owed", "udhaaro", "outstanding", "unpaid", "debt"],
  },
  {
    id: "refund-accounting",
    term: "How refunds affect your figures",
    body: "A refunded order stays in your history. Revenue excludes refunds, while Total Orders still counts the original sale, and Refund Rate is the share of orders that came back.",
    watchOut:
      "A refund is not a correction. Refunding a mistyped bill leaves both the sale and the refund in the record.",
    keywords: ["return", "revenue", "refund rate", "net"],
  },
  {
    id: "sample-data",
    term: "“Sample data”",
    body: "A badge on an AI Insights section means it is showing examples, not your business. It appears until an AI key is connected, and goes once the section is generated from your own sales.",
    watchOut:
      "Sample cards name items, customers and prices that read as real. Nothing on a sample card refers to anyone you trade with.",
    keywords: ["example", "demo", "fake", "not connected", "ai"],
  },
  {
    id: "ai-privacy",
    term: "What AI Insights sends out",
    body: "Insights run on your own key, so requests go from this app to the provider you chose — Google or OpenRouter. What is sent is a summary of your sales, menu, customers and staffing for the window each section names.",
    watchOut:
      "The provider's terms govern that data, not ours. If that matters for your business, read theirs before connecting a key.",
    keywords: ["privacy", "data", "security", "gemini", "openrouter", "sent"],
  },
  {
    id: "ai-limit",
    term: "The hourly AI limit",
    body: "Insights are capped per hour, shown as a meter like “6 / 20 this hour”. Each generation or refresh spends one; the allowance refills as the hour rolls on rather than all at once.",
    watchOut:
      "Your provider has its own separate limit. Hitting theirs looks different — the section will say your usage limit is reached.",
    keywords: ["quota", "rate limit", "20", "hour", "refresh", "generate"],
  },
  {
    id: "currency-symbol",
    term: "Currency is a symbol, not a conversion",
    body: "The app stores which symbol to print. Changing it re-labels every figure, including past ones, and converts nothing.",
    watchOut:
      "Switching currency mid-year makes older sales unreadable against newer ones. Set it once, at the start.",
    keywords: ["exchange", "rate", "convert", "symbol", "rs", "dollar"],
  },
];

// ── The dashboard's vocabulary ────────────────────────────────────────────

export const HELP_METRICS: HelpMetric[] = [
  {
    label: "Gross revenue",
    meaning: "What you took in from sales, before costs are deducted.",
    where: "Profit & Cost",
  },
  {
    label: "Net profit",
    meaning: "What is left after the cost of goods and your expenses.",
    where: "Profit & Cost",
  },
  {
    label: "Margin",
    meaning:
      "Profit as a share of the sale price. A 30% margin means 30 paisa of every rupee is profit.",
    where: "Profit & Cost",
  },
  {
    label: "Prime cost",
    meaning:
      "Goods plus labour — the two costs that move most with how busy you are.",
    where: "Profit & Cost",
  },
  {
    label: "Break-even",
    meaning: "The sales you need before a day starts making money.",
    where: "Profit & Cost",
  },
  {
    label: "Average order value",
    meaning: "Revenue divided by number of orders: what a typical bill is.",
    where: "Overview, Order History",
  },
  {
    label: "Refund rate",
    meaning: "The share of orders that were refunded.",
    where: "Order History",
  },
  {
    label: "Cost price",
    meaning:
      "What an item costs you. Without it, that item has no margin and no profit figure.",
    where: "Products",
  },
];

// ── Troubleshooting ───────────────────────────────────────────────────────

/**
 * The AI error codes worth looking up, in the order a merchant meets them:
 * set-up first, then their key, then the temporary ones.
 *
 * Only the codes are listed here. The wording comes from the same table the
 * error panels use, so the two can never disagree.
 */
export const HELP_ERROR_CODES: string[] = [
  "NOT_CONFIGURED",
  "AI_DISABLED",
  "AI_KEY_INVALID",
  "AI_MODEL_UNAVAILABLE",
  "AI_QUOTA_EXCEEDED",
  "AI_RATE_LIMIT",
  "AI_UNAVAILABLE",
  "AI_EMPTY_RESPONSE",
  "SALES_DATA_UNAVAILABLE",
  "NETWORK",
  "AUTH_REQUIRED",
  "BRIEFING_REQUIRED",
];

// ── Reaching a person ─────────────────────────────────────────────────────

/**
 * Support's own details. Fill these in — a channel with no value is left off
 * the page rather than shown as a dead link, so an empty file degrades to
 * "no contact details yet" instead of to a broken button.
 */
export const HELP_CONTACT = {
  /** Digits with the country code, as WhatsApp expects: "9779800000000". */
  whatsapp: "",
  phone: "",
  email: "",
} as const;

// ── The menu, page by page ────────────────────────────────────────────────

export interface HelpPageEntry {
  /** What the screen is for. */
  what: string;
  /** What it actually puts in front of you. */
  shows: string;
}

/**
 * One entry per sidebar destination, keyed by its href.
 *
 * The Help page walks `navigationConfig` itself and looks each href up here,
 * so the list on screen is always the real menu: a page added to the sidebar
 * shows up immediately, described or not, rather than being quietly missing.
 */
export const HELP_PAGES: Record<string, HelpPageEntry> = {
  "/dashboard": {
    what: "The day at a glance, and the first place to look each morning.",
    shows:
      "Revenue, sales, products sold and net profit for the range you pick, with revenue over the week, sales by category, your busiest hours, top items, payment methods and the latest transactions. Growth Tracker and Heatmap sit beside it as tabs.",
  },
  "/dashboard/sales-revenue": {
    what: "Where the money comes from, product by product.",
    shows:
      "Revenue against profit per product, the sales trend, a forecast and target tracker, your peak hours and days, best and slowest products, and the effect of campaigns and price changes.",
  },
  "/dashboard/profit-cost": {
    what: "What you keep after costs — the health check behind the takings.",
    shows:
      "Gross revenue, net profit, refunds and average margin, then cost of goods against profit, prime cost, break-even, unit economics, profit by day and hour, and a what-if planner for testing a change before making it.",
  },
  "/dashboard/tax-analytics": {
    what: "Everything the tax office will eventually ask about.",
    shows:
      "Taxable against non-taxable sales, tax by category, tax on refunded bills, VAT trends and return summary, TDS, advance instalments, a filing calendar and a reconciliation of what you actually owe.",
  },
  "/dashboard/expenses": {
    what: "Spending as a picture, rather than as a list of entries.",
    shows:
      "Cash flow over recent months, spending by category, the monthly trend, and how each budget is tracking against what has actually been spent.",
  },
  "/dashboard/inventory": {
    what: "What is on your shelves and what it is worth.",
    shows:
      "Stock value at selling and at cost price, potential margin, product and variant counts, and stock levels with the items running low.",
  },
  "/dashboard/live-tables": {
    what: "Your floor, as it stands right now.",
    shows:
      "Every table as a grid or as a floor plan, which are occupied, and how full the room is.",
  },
  "/dashboard/employee": {
    what: "How your team is performing at the till.",
    shows:
      "Sales and shifts per employee over the range you pick. Opening anyone gives their bills, invoices and shift history.",
  },
  "/dashboard/customers": {
    what: "Who buys from you, and whether they come back.",
    shows:
      "Customer counts and behaviour over the chosen range, with retention and spending patterns.",
  },
  "/records/invoices": {
    what: "Every bill you have raised, and what is still owed.",
    shows:
      "The invoice list with totals across the top, filtered by state. This is also where a new invoice starts.",
  },
  "/records/expenses": {
    what: "Recording what the business spends, and on what.",
    shows:
      "Expenses and income as entries, summarised by purpose, with budgets and the most recent transactions.",
  },
  "/records/credits": {
    what: "Invoices you have moved to credit, and the dues against them.",
    shows: "Each credit, what is outstanding on it, and the totals.",
  },
  "/records/order-history": {
    what: "The till's record: every completed sale.",
    shows:
      "Orders, revenue, average order value and refunds for the chosen dates, with each transaction openable in full. Refunds are issued from here.",
  },
  "/records/customers": {
    what: "Your customer book.",
    shows:
      "Every customer with their contact details and standing. Opening one gives their order history, loyalty and dues.",
  },
  "/records/products": {
    what: "The menu itself — what you sell and what it costs you.",
    shows:
      "Every product with price, cost, category and stock, and how many of your plan's product allowance is used.",
  },
  "/offers": {
    what: "Building a promotion, and seeing it before it runs.",
    shows:
      "A four-step builder for the offer, its dates and its terms, with a preview of how it reaches a customer.",
  },
  "/ai-insights": {
    what: "Your own sales, read back to you as advice.",
    shows:
      "Eight sections — menu ideas, slow items, pricing, hour-by-hour, festivals, sales, retention and staffing — each generated from your data, with the hourly allowance shown in the header. Needs your own AI key.",
  },
  "/settings/business": {
    what: "Your business as customers see it.",
    shows:
      "Name, address, phone, logo and PAN or VAT number — the details printed on invoices and receipts.",
  },
  "/settings/change-password": {
    what: "Changing the password you sign in with.",
    shows: "The password form, and what makes a strong one.",
  },
  "/settings/employees": {
    what: "Who can sign in, and how much they can see.",
    shows:
      "Every employee with their role and status. New accounts start here.",
  },
  "/settings/currency": {
    what: "The currency every figure in the app is shown in.",
    shows:
      "A searchable list of currencies by name, code or country. It changes the symbol, not the value.",
  },
  "/settings/tax": {
    what: "The tax rates applied to invoices.",
    shows:
      "Your standard and group rates, and the switch that turns tax on for new invoices.",
  },
  "/settings/discount": {
    what: "Discounts you can reuse at the till.",
    shows:
      "Each discount, whether it takes a percentage or a fixed amount, and whether it is enabled.",
  },
  "/settings/category": {
    what: "The groups your products are sorted into.",
    shows:
      "Every category and how many products it holds. Categories are how the dashboards break sales down.",
  },
  "/settings/loyalty-points": {
    what: "What customers earn, and what it is worth.",
    shows:
      "The earning and redemption rules, and the tiers customers move through.",
  },
  "/settings/api-keys": {
    what: "Connecting your own AI provider.",
    shows:
      "Your provider and model, the key itself, and how much of this hour's allowance is spent.",
  },
  "/bizexpense": {
    what: "Reading expenses straight off a photographed receipt.",
    shows: "Nothing yet — this one is still being built.",
  },
  "/subscriptions": {
    what: "Your plan, and what the others include.",
    shows: "Each plan side by side, with the one you are on marked.",
  },
  "/help": {
    what: "This page.",
    shows:
      "Guides, the ideas worth knowing, the dashboard's vocabulary, and what each error code means.",
  },
};
