import type { LucideIcon } from "lucide-react";
import {
  BadgePercent,
  Boxes,
  CalendarClock,
  Coins,
  Copy,
  Eye,
  FileDown,
  Gift,
  Layers,
  PiggyBank,
  Percent,
  ReceiptText,
  RotateCcw,
  Send,
  Sparkles,
  TrendingDown,
  Tag,
  Users,
  Wallet,
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
  /**
   * A walkthrough on YouTube, when one has been recorded.
   *
   * Absent, the guide still offers the button — greyed, and saying so —
   * rather than hiding it: the tutorials are coming, and a button that
   * appears one release and not the next is harder to learn than one that
   * waits in place.
   */
  video?: string;
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
    id: "invoice-details",
    title: "Open an invoice and read it",
    summary: "See everything recorded against one bill.",
    icon: Eye,
    href: "/records/invoices",
    hrefLabel: "Invoices",
    steps: [
      "Open Invoices and find the bill in the list.",
      "Use the row's menu and choose View.",
      "The page shows the items, the totals, what has been paid and what is still due.",
    ],
    note: "Edit sits beside View in the same menu, for correcting a bill rather than refunding it.",
    keywords: ["view", "detail", "open", "bill", "read", "check"],
  },
  {
    id: "record-payment",
    title: "Record a payment on an invoice",
    summary: "Mark a bill as settled when the money arrives.",
    icon: Wallet,
    href: "/records/invoices",
    hrefLabel: "Invoices",
    steps: [
      "Open Invoices and use the row's menu on the bill.",
      "Choose Record payment.",
      "Check the amount due against what you were handed \u2014 the breakdown shows the subtotal, tax, any discount and loyalty points used.",
      "Pick how it was paid: Cash or QR.",
    ],
    note: "This settles the invoice in full. For someone paying in instalments, move the bill to credit first and take payments against it.",
    keywords: ["paid", "settle", "cash", "qr", "collect", "money"],
  },
  {
    id: "move-to-credit",
    title: "Move an invoice to credit",
    summary: "Track a bill a regular will settle later.",
    icon: BadgePercent,
    href: "/records/credits",
    hrefLabel: "Credits",
    steps: [
      "Open Invoices and use the row's menu on the unpaid bill.",
      "Choose Move to credit and confirm.",
      "The bill now appears on the Credits page with its outstanding due.",
    ],
    note: "It leaves the invoice list when it moves. Credits is where you see who owes what, and where instalments are taken.",
    keywords: ["udhaaro", "due", "owed", "later", "regular", "credit"],
  },
  {
    id: "partial-payment",
    title: "Take a partial payment",
    summary: "Accept part of what is owed and keep the rest on the books.",
    icon: Coins,
    href: "/records/credits",
    hrefLabel: "Credits",
    steps: [
      "Open Credits and choose the credit being paid down.",
      "Record a payment and enter the amount handed over, rather than the full due.",
      "The modal shows what stays due after this payment before you confirm.",
      "Pick how it was paid: Cash or QR.",
    ],
    note: "Each instalment is kept, so the credit carries its own payment history. The credit closes itself once a payment clears the remaining balance.",
    keywords: [
      "instalment",
      "installment",
      "part",
      "deposit",
      "advance",
      "balance",
    ],
  },
  {
    id: "due-date",
    title: "Set a due date and reminders",
    summary: "Say when a bill is expected, and be reminded before it is late.",
    icon: CalendarClock,
    href: "/records/invoices",
    hrefLabel: "Invoices",
    steps: [
      "Open Invoices and use the row's menu on the bill.",
      "Choose Set due date \u2014 or Edit due date, if it already has one.",
      "Pick the date the money is expected.",
      "Add the reminders you want, each set a number of days from that date.",
    ],
    note: "The Invoices list can be filtered by due date, so overdue bills can be pulled up on their own.",
    keywords: ["deadline", "overdue", "reminder", "chase", "terms", "date"],
  },
  {
    id: "email-invoice",
    title: "Email an invoice to a customer",
    summary: "Send the bill to the address on their record.",
    icon: Send,
    href: "/records/invoices",
    hrefLabel: "Invoices",
    steps: [
      "Open Invoices and use the row's menu on the bill.",
      "Choose Resend invoice.",
      "Choose which document to send: Proforma, Invoice or Tax Invoice.",
      "Check the address it is going to, and send.",
    ],
    note: "A Proforma is a quote sent before the sale is final; a Tax Invoice is the one a customer claims against.",
    keywords: ["send", "mail", "resend", "share", "customer", "proforma"],
  },
  {
    id: "export-invoice",
    title: "Download or print a bill",
    summary: "Get a PDF, or put it on paper.",
    icon: FileDown,
    href: "/records/invoices",
    hrefLabel: "Invoices",
    steps: [
      "Open Invoices and use the row's menu on the bill.",
      "Choose Export as PDF to download it, or Print to send it to a printer.",
      "Choose the document: Proforma, Invoice or Tax Invoice.",
    ],
    note: "The three differ in what they claim, not in how they look \u2014 send a Tax Invoice only when the sale is final and taxed.",
    keywords: ["pdf", "download", "print", "paper", "copy", "save"],
  },
  {
    id: "duplicate-invoice",
    title: "Duplicate an invoice",
    summary: "Start a new bill from one you have already raised.",
    icon: Copy,
    href: "/records/invoices",
    hrefLabel: "Invoices",
    steps: [
      "Open Invoices and use the row's menu on the bill to copy.",
      "Choose Duplicate.",
      "A new bill opens with the same items and customer, ready to edit.",
    ],
    note: "Useful for a customer who orders the same thing each week \u2014 the original is untouched.",
    keywords: ["copy", "repeat", "again", "same", "template", "recurring"],
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
    id: "expense-income",
    title: "Record an expense or income",
    summary: "Put money going out, or coming in, on the books.",
    icon: TrendingDown,
    href: "/records/expenses",
    hrefLabel: "Expense & Income",
    steps: [
      "Open Expense & Income and choose Add Expense \u2014 or switch the form to Income for money in.",
      "Pick the purpose it belongs to. Manage purposes lets you add one you don't have yet.",
      "Enter the amount and the date it happened.",
      "For something that repeats \u2014 rent, a subscription \u2014 mark it recurring and give it an end date.",
    ],
    note: "Purpose is what the dashboards group spending by, so an entry filed under the wrong one is hard to find later.",
    keywords: [
      "spend",
      "bill",
      "rent",
      "salary",
      "cost",
      "recurring",
      "income",
    ],
  },
  {
    id: "budget",
    title: "Set a budget for a category",
    summary:
      "Give a purpose a monthly ceiling and watch it against actual spend.",
    icon: PiggyBank,
    href: "/records/expenses",
    hrefLabel: "Expense & Income",
    steps: [
      "Open Expense & Income and choose Set Budget.",
      "Pick the expense category to cap.",
      "Enter the threshold you want to stay under.",
    ],
    note: "Budgets show up on the Expense Analytics dashboard as budget against actual, so you can see which ones are running hot before the month ends.",
    keywords: ["budget", "limit", "threshold", "cap", "target", "overspend"],
  },
  {
    id: "bulk-stock",
    title: "Update stock for several products at once",
    summary: "Count the shelf, then enter the whole count in one pass.",
    icon: Layers,
    href: "/dashboard/inventory",
    hrefLabel: "Inventory",
    steps: [
      "Open Inventory and choose Add Stock.",
      "Search for a product, or scroll the list \u2014 everything you change stays changed as you move between them.",
      "Set In stock for each one, and Low stock if you want its alert threshold to change too.",
      "Products with variants list each variant separately, so a size or flavour can be counted on its own.",
      "Press Save changes once at the end.",
    ],
    note: "One save covers every product you touched, so a stock take is one trip through the list rather than one trip per item.",
    keywords: [
      "stocktake",
      "stock take",
      "count",
      "restock",
      "bulk",
      "inventory",
      "variants",
    ],
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
 * How to reach support.
 *
 * A channel with no value is left off the page rather than shown as a dead
 * link, so an unfilled field degrades to one fewer way of getting in touch
 * instead of to a button that goes nowhere.
 */
export const HELP_CONTACT = {
  email: "support@rebuzzpos.com",
  /** Digits with the country code, as WhatsApp's link format expects. */
  whatsapp: "9779826189697",
  /** As many as support answers on; printed in order. */
  phones: ["+977 9826189697", "+977 9802853077"],
  /** The channel's URL. Left blank until there is one to link to. */
  youtube: "",
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
      "Four figures for the range you pick — revenue, sales, products sold and net profit — then revenue across the week, sales by category, takings by hour, your top items, how people paid, and the latest transactions. Low stock and AI-written notes sit at the foot. Growth Tracker and Heatmap are tabs beside it: one for targets and year-on-year, one for the busiest squares of the week.",
  },
  "/dashboard/sales-revenue": {
    what: "Where the money comes from, product by product.",
    shows:
      "Revenue against profit for each product, the sales trend with a forecast, how you are tracking against target, your peak hours and peak days, best and slowest sellers, and what campaigns and price changes did to sales. The date range at the top drives every card.",
  },
  "/dashboard/profit-cost": {
    what: "What you keep after costs — the health check behind the takings.",
    shows:
      "Gross revenue, net profit, refunds and average margin across the top. Below: profit over time, revenue split against cost of goods, prime cost, break-even, per-unit economics, profit by day and hour, and a menu matrix showing which items earn their place. The what-if planner lets you test a price or cost change before making it.",
  },
  "/dashboard/tax-analytics": {
    what: "Everything the tax office will eventually ask about.",
    shows:
      "Taxable against non-taxable sales, tax by category, tax charged on bills you later refunded, VAT trend and return summary, TDS on rent and receivable, income tax provision, advance instalments, a filing calendar, and a reconciliation of what you actually owe.",
  },
  "/dashboard/expenses": {
    what: "Spending as a picture, rather than as a list of entries.",
    shows:
      "Cash flow over recent months, where the money went by category, the monthly trend, and each budget against what has actually been spent — so a category running hot shows before the month ends.",
  },
  "/dashboard/inventory": {
    what: "What is on your shelves and what it is worth.",
    shows:
      "Stock valued at both selling and cost price, the margin sitting in it, product and variant counts, what is moving fast or not at all, and what is running low. Add Stock opens the whole list for a stock take in one pass.",
  },
  "/dashboard/live-tables": {
    what: "Your floor, as it stands right now.",
    shows:
      "Every table as a grid or as a floor plan you arrange yourself, which are occupied and which are free, and how full the room is.",
  },
  "/dashboard/employee": {
    what: "How your team is performing at the till.",
    shows:
      "Sales, bills and shifts per employee for the range you pick. Opening anyone gives their own page: the bills they rang up, invoices raised, hours worked and shift history.",
  },
  "/dashboard/customers": {
    what: "Who buys from you, and whether they come back.",
    shows:
      "How many customers you have and how many are new, what a typical one spends, who is at risk of not returning, and how spending is spread across them.",
  },
  "/records/invoices": {
    what: "Every bill you have raised, and what is still owed.",
    shows:
      "The invoice list with totals across the top, filtered by state and by due date. Each row's menu carries the whole working life of a bill: view, edit, set a due date, record payment, resend, export as PDF, print, duplicate, or move it to credit.",
  },
  "/records/expenses": {
    what: "Recording what the business spends, and on what.",
    shows:
      "Expenses and income as dated entries under a purpose, with budgets per category, a summary by purpose and the most recent transactions. Recurring entries — rent, subscriptions — are set once with an end date.",
  },
  "/records/credits": {
    what: "Invoices you have moved to credit, and the dues against them.",
    shows:
      "Each credit with what is outstanding on it, its payment history, and the totals across all of them. Instalments are taken here: enter what was handed over and the rest stays due.",
  },
  "/records/order-history": {
    what: "The till's record: every completed sale.",
    shows:
      "Orders, revenue, average order value and refunds for the dates you pick, with every transaction openable in full — items, payment method, who served it. Refunds are issued from here, and refunded orders stay in the record.",
  },
  "/records/customers": {
    what: "Your customer book.",
    shows:
      "Every customer with contact details, loyalty tier and what they owe. Opening one gives their order history, loyalty points, dues and a WhatsApp button to reach them.",
  },
  "/records/products": {
    what: "The menu itself — what you sell and what it costs you.",
    shows:
      "Every product with selling price, cost price, category, stock and variants, plus how much of your plan's product allowance is used. Cost price is what makes margin and profit calculable, so an item without one is missing from those figures.",
  },
  "/offers": {
    what: "Building a promotion, and seeing it before it runs.",
    shows:
      "A four-step builder — what the offer is, what it applies to, the dates it runs and the terms — with a live preview of how it reaches a customer.",
  },
  "/ai-insights": {
    what: "Your own sales, read back to you as advice.",
    shows:
      "Eight sections — menu ideas, slow items, pricing, hour-by-hour, festivals, sales, retention and staffing — each generated from your own data, with the hourly allowance shown in the header. Needs your own AI key; until then each section shows examples marked “Sample data”.",
  },
  "/settings/business": {
    what: "Your business as customers see it.",
    shows:
      "Name, address, precise location, phone, logo and PAN or VAT number — the details printed on every invoice and receipt.",
  },
  "/settings/change-password": {
    what: "Changing the password you sign in with.",
    shows:
      "The current and new password, with a strength check and what makes one strong.",
  },
  "/settings/employees": {
    what: "Who can sign in, and how much they can see.",
    shows:
      "Every employee with their role and status. Adding one creates the account and emails them their password — no password is set here. Role decides reach: the owner sees everything, staff and basic accounts less.",
  },
  "/settings/currency": {
    what: "The currency every figure in the app is shown in.",
    shows:
      "A searchable list by currency, code or country, with the common ones first. It changes the symbol on every figure, past ones included, and converts nothing.",
  },
  "/settings/tax": {
    what: "The tax rates applied to invoices.",
    shows:
      "Standard rates and group rates — several combined under one name — each with its own enabled and applied state, plus the switch that starts adding tax to new invoices.",
  },
  "/settings/discount": {
    what: "Discounts you can reuse at the till.",
    shows:
      "Each discount, whether it takes a percentage or a fixed amount off, and whether it is enabled. A discount that exists but is not enabled will not appear on an invoice.",
  },
  "/settings/category": {
    what: "The groups your products are sorted into.",
    shows:
      "Every category and how many products sit in it. Categories are how the dashboards break sales down, so an uncategorised product is harder to read about later.",
  },
  "/settings/loyalty-points": {
    what: "What customers earn, and what it is worth.",
    shows:
      "How points are earned on a sale, what they are worth when redeemed, and the tiers customers move through as they spend.",
  },
  "/settings/api-keys": {
    what: "Connecting your own AI provider.",
    shows:
      "Your provider and model, the key itself, and how much of this hour's allowance is spent. Google Gemini and OpenRouter both offer a free tier; the cost of the key is yours, not ours.",
  },
  "/bizexpense": {
    what: "Reading expenses straight off a photographed receipt.",
    shows: "Nothing yet — this one is still being built.",
  },
  "/subscriptions": {
    what: "Your plan, and what the others include.",
    shows:
      "Each plan side by side with what it allows, the one you are on marked, and what changes if you move.",
  },
  "/help": {
    what: "This page.",
    shows:
      "Guides for each job, what every screen in the menu does, the ideas worth knowing, the dashboard's vocabulary, what each error code means, and a form to write to us.",
  },
};

// ── Frequently asked ──────────────────────────────────────────────────────

export interface HelpFaq {
  q: string;
  a: string;
  /**
   * A walkthrough of this answer on YouTube, once one is recorded. Absent,
   * the button still shows — greyed, and saying so.
   */
  video?: string;
}

export interface HelpFaqGroup {
  /** The heading the questions sit under. */
  group: string;
  items: HelpFaq[];
}

/**
 * The questions support answers most often, in their own words.
 *
 * These cover the POS app as a whole, not only this dashboard — printing and
 * stock tracking happen at the till, and the person reading this owns both.
 */
export const HELP_FAQS: HelpFaqGroup[] = [
  {
    group: "Account & login",
    items: [
      {
        q: "How do I reset my password?",
        a: "On the login screen, tap “Forgot your Password?” and enter your registered email. RebuzzPOS emails you a reset token. On the Reset Password screen, enter that token along with your new password (and confirm it) to update your password. Check your spam folder if the token doesn’t arrive within a few minutes.",
      },
      {
        q: "Can I use RebuzzPOS on multiple devices?",
        a: "Yes. You can sign in to your RebuzzPOS account on more than one device — for example a counter tablet and the owner’s phone. Just log in with the same email or phone number and password on each device.",
      },
    ],
  },
  {
    group: "Billing & sales",
    items: [
      {
        q: "How do I print bills?",
        a: "Open a completed bill and tap Print. RebuzzPOS prints to a Sunmi built-in printer if your device has one, and to a network printer at the IP you have configured. Set this up under Settings → Hardware & Printing → Printer (Set Bill IP), and make sure the printer and your device are on the same Wi-Fi network.",
      },
      {
        q: "What is a Proforma Invoice?",
        a: "A Proforma Invoice is a preliminary bill you can share before finalising a sale — it lists items, quantities and prices but is not the final tax document. When you export or print from checkout or a saved ticket, you can choose Proforma Invoice, Invoice, or Tax Invoice.",
      },
    ],
  },
  {
    group: "Products & inventory",
    items: [
      {
        q: "How does stock tracking work?",
        a: "Turn on the “Track Stock” switch for a product and enter its In Stock and Low Stock values. RebuzzPOS then reduces the stock count automatically with each sale, so the current quantity always stays up to date.",
      },
      {
        q: "What is a low stock alert?",
        a: "It is a “Low Stock” badge shown on a product in the POS menu when its remaining quantity drops to or below the Low Stock value you set for it. Set the threshold per product using the Low Stock field, with Track Stock enabled.",
      },
    ],
  },
  {
    group: "Staff & roles",
    items: [
      {
        q: "What is the difference between Basic and Staff roles?",
        a: "When you add an employee you assign them a Basic or Staff role — the account owner is the admin. Both Basic and Staff can run daily sales, but Analytics is available only to the admin. Staff members also do not see the Creditors and Bills sections, whereas Basic members do. The admin has full access, including settings and staff management.",
      },
      {
        q: "How does staff login work?",
        a: "An admin adds a staff member by entering their name, email, phone and role — no password is set in the app. The system creates the account and sends the login password to the staff member’s registered email. They then sign in on the normal login screen using their email or phone number and that password.",
      },
    ],
  },
  {
    group: "Printer & hardware",
    items: [
      {
        q: "The printer isn’t printing. What should I check?",
        a: "First, make sure the printer is powered on and on the same Wi-Fi network as your device. Then check the printer IP under Settings → Hardware & Printing → Printer (Set Bill IP) — re-enter it if needed and try printing again. On Sunmi devices the built-in printer is used automatically.",
      },
      {
        q: "How do I find the printer’s IP address?",
        a: "On most thermal printers, hold the feed button while powering on — it prints a configuration page showing the IP address. You can also check your router’s connected-devices list. Enter this IP in RebuzzPOS under Settings → Hardware & Printing → Printer (Set Bill IP).",
      },
    ],
  },
];

/**
 * What a support question can be about.
 *
 * These strings are a contract, not copy: the API checks `subject` against
 * this exact list and rejects anything else, so they are spelled as it
 * spells them rather than to match the FAQ headings beside them.
 */
export const SUPPORT_SUBJECTS: string[] = [
  "Account & Login",
  "Billing & Sales",
  "Products & Inventory",
  "Staff & Roles",
  "Printer & Hardware",
  "Other",
];

/**
 * The three questions a visitor asks that the in-app FAQs do not answer.
 *
 * They live here rather than in `HELP_FAQS` because they are about buying
 * the product, not using it: nobody signed in needs to be told what the app
 * is for. The prices are the ones in `lib/config/plans.ts` — if those
 * change, these sentences have to change with them.
 */
const HOME_ONLY_FAQS: HelpFaq[] = [
  {
    q: "How much does Rebuzz POS cost?",
    a: "There is a free plan that does not expire: the whole app, capped at 20 products. Past that it is Rs 19,999 a year — down from Rs 24,000 — or Rs 80,000 once for lifetime access. Both lift the product limit and add priority support, and a thermal printer can be added to either.",
  },
  {
    q: "What features does Rebuzz POS offer?",
    a: "Billing with proforma, invoice and tax invoice from the same sale; inventory with stock tracking and low-stock alerts; cash, QR and loyalty payments; a customer book with loyalty points; staff accounts with roles and shifts; expenses and budgets; VAT and PAN handling built for Nepal; offers; and dashboards for sales, profit, tax and staff.",
  },
  {
    q: "What are the benefits of using Rebuzz POS?",
    a: "One place instead of four: the till, the stock, the books and the reports all read from the same sales. The numbers arrive worked out — margin per item, break-even, your busiest hours, who is buying again — rather than as a spreadsheet to build. It is made for how businesses here trade, in NPR, with Nepal's tax rules and holiday calendar, and runs on whatever device you already have.",
  },
];

/**
 * Questions already answered for the Help page that a visitor also asks.
 *
 * Listed by question so the answer stays in one place: change it there and
 * the home page changes with it.
 */
export const HOME_FAQ_QUESTIONS: string[] = [
  "Can I use RebuzzPOS on multiple devices?",
  "How does stock tracking work?",
];

/** What the home page shows: the buying questions, then the using ones. */
export const HOME_FAQS: HelpFaq[] = [
  ...HOME_ONLY_FAQS,
  ...HOME_FAQ_QUESTIONS.flatMap((question) =>
    HELP_FAQS.flatMap((group) => group.items).filter(
      (item) => item.q === question,
    ),
  ),
];
