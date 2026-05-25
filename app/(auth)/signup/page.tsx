"use client";
import Divider from "@/components/Divider";
import { Button } from "@/components/ui/button";
import registerUser from "@/services/authServices/apiRegister";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";

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
    <div className="min-h-screen flex flex-col items-center justify-center bg-white px-4 font-sans">
      {/* Logo Section */}
      <div className="my-8 flex items-center gap-2">
        <span className="text-2xl text-blue-900 font-bold tracking-tight">
          <Link href="/">Rebuzz</Link>
        </span>
      </div>

      {/* Header */}
      <div className="text-center max-w-md mb-4">
        <h1 className="text-[32px] font-bold leading-tight mb-4">
          Check out Rebuzz — it&apos;s free!
        </h1>
        <p className="text-gray-600 text-[20px] leading-relaxed">
          Rebuzz helps freelancers, consultants, and small businesses simplify
          their finances.
        </p>
      </div>

      {/* Form Container */}
      <div className="w-full max-w-100">
        <form className="space-y-2" onSubmit={handleSubmit(onSubmit)}>
          {/* Full Name */}
          <div>
            <label
              className="block text-gray-700 text-sm font-bold mb-2"
              htmlFor="fullName"
            >
              Full Name
            </label>
            <input
              type="text"
              id="fullName"
              className="w-full px-2 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
              {...register("fullName", {
                required: "Name is required",
              })}
            />
            {errors.fullName && (
              <p className="mt-1 text-sm text-red-500">
                {errors.fullName.message}
              </p>
            )}
          </div>

          {/* Email */}
          <div>
            <label
              className="block text-gray-700 text-sm font-bold mb-2"
              htmlFor="email"
            >
              Email
            </label>
            <input
              id="email"
              type="email"
              className="w-full px-2 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
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

          {/* Phone Number */}
          <div>
            <label
              className="block text-gray-700 text-sm font-bold mb-2"
              htmlFor="phone"
            >
              Phone Number
            </label>
            <input
              id="phone"
              type="tel"
              className="w-full px-2 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
              {...register("phone", {
                required: "Phone number is required",
                pattern: {
                  value: /^[0-9+\-\s()]{7,15}$/,
                  message: "Enter a valid phone number",
                },
              })}
            />
            {errors.phone && (
              <p className="mt-1 text-sm text-red-500">
                {errors.phone.message}
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
                  minLength: {
                    value: 8,
                    message: "Password must be at least 8 characters",
                  },
                })}
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-blue-600 text-sm font-bold hover:underline"
              >
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>
            {errors.password ? (
              <p className="mt-2 text-sm text-red-500">
                {errors.password.message}
              </p>
            ) : passwordValue.length >= 8 && passwordHints.length > 0 ? (
              <p className="mt-2 text-[14px] text-amber-600">
                Your password is valid, but adding {passwordHints.join(" and ")}{" "}
                would make it stronger.
              </p>
            ) : (
              <p className="mt-2 text-[14px] text-gray-600">
                At least 8 characters, but longer is better.
              </p>
            )}
          </div>

          {/* Confirm Password */}
          <div>
            <label
              className="block text-sm text-gray-700 font-bold mb-2"
              htmlFor="cpass"
            >
              Confirm Password
            </label>
            <div className="relative">
              <input
                id="cpass"
                type={showConfirmPassword ? "text" : "password"}
                className="w-full px-2 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                {...register("cpass", {
                  required: "Please confirm your password",
                  validate: (value) =>
                    value === passwordValue || "Passwords do not match",
                })}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword((prev) => !prev)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-blue-600 text-sm font-bold hover:underline"
              >
                {showConfirmPassword ? "Hide" : "Show"}
              </button>
            </div>
            {errors.cpass ? (
              <p className="mt-1 text-sm text-red-500">
                {errors.cpass.message}
              </p>
            ) : (
              <p className="mt-1 text-[14px] text-gray-600">
                Must match your password.
              </p>
            )}
          </div>

          {/* Redeem Code (optional) */}
          <div>
            <label
              className="block text-gray-700 text-sm font-bold mb-2"
              htmlFor="redeemCode"
            >
              Redeem Code{" "}
              <span className="text-gray-400 font-normal">(optional)</span>
            </label>
            <input
              type="text"
              id="redeemCode"
              className="w-full px-2 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
              {...register("redeemCode")}
            />
          </div>

          <Link
            href="/login"
            className="block text-blue-800 font-semibold py-1 text-sm"
          >
            Already have an account?
          </Link>

          {/* Primary CTA */}
          {serverError && (
            <p className="text-sm text-red-500 text-center">{serverError}</p>
          )}

          <Button
            type="submit"
            disabled={isLoading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-5 text-[16px] rounded-full transition-colors duration-200"
          >
            {isLoading ? "Creating account..." : "Get started"}
          </Button>
        </form>

        <Divider />

        {/* Social Logins */}
        <div className="space-y-3">
          <Button className="w-full flex items-center justify-center gap-3 border border-gray-900 py-5 rounded-full hover:bg-blue-200 hover:text-blue-800 hover:border-blue-900 bg-gray-50 text-gray-700 transition-colors text-[16px] font-semibold">
            Sign up with Google
          </Button>
          <Button className="w-full flex items-center justify-center gap-3 border border-gray-900 bg-gray-900 text-gray-100 py-5 rounded-full hover:bg-blue-200 hover:text-blue-800 hover:border-blue-900 transition-colors font-semibold text-[16px]">
            Sign up with Apple
          </Button>
        </div>
      </div>
    </div>
  );
};

export default SignUpPage;
