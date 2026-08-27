"use client";
// import Divider from "@/components/Divider";
import { ArrowLeft, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import registerUser from "@/services/authServices/apiRegister";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import ServerEnvBadge from "@/components/ServerEnvBadge";

type SignupFormValues = {
  fullName: string;
  email: string;
  phone: string;
  password: string;
  cpass: string;
  redeemCode?: string;
};

// Helper function to provide password strength hints
const getPasswordHints = (password: string): string[] => {
  const hints: string[] = [];
  if (!/[A-Z]/.test(password)) hints.push("a capital letter");
  if (!/[0-9]/.test(password)) hints.push("a number");
  return hints;
};

// need to ask for clarification later
const BUSINESS_SLUG = process.env.NEXT_PUBLIC_BUSINESS_SLUG ?? "java";

/** The input style shared by every field, so they always agree. */
const INPUT_CLASS =
  "h-12 w-full rounded-xl border border-gray-300 bg-white px-4 text-[15px] text-gray-900 outline-none transition-colors placeholder:text-gray-400 focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10";

const SignUpPage = () => {
  const [serverError, setServerError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const {
    register,
    handleSubmit,
    watch, // watch is used to monitor the password field for real-time validation hints
    formState: { errors },
  } = useForm<SignupFormValues>();

  const router = useRouter();

  // Watch the password field for real-time validation hints
  const passwordValue = watch("password", "");
  const passwordHints = getPasswordHints(passwordValue);

  const onSubmit = async (signupData: SignupFormValues) => {
    setServerError(null);
    setIsLoading(true);

    const result = await registerUser(BUSINESS_SLUG, {
      name: signupData.fullName,
      email: signupData.email,
      phone: signupData.phone,
      password: signupData.password,
      confirm_password: signupData.cpass,
    });

    setIsLoading(false);

    if (!result.success) {
      setServerError(result.error);
      return;
    }

    sessionStorage.setItem("pendingVerifyEmail", signupData.email);
    router.push("/signup/verify");
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

      <main className="relative flex flex-col items-center justify-center mt-4 px-6 pb-14">
        <div className="w-full max-w-4xl">
          {/* Picks up the same step chip the verify screen uses a screen later,
              so come the two halves of signup read as one flow. */}
          <span className="mb-1 inline-flex items-center gap-1 pt-1  pr-3">
            <span className="flex h-6 w-6 items-center justify-center">
              <UserPlus size={16} className="text-blue-600" strokeWidth={2.5} />
            </span>
            <span className=" text-[11px] font-semibold uppercase tracking-[0.2em] text-blue-600">
              Step 1 of 2 &middot; Create account
            </span>
          </span>

          <h1 className="text-2xl font-bold leading-tight tracking-tight text-gray-900 sm:text-3xl">
            Create your account
          </h1>
          <p className="mt-1.5 text-sm leading-relaxed text-gray-500">
            Free to start, and no card needed — you can be selling in minutes.
          </p>

          {/* Two columns of fields from `sm` up, one column on small screens. */}
          <form
            className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2"
            onSubmit={handleSubmit(onSubmit)}
          >
            {/* Full Name — full width across the grid on larger screens. */}
            <div className="sm:col-span-2">
              <label
                className="mb-1.5 block text-[13px] font-medium text-gray-700"
                htmlFor="fullName"
              >
                Full Name
              </label>
              <input
                type="text"
                id="fullName"
                placeholder="Enter your full name"
                className={INPUT_CLASS}
                {...register("fullName", {
                  required: "Name is required",
                })}
              />
              {errors.fullName && (
                <p className="mt-1 text-xs text-red-500">
                  {errors.fullName.message}
                </p>
              )}
            </div>

            {/* Email */}
            <div>
              <label
                className="mb-1.5 block text-[13px] font-medium text-gray-700"
                htmlFor="email"
              >
                Email
              </label>
              <input
                id="email"
                type="email"
                placeholder="Enter your email"
                className={INPUT_CLASS}
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

            {/* Phone Number */}
            <div>
              <label
                className="mb-1.5 block text-[13px] font-medium text-gray-700"
                htmlFor="phone"
              >
                Phone Number
              </label>
              <input
                id="phone"
                type="tel"
                placeholder="Enter your phone number"
                className={INPUT_CLASS}
                {...register("phone", {
                  required: "Phone number is required",
                  pattern: {
                    value: /^[0-9+\-\s()]{7,15}$/,
                    message: "Enter a valid phone number",
                  },
                })}
              />
              {errors.phone && (
                <p className="mt-1 text-xs text-red-500">
                  {errors.phone.message}
                </p>
              )}
            </div>

            {/* Password */}
            <div>
              <label
                className="mb-1.5 block text-[13px] font-medium text-gray-700"
                htmlFor="password"
              >
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Create a password (min 8 chars)"
                  className={`${INPUT_CLASS} pr-20`}
                  {...register("password", {
                    required: "Password is required",
                    minLength: {
                      value: 8,
                      message: "Password must be at least 8 characters",
                    },
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
              {errors.password ? (
                <p className="mt-1 text-xs text-red-500">
                  {errors.password.message}
                </p>
              ) : passwordValue.length >= 8 && passwordHints.length > 0 ? (
                <p className="mt-1 text-xs text-amber-600">
                  Your password is valid, but adding{" "}
                  {passwordHints.join(" and ")} would make it stronger.
                </p>
              ) : (
                <p className="mt-1 text-xs text-gray-500">
                  At least 8 characters, but longer is better.
                </p>
              )}
            </div>

            {/* Confirm Password */}
            <div>
              <label
                className="mb-1.5 block text-[13px] font-medium text-gray-700"
                htmlFor="cpass"
              >
                Confirm Password
              </label>
              <div className="relative">
                <input
                  id="cpass"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Re-enter your password"
                  className={`${INPUT_CLASS} pr-20`}
                  {...register("cpass", {
                    required: "Please confirm your password",
                    validate: (value) =>
                      value === passwordValue || "Passwords do not match",
                  })}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword((prev) => !prev)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-blue-600 text-xs font-semibold hover:underline cursor-pointer"
                >
                  {showConfirmPassword ? "Hide" : "Show"}
                </button>
              </div>
              {errors.cpass ? (
                <p className="mt-1 text-xs text-red-500">
                  {errors.cpass.message}
                </p>
              ) : (
                <p className="mt-1 text-xs text-gray-500">
                  Must match your password.
                </p>
              )}
            </div>

            {/* Redeem Code (optional) — full width across the grid on larger
                screens. */}
            <div className="sm:col-span-2">
              <label
                className="mb-1.5 block text-[13px] font-medium text-gray-700"
                htmlFor="redeemCode"
              >
                Redeem Code{" "}
                <span className="text-gray-400 font-normal">(optional)</span>
              </label>
              <input
                type="text"
                id="redeemCode"
                placeholder="Enter redeem code"
                className={INPUT_CLASS}
                {...register("redeemCode")}
              />
            </div>

            {/* Server error */}
            {serverError && (
              <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 sm:col-span-2">
                <p className="text-[13px] leading-snug text-red-600">
                  {serverError}
                </p>
              </div>
            )}

            <Button
              type="submit"
              disabled={isLoading}
              className="h-12 w-full cursor-pointer rounded-full bg-blue-600 text-[15px] font-semibold text-white shadow-lg shadow-blue-600/25 transition-all hover:bg-blue-700 hover:shadow-blue-600/35 disabled:cursor-not-allowed disabled:opacity-60 disabled:shadow-none sm:col-span-2"
            >
              {isLoading ? "Creating account..." : "Get started"}
            </Button>
          </form>

          <div className="mt-4 text-center">
            <p className="text-xs text-gray-500">
              Already have an account?{" "}
              <Link
                href="/login"
                className="font-semibold text-blue-600 transition-colors hover:text-blue-700"
              >
                Log in
              </Link>
            </p>
          </div>

          <div className="mt-4 text-center">
            <Link
              href="/"
              className="inline-flex items-center gap-1 text-xs text-gray-400 transition-colors hover:text-gray-600"
            >
              <ArrowLeft className="h-3 w-3" />
              Back to home
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
};

export default SignUpPage;
