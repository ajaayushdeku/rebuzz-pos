"use client";

import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import {
  AlertCircle,
  Check,
  Eye,
  EyeOff,
  Loader2,
  Lock,
  Shield,
  X,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const inputClass =
  "w-full border border-gray-200 rounded-lg px-3 py-2.5 pr-10 text-sm text-gray-900 placeholder:text-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition";
const inputErrorClass =
  "w-full border border-red-300 rounded-lg px-3 py-2.5 pr-10 text-sm text-gray-900 placeholder:text-gray-300 focus:outline-none focus:ring-2 focus:ring-red-400 focus:border-transparent transition";

/** Four segments, so the bar reads as a level rather than a percentage. */
const STRENGTH_LEVELS = [
  { label: "Weak", bar: "bg-red-500", text: "text-red-600" },
  { label: "Fair", bar: "bg-orange-500", text: "text-orange-600" },
  { label: "Good", bar: "bg-yellow-500", text: "text-yellow-700" },
  { label: "Strong", bar: "bg-green-500", text: "text-green-600" },
] as const;

/** Below this the password is refused — two requirements is not enough. */
const MIN_SCORE = 3;

const REQUIREMENTS = [
  { label: "At least 8 characters", test: (pw: string) => pw.length >= 8 },
  { label: "An uppercase letter", test: (pw: string) => /[A-Z]/.test(pw) },
  { label: "A lowercase letter", test: (pw: string) => /[a-z]/.test(pw) },
  { label: "A number", test: (pw: string) => /[0-9]/.test(pw) },
  {
    label: "A special character",
    test: (pw: string) => /[^a-zA-Z0-9]/.test(pw),
  },
];

/** 0-6, from length and character variety. */
function scorePassword(pw: string): number {
  let score = 0;
  if (pw.length >= 8) score += 1;
  if (pw.length >= 12) score += 1;
  if (/[a-z]/.test(pw)) score += 1;
  if (/[A-Z]/.test(pw)) score += 1;
  if (/[0-9]/.test(pw)) score += 1;
  if (/[^a-zA-Z0-9]/.test(pw)) score += 1;
  return score;
}

/** Score 0-6 → one of the four levels. */
function strengthLevel(score: number): number {
  if (score <= 2) return 0;
  if (score === 3) return 1;
  if (score === 4) return 2;
  return 3;
}

/**
 * A password input with its own reveal toggle and message slot.
 *
 * The three fields were identical blocks of markup with only the state
 * swapped; one component keeps the reveal button, spacing and error styling
 * from drifting apart between them.
 */
function PasswordField({
  label,
  value,
  onChange,
  placeholder,
  autoComplete,
  invalid,
  message,
  children,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  autoComplete: string;
  invalid?: boolean;
  /** Validation line under the field. */
  message?: React.ReactNode;
  /** Extra content under the field, e.g. the strength meter. */
  children?: React.ReactNode;
}) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="px-4">
      <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.06em] text-gray-500">
        {label}
      </label>

      <div className="relative">
        <Input
          type={visible ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={invalid ? inputErrorClass : inputClass}
          placeholder={placeholder}
          autoComplete={autoComplete}
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? `Hide ${label}` : `Show ${label}`}
          className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer rounded text-gray-400 transition-colors hover:text-gray-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
        >
          {visible ? <EyeOff size={16} /> : <Eye size={16} />}
        </button>
      </div>

      {message}
      {children}
    </div>
  );
}

export default function ChangePasswordPage() {
  const [userId, setUserId] = useState<string | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);

  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const score = scorePassword(newPassword);
  const level = strengthLevel(score);
  const passwordsMatch = newPassword === confirmPassword;
  // Reusing the current password is not a change at all.
  const reusesOld = !!newPassword && newPassword === oldPassword;
  const allFilled = !!(oldPassword && newPassword && confirmPassword);

  const canSubmit =
    allFilled &&
    passwordsMatch &&
    !reusesOld &&
    score >= MIN_SCORE &&
    !loading &&
    !!userId;

  /** Why the button is disabled — silently inert controls are a dead end. */
  const blocker = (() => {
    if (loading || !allFilled) return null;
    if (reusesOld) return "The new password must differ from the current one.";
    if (score < MIN_SCORE) return "Pick a stronger password to continue.";
    if (!passwordsMatch) return "The two new passwords do not match.";
    if (!userId) return "Your account could not be loaded — reload and retry.";
    return null;
  })();

  useEffect(() => {
    const loadUserId = async () => {
      try {
        const res = await fetch("/api/profile");
        const data = await res.json();
        const id = data?.data?.user?._id;
        if (id) setUserId(id);
      } catch {
        console.error("Failed to fetch user profile");
      } finally {
        setProfileLoading(false);
      }
    };
    loadUserId();
  }, []);

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!canSubmit || !userId) return;

    setLoading(true);
    try {
      const res = await fetch("/api/auth/change-password", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          old_password: oldPassword,
          password: newPassword,
          confirm_password: confirmPassword,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to change password");

      toast.success("Password changed successfully!");
      setOldPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-50 px-6 py-8 md:px-10">
      <div className="mx-auto w-full">
        {/* ── Header ── */}
        <div className="mb-5 border-b border-gray-200 pb-4">
          <h1 className="truncate text-xl font-bold md:text-2xl">
            Change Password
          </h1>
          <p className="mt-0.5 text-xs text-gray-400">
            Update the password you sign in with.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm"
        >
          {/* Card heading */}
          <div className="flex items-center gap-3 border-b border-gray-100 px-6 py-5">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50">
              <Lock className="h-5 w-5 text-blue-600" />
            </div>
            <div className="min-w-0">
              <h2 className="text-[15px] font-semibold text-gray-900">
                Account security
              </h2>
              <p className="text-xs text-gray-400">
                Choose a strong password you haven&rsquo;t used before.
              </p>
            </div>
          </div>

          <div className="space-y-5 p-6">
            {/* The account is needed to submit, so say so while it loads
                instead of leaving the button inert without explanation. */}
            {profileLoading && (
              <div className="flex items-center gap-2 rounded-lg bg-gray-50 px-3 py-2.5 text-[12px] text-gray-500">
                <Loader2 size={14} className="animate-spin" />
                Loading your account…
              </div>
            )}

            {!profileLoading && !userId && (
              <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2.5">
                <AlertCircle
                  size={14}
                  className="mt-0.5 shrink-0 text-red-500"
                />
                <p className="text-[12px] leading-relaxed text-red-600">
                  Your account details could not be loaded, so the password
                  cannot be changed right now. Reload the page and try again.
                </p>
              </div>
            )}

            <PasswordField
              label="Current password"
              value={oldPassword}
              onChange={setOldPassword}
              placeholder="Enter your current password"
              autoComplete="current-password"
            />

            <PasswordField
              label="New password"
              value={newPassword}
              onChange={setNewPassword}
              placeholder="Enter your new password"
              autoComplete="new-password"
              invalid={reusesOld}
              message={
                reusesOld ? (
                  <p className="mt-1 flex items-center gap-1 text-[11px] text-red-500">
                    <AlertCircle className="h-3 w-3" />
                    Must be different from your current password
                  </p>
                ) : undefined
              }
            >
              {newPassword && (
                <div className="mt-3 space-y-2.5">
                  {/* Segmented meter — four filled blocks read as a level. */}
                  <div className="flex items-center gap-2">
                    <div className="flex flex-1 gap-1">
                      {STRENGTH_LEVELS.map((_, i) => (
                        <span
                          key={i}
                          className={`h-1.5 flex-1 rounded-full transition-colors duration-300 ${
                            i <= level
                              ? STRENGTH_LEVELS[level].bar
                              : "bg-gray-200"
                          }`}
                        />
                      ))}
                    </div>
                    <span
                      className={`min-w-[44px] text-right text-[11px] font-semibold ${STRENGTH_LEVELS[level].text}`}
                    >
                      {STRENGTH_LEVELS[level].label}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 gap-1 sm:grid-cols-2">
                    {REQUIREMENTS.map((req) => {
                      const passed = req.test(newPassword);
                      return (
                        <div
                          key={req.label}
                          className="flex items-center gap-1.5 text-[11px]"
                        >
                          {passed ? (
                            <Check className="h-3 w-3 shrink-0 text-green-500" />
                          ) : (
                            <X className="h-3 w-3 shrink-0 text-gray-300" />
                          )}
                          <span
                            className={
                              passed ? "text-green-600" : "text-gray-400"
                            }
                          >
                            {req.label}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </PasswordField>

            <PasswordField
              label="Confirm new password"
              value={confirmPassword}
              onChange={setConfirmPassword}
              placeholder="Re-enter your new password"
              autoComplete="new-password"
              invalid={!!confirmPassword && !passwordsMatch}
              message={
                confirmPassword ? (
                  passwordsMatch ? (
                    <p className="mt-1 flex items-center gap-1 text-[11px] text-green-600">
                      <Check className="h-3 w-3" />
                      Passwords match
                    </p>
                  ) : (
                    <p className="mt-1 flex items-center gap-1 text-[11px] text-red-500">
                      <AlertCircle className="h-3 w-3" />
                      Passwords do not match
                    </p>
                  )
                ) : undefined
              }
            />
          </div>

          {/* ── Submit ── */}
          <div className="space-y-2 border-t border-gray-100 bg-gray-50 px-6 py-4">
            {blocker && (
              <p className="text-center text-[11px] text-gray-500">{blocker}</p>
            )}

            <Button
              type="submit"
              disabled={!canSubmit}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 py-2.5 text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Changing password...
                </>
              ) : (
                <>
                  <Shield className="h-4 w-4" />
                  Update password
                </>
              )}
            </Button>
          </div>
        </form>

        {/* ── Security tip ── */}
        <div className="mt-6 flex items-start gap-3 rounded-xl border border-blue-100 bg-blue-50 p-4">
          <Shield className="mt-0.5 h-4 w-4 shrink-0 text-blue-600" />
          <p className="text-[11px] leading-relaxed text-blue-700">
            Use a password unique to this account. Reusing one from another site
            means a breach there becomes a breach here.
          </p>
        </div>
      </div>
    </div>
  );
}
