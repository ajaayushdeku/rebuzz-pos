import type { ReactNode } from "react";

type DesignTabHeaderProps = {
  title: string;
  description: string;
  eyebrow?: ReactNode;
  actions?: ReactNode;
};

export function DesignTabHeader({
  title,
  description,
  eyebrow,
  actions,
}: DesignTabHeaderProps) {
  return (
    <header className="flex w-full flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0 flex-1">
        <div className="flex flex-col items-start gap-x-3 gap-y-1">
          {eyebrow && (
            <span className="inline-flex shrink-0 items-center gap-2 text-xs font-semibold tracking-wide text-blue-600 dark:text-blue-400">
              {eyebrow}
            </span>
          )}
          <h1 className="truncate text-[18px] font-semibold tracking-tight text-[#3c4043] sm:text-[22px] md:text-[26px] dark:text-[#e8ecf4]">
            {title}
          </h1>
        </div>

        <p className="ml-0.5  max-w-xl text-[11px] leading-relaxed text-[#5f6368] sm:mt-1 sm:text-[12px] md:text-[12px] dark:text-[#a9b4c7]">
          {description}
        </p>
      </div>

      {actions && (
        <div className="flex w-full shrink-0 flex-wrap items-center justify-start gap-2 sm:w-auto sm:justify-end">
          {actions}
        </div>
      )}
    </header>
  );
}
