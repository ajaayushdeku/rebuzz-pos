import type { ReactNode } from "react";

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
  flexItems?: string;
  actionWidth?: string;
}

export default function PageHeader({
  title,
  subtitle,
  actions,
  leading,
  rule = true,
  spaceBelow = true,
  className = "",
  flexItems = "items-center flex-row",
  actionWidth = "w-fit",
}: PageHeaderProps) {
  return (
    <div className={className}>
      <div
        className={`flex w-full  ${flexItems} justify-between gap-4 pb-5 sm:flex-row sm:items-end`}
      >
        {leading}

        <div className="w-full min-w-0">
          <h1 className="truncate text-[18px]  font-semibold tracking-wide text-[#3c4043] sm:text-[22px] md:text-[26px] dark:text-[#e8ecf4]">
            {title}
          </h1>

          {subtitle && (
            <p className="mt-0.5 sm:mt-1  ml-0.5 w-[80%] sm:w-full max-w-xl text-[11px] md:text-[12px] sm:text-[12px] leading-relaxed text-[#5f6368] dark:text-[#a9b4c7]">
              {subtitle}
            </p>
          )}
        </div>

        {actions && (
          <div
            className={`flex ${actionWidth}  flex-wrap items-center gap-2 sm:ml-auto  justify-end`}
          >
            {actions}
          </div>
        )}
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
