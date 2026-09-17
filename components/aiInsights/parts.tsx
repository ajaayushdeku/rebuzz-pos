"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import toast from "react-hot-toast";
import {
  ArrowRight,
  FlaskConical,
  RefreshCw,
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

/** Money in the business's currency, whole numbers without decimals. */
export function useMoney() {
  const { currency } = useCurrency();
  return (value: number) =>
    `${currency.symbol} ${formatNumber(value, currency.locale)}`;
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

/**
 * Every card on the page, with one rhythm inside it.
 *
 * The spacing lives here rather than on each card's parts. Cards used to set
 * their own — `gap-3` on one, `mt-4` between blocks on another, nothing on a
 * third — so the same kind of information sat at different distances on
 * neighbouring cards, and the tight ones read as a cluster.
 */
export function Card({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`relative flex h-full flex-col gap-4 rounded-xl border border-gray-200 bg-white p-5 transition-shadow hover:shadow-md ${className}`}
    >
      {children}
    </div>
  );
}

/**
 * The top of a card: a leading visual, the title, and a row of chips under it.
 *
 * The right padding keeps the title clear of the corner controls (dismiss,
 * shortlist); `reserve` widens it where there are two of them.
 */
export function CardHeader({
  lead,
  title,
  children,
  reserve = "pr-8",
}: {
  lead: ReactNode;
  title: ReactNode;
  /** Chips or a short line under the title. */
  children?: ReactNode;
  reserve?: string;
}) {
  return (
    <div className={`flex items-start gap-3 ${reserve}`}>
      <div className="shrink-0">{lead}</div>
      <div className="min-w-0 flex-1">
        <h3 className="text-[13px] font-semibold leading-snug text-gray-900">
          {title}
        </h3>
        {children && (
          <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
            {children}
          </div>
        )}
      </div>
    </div>
  );
}

/** An emoji in a soft square, so icons of different shapes line up. */
export function EmojiTile({
  children,
  className = "bg-gray-50",
}: {
  children: ReactNode;
  /** Tile background, e.g. "bg-orange-50". */
  className?: string;
}) {
  return (
    <span
      className={`flex h-10 w-10 items-center justify-center rounded-lg text-xl leading-none ${className}`}
      aria-hidden
    >
      {children}
    </span>
  );
}

/** A small pill under a card title. */
export function Chip({
  children,
  className = "border border-gray-200 text-gray-500",
}: {
  children: ReactNode;
  /** Colours, e.g. "bg-violet-50 text-violet-700". */
  className?: string;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${className}`}
    >
      {children}
    </span>
  );
}

const FACT_COLUMNS = {
  2: "grid-cols-2",
  3: "grid-cols-3",
} as const;

/**
 * Figures in a row of labelled tiles.
 *
 * Each number gets its own box and its own name, instead of several figures
 * sharing one line joined by dots — "Last visit 18 days ago · Rs 850/visit"
 * made the reader work out where one fact ended and the next began.
 */
export function Facts({
  children,
  columns = 2,
}: {
  children: ReactNode;
  columns?: keyof typeof FACT_COLUMNS;
}) {
  return <dl className={`grid gap-2 ${FACT_COLUMNS[columns]}`}>{children}</dl>;
}

export function Fact({
  label,
  children,
  valueClassName = "text-gray-900",
}: {
  label: string;
  children: ReactNode;
  /** Colour of the figure, e.g. "text-emerald-700". */
  valueClassName?: string;
}) {
  return (
    <div className="min-w-0 rounded-lg bg-violet-100/60 px-3 py-2">
      <dt className="truncate text-[10px] font-semibold uppercase tracking-wider text-gray-400">
        {label}
      </dt>
      <dd
        className={`mt-0.5 break-words text-[13px] font-semibold leading-snug tabular-nums ${valueClassName}`}
      >
        {children}
      </dd>
    </div>
  );
}

/** A small uppercase label over a group of chips: "Stock up on", "Built from". */
export function CardLabel({
  icon: Icon,
  iconClassName = "text-gray-400",
  children,
}: {
  icon: LucideIcon;
  iconClassName?: string;
  children: ReactNode;
}) {
  return (
    <p className="mb-2 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-gray-500">
      <Icon size={12} className={iconClassName} aria-hidden />
      {children}
    </p>
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

export function TipBox({
  icon: Icon,
  iconClassName = "text-amber-500",
  children,
}: {
  icon: LucideIcon;
  iconClassName?: string;
  children: ReactNode;
}) {
  return (
    <div className="flex items-start gap-2.5 rounded-lg border border-gray-100 bg-gray-50 px-3.5 py-3 text-[13px] leading-relaxed text-gray-700">
      <Icon size={14} className={`mt-0.5 shrink-0 ${iconClassName}`} />
      <p>{children}</p>
    </div>
  );
}

/**
 * Tinted full-width buttons. Looked up rather than built from the tone name:
 * Tailwind only ships classes it finds written out whole in the source.
 */
const ACTION_TONES = {
  amber: "border-amber-200 bg-amber-50 text-amber-800 hover:bg-amber-100",
  blue: "border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100",
  violet: "border-violet-200 bg-violet-50 text-violet-700 hover:bg-violet-100",
  green:
    "border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100",
  pink: "border-pink-200 bg-pink-50 text-pink-600 hover:bg-pink-100",
} as const;

export type ActionTone = keyof typeof ACTION_TONES;

export function ActionButton({
  tone,
  children,
  icon: Icon,
  onClick,
  href,
}: {
  tone: ActionTone;
  children: ReactNode;
  /** Leading icon. Without one, an arrow trails the label instead. */
  icon?: LucideIcon;
  onClick?: () => void;
  /** A real destination, when there is one — rendered as a link. */
  href?: string;
}) {
  const className = `mt-auto flex w-full items-center justify-center gap-2 rounded-lg border px-3 py-2.5 text-[13px] font-semibold transition-colors ${ACTION_TONES[tone]}`;
  const content = (
    <>
      {Icon && <Icon size={14} />}
      {children}
      {!Icon && <ArrowRight size={14} />}
    </>
  );

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

/** Three across on wide screens, the grid every card section uses. */
export function CardGrid({ children }: { children: ReactNode }) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
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
      {data?.generatedAt && (
        <p className="mt-2.5 text-right text-[11px] text-gray-400">
          Written by AI from your own sales and menu · Updated{" "}
          {updatedLabel(data.generatedAt)}
        </p>
      )}
    </>
  );
}
