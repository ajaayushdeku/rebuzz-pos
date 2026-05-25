"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";

type SignupFormValues = {
  fullName: string;
  email: string;
  phone: string;
  password: string;
  cpass: string;
  redeemCode?: string;
};
export default function Page() {
  //   refactor this later

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<SignupFormValues>();

  const [isLoading, setIsLoading] =
    useState(false);

  const [serverError, setServerError] = useState<
    string | null
  >(null);
  return (
    <div className="px-8 py-8">
      <h1 className="text-red-500">
        PAGE UNDER CONSTRUCTION
      </h1>
      <div className="py-2 border-b-2 border-gray-400">
        <h1 className="font-bold text-2xl  text-blue-700">
          PERSONAL INFORMATION
        </h1>
        <p className="text-gray-600 text-xl ">
          Manage your personal information.
        </p>
      </div>

      {/* For changing passwords */}
      <div className="py-4">
        <div className="w-full max-w-100">
          <form
            className="space-y-2"
            // onSubmit={handleSubmit(onSubmit)}
          >
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
                    value:
                      /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                    message:
                      "Enter a valid email address",
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
                  required:
                    "Phone number is required",
                  pattern: {
                    value: /^[0-9+\-\s()]{7,15}$/,
                    message:
                      "Enter a valid phone number",
                  },
                })}
              />
              {errors.phone && (
                <p className="mt-1 text-sm text-red-500">
                  {errors.phone.message}
                </p>
              )}
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-5 text-[16px] rounded-full transition-colors duration-200"
            >
              {isLoading
                ? "Updating..."
                : "Update Information"}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
