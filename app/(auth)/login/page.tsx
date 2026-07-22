"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import Divider from "@/components/Divider";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import loginUser from "@/services/authServices/apiLogin";
import ServerEnvBadge from "@/components/ServerEnvBadge";

type LoginFormValues = {
  email: string;
  password: string;
};

const LoginPage = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>();

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
      setServerError(result.error);
      return;
    }

    // Invalidate cached business data so the new user's business is fetched
    await queryClient.invalidateQueries({ queryKey: ["business-profile"] });

    await checkBusinessAndRedirect();
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white px-6 font-sans">
      {/* Logo Section */}
      <div className="mb-6 md:mb-10 flex flex-col items-center gap-3">
        <span className="text-2xl text-blue-900 font-bold tracking-tight">
          <Link href="/">Rebuzz</Link>
        </span>
        <ServerEnvBadge />
      </div>

      {/* Header */}
      <div className="text-center max-w-md mb-6 md:mb-8">
        <h1 className="text-[24px] sm:text-[28px] md:text-[32px] font-bold leading-tight mb-3">
          Log back into your account.
        </h1>
        <p className="text-gray-600 text-[14px] sm:text-[16px] md:text-[20px] leading-relaxed">
          Welcome back, <br />
          Your customers are waiting for you.
        </p>
      </div>

      {/* Form Container */}
      <div className="w-full max-w-sm">
        <form className="space-y-5" onSubmit={handleSubmit(onSubmit)}>
          {/* Email */}
          <div>
            <label
              htmlFor="email"
              className="block text-gray-700 text-sm font-bold mb-1.5"
            >
              Email
            </label>
            <input
              id="email"
              type="email"
              className="w-full px-3.5 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-sm"
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
              className="block text-sm text-gray-700 font-bold mb-1.5"
              htmlFor="password"
            >
              Password
            </label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                className="w-full px-3.5 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-sm"
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
            <div className="mt-1.5">
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
            <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3">
              <p className="text-xs text-red-600 text-center font-medium">
                {serverError}
              </p>
            </div>
          )}

          <Button
            type="submit"
            disabled={isLoading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 text-sm rounded-full transition-colors duration-200 disabled:opacity-60 cursor-pointer"
          >
            {isLoading ? "Logging in..." : "Log In"}
          </Button>

          <Divider />

          <Button
            type="button"
            onClick={() => router.push("/signup")}
            className="w-full border border-gray-300 bg-gray-50 text-gray-700 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-300 font-semibold py-2.5 text-sm rounded-full transition-colors duration-200 cursor-pointer"
          >
            Create a New Account
          </Button>
        </form>

        {/* Back to home */}
        <div className="mt-6 text-center">
          <Link
            href="/"
            className="text-xs text-gray-500 hover:text-blue-600 transition-colors font-medium inline-flex items-center gap-1"
          >
            <ArrowLeft className="h-3 w-3" />
            Back to home
          </Link>
        </div>

        {/* Demo button — for development only */}
        <div className="mt-4 pt-6 border-t border-dashed border-gray-200 text-center">
          <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-3 font-semibold">
            Quick Demo Access
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
            className="w-full border-2 border-amber-300 bg-amber-50 text-amber-700 hover:bg-amber-100 hover:text-amber-800 font-semibold py-2.5 text-sm rounded-full transition-colors duration-200 disabled:opacity-60 cursor-pointer"
          >
            {isLoading ? "Logging in..." : "🔑 Demo Login"}
          </Button>
          <p className="text-[10px] text-gray-400 mt-2">
            One-click login with demo credentials
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
