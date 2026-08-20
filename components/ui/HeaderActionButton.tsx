import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

/**
 * The two looks page headers use.
 *
 * `solid`  — the primary action on a records/settings page ("Add new product").
 * `dashed` — the secondary "create something elsewhere" action on the
 *            dashboards ("Create Order", "Add Stock"), whose dashed outline
 *            reads as a placeholder you fill rather than a committed action.
 */
export type HeaderActionVariant = "solid" | "dashed";

const VARIANT: Record<HeaderActionVariant, string> = {
  solid: "bg-blue-600 text-white hover:bg-blue-700 focus-visible:ring-blue-500",
  dashed:
    "border-[1px]  border-dashed  border-blue-400 bg-transparent text-blue-500 font-semibold hover:border-blue-500 hover:bg-blue-100 hover:text-blue-500 focus-visible:ring-blue-400",
};

const BASE =
  "flex cursor-pointer items-center gap-2 rounded-lg text-sm focus-visible:ring-2 focus-visible:ring-offset-2";

type HeaderActionButtonProps = {
  /** Button text. Hidden below `lg` when `hideLabelOnMobile` is set. */
  label: string;
  icon?: LucideIcon;
  variant?: HeaderActionVariant;
  /** Renders a Link instead of a button. Mutually exclusive with `onClick`. */
  href?: string;
  onClick?: () => void;
  disabled?: boolean;
  /**
   * Collapse to an icon-only button below `lg`. For headers that also carry a
   * date filter or tabs, where the full label would wrap the row.
   */
  hideLabelOnMobile?: boolean;
  className?: string;
};

/**
 * The action button in a page header. Every header across the dashboards,
 * records and settings had its own copy of one of two long class strings; this
 * is that pair, in one place, so they can't drift apart one page at a time.
 *
 * Deliberately NOT marked "use client". Server-rendered headers pass `icon` as
 * a component reference, which cannot cross a server→client boundary; leaving
 * the directive off lets this render inside the server component itself, and
 * client pages still get it bundled as client code when they import it. The
 * corollary is that `onClick` is only usable from a client component.
 */
export default function HeaderActionButton({
  label,
  icon: Icon,
  variant = "solid",
  href,
  onClick,
  disabled,
  hideLabelOnMobile = false,
  className,
}: HeaderActionButtonProps) {
  const classes = cn(BASE, VARIANT[variant], className);

  const content = (
    <>
      {Icon && <Icon className="h-4 w-4 shrink-0" />}
      <span className={hideLabelOnMobile ? "hidden lg:block" : undefined}>
        {label}
      </span>
    </>
  );

  if (href) {
    return (
      <Button asChild className={classes} disabled={disabled}>
        {/* title carries the label for the icon-only breakpoint. */}
        <Link href={href} title={label}>
          {content}
        </Link>
      </Button>
    );
  }

  return (
    <Button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={label}
      className={classes}
    >
      {content}
    </Button>
  );
}
