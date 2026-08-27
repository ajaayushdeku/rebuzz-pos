"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { useForm } from "react-hook-form";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import Divider from "@/components/Divider";
import { ArrowLeft, KeyRound, Loader2, LogIn, PlayCircle } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import loginUser from "@/services/authServices/apiLogin";
import { ACCESS_DENIED_PATH } from "@/lib/auth/roles";
import ServerEnvBadge from "@/components/ServerEnvBadge";

type LoginFormValues = {
  email: string;
  password: string;
};

/** The input style shared by both fields, so they always agree. */
const INPUT_CLASS =
  "h-12 w-full rounded-xl border border-gray-300 bg-white px-4 text-[15px] text-gray-900 outline-none transition-colors placeholder:text-gray-400 focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10";

const LoginPage = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const queryClient = useQueryClient();
  const searchParams = useSearchParams();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    // Prefilled when re-authenticating an account from the switcher
    // (e.g. /login?add=1&email=user@example.com).
    defaultValues: { email: searchParams.get("email") ?? "", password: "" },
  });

  const checkBusinessAndRedirect = async () => {
    try {
      const res = await fetch("/api/business");
      if (res.ok) {
        const data = await res.json();
        // If business data exists (has _id or businessName), go to dashboard
        if (
          data?.status === "success" &&
          (data?.data?.business?._id || data?.data?.business?.businessName)
        ) {
          router.push("/dashboard");
          return;
        }
      }
    } catch {
      // If the fetch fails or no business, redirect to onboarding
      console.log("No business found, redirecting to onboarding");
    }
    router.push("/onboarding");
  };

  const onSubmit = async (loginData: LoginFormValues) => {
    setServerError(null);
    setIsLoading(true);

    const result = await loginUser({
      email_or_phone: loginData.email,
      password: loginData.password,
      deviceToken: "",
    });

    setIsLoading(false);

    if (!result.success) {
      if (result.forbidden) {
        router.replace(ACCESS_DENIED_PATH);
        return;
      }

      setServerError(result.error);
      return;
    }

    // Invalidate cached business data so the new user's business is fetched
    await queryClient.invalidateQueries({ queryKey: ["business-profile"] });

    await checkBusinessAndRedirect();
  };

  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden bg-white font-sans">
      <header className="relative flex flex-col items-center justify-center gap-4  px-6  sm:px-10">
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

      <main className=" relative flex flex-1 items-center justify-center px-6">
        <div className="w-full max-w-xl">
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-blue-600">
            Welcome back
          </p>
          <h1 className="text-2xl font-bold leading-tight tracking-tight text-gray-900 sm:text-3xl">
            Log in and continue selling
          </h1>
          <p className="mt-1.5 text-sm leading-relaxed text-gray-500">
            Enter your details to pick up where you left off. Your customers are
            waiting for you.
          </p>

          <form className="mt-8 space-y-5" onSubmit={handleSubmit(onSubmit)}>
            {/* Email */}
            <div>
              <label
                htmlFor="email"
                className="mb-1.5 block text-[13px] font-semibold text-gray-700"
              >
                Email
              </label>
              <input
                id="email"
                type="email"
                className={INPUT_CLASS}
                placeholder="Enter your email"
                {...register("email", {
                  required: "Email is required",
                  pattern: {
                    value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                    message: "Enter a valid email address",
                  },
                })}
              />
              {errors.email && (
                <p className="mt-1 text-xs text-red-500">
                  {errors.email.message}
                </p>
              )}
            </div>

            {/* Password */}
            <div>
              <label
                className="mb-1.5 block text-[13px] font-semibold text-gray-700"
                htmlFor="password"
              >
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  className={`${INPUT_CLASS} pr-20`}
                  placeholder="Enter your password"
                  {...register("password", {
                    required: "Password is required",
                  })}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-blue-600 text-xs font-semibold hover:underline cursor-pointer"
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>
              {errors.password && (
                <p className="mt-1 text-xs text-red-500">
                  {errors.password.message}
                </p>
              )}
              <div className="mt-1">
                <Link
                  href="/forgot-password"
                  className="text-xs text-gray-500 hover:text-blue-600 transition-colors"
                >
                  Forgot your password?
                </Link>
              </div>
            </div>

            {/* Server error */}
            {serverError && (
              <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3">
                <p className="text-[13px] leading-snug text-red-600">
                  {serverError}
                </p>
              </div>
            )}

            <Button
              type="submit"
              disabled={isLoading}
              className="h-12 w-full cursor-pointer rounded-full bg-blue-600 text-[15px] font-semibold text-white shadow-lg shadow-blue-600/25 transition-all hover:bg-blue-700 hover:shadow-blue-600/35 disabled:cursor-not-allowed disabled:opacity-60 disabled:shadow-none"
            >
              <LogIn size={24} className="text-white" />{" "}
              {isLoading ? "Logging in..." : "Log In"}
            </Button>

            {/* <Divider />*/}
          </form>

          <div className="mt-4 text-center">
            <p className="text-xs text-gray-500">
              New to ReBuzz?{" "}
              <Link
                href="/signup"
                className="font-semibold text-blue-600 transition-colors hover:text-blue-700"
              >
                Create an account
              </Link>
            </p>
          </div>

          <div className="mt-3 text-center">
            <Link
              href="/"
              className="inline-flex items-center gap-1 text-xs text-gray-400 transition-colors hover:text-gray-600"
            >
              <ArrowLeft className="h-3 w-3" />
              Back to home
            </Link>
          </div>

          {/* Demo button — for development only */}
          <div className="mt-2 border-t border-dashed border-gray-200 pt-5">
            <p className="mb-2.5 text-center text-[10px] font-semibold uppercase tracking-wider text-gray-400">
              Quick demo access
            </p>
            <Button
              type="button"
              onClick={() =>
                onSubmit({
                  email: process.env.NEXT_PUBLIC_DEMO_EMAIL!,
                  password: process.env.NEXT_PUBLIC_DEMO_PASSWORD!,
                })
              }
              disabled={isLoading}
              className="h-11 w-full cursor-pointer rounded-full border border-dashed border-[2px] border-rose-400 bg-rose-50/60 text-[13px] font-medium text-rose-700 transition-all duration-200 hover:border-blue-400 hover:bg-blue-100 hover:text-cyan-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <span className="flex items-center justify-center gap-2">
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Logging in...</span>
                  </>
                ) : (
                  <>
                    <PlayCircle className="h-4 w-4" />
                    <span>Try Demo Account</span>
                  </>
                )}
              </span>
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
};

// useSearchParams (for the ?email= prefill) must sit under a Suspense boundary.
export default function LoginPageWithSuspense() {
  return (
    <Suspense fallback={null}>
      <LoginPage />
    </Suspense>
  );
}
