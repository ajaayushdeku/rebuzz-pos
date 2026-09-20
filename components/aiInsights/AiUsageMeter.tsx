"use client";

import { useEffect, useState } from "react";
import { Gauge, Layers } from "lucide-react";

import { useAiQuota } from "@/hooks/useAiQuota";

/**
 * How much AI the business has used: the hour's allowance, and the day's
 * sections.
 *
 * Both numbers are ones this app actually knows — the hourly limit is its own,
 * and the day's sections are the answers it has saved. The provider's own
 * quota is deliberately absent: Gemini publishes no such figure, and a meter
 * that guessed would be worse than none.
 *
 * Silent when it cannot be read. A usage meter is a convenience; it should
 * never be the thing that shows an error on a page full of working cards.
 */

/** "4 min 20 s", "45 s" — how long until the next slot frees up. */
function untilLabel(ms: number): string {
  const seconds = Math.max(0, Math.ceil(ms / 1000));
  if (seconds < 60) return `${seconds} s`;
  const minutes = Math.floor(seconds / 60);
  const rest = seconds % 60;
  return rest ? `${minutes} min ${rest} s` : `${minutes} min`;
}

/**
 * The countdown to the next free slot.
 *
 * Its own component so the ticking clock re-renders one line rather than the
 * whole hero every second.
 */
function NextSlot({ at }: { at: string }) {
  const target = new Date(at).getTime();
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [at]);

  if (Number.isNaN(target) || target <= now) return null;
  return <>Next request in {untilLabel(target - now)}</>;
}

export default function AiUsageMeter({
  totalSections,
}: {
  totalSections: number;
}) {
  const { data, isLoading, isError } = useAiQuota();

  if (isLoading) {
    return (
      <div
        className="h-[92px] animate-pulse rounded-xl border border-white/10 bg-white/5"
        aria-hidden
      />
    );
  }

  if (isError || !data) return null;

  const { limit, used, remaining, nextSlotAt } = data.hour;
  const writtenToday = data.today.sections.length;
  const usedPct = limit > 0 ? Math.min(100, (used / limit) * 100) : 0;

  /**
   * Colour by what is left, not by what is spent: the bar is a warning at the
   * end of the hour, not a progress bar for a task anyone wants to finish.
   */
  const bar =
    remaining === 0
      ? "bg-rose-400"
      : remaining <= limit * 0.25
        ? "bg-amber-400"
        : "bg-violet-400";

  return (
    <div className="rounded-xl border border-white/10 bg-white/5 px-3.5 py-3">
      <div className="flex items-center justify-between gap-3 text-[11px]">
        <span className="flex items-center gap-1.5 font-medium text-slate-300">
          <Gauge size={13} className="text-violet-300" aria-hidden />
          AI requests this hour
        </span>
        <span className="font-semibold tabular-nums text-white">
          {remaining} of {limit} left
        </span>
      </div>

      <div
        className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/10"
        role="meter"
        aria-valuemin={0}
        aria-valuemax={limit}
        aria-valuenow={remaining}
        aria-label="AI requests left this hour"
      >
        <div
          className={`h-full rounded-full transition-all ${bar}`}
          style={{ width: `${100 - usedPct}%` }}
        />
      </div>

      <p className="mt-1.5 flex flex-wrap items-center gap-x-1.5 text-[11px] text-slate-400">
        <Layers size={12} aria-hidden />
        <span>
          {writtenToday} of {totalSections} sections written today
        </span>
        {/* The window rolls, so slots come back one at a time rather than all
            at once — the countdown is to the next one, not to a reset. */}
        {nextSlotAt && remaining < limit && (
          <>
            <span aria-hidden>·</span>
            <span className="tabular-nums">
              <NextSlot at={nextSlotAt} />
            </span>
          </>
        )}
      </p>

      {remaining === 0 && (
        <p className="mt-1.5 text-[11px] leading-relaxed text-amber-300">
          Sections now show the last answer they had until a request frees up.
        </p>
      )}
    </div>
  );
}
