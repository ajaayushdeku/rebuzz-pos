"use client";

import { useState, type ReactNode } from "react";
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
import RefreshConfirmModal from "@/components/aiInsights/RefreshConfirmModal";
import { CardInfo } from "@/components/dashboardComponents/chartCard";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useAiProviderLabel } from "@/hooks/useAiKey";
import type { AiSectionState } from "@/hooks/useAiSection";
import { useCurrency } from "@/providers/CurrencyContext";
import { formatNumber } from "@/utils/helper";
import {
  STAT_ROW_AI_INSIGHTS,
  STAT_ROW_ITEM_AI_INSIGHTS,
} from "../dashboardComponents/overviewDash/statRow";
import { cn } from "@/lib/utils";

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
          className="inline-flex shrink-0 cursor-help items-center gap-1 rounded-full border border-dashed border-[#dadce0] bg-[#f8f9fa] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[#5f6368] outline-none focus-visible:ring-2 focus-visible:ring-violet-500 dark:border-white/15 dark:text-[#a9b4c7] dark:bg-white/5"
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

/**
 * A section's header, built to ChartCard's: the same tile, the same title and
 * subtitle, the same ⓘ beside the title, the same row of controls on the
 * right. Sections and dashboard cards are read as the same kind of object, so
 * they are headed the same way.
 */
export function SectionHeader({
  icon: Icon,
  iconClassName,
  title,
  subtitle,
  info,
  actions,
  sample = false,
  align = "flex-row",
  actionWidth = "",
}: {
  icon: LucideIcon;
  /** Tile background and icon colour, e.g. "bg-red-50 text-red-600 dark:text-red-300 dark:bg-red-400/10". */
  iconClassName: string;
  title: string;
  subtitle: ReactNode;
  info?: { heading: string; body: ReactNode };
  actions?: ReactNode;
  sample?: boolean;
  align?: string;
  actionWidth?: string;
}) {
  return (
    <div
      className={`relative mb-4 flex ${align} items-center justify-between gap-3`}
    >
      <div className="flex min-w-0 items-center gap-3">
        <div
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-[13px] border border-current/15 shadow-sm ${iconClassName}`}
        >
          <Icon size={18} strokeWidth={1.9} />
        </div>

        <div className="min-w-0">
          <h3 className="flex min-w-0 items-center gap-1.5 text-[14px] font-medium tracking-[0.01em] text-[#27364e] sm:text-[15px] dark:text-[#e8edf7]">
            <span className="truncate">{title}</span>
            {info && (
              <CardInfo heading={info.heading} body={info.body} label={title} />
            )}
            {sample && <SampleDataBadge />}
          </h3>

          <p className="mt-1 line-clamp-2 text-[11px] leading-[1.45] tracking-wide text-slate-500 sm:text-xs dark:text-slate-400">
            {subtitle}
          </p>
        </div>
      </div>

      {actions && (
        <div className={`flex ${actionWidth} shrink-0 items-center gap-2`}>
          {actions}
        </div>
      )}
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
  /** The section's accent, e.g. "text-red-600 dark:text-red-300". */
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
      className={`inline-flex cursor-pointer items-center gap-2 rounded-lg border border-[#dadce0] bg-white dark:bg-white/5 px-3 py-2 text-[11px] font-semibold tracking-wide transition-colors hover:bg-[#f8f9fa] disabled:cursor-wait disabled:opacity-70 ${textClassName} dark:hover:bg-white/5 dark:border-white/15`}
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
      className={`rounded-md p-1 text-[#9aa0a6] transition-colors hover:bg-[#f1f3f4] hover:text-[#5f6368] ${className} dark:hover:text-[#e8ecf4] dark:hover:bg-white/10 dark:text-[#9aa6bd]`}
    >
      <X size={14} />
    </button>
  );
}

/** Three across on wide screens, the grid every card section uses. */
export function CardGrid({ children }: { children: ReactNode }) {
  return (
    // <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
    <div className={STAT_ROW_AI_INSIGHTS}>{children}</div>
  );
}

/** Shown when every card in a section has been dismissed. */
export function EmptySection({ message }: { message: string }) {
  return (
    <div className="rounded-2xl border border-[#e5e7eb] bg-[#fafafa] px-5 py-10 text-center dark:border-white/10 dark:bg-[#171c26] sm:px-8 sm:py-12">
      <div className="mx-auto flex max-w-md flex-col items-center">
        {/* Icon */}
        <div className="mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-[#f0f1f3] dark:bg-white/10">
          <Sparkles
            size={24}
            className="text-gray-500 dark:text-[#9aa6bd]"
            aria-hidden
          />
        </div>

        {/* Heading */}
        <h3 className="text-sm font-semibold text-[#374151] dark:text-[#e5e7eb]">
          Nothing to show just yet
        </h3>

        {/* Description */}
        <p className="mt-2 max-w-sm text-[13px] leading-relaxed text-[#737b89] dark:text-[#9ca6b5]">
          {message}
        </p>

        {/* Status */}
        <div className="mt-5 inline-flex items-center gap-2 rounded-lg bg-[#f0f1f3] px-3 py-2 dark:bg-white/[0.05]">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
          <span className="text-[10px] font-medium tracking-wide text-[#737b89] dark:text-[#a1a8b5]">
            ALL CAUGHT UP
          </span>
        </div>
      </div>
    </div>
  );
}

// ── Sections generated by AI ──────────────────────────────────────────────

/**
 * "Generate more": a further batch of cards, added after the ones shown.
 * Only for sections whose hook was given `describe`, and only while the AI
 * still has new ones to give.
 */
export function SectionMoreButton<T>({
  state,
  textClassName,
}: {
  state: AiSectionState<T>;
  textClassName: string;
}) {
  if (!state.canGenerateMore) return null;

  return (
    <span title="Adds new cards to the ones shown. Uses one request on your AI key.">
      <GenerateMoreButton
        label={state.isGeneratingMore ? "Generating…" : "Generate more"}
        textClassName={textClassName}
        onClick={state.generateMore}
        busy={state.isGeneratingMore}
      />
    </span>
  );
}

/**
 * The Refresh button, once there is an answer worth replacing.
 *
 * Confirmed before it fires, because this is the one control on the page that
 * spends from the hourly allowance on the merchant's own key — everything else
 * is served from the day's saved answer for nothing. The modal says what is
 * left, when the next request frees up, and which provider and model will
 * answer, so the decision is made with those in view rather than after the fact.
 */
export function SectionRefreshButton<T>({
  state,
  textClassName,
}: {
  state: AiSectionState<T>;
  textClassName: string;
}) {
  const [confirming, setConfirming] = useState(false);

  // Nothing to refresh until something has loaded, and nothing to analyse
  // when there is no data — a new answer would cost a call to say so again.
  if (!state.data || state.data.reason) return null;

  return (
    <>
      <GenerateMoreButton
        label={state.isRefreshing ? "Refreshing…" : "Refresh"}
        icon={RefreshCw}
        textClassName={textClassName}
        onClick={() => setConfirming(true)}
        busy={state.isRefreshing}
      />

      {/* Mounted only while asking. The modal reads the quota and the key
          status, and this button renders on all eight sections — left mounted,
          that would be eight readers of a `staleTime: 0` query refetching on
          every window focus, each a round trip through the proxy to the POS. */}
      {confirming && (
        <RefreshConfirmModal
          open
          onClose={() => setConfirming(false)}
          busy={state.isRefreshing}
          onConfirm={() => {
            setConfirming(false);
            state.refresh();
          }}
        />
      )}
    </>
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
  layout: "list" | "cards";
  noSalesMessage: string;
  nothingFlaggedMessage?: string;
  emptyMessage: string;
  children: ReactNode;
}) {
  const { data } = state;
  const providerLabel = useAiProviderLabel();

  if (state.isLoading) {
    return layout === "list" ? (
      <ul className="flex flex-col gap-2.5" aria-label="Loading">
        {[0, 1, 2].map((i) => (
          <li
            key={i}
            className="h-12 animate-pulse rounded-xl border border-slate-200/80 bg-slate-100 dark:border-[#293750] dark:bg-[#182338]"
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
            className="h-64 animate-pulse rounded-2xl border border-slate-200/80 bg-slate-100 dark:border-[#293750] dark:bg-[#182338]"
          />
        ))}
      </div>
    );
  }

  if (state.isError) {
    return <AiInsightsErrorState error={state.error} onRetry={state.retry} />;
  }

  if (data?.reason === "NO_SALES") {
    return <EmptySection message={noSalesMessage} />;
  }

  if (data?.reason === "NOTHING_FLAGGED") {
    return <EmptySection message={nothingFlaggedMessage} />;
  }

  if (visibleCount === 0) {
    return <EmptySection message={emptyMessage} />;
  }

  return (
    <>
      <div
        className={`transition-opacity duration-300 ${
          state.isRefreshing ? "opacity-50" : "opacity-100"
        }`}
      >
        {children}
      </div>

      {data?.generatedAt &&
        (data.stale ? (
          <div className="mt-3 flex items-start justify-end gap-2 text-right">
            <TriangleAlert
              className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-600 dark:text-amber-400"
              aria-hidden
            />
            <p className="text-[11px] leading-relaxed text-amber-700 dark:text-amber-300">
              {staleWhy(data.staleReason)} Showing the last answer
              {data.model ? (
                <>
                  {" from "}
                  <span className="font-mono font-medium">{data.model}</span>
                </>
              ) : null}
              , written {updatedLabel(data.generatedAt)}.
            </p>
          </div>
        ) : (
          <div className="mt-5 flex flex-wrap items-center justify-end gap-x-1.5 gap-y-1 text-[11px] text-slate-500 dark:text-slate-400">
            <span>Generated by</span>
            <span className="font-medium text-slate-700 dark:text-slate-300">
              {providerLabel ?? "AI"}
            </span>

            {data.model && (
              <>
                <span className="text-slate-300 dark:text-slate-600">·</span>
                <span className="font-mono text-slate-500 dark:text-slate-400">
                  {data.model}
                </span>
              </>
            )}

            <span className="text-slate-300 dark:text-slate-600">·</span>
            <span>Generated on {updatedLabel(data.generatedAt)}</span>
          </div>
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
    bg: "bg-emerald-50 dark:bg-emerald-400/10",
    bgIcon: "bg-emerald-200 dark:bg-emerald-400/25",
    tile: "bg-emerald-50 text-emerald-600 dark:text-emerald-300 dark:bg-emerald-400/10",
    text: "text-emerald-700 dark:text-emerald-300",
  },
  blue: {
    bar: "bg-blue-500",
    bg: "bg-blue-50 dark:bg-blue-400/10",
    bgIcon: "bg-blue-200 dark:bg-blue-400/25",
    tile: "bg-blue-50 text-blue-600 dark:text-blue-300 dark:bg-blue-400/10",
    text: "text-blue-700 dark:text-blue-300",
  },
  red: {
    bar: "bg-red-500",
    bg: "bg-red-50 dark:bg-red-400/10",
    bgIcon: "bg-red-200 dark:bg-red-400/25",
    tile: "bg-red-50 text-red-600 dark:text-red-300 dark:bg-red-400/10",
    text: "text-red-600 dark:text-red-300",
  },
  rose: {
    bar: "bg-rose-400",
    bg: "bg-rose-50 dark:bg-rose-400/10",
    bgIcon: "bg-rose-200 dark:bg-rose-400/25",
    tile: "bg-rose-50 text-rose-600 dark:text-rose-300 dark:bg-rose-400/10",
    text: "text-rose-600 dark:text-rose-300",
  },
  amber: {
    bar: "bg-amber-400",
    bg: "bg-amber-50 dark:bg-amber-400/10",
    bgIcon: "bg-amber-200 dark:bg-amber-400/25",
    tile: "bg-amber-50 text-amber-600 dark:text-amber-300 dark:bg-amber-400/10",
    text: "text-amber-700 dark:text-amber-300",
  },
  orange: {
    bar: "bg-orange-400",
    bg: "bg-orange-50 dark:bg-orange-400/10",
    bgIcon: "bg-orange-200 dark:bg-orange-400/25",
    tile: "bg-orange-50 text-orange-600 dark:text-orange-300 dark:bg-orange-400/10",
    text: "text-orange-700 dark:text-orange-300",
  },
  pink: {
    bar: "bg-pink-500",
    bg: "bg-pink-50 dark:bg-pink-400/10",
    bgIcon: "bg-pink-200 dark:bg-pink-400/25",
    tile: "bg-pink-50 text-pink-600 dark:text-pink-300 dark:bg-pink-400/10",
    text: "text-pink-600 dark:text-pink-300",
  },
  slate: {
    bar: "bg-slate-300 dark:bg-white/20",
    bg: "bg-slate-50 dark:bg-white/5",
    bgIcon: "bg-slate-200 dark:bg-white/15",
    tile: "bg-slate-100 text-slate-500 dark:text-[#9aa6bd] dark:bg-white/10",
    text: "text-slate-500 dark:text-[#9aa6bd]",
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
    <span className="font-medium normal-case tracking-normal text-[#9aa0a6] dark:text-[#9aa6bd]">
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
    ? "bg-[#f1f3f4] text-[#5f6368] dark:text-[#a9b4c7] dark:bg-white/10"
    : up
      ? "bg-emerald-50 text-emerald-700 dark:text-emerald-300 dark:bg-emerald-400/10"
      : "bg-red-50 text-red-600 dark:text-red-300 dark:bg-red-400/10";
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
      className={`grid ${cols} divide-x divide-[#e8eaed] border-y border-[#e8eaed] bg-[#f8f9fa] dark:border-white/10 dark:divide-white/10 dark:bg-white/5`}
    >
      {metrics.slice(0, 3).map((m) => (
        <div key={m.label} className="min-w-0 px-4 py-3">
          <dt className="truncate text-[10px] font-semibold uppercase tracking-wider text-[#9aa0a6] dark:text-[#9aa6bd]">
            {m.label}
          </dt>
          <dd
            className={`mt-1 text-[15px] font-semibold leading-tight tabular-nums ${m.valueClassName ?? "text-[#3c4043] dark:text-[#e8ecf4]"}`}
          >
            {m.value}
          </dd>
          {(m.note || m.delta) && (
            <dd className="mt-1 flex flex-wrap items-center gap-1 text-[11px] text-[#9aa0a6] dark:text-[#9aa6bd]">
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
    <div className="overflow-hidden rounded-lg border border-blue-100 bg-blue-50/40 dark:border-blue-400/20 dark:bg-blue-400/10">
      <div className="px-3.5 py-3">
        <p className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-blue-700 dark:text-blue-300">
          <Sparkles size={11} aria-hidden />
          {title}
        </p>
        <div className="mt-1.5 text-[13px] leading-relaxed text-[#3c4043] dark:text-[#e8ecf4]">
          {children}
        </div>
      </div>
      {details && (
        <div className="flex flex-col gap-2 border-t border-blue-100 bg-white/70 dark:bg-white/5 px-3.5 py-3 dark:border-blue-400/20">
          {details}
        </div>
      )}
    </div>
  );
}

/**
 * Several pieces of advice inside one Recommendation, best first.
 *
 * Numbered rather than bulleted: these are alternatives ranked by what to
 * try first, and a bullet would read as "do all of these". A single tip is
 * rendered as a plain sentence, so a card with one answer looks no different
 * from how it did when one was all a card could hold.
 */
export function TipList({ tips }: { tips: string[] }) {
  if (tips.length === 0) return null;
  if (tips.length === 1) return <>{tips[0]}</>;

  return (
    <ol className="flex flex-col gap-2">
      {tips.map((tip, i) => (
        <li key={i} className="flex gap-2.5">
          <span className="mt-px text-[11px] font-semibold tabular-nums text-blue-700 dark:text-blue-300">
            {i + 1}
          </span>
          <span>{tip}</span>
        </li>
      ))}
    </ol>
  );
}

/** A small uppercase label over a group of tags inside a card body. */
export function BodyLabel({ children }: { children: ReactNode }) {
  return (
    <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-[#9aa0a6] dark:text-[#9aa6bd]">
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
          className="rounded-md border border-[#dadce0] bg-white dark:bg-white/5 px-2 py-1 text-[11px] text-[#3c4043] dark:border-white/15 dark:text-[#e8ecf4]"
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
    ? "flex w-full items-center justify-center gap-2 rounded-lg border border-[#244074] shadow-sm transition-all duration-200 bg-[#244074] px-3 py-2.5 text-[13px]  font-semibold text-white hover:bg-[#1b3158] hover:shadow-md active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#244074]/40 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none dark:border-[#42649e] dark:bg-[#244074] dark:hover:bg-[#2e5087] cursor-pointer hover:border-[#1b3158]"
    : "flex w-full items-center justify-center gap-1.5 rounded-lg border border-[#dadce0] px-3 py-2.5 text-[13px] font-semibold text-[#3c4043] transition-colors hover:bg-[#f8f9fa] dark:hover:bg-white/5 dark:border-white/15 dark:text-[#e8ecf4] cursor-pointer";
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
  dismissible = true,
}: {
  accent: AccentName;
  lead: ReactNode;
  label: ReactNode;
  title: ReactNode;
  onDismiss: () => void;
  dismissLabel: string;
  corner?: ReactNode;
  metrics?: Metric[];
  children: ReactNode;
  footer?: ReactNode;
  dismissible?: boolean;
}) {
  const a = ACCENTS[accent];

  return (
    <article
      className={cn(
        "relative flex h-full flex-col overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm shadow-slate-900/[0.025] transition-all duration-200 hover:border-slate-300 hover:shadow-md dark:border-[#293750] dark:bg-[#182338] dark:shadow-black/10 dark:hover:border-[#40516e]",
        STAT_ROW_ITEM_AI_INSIGHTS,
      )}
    >
      {/* Accent strip
      <div className={`h-[3px] w-full ${a.bar}`} aria-hidden="true" /> */}

      {/* Card heading */}
      <header
        className={`relative flex items-start gap-3 px-5 pb-4 pt-4 ${a.bg}`}
      >
        {lead}

        <div className={`min-w-0 flex-1 ${corner ? "pr-12" : "pr-6"}`}>
          <p
            className={`flex flex-wrap items-center gap-1 text-[10px] font-semibold uppercase tracking-[0.1em] ${a.text}`}
          >
            {label}
          </p>

          <h3 className="mt-1 text-[15px] font-semibold leading-snug tracking-[0.005em] text-slate-800 dark:text-[#e8edf7]">
            {title}
          </h3>
        </div>

        <div className="absolute right-3 top-3.5 flex items-center gap-1">
          {corner}

          {dismissible && (
            <DismissButton
              label={dismissLabel}
              onClick={onDismiss}
              className=""
            />
          )}
        </div>
      </header>

      {/* Metrics */}
      {metrics && metrics.length > 0 && <MetricStrip metrics={metrics} />}

      {/* Main content */}
      <div
        className={`flex flex-1 flex-col gap-4 px-5 pt-4 ${
          footer ? "pb-4" : "pb-5"
        }`}
      >
        {children}
      </div>

      {/* Footer */}
      {footer && (
        <footer className="mt-auto border-t border-slate-100 px-5 pb-4 pt-3 dark:border-[#293750]">
          {footer}
        </footer>
      )}
    </article>
  );
}
