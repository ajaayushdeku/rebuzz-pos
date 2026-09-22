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
import { CHART_PALETTE, ChartCard } from "../chartCard";

const CONFIDENCE_STYLES: Record<ConfidenceLevel, string> = {
  High: "bg-green-50 text-green-700 border-green-200",
  Likely: "bg-blue-50 text-blue-700 border-blue-200",
  Moderate: "bg-amber-50 text-amber-700 border-amber-200",
  Low: "bg-red-50 text-red-600 border-red-200",
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
    return <Sparkles size={14} className="text-violet-500" />;
  }
  if (driver.kind === "trend") {
    return (driver.impact ?? 0) < 0 ? (
      <TrendingDown size={14} className="text-red-500" />
    ) : (
      <TrendingUp size={14} className="text-green-600" />
    );
  }
  return <CalendarDays size={14} style={{ color: CHART_PALETTE.blue }} />;
}

/** The two forecast tiles' colours: the day in blue, the week in teal. */
const TILE_THEME = {
  day: { ink: "#1967d2", wash: "#e8f0fe", border: "#d2e3fc" },
  week: { ink: "#0d7a82", wash: "#e4f5f6", border: "#c3e7ea" },
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
      ? "bg-green-50 text-green-700"
      : pct < 0
        ? "bg-red-50 text-red-600"
        : "bg-gray-100 text-gray-500";
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
        className="text-xs font-bold shrink-0 text-gray-300"
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
          ? "text-green-600"
          : value < 0
            ? "text-red-500"
            : "text-gray-400"
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
      controls={badge}
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
          className="font-medium hover:underline"
          style={{ color: CHART_PALETTE.blue }}
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
        <div
          className="flex h-48 items-center justify-center gap-2 text-sm"
          style={{ color: CHART_PALETTE.subtitle }}
        >
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
          <p className="text-sm" style={{ color: CHART_PALETTE.axis }}>
            {(error as Error)?.message ?? "Couldn't load the forecast."}
          </p>
          <button
            type="button"
            onClick={() => refetch()}
            disabled={isFetching}
            className="flex cursor-pointer items-center gap-1.5 rounded-full border px-3 py-1 text-[11px] font-medium transition hover:bg-[#f1f3f4] disabled:opacity-50"
            style={{
              borderColor: CHART_PALETTE.control,
              color: CHART_PALETTE.title,
            }}
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
          <CalendarDays size={22} className="text-blue-300" />
          <p className="text-sm" style={{ color: CHART_PALETTE.title }}>
            Not enough sales history yet
          </p>
          <p
            className="max-w-xs text-xs leading-relaxed"
            style={{ color: CHART_PALETTE.subtitle }}
          >
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
          <CalendarDays size={22} className="text-blue-300" />
          <p className="text-sm" style={{ color: CHART_PALETTE.title }}>
            No sales in the last two weeks
          </p>
          <p
            className="max-w-xs text-xs leading-relaxed"
            style={{ color: CHART_PALETTE.subtitle }}
          >
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
          <span
            className="text-[11px]"
            style={{ color: CHART_PALETTE.subtitle }}
          >
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
        className={`mb-5 grid grid-cols-2 gap-3 transition-opacity ${busy ? "opacity-50" : ""}`}
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
              className="rounded-xl border p-3.5"
              style={{
                borderColor: tile.theme.border,
                background: `linear-gradient(135deg, ${tile.theme.wash} 0%, #ffffff 70%)`,
              }}
            >
              <p
                className="mb-2 flex items-center gap-1.5 text-[11px] font-semibold"
                style={{ color: tile.theme.ink }}
              >
                <span
                  className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white"
                  style={{
                    boxShadow: `inset 0 0 0 1px ${tile.theme.border}`,
                  }}
                >
                  <Icon size={11} />
                </span>
                <span className="truncate">{tile.label}</span>
              </p>
              {/* The chip beside the figure it describes, so the label above
                  keeps a line to itself on a half-width card. */}
              <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
                <p
                  className="text-2xl font-semibold tracking-tight"
                  style={{ color: CHART_PALETTE.title }}
                >
                  {fmt(tile.value)}
                </p>
                <VsUsual value={tile.value} usual={tile.usual} />
              </div>
              <p
                className="mt-0.5 text-xs"
                style={{ color: CHART_PALETTE.subtitle }}
              >
                {tile.usualLabel}: {fmt(tile.usual)}
              </p>
            </div>
          );
        })}
      </div>

      {/* Drivers */}
      {data.drivers.length > 0 && (
        <div className="mb-4">
          <p
            className="mb-2.5 text-[11px]"
            style={{ color: CHART_PALETTE.axis }}
          >
            Key forecast drivers
          </p>
          <div className="space-y-2">
            {data.drivers.map((driver, i) => (
              <div
                key={`${driver.kind}-${i}`}
                className="flex items-start justify-between gap-3 border-b py-2.5 last:border-0"
                style={{ borderColor: CHART_PALETTE.grid }}
              >
                <div className="flex min-w-0 flex-1 items-start gap-2.5">
                  <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-[#f8f9fa]">
                    <DriverIcon driver={driver} />
                  </div>
                  <div className="min-w-0">
                    <p
                      className="text-xs font-medium"
                      style={{ color: CHART_PALETTE.title }}
                    >
                      {driver.label}
                    </p>
                    <p
                      className="mt-0.5 text-xs leading-relaxed"
                      style={{ color: CHART_PALETTE.subtitle }}
                    >
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
      <div
        className="flex items-center justify-between gap-3 border-t pt-3"
        style={{ borderColor: CHART_PALETTE.grid }}
      >
        <div
          className="flex shrink-0 items-center gap-1.5"
          style={{ color: CHART_PALETTE.subtitle }}
        >
          <Calendar size={13} />
          <span className="text-xs">Weekly outlook:</span>
        </div>
        <p
          className="text-right text-xs font-medium"
          style={{ color: CHART_PALETTE.blue }}
        >
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
      <div className="mt-3 flex items-start justify-between gap-3 rounded-lg bg-[#f8f9fa] px-3 py-2">
        <p
          className="flex items-start gap-1.5 text-[11px] leading-relaxed"
          style={{ color: CHART_PALETTE.axis }}
        >
          {isAi ? (
            <>
              <Sparkles size={12} className="mt-0.5 shrink-0 text-violet-500" />
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
              <Calculator size={12} className="mt-0.5 shrink-0 text-gray-400" />
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
              className="flex shrink-0 cursor-pointer items-center gap-1 rounded-md px-1.5 py-0.5 text-[11px] font-medium text-gray-500 transition hover:bg-white hover:text-gray-800 disabled:cursor-default disabled:opacity-60"
            >
              <RotateCw size={11} className={busy ? "animate-spin" : ""} />
              {busy ? "Refreshing…" : "Refresh"}
            </button>
          )}
      </div>
    </Shell>
  );
}
