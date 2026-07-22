"use client";

// NEXT_PUBLIC_ vars are inlined at build time, so this reads fine on the client.
const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "";

type EnvInfo = {
  label: string;
  className: string;
  dot: string;
};

/** Map the configured API host to a human-readable environment. */
function resolveEnv(): EnvInfo {
  if (API_URL.includes("api.beta.")) {
    return {
      label: "Testing Server",
      className: "bg-amber-50 text-amber-700 border-amber-200",
      dot: "bg-amber-500",
    };
  }
  if (API_URL.includes("appapi.")) {
    return {
      label: "Production Server",
      className: "bg-green-50 text-green-700 border-green-200",
      dot: "bg-green-500",
    };
  }
  if (API_URL.includes("localhost") || API_URL.includes("127.0.0.1")) {
    return {
      label: "Local Server",
      className: "bg-gray-100 text-gray-600 border-gray-200",
      dot: "bg-gray-400",
    };
  }
  return {
    label: "Unknown Server",
    className: "bg-gray-100 text-gray-600 border-gray-200",
    dot: "bg-gray-400",
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

  return (
    <span
      title={API_URL || "No API URL configured"}
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border text-xs font-semibold whitespace-nowrap ${env.className} ${className}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${env.dot}`} />
      {env.label}
    </span>
  );
}
