"use client";

import {
  FlaskConical,
  ShieldCheck,
  Laptop,
  HelpCircle,
  type LucideIcon,
} from "lucide-react";

// NEXT_PUBLIC_ vars are inlined at build time, so this reads fine on the client.
const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "";

type EnvInfo = {
  label: string;
  className: string;
  dot: string;
  icon: LucideIcon;
};

/** Map the configured API host to a human-readable environment. */
function resolveEnv(): EnvInfo {
  if (API_URL.includes("api.beta.")) {
    return {
      label: "Testing Server",
      className: "bg-blue-50 text-blue-700 border-blue-200",
      dot: "bg-blue-500",
      icon: FlaskConical,
    };
  }
  if (API_URL.includes("appapi.")) {
    return {
      label: "Production Server",
      className: "bg-green-50 text-green-700 border-green-200",
      dot: "bg-green-500",
      icon: ShieldCheck,
    };
  }
  if (API_URL.includes("localhost") || API_URL.includes("127.0.0.1")) {
    return {
      label: "Local Server",
      className: "bg-gray-100 text-gray-600 border-gray-200",
      dot: "bg-gray-400",
      icon: Laptop,
    };
  }
  return {
    label: "Unknown Server",
    className: "bg-gray-100 text-gray-600 border-gray-200",
    dot: "bg-gray-400",
    icon: HelpCircle,
  };
}

/**
 * A small pill showing which backend the app is pointed at (testing /
 * production / local), derived from NEXT_PUBLIC_API_URL. Rendered on the home,
 * login, and dashboard header.
 */
export default function ServerEnvBadge({
  className = "",
}: {
  className?: string;
}) {
  const env = resolveEnv();
  const Icon = env.icon;

  return (
    <span
      title={API_URL || "No API URL configured"}
      className={`inline-flex items-center gap-2 md:gap-1.5 rounded-full border px-2.5 py-1.5 md:py-0.5 text-xs font-bold whitespace-nowrap ${env.className} ${className}`}
    >
      {/* Pulsing status dot — the ring reads as "connected and live" the way a
          stream indicator does. Held still when the OS asks for less motion. */}
      <span className="relative flex h-1.5 w-1.5 shrink-0">
        <span
          className={`absolute inline-flex h-full w-full animate-ping rounded-full opacity-75 motion-reduce:animate-none ${env.dot}`}
        />
        <span
          className={`relative inline-flex h-1.5 w-1.5 rounded-full ${env.dot}`}
        />
      </span>

      <Icon size={12} className="shrink-0" aria-hidden="true" />
      <span className="hidden md:block">{env.label}</span>
    </span>
  );
}
