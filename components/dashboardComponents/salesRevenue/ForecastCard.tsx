"use client";

import { useRef } from "react";
import Link from "next/link";
import {
  Calculator,
  Calendar,
  CalendarDays,
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
import { ComponentHeader } from "@/components/ComponentHeader";
import { useAiProviderLabel, useHasSavedAiKey } from "@/hooks/useAiKey";
import { aiErrorMessage } from "@/services/apiAiInsights.client";
import { fetchSalesForecast } from "@/services/apiSalesForecast.client";
import type {
  ConfidenceLevel,
  ForecastDriver,
  SalesForecast,
} from "@/lib/salesForecast";

const CONFIDENCE_STYLES: Record<ConfidenceLevel, string> = {
  High: "bg-green-50 text-green-700 border-green-200",
  Likely: "bg-indigo-50 text-indigo-700 border-indigo-200",
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
  return <CalendarDays size={14} className="text-indigo-500" />;
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
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 h-full relative select-none">
      <div className="flex items-start justify-between mb-5">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center shrink-0">
            <TrendingUp size={15} className="text-indigo-600" />
          </div>
          <ComponentHeader
            title="What's coming forecast"
            subHeader={subHeader}
          />
        </div>
        {badge}
      </div>
      {children}
    </div>
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
          className="font-medium text-indigo-600 hover:underline"
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
        <div className="flex h-48 items-center justify-center gap-2 text-sm text-gray-400">
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
          <p className="text-sm text-gray-500">
            {(error as Error)?.message ?? "Couldn't load the forecast."}
          </p>
          <button
            type="button"
            onClick={() => refetch()}
            disabled={isFetching}
            className="flex cursor-pointer items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 transition hover:bg-gray-50 disabled:opacity-50"
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
          <CalendarDays size={22} className="text-indigo-300" />
          <p className="text-sm font-semibold text-gray-700">
            Not enough sales history yet
          </p>
          <p className="max-w-xs text-xs leading-relaxed text-gray-400">
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
          <CalendarDays size={22} className="text-indigo-300" />
          <p className="text-sm font-semibold text-gray-700">
            No sales in the last two weeks
          </p>
          <p className="max-w-xs text-xs leading-relaxed text-gray-400">
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
          className="flex flex-col items-end gap-1"
          title={CONFIDENCE_HINT[data.confidence]}
        >
          <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">
            Confidence
          </span>
          <span
            className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border ${
              CONFIDENCE_STYLES[data.confidence]
            }`}
          >
            {data.confidence}
          </span>
        </div>
      }
    >
      {/* Forecast numbers, faded while a new forecast is being made */}
      <div
        className={`grid grid-cols-2 gap-3 mb-5 transition-opacity ${busy ? "opacity-50" : ""}`}
      >
        <div className="bg-gray-50 rounded-xl p-3.5">
          <p className="text-[10px] font-semibold text-indigo-600 uppercase tracking-wide mb-1.5">
            {dayLabel}
          </p>
          <p className="text-xl font-bold text-gray-900">
            {fmt(data.tomorrowForecast)}
          </p>
          <p className="text-xs text-gray-400 mt-0.5">
            Usual {data.tomorrowWeekday}: {fmt(data.tomorrowBaseline)}
          </p>
        </div>
        <div className="bg-gray-50 rounded-xl p-3.5">
          <p className="text-[10px] font-semibold text-indigo-600 uppercase tracking-wide mb-1.5">
            {weekLabel}
          </p>
          <p className="text-xl font-bold text-gray-900">
            {fmt(data.weeklyProjection)}
          </p>
          <p className="text-xs text-gray-400 mt-0.5">
            Usual week: {fmt(data.weeklyBaseline)}
          </p>
        </div>
      </div>

      {/* Drivers */}
      {data.drivers.length > 0 && (
        <div className="mb-4">
          <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-2.5">
            Key forecast drivers
          </p>
          <div className="space-y-2">
            {data.drivers.map((driver, i) => (
              <div
                key={`${driver.kind}-${i}`}
                className="flex items-start justify-between gap-3 py-2.5 border-b border-gray-50 last:border-0"
              >
                <div className="flex items-start gap-2.5 flex-1 min-w-0">
                  <div className="w-6 h-6 rounded-lg bg-gray-50 flex items-center justify-center shrink-0 mt-0.5">
                    <DriverIcon driver={driver} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-gray-800">
                      {driver.label}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5 leading-relaxed">
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
      <div className="flex items-center justify-between gap-3 pt-3 border-t border-gray-100">
        <div className="flex items-center gap-1.5 text-gray-400 shrink-0">
          <Calendar size={13} />
          <span className="text-xs">Weekly outlook:</span>
        </div>
        <p className="text-right text-xs font-semibold text-indigo-600">
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
      <div className="mt-3 flex items-start justify-between gap-3 rounded-lg bg-gray-50 px-3 py-2">
        <p className="flex items-start gap-1.5 text-[11px] leading-relaxed text-gray-500">
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
