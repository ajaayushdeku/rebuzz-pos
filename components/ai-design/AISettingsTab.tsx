"use client";

import { useEffect, useState } from "react";
import {
  ArrowRight,
  CheckCircle2,
  Eye,
  EyeOff,
  ExternalLink,
  Lightbulb,
  LockKeyhole,
  RefreshCw,
  Sparkles,
} from "lucide-react";

import { AISettings } from "@/app/(app)/ai-design/page";
import { DesignTabHeader } from "./DesignTabHeader";
import { formatAiDesignError } from "./formatAiDesignError";

export function AISettingsTab() {
  const [accountId, setAccountId] = useState("");
  const [apiToken, setApiToken] = useState("");
  const [showToken, setShowToken] = useState(false);
  const [settings, setSettings] = useState<AISettings | null>(null);

  const [loading, setLoading] = useState(true);
  const [verifying, setVerifying] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const fetchSettings = async () => {
    try {
      setLoading(true);
      setError("");

      const res = await fetch("/api/ai-design/settings", {
        method: "GET",
        cache: "no-store",
      });

      const json = await res.json();

      if (!res.ok) {
        throw new Error(json.error || "Unable to load AI settings.");
      }

      setSettings(json.data);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to load AI settings.",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchSettings();
  }, []);

  const handleVerifyAndSave = async () => {
    const trimmedAccountId = accountId.trim();
    const trimmedApiToken = apiToken.trim();
    const hasNewCredentials = Boolean(trimmedAccountId && trimmedApiToken);

    if (!hasNewCredentials && (trimmedAccountId || trimmedApiToken)) {
      setError("Please provide both your Cloudflare Account ID and API Token.");
      return;
    }

    if (!hasNewCredentials && !settings?.configured) {
      setError("Please enter your Cloudflare Account ID and API Token.");
      return;
    }

    try {
      setVerifying(true);
      setError("");
      setSuccess("");

      // Step 1: Verify the new credentials or the previously saved credentials.
      const verifyRes = await fetch("/api/ai-design/settings/verify", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(
          hasNewCredentials
            ? {
                accountId: trimmedAccountId,
                apiToken: trimmedApiToken,
              }
            : {},
        ),
      });

      const verifyJson = await verifyRes.json();

      if (!verifyRes.ok || !verifyJson.data?.ok) {
        throw new Error(
          formatAiDesignError(
            verifyJson,
            "Cloudflare credential verification failed.",
          ),
        );
      }

      // Step 2: Save new credentials only after successful verification.
      if (hasNewCredentials) {
        const saveRes = await fetch("/api/ai-design/settings", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            accountId: trimmedAccountId,
            apiToken: trimmedApiToken,
          }),
        });

        const saveJson = await saveRes.json();

        if (!saveRes.ok) {
          throw new Error(
            formatAiDesignError(
              saveJson,
              "Unable to save Cloudflare credentials.",
            ),
          );
        }
      }

      setAccountId("");
      setApiToken("");
      setShowToken(false);

      setSuccess(
        hasNewCredentials
          ? "Cloudflare credentials verified and saved successfully."
          : "Your existing Cloudflare connection is valid.",
      );

      await fetchSettings();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong while verifying Cloudflare credentials.",
      );
    } finally {
      setVerifying(false);
    }
  };

  const handleToggleEnabled = async () => {
    if (!settings) return;

    try {
      setUpdating(true);
      setError("");
      setSuccess("");

      const res = await fetch("/api/ai-design/settings", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          enabled: !settings.enabled,
        }),
      });

      const json = await res.json();

      if (!res.ok) {
        throw new Error(json.error || "Unable to update AI settings.");
      }

      await fetchSettings();

      setSuccess(
        !settings.enabled
          ? "AI Design has been enabled."
          : "AI Design has been disabled.",
      );
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to update settings.",
      );
    } finally {
      setUpdating(false);
    }
  };

  const handleRemoveConnection = async () => {
    if (
      !window.confirm(
        "Are you sure you want to remove the Cloudflare connection?",
      )
    ) {
      return;
    }

    try {
      setRemoving(true);
      setError("");
      setSuccess("");

      const res = await fetch("/api/ai-design/settings", {
        method: "DELETE",
      });

      const json = await res.json();

      if (!res.ok) {
        throw new Error(
          json.error || "Unable to remove Cloudflare credentials.",
        );
      }

      setAccountId("");
      setApiToken("");
      setShowToken(false);

      await fetchSettings();

      setSuccess("Cloudflare connection removed successfully.");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to remove Cloudflare connection.",
      );
    } finally {
      setRemoving(false);
    }
  };

  const status = settings?.configured
    ? settings.enabled
      ? "Connected"
      : "Disabled"
    : "Not connected";

  return (
    <div className="space-y-6">
      <DesignTabHeader
        title="AI Settings"
        description="Connect your Cloudflare account to power AI graphic generation."
      />

      <div className="grid w-full items-start gap-5 lg:grid-cols-[minmax(0,1.6fr)_minmax(320px,0.9fr)]">
        <div className="space-y-5">
          <section className="overflow-hidden rounded-2xl border border-border bg-card">
            <div className="flex flex-col gap-4 bg-gradient-to-br from-blue-50 via-violet-50/50 to-card p-5 dark:from-blue-950/40 dark:via-violet-950/20 dark:to-card sm:flex-row sm:items-start sm:justify-between sm:p-6">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-violet-600 text-white shadow-md shadow-blue-600/20">
                  <Sparkles className="h-5 w-5" aria-hidden="true" />
                </div>

                <div>
                  <h2 className="font-semibold tracking-tight">
                    Cloudflare AI connection
                  </h2>
                  <p className="mt-1 text-xs leading-5 text-muted-foreground">
                    Connect your account to generate promotional graphics.
                  </p>
                </div>
              </div>

              <span
                role="status"
                className={`inline-flex w-fit items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold ${
                  loading
                    ? "border-border bg-background/70 text-muted-foreground"
                    : settings?.configured && settings.enabled
                      ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300"
                      : settings?.configured
                        ? "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-300"
                        : "border-border bg-background/70 text-muted-foreground"
                }`}
              >
                <span
                  className={`h-1.5 w-1.5 rounded-full ${
                    loading
                      ? "animate-pulse bg-muted-foreground"
                      : settings?.configured && settings.enabled
                        ? "bg-emerald-500"
                        : settings?.configured
                          ? "bg-amber-500"
                          : "bg-slate-400"
                  }`}
                />
                {loading ? "Checking connection" : status}
              </span>
            </div>

            <div className="space-y-5 p-5 sm:p-6">
              {error && (
                <div
                  role="alert"
                  className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-300"
                >
                  {error}
                </div>
              )}

              {success && (
                <div
                  role="status"
                  className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-300"
                >
                  <CheckCircle2 className="h-4 w-4 shrink-0" />
                  {success}
                </div>
              )}

              <div className="space-y-2">
                <div className="flex items-center justify-between gap-3">
                  <label
                    htmlFor="cloudflare-account-id"
                    className="text-sm font-semibold"
                  >
                    Cloudflare Account ID
                  </label>

                  <a
                    href="https://dash.cloudflare.com/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 text-xs font-semibold text-blue-600 transition-colors hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                  >
                    Open Cloudflare
                    <ArrowRight className="h-3.5 w-3.5" />
                  </a>
                </div>

                <input
                  type="text"
                  id="cloudflare-account-id"
                  value={accountId}
                  onChange={(event) => {
                    setAccountId(event.target.value);
                    setError("");
                    setSuccess("");
                  }}
                  placeholder={
                    settings?.maskedAccountId
                      ? `Saved Account ID: ${settings.maskedAccountId}`
                      : "Enter your Cloudflare Account ID"
                  }
                  disabled={loading || verifying}
                  autoComplete="off"
                  spellCheck={false}
                  className="h-11 w-full rounded-xl border border-border bg-background px-3 text-sm outline-none transition-shadow placeholder:text-muted-foreground/80 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 disabled:opacity-60"
                />

                <p className="text-xs leading-5 text-muted-foreground">
                  Find your Account ID in your Cloudflare dashboard under your
                  account details.
                </p>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between gap-3">
                  <label
                    htmlFor="cloudflare-api-token"
                    className="text-sm font-semibold"
                  >
                    Cloudflare API Token
                  </label>

                  <a
                    href="https://dash.cloudflare.com/profile/api-tokens"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 text-xs font-semibold text-blue-600 transition-colors hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                  >
                    Create API Token
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                </div>

                <div className="relative">
                  <input
                    type={showToken ? "text" : "password"}
                    id="cloudflare-api-token"
                    value={apiToken}
                    onChange={(event) => {
                      setApiToken(event.target.value);
                      setError("");
                      setSuccess("");
                    }}
                    placeholder={
                      settings?.maskedApiToken
                        ? `Saved token: ${settings.maskedApiToken}`
                        : "Enter your Cloudflare API Token"
                    }
                    disabled={loading || verifying}
                    autoComplete="new-password"
                    spellCheck={false}
                    className="h-11 w-full rounded-xl border border-border bg-background px-3 pr-12 text-sm outline-none transition-shadow placeholder:text-muted-foreground/80 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 disabled:opacity-60"
                  />

                  <button
                    type="button"
                    onClick={() => setShowToken((previous) => !previous)}
                    className="absolute right-2 top-1/2 inline-flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                    aria-label={showToken ? "Hide API token" : "Show API token"}
                  >
                    {showToken ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>

                <p className="text-xs leading-5 text-muted-foreground">
                  Create a token with permission to use Workers AI. Your token
                  is encrypted by the backend and is never returned to the
                  browser after saving.
                </p>
              </div>

              {settings?.configured && (
                <div className="rounded-xl border border-border bg-muted/30 p-3">
                  <p className="text-xs font-semibold text-foreground">
                    Connected AI models
                  </p>

                  <div className="mt-2 space-y-1.5 text-xs text-muted-foreground">
                    <p>
                      <span className="font-medium text-foreground">Text:</span>{" "}
                      {settings.textModel || "@cf/zai-org/glm-4.7-flash"}
                    </p>
                    <p>
                      <span className="font-medium text-foreground">
                        Image:
                      </span>{" "}
                      {settings.imageModel ||
                        "@cf/black-forest-labs/flux-2-klein-4b"}
                    </p>
                  </div>
                </div>
              )}

              {settings?.lastVerifiedAt && (
                <p className="text-xs text-muted-foreground">
                  Last verified:{" "}
                  {new Date(settings.lastVerifiedAt).toLocaleString()}
                </p>
              )}

              <div className="flex flex-col gap-2 border-t border-border pt-5 sm:flex-row sm:flex-wrap sm:items-center">
                <button
                  type="button"
                  onClick={handleVerifyAndSave}
                  disabled={
                    loading ||
                    verifying ||
                    removing ||
                    (!accountId.trim() &&
                      !apiToken.trim() &&
                      !settings?.configured)
                  }
                  className="flex min-h-11 items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
                >
                  {verifying && <RefreshCw className="h-4 w-4 animate-spin" />}

                  {verifying
                    ? "Verifying..."
                    : settings?.configured
                      ? accountId.trim() || apiToken.trim()
                        ? "Verify & Replace Credentials"
                        : "Verify Existing Connection"
                      : "Verify & Save"}
                </button>

                {settings?.configured && (
                  <>
                    <button
                      type="button"
                      onClick={handleToggleEnabled}
                      disabled={loading || updating || removing}
                      className="min-h-11 rounded-xl border border-border px-4 py-2.5 text-sm font-medium transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {updating
                        ? "Updating..."
                        : settings.enabled
                          ? "Disable AI"
                          : "Enable AI"}
                    </button>

                    <button
                      type="button"
                      onClick={handleRemoveConnection}
                      disabled={loading || removing || updating}
                      className="min-h-11 rounded-xl border border-red-200 px-4 py-2.5 text-sm font-medium text-red-600 transition-colors hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-red-900 dark:hover:bg-red-950/30"
                    >
                      {removing ? "Removing..." : "Remove connection"}
                    </button>
                  </>
                )}
              </div>
            </div>
          </section>

          <section className="rounded-2xl border border-emerald-200/80 bg-emerald-50/70 p-5 dark:border-emerald-900/80 dark:bg-emerald-950/20 sm:p-6">
            <div className="flex gap-3">
              <LockKeyhole
                className="mt-0.5 h-5 w-5 shrink-0 text-emerald-700 dark:text-emerald-300"
                aria-hidden="true"
              />

              <div>
                <h3 className="text-sm font-semibold text-emerald-900 dark:text-emerald-200">
                  Your credentials stay protected
                </h3>

                <p className="mt-1.5 text-xs leading-5 text-emerald-800/80 dark:text-emerald-200/75">
                  Your Account ID and API Token are encrypted by the backend.
                  The full API Token is not stored in browser storage or
                  returned to the frontend after saving.
                </p>
              </div>
            </div>
          </section>
        </div>

        <aside>
          <section className="rounded-2xl border border-border bg-card p-5 sm:p-6">
            <div className="flex items-center gap-2.5">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300">
                <Lightbulb className="h-4 w-4" aria-hidden="true" />
              </span>

              <div>
                <h3 className="font-semibold">Before you connect</h3>
                <p className="mt-1 text-xs leading-5 text-muted-foreground">
                  Set up your Cloudflare account and create an API Token with
                  Workers AI permissions.
                </p>
              </div>
            </div>

            <ol className="mt-5 space-y-5">
              <li className="flex gap-3">
                <span className="mt-px flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-100 text-[11px] font-bold tabular-nums text-blue-700 dark:bg-blue-950/70 dark:text-blue-300">
                  1
                </span>

                <div className="min-w-0">
                  <p className="text-[13px] font-medium text-foreground">
                    Find your Account ID
                  </p>

                  <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
                    Sign in to Cloudflare, select your account, and find its
                    Account ID in the account details.
                  </p>

                  <a
                    href="https://dash.cloudflare.com/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-1.5 inline-flex items-center gap-1 text-xs font-medium text-blue-600 hover:underline dark:text-blue-400"
                  >
                    Open Cloudflare dashboard
                    <ExternalLink className="h-3 w-3" aria-hidden="true" />
                  </a>
                </div>
              </li>

              <li className="flex gap-3">
                <span className="mt-px flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-100 text-[11px] font-bold tabular-nums text-blue-700 dark:bg-blue-950/70 dark:text-blue-300">
                  2
                </span>

                <div className="min-w-0">
                  <p className="text-[13px] font-medium text-foreground">
                    Create an API Token
                  </p>

                  <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
                    Create a token with the required Workers AI permission.
                    Follow the least-privilege principle and grant only the
                    permissions needed for AI usage.
                  </p>

                  <a
                    href="https://dash.cloudflare.com/profile/api-tokens"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-1.5 inline-flex items-center gap-1 text-xs font-medium text-blue-600 hover:underline dark:text-blue-400"
                  >
                    Open API Tokens
                    <ExternalLink className="h-3 w-3" aria-hidden="true" />
                  </a>
                </div>
              </li>

              <li className="flex gap-3">
                <span className="mt-px flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-100 text-[11px] font-bold tabular-nums text-blue-700 dark:bg-blue-950/70 dark:text-blue-300">
                  3
                </span>

                <div className="min-w-0">
                  <p className="text-[13px] font-medium text-foreground">
                    Verify and save your credentials
                  </p>

                  <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
                    Enter your Account ID and API Token, then select{" "}
                    <span className="font-medium text-foreground">
                      Verify &amp; Save
                    </span>
                    . Rebuzz checks access to Workers AI before saving your
                    credentials.
                  </p>
                </div>
              </li>
            </ol>

            <div className="mt-5 border-t border-border pt-4">
              <p className="text-xs leading-relaxed text-muted-foreground">
                AI Design uses the Cloudflare account connected by your
                business. Workers AI usage is subject to Cloudflare&lsquo;s
                pricing, limits, and account terms. This connection is separate
                from your AI Insights provider settings.
              </p>
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}
