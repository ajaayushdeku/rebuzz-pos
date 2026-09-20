"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import toast from "react-hot-toast";
import {
  ArrowDownRight,
  ArrowUpRight,
  FlaskConical,
  RefreshCw,
  Sparkles,
  TriangleAlert,
  WandSparkles,
  X,
  type LucideIcon,
} from "lucide-react";

import AiInsightsErrorState from "@/components/aiInsights/AiInsightsErrorState";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useAiProviderLabel } from "@/hooks/useAiKey";
import type { AiSectionState } from "@/hooks/useAiSection";
import { useCurrency } from "@/providers/CurrencyContext";
import { formatNumber } from "@/utils/helper";

/**
 * Pieces shared by every AI Insights section.
 *
 * Eight sections repeat the same header, card, dismiss button, tip box and
 * action button. Written once here so they cannot drift apart visually — one
 * section with a slightly different tip box reads as a different kind of
 * advice.
 */

/**
 * Money in the business's currency: "Rs 1,200", and "-Rs 40" for a loss.
 *
 * The sign goes before the symbol, as `formatCurrencySymbol` does elsewhere in
 * the app. "Rs -40" read as a price of minus forty.
 */
export function useMoney() {
  const { currency } = useCurrency();
  return (value: number) => {
    const text = `${currency.symbol} ${formatNumber(Math.abs(value), currency.locale)}`;
    return value < 0 && /[1-9]/.test(text) ? `-${text}` : text;
  };
}

/**
 * Stand-in for actions that are not wired up yet.
 *
 * Says so plainly rather than doing nothing: a button that silently ignores a
 * click reads as broken, and one that pretends to succeed would be worse.
 */
export function comingSoon(action: string) {
  toast(`${action} is coming soon.`, { icon: "✨" });
}

/**
 * Marks a section that still shows sample content instead of an AI answer.
 *
 * The connected sections and the sample ones look the same, and the sample
 * cards name items, customers and prices that read as real. Without a mark, a
 * merchant could act on advice about a customer they do not have. It goes
 * once a section is generated from the business's own data.
 */
export function SampleDataBadge() {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        {/* tabIndex so the explanation is reachable by keyboard, as on
            RangeBadge: a native `title` never shows for anyone tabbing. */}
        <span
          tabIndex={0}
          className="inline-flex shrink-0 cursor-help items-center gap-1 rounded-full border border-dashed border-gray-300 bg-gray-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-gray-500 outline-none focus-visible:ring-2 focus-visible:ring-violet-500"
        >
          <FlaskConical size={10} aria-hidden />
          Sample data
        </span>
      </TooltipTrigger>
      <TooltipContent side="top" sideOffset={6} className="max-w-64">
        <p className="font-semibold">Not connected to AI yet</p>
        <p className="mt-1 leading-relaxed opacity-80">
          These cards are examples of what this section will show. They are not
          about your business, and its buttons are not wired up yet.
        </p>
      </TooltipContent>
    </Tooltip>
  );
}

export function SectionHeader({
  icon: Icon,
  iconClassName,
  title,
  subtitle,
  actions,
  sample = false,
}: {
  icon: LucideIcon;
  /** Tile background and icon colour, e.g. "bg-red-50 text-red-600". */
  iconClassName: string;
  title: string;
  subtitle: string;
  actions?: ReactNode;
  /** The section still shows sample content; see SampleDataBadge. */
  sample?: boolean;
}) {
  return (
    <div className="mb-4 flex relative gap-3 flex-col md:flex-row items-start md:items-center justify-between">
      <div className="flex items-center  gap-3">
        <div
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${iconClassName}`}
        >
          <Icon size={17} />
        </div>
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-base font-semibold text-gray-900">{title}</h2>
            {sample && <SampleDataBadge />}
          </div>
          <p className="text-xs text-gray-500">{subtitle}</p>
        </div>
      </div>
      {actions && <div className="flex w-full md:w-fit  gap-2">{actions}</div>}
    </div>
  );
}

export function GenerateMoreButton({
  label = "Generate More",
  icon: Icon = WandSparkles,
  textClassName,
  onClick,
  busy = false,
}: {
  label?: string;
  icon?: LucideIcon;
  /** The section's accent, e.g. "text-red-600". */
  textClassName: string;
  onClick: () => void;
  /** A request is running: the icon spins and further clicks are ignored. */
  busy?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={busy}
      aria-busy={busy}
      className={`inline-flex items-center gap-2 rounded-lg border bg-white px-3 py-2 text-[11px] tracking-wide font-semibold   cursor-pointer transition-colors disabled:cursor-wait disabled:opacity-70 ${textClassName}`}
    >
      <Icon size={14} className={busy ? "animate-spin" : undefined} />
      <span className="hidden md:block"> {label}</span>
    </button>
  );
}

/** The × in a card's corner. Named for screen readers by what it removes. */
export function DismissButton({
  label,
  onClick,
  className = "absolute right-3 top-3",
}: {
  label: string;
  onClick: () => void;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={`Dismiss ${label}`}
      className={`rounded-md p-1 text-gray-300 transition-colors hover:bg-gray-100 hover:text-gray-500 ${className}`}
    >
      <X size={14} />
    </button>
  );
}

/** Three across on wide screens, the grid every card section uses. */
export function CardGrid({ children }: { children: ReactNode }) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-2">
      {children}
    </div>
  );
}

/** Shown when every card in a section has been dismissed. */
export function EmptySection({ message }: { message: string }) {
  return (
    <p className="rounded-xl border border-dashed border-gray-200 bg-white px-4 py-8 text-center text-[13px] text-gray-400">
      {message}
    </p>
  );
}

// ── Sections generated by AI ──────────────────────────────────────────────

/** The Refresh button, once there is an answer worth replacing. */
export function SectionRefreshButton<T>({
  state,
  textClassName,
}: {
  state: AiSectionState<T>;
  textClassName: string;
}) {
  // Nothing to refresh until something has loaded, and nothing to analyse
  // when there is no data — a new answer would cost a call to say so again.
  if (!state.data || state.data.reason) return null;
  return (
    <GenerateMoreButton
      label={state.isRefreshing ? "Refreshing…" : "Refresh"}
      icon={RefreshCw}
      textClassName={textClassName}
      onClick={state.refresh}
      busy={state.isRefreshing}
    />
  );
}

/** "10:42 AM", or "Sep 16, 10:42 AM" when it was not today. */
/**
 * Why there is no fresh answer, in a merchant's words.
 *
 * Each of these is a real difference: a model that answered nothing may work
 * on the next try, while a spent hourly limit needs waiting, and both are
 * worth telling apart from "something went wrong".
 */
function staleWhy(reason?: string): string {
  switch (reason) {
    case "INSIGHTS_RATE_LIMIT":
    case "AI_RATE_LIMIT":
      return "AI requests for this hour are used up.";
    case "AI_QUOTA_EXCEEDED":
      return "Your key's usage limit is reached.";
    case "AI_EMPTY_RESPONSE":
      return "The model in use answered nothing.";
    case "AI_TRUNCATED":
      return "The model in use was cut off before finishing.";
    case "AI_MALFORMED_RESPONSE":
      return "The model in use answered in a format we couldn't read.";
    default:
      return "A fresh answer couldn't be generated.";
  }
}

function updatedLabel(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  const sameDay = date.toDateString() === new Date().toDateString();
  return date.toLocaleString("en-US", {
    ...(sameDay ? {} : { month: "short", day: "numeric" }),
    hour: "numeric",
    minute: "2-digit",
  });
}

/**
 * Everything around a generated section's content: loading, failure, the two
 * "nothing to show" cases, and the caption saying where the answer came from.
 *
 * `children` renders only when there are items on screen. `visibleCount` is
 * what is left after dismissals and filters, so an emptied section says so
 * instead of showing a blank space.
 */
export function AiSectionBody<T>({
  state,
  visibleCount,
  layout,
  noSalesMessage,
  nothingFlaggedMessage = "Nothing to flag right now.",
  emptyMessage,
  children,
}: {
  state: AiSectionState<T>;
  visibleCount: number;
  /** The skeleton's shape: rows, or a grid of cards. */
  layout: "list" | "cards";
  noSalesMessage: string;
  nothingFlaggedMessage?: string;
  emptyMessage: string;
  children: ReactNode;
}) {
  const { data } = state;
  // Which provider is answering. The cache only serves an answer generated
  // under the provider and model in use, so this always names the one that
  // actually wrote what is on screen.
  const providerLabel = useAiProviderLabel();

  if (state.isLoading) {
    return layout === "list" ? (
      <ul className="flex flex-col gap-2.5" aria-label="Loading">
        {[0, 1, 2].map((i) => (
          <li
            key={i}
            className="h-12 animate-pulse rounded-xl border border-gray-100 bg-gray-100/70"
          />
        ))}
      </ul>
    ) : (
      <div
        className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3"
        aria-label="Loading"
      >
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="h-64 animate-pulse rounded-xl border border-gray-100 bg-gray-100/70"
          />
        ))}
      </div>
    );
  }

  if (state.isError) {
    return <AiInsightsErrorState error={state.error} onRetry={state.retry} />;
  }

  if (data?.reason === "NO_SALES")
    return <EmptySection message={noSalesMessage} />;
  if (data?.reason === "NOTHING_FLAGGED") {
    return <EmptySection message={nothingFlaggedMessage} />;
  }
  if (visibleCount === 0) return <EmptySection message={emptyMessage} />;

  return (
    <>
      <div
        className={`transition-opacity ${state.isRefreshing ? "opacity-50" : ""}`}
      >
        {children}
      </div>
      {data?.generatedAt &&
        (data.stale ? (
          /* Not this model's answer. Said plainly and in amber, because the
             cards are real but older — reading them as today's work from the
             model just chosen would be the wrong conclusion. */
          <p className="mt-2.5 flex flex-wrap items-center justify-end gap-x-1.5 text-right text-[11px] text-amber-700">
            <TriangleAlert className="h-3 w-3 shrink-0" aria-hidden />
            <span>
              {staleWhy(data.staleReason)} Showing the last answer
              {data.model ? (
                <>
                  {" from "}
                  <span className="font-mono">{data.model}</span>
                </>
              ) : null}
              , written {updatedLabel(data.generatedAt)}.
            </span>
          </p>
        ) : (
          <p className="mt-2.5 text-right text-[11px] text-gray-400">
            Written by {providerLabel ?? "AI"} from your own sales and menu
            {/* The model as well as the provider: on OpenRouter's free router
                the model changes between answers, and "which one wrote this"
                is the first question when a card reads badly. */}
            {data.model && (
              <>
                {" · "}
                <span className="font-mono">{data.model}</span>
              </>
            )}
            {" · Updated "}
            {updatedLabel(data.generatedAt)}
          </p>
        ))}
    </>
  );
}

// ── The insight card ──────────────────────────────────────────────────────
//
// One layout for every card on the page, top to bottom:
//   a thin accent strip · a header (tile, small label, title) · a strip of
//   figures · the body · a recommendation · an action.
// Each section only decides what goes in each slot, so a price change, a slow
// item and a festival read as the same kind of object.

/**
 * A card's accent, used three times: the strip across the top, the tile
 * behind its icon and its small label. Written out whole, for Tailwind.
 */
export const ACCENTS = {
  emerald: {
    bar: "bg-emerald-500",
    bg: "bg-emerald-50",
    bgIcon: "bg-emerald-200",
    tile: "bg-emerald-50 text-emerald-600",
    text: "text-emerald-700",
  },
  blue: {
    bar: "bg-blue-500",
    bg: "bg-blue-50",
    bgIcon: "bg-blue-200",
    tile: "bg-blue-50 text-blue-600",
    text: "text-blue-700",
  },
  red: {
    bar: "bg-red-500",
    bg: "bg-red-50",
    bgIcon: "bg-red-200",
    tile: "bg-red-50 text-red-600",
    text: "text-red-600",
  },
  rose: {
    bar: "bg-rose-400",
    bg: "bg-rose-50",
    bgIcon: "bg-rose-200",
    tile: "bg-rose-50 text-rose-600",
    text: "text-rose-600",
  },
  amber: {
    bar: "bg-amber-400",
    bg: "bg-amber-50",
    bgIcon: "bg-amber-200",
    tile: "bg-amber-50 text-amber-600",
    text: "text-amber-700",
  },
  orange: {
    bar: "bg-orange-400",
    bg: "bg-orange-50",
    bgIcon: "bg-orange-200",
    tile: "bg-orange-50 text-orange-600",
    text: "text-orange-700",
  },
  pink: {
    bar: "bg-pink-500",
    bg: "bg-pink-50",
    bgIcon: "bg-pink-200",
    tile: "bg-pink-50 text-pink-600",
    text: "text-pink-600",
  },
  slate: {
    bar: "bg-slate-300",
    bg: "bg-slate-50",
    bgIcon: "bg-slate-200",
    tile: "bg-slate-100 text-slate-500",
    text: "text-slate-500",
  },
} as const;

export type AccentName = keyof typeof ACCENTS;

/** A square in the card's accent, holding an emoji or an icon. */
export function LeadTile({
  accent,
  children,
}: {
  accent: AccentName;
  children: ReactNode;
}) {
  return (
    <span
      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-xl leading-none ${ACCENTS[accent].bgIcon}`}
      aria-hidden
    >
      {children}
    </span>
  );
}

/** The quieter part of a card's label: " · since Aug 7". */
export function LabelNote({ children }: { children: ReactNode }) {
  return (
    <span className="font-medium normal-case tracking-normal text-gray-400">
      · {children}
    </span>
  );
}

/**
 * "▼ 93%" beside a figure. Coloured only where up or down has a meaning; a
 * price moving is neither good nor bad in itself, so it can be `neutral`.
 */
export function Delta({
  pct,
  neutral = false,
}: {
  pct: number | null;
  neutral?: boolean;
}) {
  if (pct === null || pct === 0) return null;
  const up = pct > 0;
  const Arrow = up ? ArrowUpRight : ArrowDownRight;
  const tone = neutral
    ? "bg-gray-100 text-gray-600"
    : up
      ? "bg-emerald-50 text-emerald-700"
      : "bg-red-50 text-red-600";
  return (
    <span
      className={`inline-flex items-center gap-0.5 rounded px-1 py-px text-[10px] font-semibold tabular-nums ${tone}`}
    >
      <Arrow size={10} aria-hidden />
      {Math.abs(pct)}%
    </span>
  );
}

export interface Metric {
  label: string;
  value: ReactNode;
  /** Colour of the value, when it carries meaning (a loss in red). */
  valueClassName?: string;
  /** The comparison under it: "was Rs 55", "of units sold". */
  note?: ReactNode;
  delta?: { pct: number | null; neutral?: boolean };
}

/**
 * A card's figures as one strip across it, divided into columns.
 *
 * Each column reads top to bottom — what it is, where it is now, where it
 * was — so a before-and-after sits in one place.
 */
export function MetricStrip({ metrics }: { metrics: Metric[] }) {
  const cols = metrics.length >= 3 ? "grid-cols-3" : "grid-cols-2";
  return (
    <dl
      className={`grid ${cols} divide-x divide-gray-100 border-y border-gray-100 bg-gray-50/60`}
    >
      {metrics.slice(0, 3).map((m) => (
        <div key={m.label} className="min-w-0 px-4 py-3">
          <dt className="truncate text-[10px] font-semibold uppercase tracking-wider text-gray-400">
            {m.label}
          </dt>
          <dd
            className={`mt-1 text-[15px] font-semibold leading-tight tabular-nums ${m.valueClassName ?? "text-gray-900"}`}
          >
            {m.value}
          </dd>
          {(m.note || m.delta) && (
            <dd className="mt-1 flex flex-wrap items-center gap-1 text-[11px] text-gray-400">
              {m.note && <span className="tabular-nums">{m.note}</span>}
              {m.delta && <Delta {...m.delta} />}
            </dd>
          )}
        </div>
      ))}
    </dl>
  );
}

/**
 * What the AI recommends, as the card's conclusion.
 *
 * Blue, and the same on every card, so "this is what to do" is recognisable
 * across sections. `details` is a row under the advice for the figure it
 * suggests — a price, a discount.
 */
export function Recommendation({
  title = "Recommendation",
  children,
  details,
}: {
  title?: string;
  children: ReactNode;
  details?: ReactNode;
}) {
  return (
    <div className="overflow-hidden rounded-lg border border-blue-100 bg-blue-50/40">
      <div className="px-3.5 py-3">
        <p className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-blue-700">
          <Sparkles size={11} aria-hidden />
          {title}
        </p>
        <div className="mt-1.5 text-[13px] leading-relaxed text-gray-700">
          {children}
        </div>
      </div>
      {details && (
        <div className="flex flex-col gap-2 border-t border-blue-100 bg-white/70 px-3.5 py-3">
          {details}
        </div>
      )}
    </div>
  );
}

/** A small uppercase label over a group of tags inside a card body. */
export function BodyLabel({ children }: { children: ReactNode }) {
  return (
    <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-gray-400">
      {children}
    </p>
  );
}

/** Items as small bordered tags: "Pizza · Rs 400", "Coke". */
export function TagList({
  tags,
}: {
  tags: { key: string; content: ReactNode }[];
}) {
  return (
    <ul className="flex flex-wrap gap-1.5">
      {tags.map((t) => (
        <li
          key={t.key}
          className="rounded-md border border-gray-200 bg-white px-2 py-1 text-[11px] text-gray-700"
        >
          {t.content}
        </li>
      ))}
    </ul>
  );
}

/**
 * The card's one action, full width at the bottom. Solid when there is
 * something to do, outlined when it only leads somewhere to look.
 */
export function CardAction({
  href,
  onClick,
  primary = true,
  external = false,
  children,
}: {
  href?: string;
  onClick?: () => void;
  primary?: boolean;
  /** Another site (WhatsApp): opened in a new tab, not routed in the app. */
  external?: boolean;
  children: ReactNode;
}) {
  const className = primary
    ? "flex w-full items-center justify-center gap-1.5 rounded-lg bg-gray-900 px-3 py-2.5 text-[13px] font-semibold text-white transition-colors hover:bg-gray-800"
    : "flex w-full items-center justify-center gap-1.5 rounded-lg border border-gray-200 px-3 py-2.5 text-[13px] font-semibold text-gray-700 transition-colors hover:bg-gray-50";
  const content = (
    <>
      {children}
      <ArrowUpRight size={14} aria-hidden />
    </>
  );
  if (href && external) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className={className}
      >
        {content}
      </a>
    );
  }
  return href ? (
    <Link href={href} className={className}>
      {content}
    </Link>
  ) : (
    <button type="button" onClick={onClick} className={className}>
      {content}
    </button>
  );
}

export function InsightCard({
  accent,
  lead,
  label,
  title,
  onDismiss,
  dismissLabel,
  corner,
  metrics,
  children,
  footer,
}: {
  accent: AccentName;
  /** The tile at the left of the header; usually a LeadTile. */
  lead: ReactNode;
  /** The small coloured line above the title: what kind of card this is. */
  label: ReactNode;
  title: ReactNode;
  onDismiss: () => void;
  dismissLabel: string;
  /** Extra controls beside the dismiss button, e.g. a shortlist star. */
  corner?: ReactNode;
  metrics?: Metric[];
  children: ReactNode;
  /** The action at the bottom; a CardAction. */
  footer?: ReactNode;
}) {
  const a = ACCENTS[accent];
  return (
    <article className="relative flex h-full flex-col overflow-hidden rounded-xl border border-gray-200 bg-white transition-shadow hover:shadow-md">
      {/* The kind of card, as a colour, before anything is read. */}
      <div className={`h-0.75 ${a.bar}`} aria-hidden />

      <header className={`flex items-start gap-3 px-5 pb-3.5 pt-4  ${a.bg}`}>
        {lead}
        <div className={`min-w-0 flex-1 ${corner ? "pr-12" : "pr-6"}`}>
          <p
            className={`flex flex-wrap items-center gap-1 text-[10px] font-semibold uppercase tracking-wider ${a.text}`}
          >
            {label}
          </p>
          <h3 className="mt-0.5 text-[15px] font-semibold leading-snug text-gray-900">
            {title}
          </h3>
        </div>
        <div className="absolute right-3 top-4 flex items-center gap-0.5">
          {corner}
          <DismissButton
            label={dismissLabel}
            onClick={onDismiss}
            className=""
          />
        </div>
      </header>

      {metrics && metrics.length > 0 && <MetricStrip metrics={metrics} />}

      <div
        className={`flex flex-1 flex-col gap-4 px-5 pt-4 ${footer ? "pb-4" : "pb-5"}`}
      >
        {children}
      </div>

      {footer && <footer className="mt-auto px-5 pb-5">{footer}</footer>}
    </article>
  );
}
