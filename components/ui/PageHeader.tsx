import type { ReactNode } from "react";

/**
 * The page header every screen opens with: a title, the sentence under it,
 * room for controls on the right, and the rule that closes it off.
 *
 * The type and the rule are the ones the dashboard and records pages already
 * use, so a page that adopts this drops its own copy rather than changing
 * appearance. The colours are the `CHART_PALETTE` greys — `#3c4043` for the
 * title, `#5f6368` for the sentence, `#dadce0` fading through `#e8eaed` for
 * the rule — written as literals because Tailwind needs them at build time.
 * Dark mode takes the light end of the same scale, and fades the rule from
 * white rather than to it.
 *
 * The rule is drawn rather than bordered: it holds the hairline under the
 * title and fades out across the page, so it separates the header without
 * ruling a hard line across the whole screen.
 */
export interface PageHeaderProps {
  /** The page's name. Truncates rather than wrapping. */
  title: ReactNode;
  /** One sentence under the title. Omit it and the title stands alone. */
  subtitle?: ReactNode;
  /** Filters, buttons — whatever sits opposite the title. */
  actions?: ReactNode;
  /**
   * Rendered at the head of the row, ahead of the title — a badge that
   * qualifies the page, say, rather than an action.
   */
  leading?: ReactNode;
  /** Draw the rule. False leaves the header unruled. */
  rule?: boolean;
  /**
   * Space below the rule.
   *
   * Leave it on when the header's neighbour supplies no spacing of its own.
   * Turn it off inside a `flex flex-col gap-*` or `space-y-*` column — that
   * column already puts a gap after the header, and the margin would add to
   * it.
   */
  spaceBelow?: boolean;
  /** Extra classes on the wrapper, for the rare page that needs them. */
  className?: string;
}

export default function PageHeader({
  title,
  subtitle,
  actions,
  leading,
  rule = true,
  spaceBelow = true,
  className = "",
}: PageHeaderProps) {
  return (
    <div className={className}>
      {/* Actions sit on the title's baseline on desktop and drop below it on
          mobile, which is why the row aligns to `end` rather than centring. */}
      <div className="flex w-full flex-col justify-between gap-4 pb-5 sm:flex-row sm:items-end">
        {leading}

        <div className="min-w-0">
          <h1 className="truncate text-[22px]  font-semibold tracking-wide text-[#3c4043] md:text-[26px] dark:text-[#e8ecf4]">
            {title}
          </h1>

          {subtitle && (
            <p className="mt-1 ml-0.5 max-w-xl text-[12px] leading-relaxed text-[#5f6368] dark:text-[#a9b4c7]">
              {subtitle}
            </p>
          )}
        </div>

        {actions && <div className="flex items-center gap-2">{actions}</div>}
      </div>

      {rule && (
        <div
          aria-hidden
          className={`h-px w-full bg-gradient-to-r from-[#dadce0] via-[#e8eaed] to-transparent dark:from-white/20 dark:via-white/10 ${
            spaceBelow ? "mb-6" : ""
          }`}
        />
      )}
    </div>
  );
}
