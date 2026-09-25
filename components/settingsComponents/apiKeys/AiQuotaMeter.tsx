"use client";

import { useEffect, useState } from "react";
import { ChevronLeft, Gauge } from "lucide-react";

import { useAiQuota } from "@/hooks/useAiQuota";
import { unlockLabel } from "@/components/offers/useAiFillLock";

/**
 * The bar's colour ramp, cool to hot: the palette's blue, through violet, to
 * its red.
 *
 * Each block owns a fixed colour decided by its position, not by how full the
 * bar is — so the first block is blue for the whole hour and nothing already
 * drawn ever repaints. Filling the bar walks along the ramp instead, which
 * reads as the allowance warming up rather than as a bar that suddenly turns
 * red at a threshold.
 */
const RAMP_STOPS: [number, number, number][] = [
  [26, 115, 232], // #1a73e8 — CHART_PALETTE.blue
  [124, 58, 237], // #7c3aed — violet
  [217, 48, 37], // #d93025 — CHART_PALETTE.bad
];

/** The ramp colour at `t` (0 → 1), interpolated between the nearest stops. */
function rampColor(t: number): string {
  const clamped = Math.min(1, Math.max(0, t));
  const span = 1 / (RAMP_STOPS.length - 1);
  const index = Math.min(RAMP_STOPS.length - 2, Math.floor(clamped / span));
  const within = (clamped - index * span) / span;

  const from = RAMP_STOPS[index];
  const to = RAMP_STOPS[index + 1];
  const mix = from.map((channel, i) =>
    Math.round(channel + (to[i] - channel) * within),
  );
  return `rgb(${mix.join(",")})`;
}

/** The ramp as one sweep, for the track that has no room for blocks. */
const RAMP_GRADIENT = `linear-gradient(90deg, ${RAMP_STOPS.map(
  (stop, i) => `rgb(${stop.join(",")}) ${(i / (RAMP_STOPS.length - 1)) * 100}%`,
).join(", ")})`;

/**
 * The same reading as a single line, for widths with no room for 20 blocks.
 *
 * The whole track is painted with the ramp and the unspent part is covered
 * over, rather than the fill carrying its own gradient: that way a position on
 * this bar is the same colour as the block at that position, and a short bar
 * cannot tell a different story from a wide one.
 */
function LineBar({ limit, spent }: { limit: number; spent: number }) {
  const spentShare = (spent / Math.max(1, limit)) * 100;

  return (
    <div
      className="relative h-1.5 w-full overflow-hidden rounded-full"
      style={{ backgroundImage: RAMP_GRADIENT }}
      role="meter"
      aria-valuemin={0}
      aria-valuemax={limit}
      aria-valuenow={spent}
      aria-label={`${spent} of ${limit} AI requests used this hour`}
    >
      <div
        className="absolute inset-y-0 right-0 bg-[#e8eaed] transition-[width] duration-300 ease-out"
        style={{ width: `${100 - spentShare}%` }}
      />
    </div>
  );
}

/**
 * One block per request, each on its own place along the ramp.
 *
 * Shared by both shapes so the bar cannot drift between them — the compact
 * one is the same bar, drawn shorter.
 */
function RampBar({
  limit,
  spent,
  thin = false,
}: {
  limit: number;
  spent: number;
  thin?: boolean;
}) {
  return (
    <div
      className={`flex ${thin ? "h-2 gap-[2px]" : "h-2 gap-1"} `}
      role="meter"
      aria-valuemin={0}
      aria-valuemax={limit}
      aria-valuenow={spent}
      aria-label={`${spent} of ${limit} AI requests used this hour`}
    >
      {Array.from({ length: limit }).map((_, i) => {
        const filled = i < spent;
        return (
          <span
            key={i}
            className={`flex-1 rounded-full transition-colors duration-300 ${
              filled ? "" : "bg-[#e8eaed]"
            }`}
            style={
              filled
                ? {
                    // Its own place on the ramp, so the block keeps this
                    // colour however full the bar gets.
                    backgroundColor: rampColor(i / Math.max(1, limit - 1)),
                  }
                : undefined
            }
          />
        );
      })}
    </div>
  );
}

/**
 * How much of the hour's AI allowance is spent.
 *
 * The limit is a cost guard — every generation spends the merchant's own
 * provider quota — so it is worth showing before it is hit rather than only
 * explaining it in the error afterwards.
 *
 * Segments rather than a percentage bar: the allowance is a small whole
 * number, and "16 of 20" is something a merchant can act on in a way that
 * "80%" is not.
 *
 * `inline` is the same reading as a header pill, for the pages that spend the
 * allowance rather than the one that configures it.
 */
export default function AiQuotaMeter({
  className = "",
  variant = "card",
}: {
  className?: string;
  variant?: "card" | "inline";
}) {
  const { data: quota, isLoading } = useAiQuota();

  /**
   * Whether the pill is showing its bar.
   *
   * Collapsed it is the reading a glance needs — how many are left and when
   * more arrive. The bar is the detail behind that, so it is opened
   * deliberately rather than by a pointer passing over the header.
   */
  const [expanded, setExpanded] = useState(false);

  // The countdown is the only part that moves on its own, so it gets its own
  // tick rather than re-fetching the whole thing every minute.
  const [, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!quota) return;
    const id = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(id);
  }, [quota]);

  // No service, no key, or an unreachable one: nothing useful to draw.
  if (isLoading || !quota) return null;

  const { limit, used, remaining, resetAt } = quota;
  const spent = Math.min(used, limit);
  const nearlyOut = remaining <= Math.max(1, Math.floor(limit * 0.15));
  const out = remaining === 0;

  const countTone = out
    ? "text-red-600"
    : nearlyOut
      ? "text-amber-600"
      : "text-[#3c4043]";

  if (variant === "inline") {
    return (
      <div
        className={`flex shrink-0 items-center gap-2 rounded-full border border-[#dadce0] bg-white px-3 py-1.5 ${className}`}
        title={
          out
            ? `No AI requests left — the allowance frees up ${unlockLabel(resetAt)}.`
            : `${remaining} of ${limit} AI requests left this hour. The oldest drops off ${unlockLabel(resetAt)}.`
        }
      >
        {/* Collapsed, the pill answers the two questions a glance asks: how
            many are left, and when more arrive. */}
        <Gauge
          className={`h-3.5 w-3.5 shrink-0 ${
            out
              ? "text-red-600"
              : nearlyOut
                ? "text-amber-600"
                : "text-[#5f6368]"
          }`}
          aria-hidden
        />
        <span className={`text-[11px] font-semibold tabular-nums ${countTone}`}>
          {spent}
          <span className="font-normal text-[#9aa0a6]">/{limit}</span>
        </span>
        {/* Names what the denominator is. The countdown used to sit here,
            between the count and the bar drawing that same count — it now
            follows the bar, where it reads as what happens next. */}
        <span className="hidden md:block text-[11px] whitespace-nowrap text-[#9aa0a6]">
          this hour
        </span>

        {/* The bar is the detail behind that reading, so it opens out to the
            right of the numbers rather than being there all along. Width and
            opacity, not display, so it slides instead of appearing. */}
        <span
          className={`overflow-hidden transition-all duration-300 ease-out ${
            // Wide enough for the bar, its gap and the countdown after it —
            // a tighter cap clipped the last word of "+1 in 34 min".
            expanded
              ? "max-w-[220px] opacity-100 sm:max-w-[340px]"
              : "max-w-0 opacity-0"
          }`}
        >
          <span className="flex items-center gap-2.5 pl-0.5">
            {/* Twenty blocks need room to stay countable; below `sm` the same
                reading is drawn as one short line instead of shrinking them
                into a dotted smear. */}
            <span className="hidden w-[200px] shrink-0 md:block">
              <RampBar limit={limit} spent={spent} thin />
            </span>
            <span className="block w-14 shrink-0 md:hidden">
              <LineBar limit={limit} spent={spent} />
            </span>
            {/* After the bar: the bar is the state now, this is the state
                next — the moment the window hands a request back. */}
            <span className="text-[11px] whitespace-nowrap text-[#9aa0a6]">
              {out ? "frees up" : "+1"} {unlockLabel(resetAt)}
            </span>
          </span>
        </span>

        <button
          type="button"
          onClick={() => setExpanded((open) => !open)}
          aria-expanded={expanded}
          aria-label={expanded ? "Hide the usage bar" : "Show the usage bar"}
          className="-mr-1 flex h-5 w-5 shrink-0 cursor-pointer items-center justify-center rounded-full text-[#9aa0a6] transition-colors hover:bg-[#f1f3f4] hover:text-[#3c4043] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
        >
          <ChevronLeft
            className={`h-3.5 w-3.5 transition-transform duration-300 ease-out ${
              expanded ? "rotate-180" : ""
            }`}
            aria-hidden
          />
        </button>
      </div>
    );
  }

  return (
    <div
      className={`rounded-2xl border border-[#e3e3e3] bg-white p-5 ${className}`}
    >
      <div className="flex items-start gap-4">
        {/* `border-current/20` frames the tile in the icon's own hue. */}
        <div
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-current/20 ${
            out
              ? "bg-red-50 text-red-600"
              : nearlyOut
                ? "bg-amber-50 text-amber-600"
                : "bg-blue-50 text-blue-600"
          }`}
        >
          <Gauge className="h-5 w-5" />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
            <div className="min-w-0">
              <p className="text-[15px] font-normal text-[#3c4043]">
                AI requests this hour
              </p>
              <p className="mt-0.5 text-xs text-[#9aa0a6]">
                {out
                  ? `No requests left — the allowance frees up ${unlockLabel(resetAt)}.`
                  : `${remaining} left. The oldest request drops off ${unlockLabel(resetAt)}.`}
              </p>
            </div>

            {/* The figure carries the state's colour: at a glance across the
                page it is the number, not the bar, that is read first. */}
            <p
              className={`shrink-0 text-[22px] font-semibold leading-none tracking-tight tabular-nums ${countTone}`}
            >
              {spent}
              <span className="text-[13px] font-normal text-[#9aa0a6]">
                {" "}
                of {limit}
              </span>
            </p>
          </div>

          {/* One segment per request, so the allowance reads as countable
              rather than as a proportion. */}
          <div className="mt-3">
            <RampBar limit={limit} spent={spent} />
          </div>

          <p className="mt-2.5 text-[11px] leading-relaxed text-[#9aa0a6]">
            Only generations that reach your AI provider count. Insights served
            from the last 26 hours&rsquo; cache are free.
          </p>
        </div>
      </div>
    </div>
  );
}
