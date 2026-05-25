"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import Divider from "@/components/Divider";
import Link from "next/link";
import loginUser from "@/services/authServices/apiLogin";

type LoginFormValues = {
  email: string;
  password: string;
};

const LoginPage = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>();

  const onSubmit = async (loginData: LoginFormValues) => {
    setServerError(null);
    setIsLoading(true);

    const result = await loginUser(
      // BUSINESS_SLUG,
      {
        email_or_phone: loginData.email,
        password: loginData.password,
        deviceToken: "",
      },
    );

    setIsLoading(false);

    if (!result.success) {
      setServerError(result.error);
      return;
    }

    router.push("/dashboard");
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white px-4 font-sans">
      {/* Logo Section */}
      <div className="my-4 md:my-8 flex items-center gap-2">
        <span className="text-2xl text-blue-900 font-bold tracking-tight">
          <Link href="/">Rebuzz</Link>
        </span>
      </div>

      {/* Header */}
      <div className="text-center max-w-md mb-4">
        <h1 className="text-[28px] md:text-[32px] font-bold leading-tight mb-4">
          Log back into your account.
        </h1>
        <p className="text-gray-600 text-[16px] md:text-[20px] leading-relaxed">
          Welcome back, <br />
          Your customers are waiting for you.
        </p>
      </div>

      {/* Form Container */}
      <div className="w-full max-w-100">
        <form className="space-y-2" onSubmit={handleSubmit(onSubmit)}>
          {/* Email */}
          <div>
            <label
              htmlFor="email"
              className="block text-gray-700 text-sm font-bold mb-2"
            >
              Email
            </label>
            <input
              id="email"
              type="email"
              className="w-full px-2 py-2 rounded-lg border border-gray-300 focus:ring-2  focus:ring-blue-500 focus:border-transparent outline-none transition-all"
              {...register("email", {
                required: "Email is required",
                pattern: {
                  value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                  message: "Enter a valid email address",
                },
              })}
            />
            {errors.email && (
              <p className="mt-1 text-sm text-red-500">
                {errors.email.message}
              </p>
            )}
          </div>

          {/* Password */}
          <div>
            <label
              className="block text-sm text-gray-700 font-bold mb-2"
              htmlFor="password"
            >
              Password
            </label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                className="w-full px-2 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                {...register("password", {
                  required: "Password is required",
                })}
              />

              {/* Show /Hide Password */}
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-blue-600 text-sm font-bold hover:underline cursor-pointer"
              >
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>
            {errors.password && (
              <p className="mt-1 text-sm text-red-500">
                {errors.password.message}
              </p>
            )}
            <Link
              href="/forgot-password"
              className="py-4 text-sm text-gray-600 hover:text-blue-600"
            >
              Forgot your password?
            </Link>
          </div>

          {serverError && (
            <p className="text-sm text-red-500 text-center">{serverError}</p>
          )}

          <Button
            type="submit"
            disabled={isLoading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-5 text-[16px] rounded-full transition-colors duration-200 disabled:opacity-60 cursor-pointer"
          >
            {isLoading ? "Logging in..." : "Log In"}
          </Button>

          <Divider />

          <Button
            type="button"
            onClick={() => router.push("/signup")}
            className="w-full border border-gray-300 bg-gray-50 text-gray-700 hover:bg-blue-200 hover:text-blue-800 hover:border-blue-900 font-bold py-5 text-[16px] rounded-full transition-colors duration-200 cursor-pointer"
          >
            Create a New Account
          </Button>
        </form>

        {/* Remove later */}
        <div className="p-4 flex items-center justify-center text-red-600">
          <Button
            type="button"
            onClick={() =>
              onSubmit({
                email: process.env.NEXT_PUBLIC_DEMO_EMAIL!,
                password: process.env.NEXT_PUBLIC_DEMO_PASSWORD!,
              })
            }
            disabled={isLoading}
            className="border border-red-300 bg-gray-50 text-red-600 hover:bg-red-200 hover:text-red-800 hover:border-red-900 font-bold py-5 text-[14px] rounded-full transition-colors duration-200 disabled:opacity-60 cursor-pointer"
          >
            {isLoading ? "Logging in..." : "Demo: For development only"}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
