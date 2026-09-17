"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import toast from "react-hot-toast";
import { ArrowRight, WandSparkles, X, type LucideIcon } from "lucide-react";

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

export function SectionHeader({
  icon: Icon,
  iconClassName,
  title,
  subtitle,
  actions,
}: {
  icon: LucideIcon;
  /** Tile background and icon colour, e.g. "bg-red-50 text-red-600". */
  iconClassName: string;
  title: string;
  subtitle: string;
  actions?: ReactNode;
}) {
  return (
    <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-3">
        <div
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${iconClassName}`}
        >
          <Icon size={17} />
        </div>
        <div>
          <h2 className="text-base font-semibold text-gray-900">{title}</h2>
          <p className="text-xs text-gray-500">{subtitle}</p>
        </div>
      </div>
      {actions && (
        <div className="flex flex-wrap items-center gap-2">{actions}</div>
      )}
    </div>
  );
}

export function GenerateMoreButton({
  label = "Generate More",
  icon: Icon = WandSparkles,
  textClassName,
  onClick,
}: {
  label?: string;
  icon?: LucideIcon;
  /** The section's accent, e.g. "text-red-600". */
  textClassName: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-[13px] font-semibold shadow-sm transition-colors hover:bg-gray-50 ${textClassName}`}
    >
      <Icon size={15} />
      {label}
    </button>
  );
}

export function Card({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`relative flex flex-col rounded-xl border border-gray-200 bg-white p-5 shadow-sm ${className}`}
    >
      {children}
    </div>
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
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
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
