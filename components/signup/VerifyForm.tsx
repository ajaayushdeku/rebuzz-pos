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
    <div className="min-h-screen flex flex-col items-center bg-gray-100 px-6 font-sans">
      <div className="my-8 flex items-center gap-2">
        <span className="text-2xl text-blue-900 font-bold tracking-tight">
          <Link href="/">Rebuzz</Link>
        </span>
      </div>

      <div className="mt-10 flex-1 flex flex-col">
        <h1 className="text-[32px] font-semibold leading-tight text-blue-900 mb-4">
          Time for verification
        </h1>

        <p className="text-blue-950 text-[15px] mb-8">
          Please enter the OTP code we have sent you at{" "}
          <span className="font-semibold">{email}</span>.
        </p>

        {/* OTP Inputs */}
        <div className="flex gap-3 mb-6" onPaste={handlePaste}>
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
              className={`w-12 h-14 text-center text-xl font-bold rounded-xl border-2 bg-white outline-none transition-all 
                ${isVerifying ? "opacity-50 cursor-not-allowed" : ""} 
                ${digit ? "border-blue-600 text-blue-900" : "border-gray-200 text-gray-800"}
                focus:border-blue-500 focus:ring-2 focus:ring-green-200`}
            />
          ))}
        </div>

        {/* Expiry */}
        <p className="text-blue-800 text-[13px] mb-2">
          Note: The code expires in{" "}
          <span
            className={secondsLeft <= 30 ? "text-red-500 font-semibold" : ""}
          >
            {minutes} min {seconds.toString().padStart(2, "0")} seconds
          </span>
          .
        </p>

        {serverError && (
          <p className="mt-2 text-sm text-red-500">{serverError}</p>
        )}

        {/* Send Again */}
        <Button
          onClick={handleResend}
          disabled={isResending || secondsLeft > 0}
          className="w-full bg-blue-300 hover:bg-blue-400 text-white font-bold py-5 text-[16px] rounded-full mb-8 transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
        >
          <RotateCw
            className={`w-5 h-5 ${isResending ? "animate-spin" : ""}`}
          />
          {isResending ? "Sending..." : "Send Again"}
        </Button>
      </div>
    </div>
  );
}
