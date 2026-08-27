"use client";
import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button"; // used only by the hidden resend button
import Link from "next/link";
// Resend feature temporarily hidden — re-enable RotateCw + resendToken when restoring.
import { Check, MailCheck, RotateCw } from "lucide-react";
import Image from "next/image";
import ServerEnvBadge from "@/components/ServerEnvBadge";
import { verifyToken } from "@/services/authServices/apiVerify";
import { resendToken } from "@/services/authServices/apiVerify";

const CODE_LENGTH = 6;
const EXPIRY_SECONDS = 5 * 60;

const business_slug = process.env.NEXT_PUBLIC_BUSINESS_SLUG ?? "java";

const STEP_LABELS = ["Your details", "Verify email"];

/**
 * The signup progress marker.
 *
 * Same shape as the one on the password-reset screens, with two stops instead
 * of three — signing up is details, then this. Deliberately a copy rather
 * than a shared component: these pages are kept independent of one another.
 */
function StepRail({ current }: { current: 1 | 2 }) {
  return (
    <div className="mb-7 flex items-start">
      {STEP_LABELS.map((label, i) => {
        const step = i + 1;
        const isDone = step < current;
        const isCurrent = step === current;
        const isLast = i === STEP_LABELS.length - 1;

        return (
          <div key={label} className={isLast ? "flex" : "flex flex-1"}>
            <div className="flex w-20 shrink-0 flex-col items-center gap-1.5">
              <span
                className={`flex h-7 w-7 items-center justify-center rounded-full border text-[11px] font-semibold transition-colors ${
                  isDone
                    ? "border-blue-600 bg-blue-600 text-white"
                    : isCurrent
                      ? "border-blue-600 bg-white text-blue-600 ring-4 ring-blue-600/10"
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
                  isDone ? "bg-blue-600" : "bg-gray-200"
                }`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

export default function VerifyForm() {
  const router = useRouter();

  const [email] = useState<string>(() => {
    if (typeof window === "undefined") return "";
    return sessionStorage.getItem("pendingVerifyEmail") ?? "";
  });

  useEffect(() => {
    if (!email) {
      router.push("/signup");
    }
  }, [email, router]);

  const [digits, setDigits] = useState<string[]>(Array(CODE_LENGTH).fill(""));
  const [secondsLeft, setSecondsLeft] = useState(EXPIRY_SECONDS);
  const [isResending, setIsResending] = useState(false); // Resend hidden for now
  const [serverError, setServerError] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Countdown timer
  useEffect(() => {
    if (secondsLeft <= 0) return;
    const interval = setInterval(() => {
      setSecondsLeft((s) => s - 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [secondsLeft]);

  const minutes = Math.floor(secondsLeft / 60);
  const seconds = secondsLeft % 60;

  const verifyCode = async (code: string) => {
    setIsVerifying(true);
    setServerError(null);
    const result = await verifyToken(business_slug, email, code);
    if (!result.success) {
      setServerError(result.error);
      setIsVerifying(false);
      return;
    }
    router.push("/onboarding");
    setIsVerifying(false);
  };

  const handleChange = (index: number, value: string) => {
    const digit = value.replace(/\D/g, "").slice(-1);
    const updated = [...digits];
    updated[index] = digit;
    setDigits(updated);

    if (digit && index < CODE_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }
    if (digit && index === CODE_LENGTH - 1) {
      const code = updated.join("");
      verifyCode(code);
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
    const nextEmpty = updated.findIndex((d) => !d);
    const focusIndex = nextEmpty === -1 ? CODE_LENGTH - 1 : nextEmpty;
    inputRefs.current[focusIndex]?.focus();
    if (updated.every((d) => d !== "")) {
      verifyCode(updated.join(""));
    }
  };

  // Resend feature temporarily hidden — restore alongside the button below.
  const handleResend = async () => {
    setIsResending(true);
    setServerError(null);
    const result = await resendToken(business_slug, email);
    if (!result.success) {
      setServerError(result.error);
      setIsResending(false);
      return;
    }
    setSecondsLeft(EXPIRY_SECONDS);
    setDigits(Array(CODE_LENGTH).fill(""));
    inputRefs.current[0]?.focus();
    setIsResending(false);
  };

  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden bg-white font-sans">
      <header className="relative flex flex-col items-center justify-center gap-4  pb-4 px-6  sm:px-10">
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

      <main className="relative flex flex-1 items-center justify-center px-6 pb-14">
        <div className="w-full max-w-3xl">
          <div>
            <span className="mb-1 inline-flex items-center gap-1 pt-1  pr-3">
              <span className="flex h-6 w-6 items-center justify-center ">
                <MailCheck
                  size={16}
                  className="text-blue-600"
                  strokeWidth={2.5}
                />
              </span>
              <span className=" text-[11px] font-semibold uppercase tracking-[0.2em] text-blue-600">
                Step 1 of 2 &middot; Create account
              </span>
            </span>
            <h1 className="text-2xl font-bold leading-tight tracking-tight text-gray-900 sm:text-3xl">
              Check your inbox
            </h1>
            <p className="mt-1.5 text-sm leading-relaxed text-gray-500">
              Enter the {CODE_LENGTH}-digit code we sent to{" "}
              <span className="font-semibold text-gray-700">{email}</span>.
            </p>
          </div>

          <div className="mt-4 space-y-4">
            {/* OTP Inputs */}
            <div>
              <p className="mb-1.5 block text-[13px] font-semibold text-gray-700">
                Verification Code
              </p>
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
                    onChange={(e) => handleChange(i, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(i, e)}
                    disabled={isVerifying}
                    className={`h-12 w-10 md:h-14 md:w-12 text-center text-lg md:text-xl font-bold rounded-xl border-2 bg-white outline-none transition-all
                    ${isVerifying ? "opacity-50 cursor-not-allowed" : ""}
                    ${digit ? "border-blue-600 text-blue-900" : "border-gray-300 text-gray-800"}
                    focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10`}
                  />
                ))}
              </div>
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
              <span className="font-medium text-gray-500">spam folder</span> or
              try again.
            </p>

            {serverError && (
              <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3">
                <p className="text-xs text-red-600 text-center font-medium">
                  {serverError}
                </p>
              </div>
            )}

            {/* Resend button — temporarily hidden. */}
            <Button
              onClick={handleResend}
              disabled={isResending || secondsLeft > 0}
              className="h-12 w-full cursor-pointer rounded-full bg-blue-600 text-[15px] font-semibold text-white shadow-lg shadow-blue-600/25 transition-all hover:bg-blue-700 hover:shadow-blue-600/35 disabled:cursor-not-allowed disabled:opacity-60 disabled:shadow-none"
            >
              <RotateCw
                className={`h-4 w-4 ${isResending ? "animate-spin" : ""}`}
              />
              {isResending ? "Sending..." : "Send Again"}
            </Button>

            <div className="text-center">
              <Link
                href="/signup"
                className="text-xs font-medium text-gray-500 transition-colors hover:text-blue-700"
              >
                Back to sign up
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
