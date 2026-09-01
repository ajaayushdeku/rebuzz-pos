import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * The two looks page headers use.
 *
 * `solid`  — the primary action on a records/settings page ("Add new product").
 * `dashed` — the secondary "create something elsewhere" action on the
 *            dashboards ("Create Order", "Add Stock"), whose dashed outline
 *            reads as a placeholder you fill rather than a committed action.
 *            Its text is `blue-600` rather than `blue-500`: the lighter shade
 *            fell below 4.5:1 against white.
 */
export type HeaderActionVariant = "solid" | "dashed";

const VARIANT: Record<HeaderActionVariant, string> = {
  solid:
    "bg-blue-600 text-white shadow-sm hover:bg-blue-700 active:bg-blue-800",
  dashed:
    "border-dashed border-blue-300 bg-white text-blue-600 hover:border-blue-400 hover:bg-blue-50 active:bg-blue-100",
};

/**
 * Everything the shared `Button` used to supply, now that this renders a plain
 * `<button>`: layout, the focus ring, the press nudge and the disabled state.
 *
 * `border border-transparent` matters — without it `solid` would be two pixels
 * shorter and narrower than `dashed`, which carries a real border. `h-9`
 * matches the `DateRangeFilter` trigger these stand beside in most headers.
 */
const BASE =
  "inline-flex h-9 shrink-0 cursor-pointer select-none items-center justify-center gap-2 whitespace-nowrap rounded-lg border border-transparent px-3.5 text-sm font-semibold transition-colors outline-none focus-visible:border-blue-500 focus-visible:ring-[3px] focus-visible:ring-blue-500/30 active:translate-y-px disabled:pointer-events-none disabled:opacity-50";

/** Square below `lg`, so an icon-only button is not a wide pill with a dot in it. */
const ICON_ONLY = "max-lg:w-9 max-lg:px-0";

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
  const classes = cn(
    BASE,
    VARIANT[variant],
    hideLabelOnMobile && ICON_ONLY,
    className,
  );

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
      // The link is the control itself. Wrapping it in a <button> would nest
      // interactive content, which is invalid and swallows the navigation.
      // An anchor takes no `disabled` attribute either, so that state has to
      // be spelled out in classes.
      <Link
        href={href}
        title={label}
        aria-disabled={disabled || undefined}
        className={cn(classes, disabled && "pointer-events-none opacity-50")}
      >
        {content}
      </Link>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={label}
      className={classes}
    >
      {content}
    </button>
  );
}
