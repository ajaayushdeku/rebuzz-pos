"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Loader2,
  ArrowLeft,
  Mail,
  Check,
  CheckCircle,
  KeyRound,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import {
  sendResetToken,
  resetPassword,
} from "@/services/authServices/apiResetPassword";
import ServerEnvBadge from "@/components/ServerEnvBadge";

type Step = "email" | "reset" | "done";

const CODE_LENGTH = 6;
const EXPIRY_SECONDS = 10 * 60; // 10 minutes

const STEP_LABELS = ["Email", "Reset code", "Done"];

/**
 * The three-step marker above each card.
 *
 * Three plain bars said how far along you were but not what the steps
 * actually are, and on the last screen a filled bar and a finished flow
 * looked the same. Numbered circles carry the name of each step, a tick
 * replaces the number once it is behind you, and the ring marks the one
 * you are on.
 *
 * `current` is 1-based. Reaching 3 means the reset finished, so every step
 * shows as done rather than one of them sitting highlighted.
 */
function StepRail({
  current,
  tone = "blue",
}: {
  current: 1 | 2 | 3;
  /** Green once the reset has actually gone through. */
  tone?: "blue" | "green";
}) {
  const filled =
    tone === "green"
      ? "border-emerald-500 bg-emerald-500 text-white"
      : "border-blue-600 bg-blue-600 text-white";
  const ring =
    tone === "green"
      ? "border-emerald-500 bg-white text-emerald-600 ring-4 ring-emerald-500/10"
      : "border-blue-600 bg-white text-blue-600 ring-4 ring-blue-600/10";
  const bar = tone === "green" ? "bg-emerald-500" : "bg-blue-600";

  return (
    <div className="mb-7 flex items-start">
      {STEP_LABELS.map((label, i) => {
        const step = i + 1;
        const isDone = step < current || current === 3;
        const isCurrent = !isDone && step === current;
        const isLast = i === STEP_LABELS.length - 1;

        return (
          <div key={label} className={isLast ? "flex" : "flex flex-1"}>
            <div className="flex w-16 shrink-0 flex-col items-center gap-1.5">
              <span
                className={`flex h-7 w-7 items-center justify-center rounded-full border text-[11px] font-semibold transition-colors ${
                  isDone
                    ? filled
                    : isCurrent
                      ? ring
                      : "border-gray-200 bg-white text-gray-400"
                }`}
              >
                {isDone ? <Check size={13} strokeWidth={3} /> : step}
              </span>

              <span
                className={`text-[10px] font-medium whitespace-nowrap ${
                  isCurrent || isDone ? "text-gray-700" : "text-gray-400"
                }`}
              >
                {label}
              </span>
            </div>

            {/* Sits at half the circle's height so it meets it edge-on. */}
            {!isLast && (
              <span
                className={`mt-3.5 h-px flex-1 transition-colors ${
                  isDone ? bar : "bg-gray-200"
                }`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

export default function ForgotPasswordPage() {
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [digits, setDigits] = useState<string[]>(Array(CODE_LENGTH).fill(""));
  const [secondsLeft, setSecondsLeft] = useState(EXPIRY_SECONDS);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<{
    token?: string;
    password?: string;
    confirmPassword?: string;
  }>({});

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Countdown timer for step 2
  useEffect(() => {
    if (step !== "reset" || secondsLeft <= 0) return;
    const interval = setInterval(() => {
      setSecondsLeft((s) => s - 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [secondsLeft, step]);

  const minutes = Math.floor(secondsLeft / 60);
  const seconds = secondsLeft % 60;

  // Step 1: Send reset token
  const handleSendToken = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError(null);

    if (!email.trim()) {
      setServerError("Please enter your email address");
      return;
    }

    setIsLoading(true);
    const result = await sendResetToken(email.trim());
    setIsLoading(false);

    if (!result.success) {
      setServerError(result.error);
      return;
    }

    // Only move to step 2 if the API explicitly returned success
    setStep("reset");
    setSecondsLeft(EXPIRY_SECONDS);
    setDigits(Array(CODE_LENGTH).fill(""));
  };

  // OTP digit change handler
  const handleDigitChange = (index: number, value: string) => {
    const digit = value.replace(/\D/g, "").slice(-1);
    const updated = [...digits];
    updated[index] = digit;
    setDigits(updated);
    setFieldErrors((prev) => ({ ...prev, token: undefined }));
    setServerError(null);

    if (digit && index < CODE_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (
    index: number,
    e: React.KeyboardEvent<HTMLInputElement>,
  ) => {
    if (e.key === "Backspace") {
      if (digits[index]) {
        const updated = [...digits];
        updated[index] = "";
        setDigits(updated);
      } else if (index > 0) {
        inputRefs.current[index - 1]?.focus();
      }
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData
      .getData("text")
      .replace(/\D/g, "")
      .slice(0, CODE_LENGTH);
    const updated = Array(CODE_LENGTH).fill("");
    pasted.split("").forEach((char, i) => {
      updated[i] = char;
    });
    setDigits(updated);
    setFieldErrors((prev) => ({ ...prev, token: undefined }));
    setServerError(null);

    const nextEmpty = updated.findIndex((d) => !d);
    const focusIndex = nextEmpty === -1 ? CODE_LENGTH - 1 : nextEmpty;
    inputRefs.current[focusIndex]?.focus();
  };

  // Step 2: Reset password
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError(null);
    setFieldErrors({});

    const token = digits.join("");
    const errors: typeof fieldErrors = {};
    if (token.length !== CODE_LENGTH)
      errors.token = `Please enter the full ${CODE_LENGTH}-digit code`;
    if (!password) errors.password = "Password is required";
    if (password.length < 8)
      errors.password = "Password must be at least 8 characters";
    if (password !== confirmPassword)
      errors.confirmPassword = "Passwords do not match";

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setIsLoading(true);
    const result = await resetPassword({
      email: email.trim(),
      token,
      password,
      confirm_password: confirmPassword,
    });
    setIsLoading(false);

    if (!result.success) {
      setServerError(result.error);
      return;
    }

    setStep("done");
  };

  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden bg-white font-sans">
      <header className="relative flex flex-col items-center justify-center gap-4  px-6  pb-4 sm:px-10">
        <div className="mt-2">
          {" "}
          <ServerEnvBadge />
        </div>

        <Link
          href="/"
          className="inline-flex items-center gap-1 transition-opacity hover:opacity-80"
        >
          <Image
            src="/rebuzz.png"
            alt=""
            width={36}
            height={36}
            className="rounded-lg"
            priority
          />
          <span className="text-2xl font-bold tracking-tight">
            <span style={{ color: "#244074" }}>Re</span>
            <span style={{ color: "#E26924" }}>Buzz</span>
          </span>
        </Link>
      </header>

      <main className="relative flex flex-1 justify-center mt-12 px-6 pb-14">
        <div className="w-full max-w-3xl">
          {/* ═══════ STEP 1: Email ═══════ */}
          {step === "email" && (
            <>
              <StepRail current={1} />

              <div>
                <span className="mb-5 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-600 shadow-lg shadow-blue-600/25">
                  <Mail size={20} className="text-white" strokeWidth={2} />
                </span>
                <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-blue-600">
                  Step 1 · Your email
                </p>
                <h1 className="text-2xl font-bold leading-tight tracking-tight text-gray-900 sm:text-3xl">
                  Forgot Pasword?
                </h1>
                <p className="mt-1.5 text-sm leading-relaxed text-gray-500">
                  Enter your email address and we&lsquo;ll send you a reset
                  token.
                </p>
              </div>

              <form onSubmit={handleSendToken} className="mt-8 space-y-5">
                <div>
                  <Label
                    htmlFor="reset-email"
                    className="mb-1.5 block text-[13px] font-semibold text-gray-700"
                  >
                    Email address
                  </Label>
                  <Input
                    id="reset-email"
                    type="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      setServerError(null);
                    }}
                    placeholder="Enter your email"
                    className="h-12 w-full rounded-xl border border-gray-300 bg-white px-4 text-[15px] text-gray-900 outline-none transition-colors placeholder:text-gray-400 focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10"
                    autoFocus
                  />
                </div>

                {serverError && (
                  <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3">
                    <p className="text-xs text-red-600 text-center font-medium">
                      {serverError}
                    </p>
                  </div>
                )}

                <Button
                  type="submit"
                  disabled={isLoading}
                  className="h-12 w-full cursor-pointer rounded-full bg-blue-600 text-[15px] font-semibold text-white shadow-lg shadow-blue-600/25 transition-all hover:bg-blue-700 hover:shadow-blue-600/35 disabled:cursor-not-allowed disabled:opacity-60 disabled:shadow-none"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    "Send Reset Token"
                  )}
                </Button>
              </form>

              <div className="mt-6 text-center">
                <Link
                  href="/login"
                  className="text-xs text-gray-500 hover:text-blue-600 transition-colors font-medium inline-flex items-center gap-1"
                >
                  <ArrowLeft className="h-3 w-3" />
                  Back to login
                </Link>
              </div>
            </>
          )}

          {/* ═══════ STEP 2: OTP + New Password ═══════ */}
          {step === "reset" && (
            <>
              <StepRail current={2} />

              <div>
                <span className="mb-5 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-600 shadow-lg shadow-blue-600/25">
                  <KeyRound size={20} className="text-white" strokeWidth={2} />
                </span>
                <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-blue-600">
                  Step 2 · Reset code
                </p>
                <h1 className="text-2xl font-bold leading-tight tracking-tight text-gray-900 sm:text-3xl">
                  Reset your password
                </h1>
                <p className="mt-1.5 text-sm leading-relaxed text-gray-500">
                  Enter the {CODE_LENGTH}-digit code we sent to{" "}
                  <span className="font-semibold text-gray-700">{email}</span>.
                </p>
              </div>

              <form onSubmit={handleResetPassword} className="mt-4 space-y-4">
                {/* OTP Inputs */}
                <div>
                  <Label className="mb-1.5 block text-[13px] font-semibold text-gray-700">
                    Reset Code
                  </Label>
                  <div
                    className="flex justify-center gap-2 md:gap-3"
                    onPaste={handlePaste}
                  >
                    {digits.map((digit, i) => (
                      <input
                        key={i}
                        ref={(el) => {
                          inputRefs.current[i] = el;
                        }}
                        type="text"
                        inputMode="numeric"
                        maxLength={1}
                        value={digit}
                        onChange={(e) => handleDigitChange(i, e.target.value)}
                        onKeyDown={(e) => handleKeyDown(i, e)}
                        disabled={isLoading}
                        className={`h-12 w-10 md:h-14 md:w-12 text-center text-lg md:text-xl font-bold rounded-xl border-2 bg-white outline-none transition-all
                        ${isLoading ? "opacity-50 cursor-not-allowed" : ""}
                        ${digit ? "border-blue-600 text-blue-900" : "border-gray-300 text-gray-800"}
                        ${fieldErrors.token ? "border-red-400" : ""}
                        focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10`}
                      />
                    ))}
                  </div>
                  {fieldErrors.token && (
                    <p className="mt-1.5 text-xs text-red-500 text-center">
                      {fieldErrors.token}
                    </p>
                  )}
                </div>

                {/* Expiry Timer */}
                <p className="text-center text-xs text-gray-500">
                  Code expires in{" "}
                  <span
                    className={
                      secondsLeft <= 60
                        ? "text-red-500 font-semibold"
                        : "font-medium text-gray-700"
                    }
                  >
                    {minutes}:{seconds.toString().padStart(2, "0")}
                  </span>
                </p>

                {/* Spam folder notice */}
                <p className="text-xs text-gray-400 text-center">
                  Didn&lsquo;t receive the code? Check your{" "}
                  <span className="font-medium text-gray-500">spam folder</span>{" "}
                  or try again.
                </p>

                {/* New Password */}
                <div>
                  <Label
                    htmlFor="new-password"
                    className="mb-1.5 block text-[13px] font-semibold text-gray-700"
                  >
                    New Password
                  </Label>
                  <div className="relative">
                    <Input
                      id="new-password"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        setFieldErrors((prev) => ({
                          ...prev,
                          password: undefined,
                        }));
                        setServerError(null);
                      }}
                      placeholder="At least 8 characters"
                      className={`h-12 w-full rounded-xl border bg-white px-4 pr-20 text-[15px] text-gray-900 outline-none transition-colors placeholder:text-gray-400 focus:ring-4 ${
                        fieldErrors.password
                          ? "border-red-300 focus:border-red-400 focus:ring-red-400/15"
                          : "border-gray-300 focus:border-blue-600 focus:ring-blue-600/10"
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((prev) => !prev)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-blue-600 text-xs font-semibold hover:underline cursor-pointer"
                    >
                      {showPassword ? "Hide" : "Show"}
                    </button>
                  </div>
                  {fieldErrors.password && (
                    <p className="mt-1 text-xs text-red-500">
                      {fieldErrors.password}
                    </p>
                  )}
                </div>

                {/* Confirm Password */}
                <div>
                  <Label
                    htmlFor="confirm-password"
                    className="mb-1.5 block text-[13px] font-semibold text-gray-700"
                  >
                    Confirm Password
                  </Label>
                  <div className="relative">
                    <Input
                      id="confirm-password"
                      type={showConfirm ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => {
                        setConfirmPassword(e.target.value);
                        setFieldErrors((prev) => ({
                          ...prev,
                          confirmPassword: undefined,
                        }));
                        setServerError(null);
                      }}
                      placeholder="Re-enter your new password"
                      className={`h-12 w-full rounded-xl border bg-white px-4 pr-20 text-[15px] text-gray-900 outline-none transition-colors placeholder:text-gray-400 focus:ring-4 ${
                        fieldErrors.confirmPassword
                          ? "border-red-300 focus:border-red-400 focus:ring-red-400/15"
                          : "border-gray-300 focus:border-blue-600 focus:ring-blue-600/10"
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirm((prev) => !prev)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-blue-600 text-xs font-semibold hover:underline cursor-pointer"
                    >
                      {showConfirm ? "Hide" : "Show"}
                    </button>
                  </div>
                  {fieldErrors.confirmPassword && (
                    <p className="mt-1 text-xs text-red-500">
                      {fieldErrors.confirmPassword}
                    </p>
                  )}
                </div>

                {/* Server error */}
                {serverError && (
                  <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3">
                    <p className="text-xs text-red-600 text-center font-medium">
                      {serverError}
                    </p>
                  </div>
                )}

                <Button
                  type="submit"
                  disabled={isLoading || secondsLeft <= 0}
                  className="h-12 w-full cursor-pointer rounded-full bg-blue-600 text-[15px] font-semibold text-white shadow-lg shadow-blue-600/25 transition-all hover:bg-blue-700 hover:shadow-blue-600/35 disabled:cursor-not-allowed disabled:opacity-60 disabled:shadow-none"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Resetting...
                    </>
                  ) : (
                    "Reset Password"
                  )}
                </Button>
              </form>

              <div className="mt-4 text-center">
                <button
                  type="button"
                  onClick={() => {
                    setStep("email");
                    setServerError(null);
                    setFieldErrors({});
                    setDigits(Array(CODE_LENGTH).fill(""));
                  }}
                  className="text-xs text-gray-500 hover:text-blue-600 transition-colors font-medium inline-flex items-center gap-1 cursor-pointer"
                >
                  <ArrowLeft className="h-3 w-3" />
                  Back to email step
                </button>
              </div>
            </>
          )}

          {/* ═══════ STEP 3: Done ═══════ */}
          {step === "done" && (
            <>
              <StepRail current={3} tone="green" />

              <div>
                <span className="mb-5 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500 shadow-lg shadow-emerald-500/25">
                  <CheckCircle
                    size={20}
                    className="text-white"
                    strokeWidth={2}
                  />
                </span>
                <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-emerald-600">
                  Step 3 · All set
                </p>
                <h1 className="text-2xl font-bold leading-tight tracking-tight text-gray-900 sm:text-3xl">
                  Password reset successful
                </h1>
                <p className="mt-1.5 text-sm leading-relaxed text-gray-500">
                  Your password has been updated. You can now log in with your
                  new password.
                </p>
                <Link
                  href="/login"
                  className="mt-10  flex flex-row items-center justify-center gap-2 w-full rounded-full bg-gray-900 py-4 text-center text-sm font-semibold text-white transition-colors hover:bg-gray-800"
                >
                  <ArrowLeft size={20} />
                  <span> Back to Login</span>
                </Link>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
