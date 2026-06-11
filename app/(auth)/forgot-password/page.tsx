"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, ArrowLeft, Mail, CheckCircle } from "lucide-react";
import Link from "next/link";
import {
  sendResetToken,
  resetPassword,
} from "@/services/authServices/apiResetPassword";

type Step = "email" | "reset" | "done";

const CODE_LENGTH = 6;
const EXPIRY_SECONDS = 10 * 60; // 10 minutes

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
    <div className="min-h-screen flex flex-col items-center justify-center bg-white px-6 font-sans">
      {/* Logo */}
      <div className="mb-6 md:mb-8 flex items-center gap-2">
        <span className="text-2xl text-blue-900 font-bold tracking-tight">
          <Link href="/">Rebuzz</Link>
        </span>
      </div>

      <div className="w-full max-w-sm">
        {/* ═══════ STEP 1: Email ═══════ */}
        {step === "email" && (
          <>
            <div className="text-center mb-6">
              <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <Mail className="h-6 w-6 text-blue-600" />
              </div>
              <h1 className="text-xl md:text-2xl font-bold text-gray-900 mb-2">
                Forgot password?
              </h1>
              <p className="text-sm text-gray-500">
                Enter your email address and we&lsquo;ll send you a reset token.
              </p>
            </div>

            <form onSubmit={handleSendToken} className="space-y-5">
              <div>
                <Label
                  htmlFor="reset-email"
                  className="text-sm text-gray-700 font-bold mb-1.5 block"
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
                  className="w-full px-3.5 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-sm"
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
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 text-sm rounded-full transition-colors disabled:opacity-60 cursor-pointer"
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
            <div className="text-center mb-6">
              <h1 className="text-xl md:text-2xl font-bold text-gray-900 mb-2">
                Reset your password
              </h1>
              <p className="text-sm text-gray-500">
                Enter the {CODE_LENGTH}-digit code we sent to{" "}
                <span className="font-semibold text-gray-700">{email}</span>.
              </p>
            </div>

            <form onSubmit={handleResetPassword} className="space-y-4">
              {/* OTP Inputs */}
              <div>
                <Label className="text-sm text-gray-700 font-bold mb-1.5 block">
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
                      className={`w-10 h-12 md:w-12 md:h-14 text-center text-lg md:text-xl font-bold rounded-xl border-2 bg-white outline-none transition-all
                        ${isLoading ? "opacity-50 cursor-not-allowed" : ""}
                        ${digit ? "border-blue-600 text-blue-900" : "border-gray-200 text-gray-800"}
                        ${fieldErrors.token ? "border-red-400" : ""}
                        focus:border-blue-500 focus:ring-2 focus:ring-blue-200`}
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
                  className="text-sm text-gray-700 font-bold mb-1.5 block"
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
                    className={`w-full px-3.5 py-2.5 rounded-lg border focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-sm ${
                      fieldErrors.password
                        ? "border-red-300 focus:ring-red-400"
                        : "border-gray-300"
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-blue-600 text-xs font-semibold hover:underline cursor-pointer"
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
                  className="text-sm text-gray-700 font-bold mb-1.5 block"
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
                    className={`w-full px-3.5 py-2.5 rounded-lg border focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-sm ${
                      fieldErrors.confirmPassword
                        ? "border-red-300 focus:ring-red-400"
                        : "border-gray-300"
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm((prev) => !prev)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-blue-600 text-xs font-semibold hover:underline cursor-pointer"
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
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 text-sm rounded-full transition-colors disabled:opacity-60 cursor-pointer"
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

            <div className="mt-6 text-center">
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
            <div className="text-center">
              <div className="w-14 h-14 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="h-7 w-7 text-green-600" />
              </div>
              <h1 className="text-xl md:text-2xl font-bold text-gray-900 mb-2">
                Password reset successful
              </h1>
              <p className="text-sm text-gray-500 mb-6">
                Your password has been updated. You can now log in with your new
                password.
              </p>
              <Link
                href="/login"
                className="inline-block w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 text-sm rounded-full transition-colors text-center"
              >
                Back to Login
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
