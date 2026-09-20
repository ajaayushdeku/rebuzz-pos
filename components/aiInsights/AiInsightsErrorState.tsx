"use client";

import Link from "next/link";
import {
  ArrowRight,
  Bot,
  CloudOff,
  Cpu,
  FileWarning,
  Gauge,
  KeyRound,
  LogIn,
  PowerOff,
  RefreshCw,
  ShieldAlert,
  Timer,
  TriangleAlert,
  WifiOff,
  type LucideIcon,
} from "lucide-react";

import {
  normalizeAiErrorCode,
  type AiInsightsError,
} from "@/services/apiAiInsights.client";

type Tone = "violet" | "red" | "amber" | "gray";

/** Looked up whole, never built from the tone name: Tailwind ships only classes it can find. */
const TONES: Record<
  Tone,
  { panel: string; iconWrap: string; icon: string; button: string }
> = {
  violet: {
    panel: "border-violet-100 bg-violet-50/50",
    iconWrap: "bg-violet-100",
    icon: "text-violet-600",
    button: "bg-violet-600 hover:bg-violet-700",
  },
  red: {
    panel: "border-red-100 bg-red-50/50",
    iconWrap: "bg-red-100",
    icon: "text-red-600",
    button: "bg-red-600 hover:bg-red-700",
  },
  amber: {
    panel: "border-amber-100 bg-amber-50/50",
    iconWrap: "bg-amber-100",
    icon: "text-amber-600",
    button: "bg-amber-600 hover:bg-amber-700",
  },
  gray: {
    panel: "border-gray-200 bg-gray-50/70",
    iconWrap: "bg-gray-100",
    icon: "text-gray-500",
    button: "bg-gray-800 hover:bg-gray-900",
  },
};

interface Presentation {
  icon: LucideIcon;
  tone: Tone;
  title: string;
  /** What to do about it — the line the bare message never had. */
  hint: string;
  /** Where the fix lives. Absent means trying again is the fix. */
  action?: { label: string; href: string };
}

const SETTINGS = "/settings/api-keys";

/**
 * Each failure, as a merchant needs to see it.
 *
 * Grouped by what fixes it rather than by where it came from. A missing key,
 * a busy Google and a cut-off answer are three very different situations, and
 * the grey sentence the cards showed before made all three look alike — so
 * someone whose setup was fine could go hunting in settings, and someone
 * without a key could keep pressing "try again".
 *
 * Each hint adds to the message above it rather than restating it. The
 * message is the sentence from the client's error table ("Couldn't reach the
 * server. Check your connection…"); a hint that repeated it put the same
 * advice on the card twice.
 *
 * Tone follows who has to act: violet when it is set-up the merchant
 * finishes, red when something they own is wrong, amber when it is temporary
 * and waiting or retrying will do, grey when the cause is outside both.
 */
function present(code: string): Presentation {
  switch (code) {
    case "NOT_CONFIGURED":
      return {
        icon: KeyRound,
        tone: "violet",
        title: "Connect your AI key",
        hint: "Insights run on your own key, from Google Gemini or OpenRouter. Creating one takes about a minute, and the steps are on the settings page.",
        action: { label: "Add API key", href: SETTINGS },
      };
    case "AI_DISABLED":
      return {
        icon: PowerOff,
        tone: "violet",
        title: "AI insights are switched off",
        // The settings form has no on/off switch; saving the key is what
        // turns AI back on, since the save route always stores it enabled.
        hint: "Your key is still saved. Saving it again in settings turns AI insights back on.",
        action: { label: "Open AI settings", href: SETTINGS },
      };
    case "AI_KEY_INVALID":
    case "KEY_UNREADABLE":
      return {
        icon: ShieldAlert,
        tone: "red",
        title: "Your API key needs attention",
        hint: "Only the AI features are paused. Your sales data and the rest of the dashboard are not affected.",
        action: { label: "Check API key", href: SETTINGS },
      };
    case "AI_MODEL_UNAVAILABLE":
      return {
        icon: Cpu,
        tone: "red",
        title: "That AI model isn't available",
        hint: "Pick another model in settings. The list only shows models your key can use.",
        action: { label: "Choose a model", href: SETTINGS },
      };
    case "AI_QUOTA_EXCEEDED":
      return {
        icon: Gauge,
        tone: "amber",
        title: "Your AI usage limit is reached",
        hint: "Every provider caps what a free key can use. Insights work again once the limit resets, or after raising it with your provider.",
      };
    case "AI_RATE_LIMIT":
    case "INSIGHTS_RATE_LIMIT":
      return {
        icon: Timer,
        tone: "amber",
        title: "Too many requests just now",
        hint: "Insights were asked for several times in a short while. Give it a moment before trying again.",
      };
    case "AI_UNAVAILABLE":
      return {
        icon: CloudOff,
        tone: "amber",
        title: "Your AI provider is busy",
        hint: "It happens during demand spikes on their side. Nothing is wrong with your key or your setup.",
      };
    case "AI_TRUNCATED":
    case "AI_MALFORMED_RESPONSE":
    case "AI_EMPTY_RESPONSE":
      return {
        icon: Bot,
        tone: "amber",
        title: "The AI tripped over its answer",
        hint: "Nothing is wrong with your setup or your data. It usually works on the next attempt.",
      };
    case "SALES_DATA_UNAVAILABLE":
      return {
        icon: CloudOff,
        tone: "gray",
        title: "Sales figures didn't load",
        hint: "The AI was not asked anything, so nothing was spent. It usually works on the next attempt.",
      };
    case "NETWORK":
      return {
        icon: WifiOff,
        tone: "gray",
        title: "You seem to be offline",
        hint: "Nothing was lost. Once you're connected, try again to load today's insights.",
      };
    case "AUTH_REQUIRED":
      return {
        icon: LogIn,
        tone: "gray",
        title: "Your session has ended",
        hint: "Sign in again to see today's insights.",
        action: { label: "Sign in", href: "/login" },
      };
    case "BRIEFING_REQUIRED":
    case "BRIEFING_TOO_LONG":
      return {
        icon: FileWarning,
        tone: "gray",
        title: "There wasn't data the AI could use",
        hint: "Insights need a normal day's sales to read. Try again once there is some activity.",
      };
    default:
      return {
        icon: TriangleAlert,
        tone: "gray",
        title: "Insights couldn't be generated",
        hint: "Try again in a moment. If it keeps happening, the code below helps pin it down.",
      };
  }
}

/**
 * The shared failure panel for the AI Business Story and the insights card.
 *
 * Both cards read one generation, so they fail together and should say the
 * same thing in the same way. Trying again from either regenerates both.
 */
export default function AiInsightsErrorState({
  error,
  onRetry,
}: {
  error?: AiInsightsError;
  onRetry: () => void;
}) {
  // Normalised first: a deployment from before the second provider still
  // answers GEMINI_RATE_LIMIT, which would otherwise fall through to the
  // generic panel and show the raw code.
  const code = normalizeAiErrorCode(error?.code ?? "UNKNOWN");
  const { icon: Icon, tone, title, hint, action } = present(code);
  const t = TONES[tone];

  const buttonClass = `inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-semibold text-white transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ${t.button}`;

  return (
    <div role="alert" className={`rounded-xl border px-5 py-5 ${t.panel}`}>
      <div className="flex items-start gap-4">
        <div
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${t.iconWrap}`}
          aria-hidden
        >
          <Icon size={20} className={t.icon} />
        </div>

        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-gray-900">{title}</p>
          {error?.message && (
            <p className="mt-1 text-[13px] leading-relaxed text-gray-600">
              {error.message}
            </p>
          )}
          <p className="mt-2 text-xs leading-relaxed text-gray-500">{hint}</p>

          <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-2">
            {action ? (
              // A client-side link, so the overview's cached answer survives
              // the trip to settings and back.
              <Link href={action.href} className={buttonClass}>
                {action.label}
                <ArrowRight size={13} />
              </Link>
            ) : (
              <button type="button" onClick={onRetry} className={buttonClass}>
                <RefreshCw size={12} />
                Try again
              </button>
            )}

            {/* The code for support, not for reading: small and out of the way. */}
            <span className="ml-auto font-mono text-[10px] text-gray-500 tracking-wide">
              {code}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
