"use client";

import { useRef } from "react";
import Link from "next/link";
import {
  Calculator,
  Calendar,
  CalendarDays,
  CalendarRange,
  Sunrise,
  Loader2,
  PartyPopper,
  RotateCw,
  Sparkles,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";

import { useCurrency } from "@/providers/CurrencyContext";
import { formatCurrencySymbol } from "@/utils/helper";
import { useAiProviderLabel, useHasSavedAiKey } from "@/hooks/useAiKey";
import { aiErrorMessage } from "@/services/apiAiInsights.client";
import { fetchSalesForecast } from "@/services/apiSalesForecast.client";
import type {
  ConfidenceLevel,
  ForecastDriver,
  SalesForecast,
} from "@/lib/salesForecast";
import { ChartCard } from "../chartCard";

const CONFIDENCE_STYLES: Record<ConfidenceLevel, string> = {
  High: "bg-green-50 text-green-700 border-green-200 dark:bg-emerald-400/10 dark:border-emerald-400/25 dark:text-emerald-300",
  Likely:
    "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-400/10 dark:border-blue-400/25 dark:text-[#a8c4ee]",
  Moderate:
    "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-400/10 dark:border-amber-400/25 dark:text-amber-300",
  Low: "bg-red-50 text-red-600 border-red-200 dark:bg-red-400/10 dark:border-red-400/25 dark:text-red-300",
};

/** What each level means, for the badge's tooltip. */
const CONFIDENCE_HINT: Record<ConfidenceLevel, string> = {
  High: "Your days have been very steady, so this should land close.",
  Likely: "Your days are fairly steady; expect the odd day off by a bit.",
  Moderate: "Your days vary a fair amount, so treat these as rough figures.",
  Low: "Too little history or days that vary a lot — a rough guide only.",
};

function DriverIcon({ driver }: { driver: ForecastDriver }) {
  if (driver.kind === "holiday") {
    return <PartyPopper size={14} className="text-amber-500" />;
  }
  if (driver.kind === "other") {
    return (
      <Sparkles size={14} className="text-violet-500 dark:text-violet-400" />
    );
  }
  if (driver.kind === "trend") {
    return (driver.impact ?? 0) < 0 ? (
      <TrendingDown size={14} className="text-red-500 dark:text-red-400" />
    ) : (
      <TrendingUp size={14} className="text-green-600 dark:text-emerald-400" />
    );
  }
  return (
    <CalendarDays size={14} className="text-[#1a73e8] dark:text-[#7ba2e3]" />
  );
}

/** The two forecast tiles' colours: the day in blue, the week in teal. */
const TILE_THEME = {
  day: {
    ink: "#1967d2",
    wash: "#e8f0fe",
    border: "#d2e3fc",
    /** The same hue against `#161d2e`: a tint rather than a wash. */
    dark: { ink: "#7ba2e3", wash: "#18243c", border: "#2b3f60" },
  },
  week: {
    ink: "#0d7a82",
    wash: "#e4f5f6",
    border: "#c3e7ea",
    dark: { ink: "#2dd4bf", wash: "#13272a", border: "#20464a" },
  },
} as const;

/**
 * "+4% vs usual": how the forecast compares with the usual figure beside it,
 * worked out here from those two numbers so the chip can never disagree with
 * them. Nothing when there is no usual figure to compare with.
 */
function VsUsual({ value, usual }: { value: number; usual: number }) {
  if (usual <= 0) return null;
  const pct = Math.round(((value - usual) / usual) * 100);
  const tone =
    pct > 0
      ? "bg-green-50 text-green-700 dark:bg-emerald-400/10 dark:text-emerald-300"
      : pct < 0
        ? "bg-red-50 text-red-600 dark:bg-red-400/10 dark:text-red-300"
        : "bg-gray-100 text-gray-500 dark:bg-white/10 dark:text-[#9aa6bd]";
  return (
    <span
      className={`shrink-0 rounded-full px-1.5 py-0.5 text-[10px] font-semibold tabular-nums ${tone}`}
      title="Compared with the usual figure below"
    >
      {pct > 0 ? "+" : pct < 0 ? "−" : "±"}
      {Math.abs(pct)}% vs usual
    </span>
  );
}

function Impact({ value }: { value: number | null }) {
  if (value === null) {
    return (
      <span
        className="text-xs font-bold shrink-0 text-gray-300 dark:text-[#6b7588]"
        title="Not measured yet"
      >
        —
      </span>
    );
  }
  return (
    <span
      className={`text-xs font-bold shrink-0 ${
        value > 0
          ? "text-green-600 dark:text-emerald-400"
          : value < 0
            ? "text-red-500 dark:text-red-400"
            : "text-gray-400 dark:text-[#7b869b]"
      }`}
    >
      {value > 0 ? "+" : ""}
      {value}%
    </span>
  );
}

/**
 * The shared dashboard card with this card's icon, title and reading notes,
 * so every state below (loading, error, no history, the forecast) sits in the
 * same frame.
 */
function Shell({
  subHeader,
  badge,
  children,
}: {
  subHeader: string;
  badge?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <ChartCard
      icon={TrendingUp}
      title="What's coming forecast"
      info={{
        heading: "Reading this card",
        body: "The day figure is the forecast for tomorrow, or for today when yesterday's saved forecast is showing, beside what that weekday usually sells. The week figure is that day and the six after it, beside a usual week. Usual days are worked out from up to your last 8 weeks of sales. Hover the confidence badge for what its level means.",
      }}
      subtitle={subHeader}
      buttons={badge}
      className="h-full select-none"
    >
      {children}
    </ChartCard>
  );
}

/** Why the calculated forecast is showing, and what would change it. */
function FallbackNote({ code }: { code: string }) {
  if (code === "NOT_CONFIGURED" || code === "AI_DISABLED") {
    return (
      <>
        Calculated from your sales.{" "}
        <Link
          href="/settings/api-keys"
          className="font-medium hover:underline text-[#1a73e8] dark:text-[#7ba2e3]"
        >
          Add an AI key
        </Link>{" "}
        for an AI forecast.
      </>
    );
  }
  return (
    <>
      Calculated from your sales — the AI couldn&apos;t answer and there was no
      saved AI forecast to show. {aiErrorMessage(code)}
    </>
  );
}

export default function ForecastCard() {
  const { currency } = useCurrency();
  const fmt = (v: number) =>
    formatCurrencySymbol(v, currency.symbol, currency.locale);
  const providerLabel = useAiProviderLabel();
  // Hidden without a key, like every other AI feature: the same status query
  // the sidebar reads, so saving or removing a key shows or hides it at once.
  const hasKey = useHasSavedAiKey();
  const queryClient = useQueryClient();

  const { data, isLoading, isError, error, refetch, isFetching } =
    useQuery<SalesForecast>({
      queryKey: ["sales-forecast"],
      queryFn: () => fetchSalesForecast(),
      enabled: hasKey,
      // One AI forecast a day, from sales up to yesterday.
      staleTime: 60 * 60 * 1000,
      refetchOnWindowFocus: false,
      retry: false,
    });

  // Set the moment a refresh starts, so a double-click cannot pay twice.
  const refreshing = useRef(false);
  const refresh = useMutation({
    mutationFn: () => fetchSalesForecast(true),
    onSuccess: (next) => {
      queryClient.setQueryData(["sales-forecast"], next);
      if (next.status === "ok" && next.aiError) {
        toast.error("The AI couldn't make a new forecast just now.");
      }
    },
    onError: (err) => toast.error((err as Error).message),
    onSettled: () => {
      refreshing.current = false;
    },
  });
  const startRefresh = () => {
    if (refreshing.current) return;
    refreshing.current = true;
    refresh.mutate();
  };

  if (!hasKey) return null;

  if (isLoading) {
    return (
      <Shell subHeader="Based on your recent sales">
        <div className="flex h-48 items-center justify-center gap-2 text-sm text-[#9aa0a6] dark:text-[#9aa6bd]">
          <Loader2 className="h-4 w-4 animate-spin" />
          Working out your forecast…
        </div>
      </Shell>
    );
  }

  if (isError || !data) {
    return (
      <Shell subHeader="Based on your recent sales">
        <div className="flex h-48 flex-col items-center justify-center gap-3 text-center">
          <p className="text-sm text-[#5f6368] dark:text-[#a9b4c7]">
            {(error as Error)?.message ?? "Couldn't load the forecast."}
          </p>
          <button
            type="button"
            onClick={() => refetch()}
            disabled={isFetching}
            className="flex cursor-pointer items-center gap-1.5 rounded-full border px-3 py-1 text-[11px] font-medium transition hover:bg-[#f1f3f4] disabled:opacity-50 border-[#dadce0] dark:border-white/15 text-[#3c4043] dark:text-[#e8ecf4]"
          >
            <RotateCw size={12} className={isFetching ? "animate-spin" : ""} />
            Try again
          </button>
        </div>
      </Shell>
    );
  }

  if (data.status === "not-enough-history") {
    const left = Math.max(1, data.daysNeeded - data.daysOfHistory);
    return (
      <Shell subHeader="Based on your recent sales">
        <div className="flex h-48 flex-col items-center justify-center gap-2 px-6 text-center">
          <CalendarDays
            size={22}
            className="text-blue-300 dark:text-[#7ba2e3]"
          />
          <p className="text-sm text-[#3c4043] dark:text-[#e8ecf4]">
            Not enough sales history yet
          </p>
          <p className="max-w-xs text-xs leading-relaxed text-[#9aa0a6] dark:text-[#9aa6bd]">
            A forecast needs at least two weeks of sales to know what a usual
            day looks like. Check back in {left} day{left === 1 ? "" : "s"}.
          </p>
        </div>
      </Shell>
    );
  }

  if (data.status === "no-recent-sales") {
    const last = new Date(`${data.lastSale}T12:00:00Z`).toLocaleDateString(
      undefined,
      { month: "short", day: "numeric", timeZone: "UTC" },
    );
    return (
      <Shell subHeader="Based on your recent sales">
        <div className="flex h-48 flex-col items-center justify-center gap-2 px-6 text-center">
          <CalendarDays
            size={22}
            className="text-blue-300 dark:text-[#7ba2e3]"
          />
          <p className="text-sm text-[#3c4043] dark:text-[#e8ecf4]">
            No sales in the last two weeks
          </p>
          <p className="max-w-xs text-xs leading-relaxed text-[#9aa0a6] dark:text-[#9aa6bd]">
            Your last sale was on {last}. The forecast picks up again once
            you&apos;re selling.
          </p>
        </div>
      </Shell>
    );
  }

  const weeklyPct =
    data.weeklyBaseline > 0
      ? Math.round(
          ((data.weeklyProjection - data.weeklyBaseline) /
            data.weeklyBaseline) *
            100,
        )
      : 0;

  const isAi = data.source === "ai";
  const busy = refresh.isPending;

  // A saved forecast from yesterday starts today, not tomorrow, and says so.
  const startsToday = data.forecastFrom === data.today;
  const dayLabel = startsToday ? "Today's forecast" : "Tomorrow's forecast";
  const weekLabel = startsToday ? "7 days from today" : "Next 7 days";
  const madeOn = data.generatedAt
    ? new Date(data.generatedAt).toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
      })
    : null;

  return (
    <Shell
      subHeader={
        isAi
          ? `AI forecast from your last ${data.basedOnWeeks} weeks of sales`
          : `Calculated from your last ${data.basedOnWeeks} weeks of sales`
      }
      badge={
        <div
          className="flex items-center gap-1.5"
          title={CONFIDENCE_HINT[data.confidence]}
        >
          <span className="text-[11px] text-[#9aa0a6] dark:text-[#9aa6bd]">
            Confidence
          </span>
          <span
            className={`rounded-full border px-2 py-0.5 text-[11px] font-medium ${
              CONFIDENCE_STYLES[data.confidence]
            }`}
          >
            {data.confidence}
          </span>
        </div>
      }
    >
      {/* Forecast numbers, faded while a new forecast is being made. Each
          tile has its own identity — the day in blue with a sunrise, the week
          in teal with a calendar — so the two figures are never read for one
          another at a glance. */}
      <div
        className={`mb-5 grid grid-cols-1 sm:grid-cols-2 gap-3 transition-opacity ${busy ? "opacity-50" : ""}`}
      >
        {[
          {
            label: dayLabel,
            icon: Sunrise,
            value: data.tomorrowForecast,
            usualLabel: `Usual ${data.tomorrowWeekday}`,
            usual: data.tomorrowBaseline,
            theme: TILE_THEME.day,
          },
          {
            label: weekLabel,
            icon: CalendarRange,
            value: data.weeklyProjection,
            usualLabel: "Usual week",
            usual: data.weeklyBaseline,
            theme: TILE_THEME.week,
          },
        ].map((tile) => {
          const Icon = tile.icon;
          return (
            <div
              key={tile.label}
              className="rounded-xl border border-[var(--tile-border)] bg-[linear-gradient(135deg,var(--tile-wash)_0%,#ffffff_70%)] p-3.5 dark:border-[var(--tile-border-dark)] dark:bg-[linear-gradient(135deg,var(--tile-wash-dark)_0%,#161d2e_70%)]"
              style={
                {
                  "--tile-border": tile.theme.border,
                  "--tile-wash": tile.theme.wash,
                  "--tile-ink": tile.theme.ink,
                  "--tile-border-dark": tile.theme.dark.border,
                  "--tile-wash-dark": tile.theme.dark.wash,
                  "--tile-ink-dark": tile.theme.dark.ink,
                } as React.CSSProperties
              }
            >
              <p className="mb-2 flex items-center gap-1.5 text-[11px] font-semibold text-[var(--tile-ink)] dark:text-[var(--tile-ink-dark)]">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white shadow-[inset_0_0_0_1px_var(--tile-border)] dark:bg-white/10 dark:shadow-[inset_0_0_0_1px_var(--tile-border-dark)]">
                  <Icon size={11} />
                </span>
                <span className="truncate">{tile.label}</span>
              </p>
              {/* The chip beside the figure it describes, so the label above
                  keeps a line to itself on a half-width card. */}
              <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
                <p className="text-2xl font-semibold tracking-tight text-[#3c4043] dark:text-[#e8ecf4]">
                  {fmt(tile.value)}
                </p>
                <VsUsual value={tile.value} usual={tile.usual} />
              </div>
              <p className="mt-0.5 text-xs text-[#9aa0a6] dark:text-[#9aa6bd]">
                {tile.usualLabel}: {fmt(tile.usual)}
              </p>
            </div>
          );
        })}
      </div>

      {/* Drivers */}
      {data.drivers.length > 0 && (
        <div className="mb-4">
          <p className="mb-2.5 text-[11px] text-[#5f6368] dark:text-[#a9b4c7]">
            Key forecast drivers
          </p>
          <div className="space-y-2">
            {data.drivers.map((driver, i) => (
              <div
                key={`${driver.kind}-${i}`}
                className="flex items-start justify-between gap-3 border-b py-2.5 last:border-0 border-[#e8eaed] dark:border-white/10"
              >
                <div className="flex min-w-0 flex-1 items-start gap-2.5">
                  <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-[#f8f9fa] dark:bg-white/5">
                    <DriverIcon driver={driver} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-[#3c4043] dark:text-[#e8ecf4]">
                      {driver.label}
                    </p>
                    <p className="mt-0.5 text-xs leading-relaxed text-[#9aa0a6] dark:text-[#9aa6bd]">
                      {driver.description}
                    </p>
                  </div>
                </div>
                <Impact value={driver.impact} />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Footer outlook */}
      <div className="flex items-center justify-between gap-3 border-t pt-3 border-[#e8eaed] dark:border-white/10">
        <div className="flex shrink-0 items-center gap-1.5 text-[#9aa0a6] dark:text-[#9aa6bd]">
          <Calendar size={13} />
          <span className="text-xs">Weekly outlook:</span>
        </div>
        <p className="text-right text-xs font-medium text-[#1a73e8] dark:text-[#7ba2e3]">
          {isAi && data.outlook ? (
            data.outlook
          ) : (
            <>
              Around {fmt(data.weeklyProjection)}
              {Math.abs(weeklyPct) >= 1
                ? `, ${Math.abs(weeklyPct)}% ${weeklyPct > 0 ? "above" : "below"} a usual week`
                : ", in line with a usual week"}
            </>
          )}
        </p>
      </div>

      {/* Who made it, and a way to ask again */}
      <div className="mt-3 flex items-start justify-between gap-3 rounded-lg bg-[#f8f9fa] px-3 py-2 dark:bg-white/5">
        <p className="flex items-start gap-1.5 text-[11px] leading-relaxed text-[#5f6368] dark:text-[#a9b4c7]">
          {isAi ? (
            <>
              <Sparkles
                size={12}
                className="mt-0.5 shrink-0 text-violet-500 dark:text-violet-400"
              />
              <span>
                Forecast by {providerLabel ?? "your AI"}
                {data.model ? ` · ${data.model}` : ""}
                {data.stale
                  ? ` · saved forecast${madeOn ? ` from ${madeOn}` : ""} — the AI couldn't make a new one. ${aiErrorMessage(data.staleReason)}`
                  : ""}
              </span>
            </>
          ) : (
            <>
              <Calculator
                size={12}
                className="mt-0.5 shrink-0 text-gray-400 dark:text-[#7b869b]"
              />
              <span>
                <FallbackNote code={data.aiError ?? "UNKNOWN"} />
              </span>
            </>
          )}
        </p>
        {data.aiError !== "NOT_CONFIGURED" &&
          data.aiError !== "AI_DISABLED" && (
            <button
              type="button"
              onClick={startRefresh}
              disabled={busy}
              title="Ask the AI for a new forecast. Uses one request on your AI key."
              className="flex shrink-0 cursor-pointer items-center gap-1 rounded-md px-1.5 py-0.5 text-[11px] font-medium text-gray-500 transition hover:bg-white hover:text-gray-800 disabled:cursor-default disabled:opacity-60 dark:text-[#9aa6bd]"
            >
              <RotateCw size={11} className={busy ? "animate-spin" : ""} />
              {busy ? "Refreshing…" : "Refresh"}
            </button>
          )}
      </div>
    </Shell>
  );
}
