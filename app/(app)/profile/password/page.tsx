"use client";

import { Button } from "@/components/ui/button";
import { useState } from "react";
import { useForm } from "react-hook-form";

type PasswordFormValues = {
  oldPassword: string;
  newPassword: string;
  cpass: string;
};

export default function Page() {
  function getPasswordHints(
    password: string,
  ): string[] {
    const hints: string[] = [];
    if (!/[A-Z]/.test(password))
      hints.push("a capital letter");
    if (!/[0-9]/.test(password))
      hints.push("a number");
    return hints;
  }

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<PasswordFormValues>();

  const [isLoading, setIsLoading] =
    useState(false);
  const [showOldPassword, setShowOldPassword] =
    useState(false);
  const [showNewPassword, setShowNewPassword] =
    useState(false);
  const [
    showConfirmPassword,
    setShowConfirmPassword,
  ] = useState(false);
  const [serverError, setServerError] = useState<
    string | null
  >(null);

  const newPasswordValue = watch(
    "newPassword",
    "",
  );
  const passwordHints = getPasswordHints(
    newPasswordValue,
  );

  const onSubmit = (data: PasswordFormValues) => {
    setIsLoading(true);
    setServerError(null);
    // wire up API call
    console.log(data);
    setIsLoading(false);
  };

  return (
    <div className="px-8 py-8">
      <h1 className="text-red-500">
        PAGE UNDER CONSTRUCTION
      </h1>
      <div className="py-2 border-b-2 border-gray-400">
        <h1 className="font-bold text-2xl text-blue-700">
          PASSWORDS & SECURITY
        </h1>
        <p className="text-gray-600 text-xl ">
          Manage your passwords and account
          security.
        </p>
      </div>

      {/* Change Password */}
      <div className="py-4">
        <h1 className="font-semibold text-xl">
          Change Password
        </h1>
        <p className="text-gray-400">
          Hint: Strong passwords are a mix of
          letters, numbers, special characters and
          capitalized letters
        </p>
        <div className="w-full max-w-100">
          <form
            className="space-y-2"
            onSubmit={handleSubmit(onSubmit)}
          >
            {/* Old Password */}
            <div>
              <label
                className="block text-sm text-gray-700 font-bold mb-2"
                htmlFor="oldPassword"
              >
                Old Password
              </label>
              <div className="relative">
                <input
                  id="oldPassword"
                  type={
                    showOldPassword
                      ? "text"
                      : "password"
                  }
                  className="w-full px-2 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                  {...register("oldPassword", {
                    required:
                      "Old password is required",
                  })}
                />
                <button
                  type="button"
                  onClick={() =>
                    setShowOldPassword(
                      (prev) => !prev,
                    )
                  }
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-blue-600 text-sm font-bold hover:underline"
                >
                  {showOldPassword
                    ? "Hide"
                    : "Show"}
                </button>
              </div>
              {errors.oldPassword && (
                <p className="mt-2 text-sm text-red-500">
                  {errors.oldPassword.message}
                </p>
              )}
            </div>

            {/* New Password */}
            <div>
              <label
                className="block text-sm text-gray-700 font-bold mb-2"
                htmlFor="newPassword"
              >
                New Password
              </label>
              <div className="relative">
                <input
                  id="newPassword"
                  type={
                    showNewPassword
                      ? "text"
                      : "password"
                  }
                  className="w-full px-2 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                  {...register("newPassword", {
                    required:
                      "New password is required",
                    minLength: {
                      value: 8,
                      message:
                        "Password must be at least 8 characters",
                    },
                  })}
                />
                <button
                  type="button"
                  onClick={() =>
                    setShowNewPassword(
                      (prev) => !prev,
                    )
                  }
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-blue-600 text-sm font-bold hover:underline"
                >
                  {showNewPassword
                    ? "Hide"
                    : "Show"}
                </button>
              </div>
              {errors.newPassword ? (
                <p className="mt-2 text-sm text-red-500">
                  {errors.newPassword.message}
                </p>
              ) : newPasswordValue.length >= 8 &&
                passwordHints.length > 0 ? (
                <p className="mt-2 text-[14px] text-amber-600">
                  Your password is valid, but
                  adding{" "}
                  {passwordHints.join(" and ")}{" "}
                  would make it stronger.
                </p>
              ) : (
                <p className="mt-2 text-[14px] text-gray-600">
                  At least 8 characters, but
                  longer is better.
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
                  type={
                    showConfirmPassword
                      ? "text"
                      : "password"
                  }
                  className="w-full px-2 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                  {...register("cpass", {
                    required:
                      "Please confirm your password",
                    validate: (value) =>
                      value ===
                        newPasswordValue ||
                      "Passwords do not match",
                  })}
                />
                <button
                  type="button"
                  onClick={() =>
                    setShowConfirmPassword(
                      (prev) => !prev,
                    )
                  }
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-blue-600 text-sm font-bold hover:underline"
                >
                  {showConfirmPassword
                    ? "Hide"
                    : "Show"}
                </button>
              </div>
              {errors.cpass ? (
                <p className="mt-1 text-sm text-red-500">
                  {errors.cpass.message}
                </p>
              ) : (
                <p className="mt-1 text-[14px] text-gray-600">
                  Must match your new password.
                </p>
              )}
            </div>

            {serverError && (
              <p className="text-sm text-red-500 text-center">
                {serverError}
              </p>
            )}

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-5 text-[16px] rounded-full transition-colors duration-200"
            >
              {isLoading
                ? "Updating password..."
                : "Update Password"}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
