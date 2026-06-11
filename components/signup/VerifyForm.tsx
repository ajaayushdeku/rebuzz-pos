"use client";
import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { RotateCw } from "lucide-react";
import { resendToken, verifyToken } from "@/services/authServices/apiVerify";

const CODE_LENGTH = 6;
const EXPIRY_SECONDS = 5 * 60;

const business_slug = process.env.NEXT_PUBLIC_BUSINESS_SLUG ?? "java";

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
  const [isResending, setIsResending] = useState(false);
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
    <div className="min-h-screen flex flex-col items-center justify-center bg-white px-6 font-sans">
      {/* Logo */}
      <div className="mb-6 md:mb-8 flex items-center gap-2">
        <span className="text-2xl text-blue-900 font-bold tracking-tight">
          <Link href="/">Rebuzz</Link>
        </span>
      </div>

      {/* Card */}
      <div className="w-full max-w-sm bg-white rounded-2xl border border-gray-200 shadow-sm p-6 md:p-8">
        <div className="text-center mb-6">
          <h1 className="text-xl md:text-2xl font-bold text-gray-900 mb-2">
            Time for verification
          </h1>
          <p className="text-sm text-gray-500">
            Please enter the OTP code we have sent you at{" "}
            <span className="font-semibold text-gray-700">{email}</span>.
          </p>
        </div>

        {/* OTP Inputs */}
        <div
          className="flex justify-center gap-2 md:gap-3 mb-5"
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
              className={`w-10 h-12 md:w-12 md:h-14 text-center text-lg md:text-xl font-bold rounded-xl border-2 bg-white outline-none transition-all 
                ${isVerifying ? "opacity-50 cursor-not-allowed" : ""} 
                ${digit ? "border-blue-600 text-blue-900" : "border-gray-200 text-gray-800"}
                focus:border-blue-500 focus:ring-2 focus:ring-blue-200`}
            />
          ))}
        </div>

        {/* Expiry */}
        <p className="text-center text-xs text-gray-500 mb-4">
          Code expires in{" "}
          <span
            className={
              secondsLeft <= 30
                ? "text-red-500 font-semibold"
                : "font-medium text-gray-700"
            }
          >
            {minutes}:{seconds.toString().padStart(2, "0")}
          </span>
        </p>

        {/* Server error */}
        {serverError && (
          <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 mb-4">
            <p className="text-xs text-red-600 text-center font-medium">
              {serverError}
            </p>
          </div>
        )}

        {/* Resend button */}
        <Button
          onClick={handleResend}
          disabled={isResending || secondsLeft > 0}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 text-sm rounded-full transition-colors disabled:opacity-60 flex items-center justify-center gap-2 cursor-pointer"
        >
          <RotateCw
            className={`w-4 h-4 ${isResending ? "animate-spin" : ""}`}
          />
          {isResending ? "Sending..." : "Send Again"}
        </Button>

        <p className="text-xs text-gray-400 text-center mt-4">
          Didn&lsquo;t receive the code? Check your spam folder or try again.
        </p>
      </div>

      {/* Back to signup */}
      <div className="mt-6 text-center">
        <Link
          href="/signup"
          className="text-xs text-gray-500 hover:text-blue-600 transition-colors font-medium"
        >
          ← Back to sign up
        </Link>
      </div>
    </div>
  );
}
