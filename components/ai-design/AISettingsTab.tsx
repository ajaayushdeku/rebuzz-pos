import { AISettings } from "@/app/(app)/ai-design/page";
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
import { DesignTabHeader } from "./DesignTabHeader";
import { formatAiDesignError } from "./formatAiDesignError";
import { useEffect, useState } from "react";

export function AISettingsTab() {
  const [apiKey, setApiKey] = useState("");
  const [showKey, setShowKey] = useState(false);
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
    if (!apiKey.trim() && !settings?.configured) {
      setError("Please enter your OpenAI API key.");
      return;
    }

    try {
      setVerifying(true);
      setError("");
      setSuccess("");

      // Step 1: Verify the new key or the previously saved key.
      const verifyRes = await fetch("/api/ai-design/settings/verify", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(apiKey.trim() ? { apiKey: apiKey.trim() } : {}),
      });

      const verifyJson = await verifyRes.json();

      if (!verifyRes.ok || !verifyJson.data?.ok) {
        throw new Error(
          formatAiDesignError(verifyJson, "API key verification failed."),
        );
      }

      // Step 2: Save only after successful verification.
      if (apiKey.trim()) {
        const saveRes = await fetch("/api/ai-design/settings", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            apiKey: apiKey.trim(),
          }),
        });

        const saveJson = await saveRes.json();

        if (!saveRes.ok) {
          throw new Error(formatAiDesignError(saveJson, "Unable to save API key."));
        }
      }

      setApiKey("");
      setSuccess(
        apiKey.trim()
          ? "API key verified and saved successfully."
          : "Your existing API key is valid.",
      );

      await fetchSettings();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong while verifying the API key.",
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
    if (!window.confirm("Are you sure you want to remove your API key?")) {
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
        throw new Error(json.error || "Unable to remove API key.");
      }

      setApiKey("");
      setShowKey(false);

      await fetchSettings();

      setSuccess("API key removed successfully.");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to remove API key.",
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
        description="Manage the OpenAI API connection used for AI graphic generation."
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
                <h2 className="font-semibold tracking-tight">OpenAI API connection</h2>
                <p className="mt-1 text-xs leading-5 text-muted-foreground">
                  Connect a key to generate promotional graphics.
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
              <span className={`h-1.5 w-1.5 rounded-full ${
                loading
                  ? "animate-pulse bg-muted-foreground"
                  : settings?.configured && settings.enabled
                    ? "bg-emerald-500"
                    : settings?.configured
                      ? "bg-amber-500"
                      : "bg-slate-400"
              }`} />
              {loading ? "Checking connection" : status}
            </span>
          </div>

          <div className="space-y-5 p-5 sm:p-6">

          {error && (
            <div role="alert" className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-300">
              {error}
            </div>
          )}

          {success && (
            <div role="status" className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-300">
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              {success}
            </div>
          )}

          <div className="space-y-3">
            <div className="flex items-center justify-between gap-3">
              <label htmlFor="openai-api-key" className="text-sm font-semibold">API key</label>

              <a
                href="https://platform.openai.com/api-keys"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-xs font-semibold text-blue-600 transition-colors hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
              >
                Get API Key
                <ArrowRight className="h-3.5 w-3.5" />
              </a>
            </div>
            <div className="relative">
              <input
                type={showKey ? "text" : "password"}
                value={apiKey}
                onChange={(event) => {
                  setApiKey(event.target.value);
                  setError("");
                  setSuccess("");
                }}
                placeholder={
                  settings?.maskedKey
                    ? `Saved key: ${settings.maskedKey}`
                    : "Enter your OpenAI API key"
                }
                disabled={loading || verifying}
                id="openai-api-key"
                autoComplete="new-password"
                className="h-11 w-full rounded-xl border border-border bg-background px-3 pr-12 text-sm outline-none transition-shadow placeholder:text-muted-foreground/80 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 disabled:opacity-60"
              />

              <button
                type="button"
                onClick={() => setShowKey((previous) => !previous)}
                className="absolute right-2 top-1/2 inline-flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                aria-label={showKey ? "Hide API key" : "Show API key"}
              >
                {showKey ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>

            <p className="text-xs leading-5 text-muted-foreground">
              {settings?.configured
                ? "A key is already saved securely. Enter a new key only if you want to replace it."
                : "Enter your OpenAI API key. It will be securely stored by the backend."}
            </p>

            {settings?.lastVerifiedAt && (
              <p className="text-xs text-muted-foreground">
                Last verified:{" "}
                {new Date(settings.lastVerifiedAt).toLocaleString()}
              </p>
            )}
          </div>

          <div className="flex flex-col gap-2 border-t border-border pt-5 sm:flex-row sm:flex-wrap sm:items-center">
            <button
              type="button"
              onClick={handleVerifyAndSave}
              disabled={loading || verifying || removing}
              className="flex min-h-11 items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
            >
              {verifying && <RefreshCw className="h-4 w-4 animate-spin" />}
              {verifying
                ? "Verifying..."
                : settings?.configured
                  ? apiKey.trim()
                    ? "Verify & Replace Key"
                    : "Verify Existing Key"
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
                  className="min-h-11 rounded-xl border border-red-200 px-4 py-2.5 text-sm font-medium text-red-600 transition-colors hover:bg-red-50 dark:border-red-900 dark:hover:bg-red-950/30 disabled:cursor-not-allowed disabled:opacity-50"
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
            <LockKeyhole className="mt-0.5 h-5 w-5 shrink-0 text-emerald-700 dark:text-emerald-300" aria-hidden="true" />
            <div>
              <h3 className="text-sm font-semibold text-emerald-900 dark:text-emerald-200">Your key stays protected</h3>
              <p className="mt-1.5 text-xs leading-5 text-emerald-800/80 dark:text-emerald-200/75">
                The key is stored by the backend and is not saved in browser storage or exposed in frontend code.
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
                  Create an OpenAI API key, check API billing, then verify it here.
                </p>
              </div>
            </div>

            <ol className="mt-5 space-y-5">
              <li className="flex gap-3">
                <span className="mt-px flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-100 text-[11px] font-bold tabular-nums text-blue-700 dark:bg-blue-950/70 dark:text-blue-300">1</span>
                <div className="min-w-0">
                  <p className="text-[13px] font-medium text-foreground">Create a secret key</p>
                  <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
                    In the OpenAI Platform, choose the project for this POS and create a new secret key. Copy it when it appears; OpenAI only shows the full key at creation.
                  </p>
                  <a
                    href="https://platform.openai.com/api-keys"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-1.5 inline-flex items-center gap-1 text-xs font-medium text-blue-600 hover:underline dark:text-blue-400"
                  >
                    Open API keys <ExternalLink className="h-3 w-3" aria-hidden="true" />
                  </a>
                </div>
              </li>
              <li className="flex gap-3">
                <span className="mt-px flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-100 text-[11px] font-bold tabular-nums text-blue-700 dark:bg-blue-950/70 dark:text-blue-300">2</span>
                <div className="min-w-0">
                  <p className="text-[13px] font-medium text-foreground">Check API billing</p>
                  <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
                    API usage is billed separately from a ChatGPT subscription. Review your API billing setup and available credits before generating graphics.
                  </p>
                  <a
                    href="https://help.openai.com/en/articles/9039756-managing-billing-for-chatgpt-and-the-api-platform"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-1.5 inline-flex items-center gap-1 text-xs font-medium text-blue-600 hover:underline dark:text-blue-400"
                  >
                    About API billing <ExternalLink className="h-3 w-3" aria-hidden="true" />
                  </a>
                </div>
              </li>
              <li className="flex gap-3">
                <span className="mt-px flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-100 text-[11px] font-bold tabular-nums text-blue-700 dark:bg-blue-950/70 dark:text-blue-300">3</span>
                <div className="min-w-0">
                  <p className="text-[13px] font-medium text-foreground">Verify and save it here</p>
                  <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
                    Paste the key into the form and select <span className="font-medium text-foreground">Verify &amp; Save</span>. Rebuzz checks the key before saving it for AI graphic generation.
                  </p>
                </div>
              </li>
            </ol>

            <div className="mt-5 border-t border-border pt-4">
              <p className="text-xs leading-relaxed text-muted-foreground">
                This connection is separate from your AI Insights provider settings. If a key is lost or exposed, revoke it in OpenAI and save a replacement here.
              </p>
            </div>
          </section>

        </aside>
      </div>
    </div>
  );
}
