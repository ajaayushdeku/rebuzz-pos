"use client";

import { useQuery } from "@tanstack/react-query";
import { User, Mail, Phone, Loader2, Shield } from "lucide-react";

import { fetchUserData } from "@/services/apiProfile";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import PageHeader from "@/components/ui/PageHeader";

export default function ProfileSettingsPage() {
  const router = useRouter();

  const { data: profile, isLoading } = useQuery({
    queryKey: ["profile"],
    queryFn: fetchUserData,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 px-6 py-8 md:px-10 flex items-center justify-center dark:bg-white/5">
        <Loader2 className="h-6 w-6 animate-spin text-blue-500 dark:text-[#7ba2e3]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 px-6 py-8 md:px-10 dark:bg-white/5">
      <div className="max-w-lg mx-auto">
        <PageHeader
          title="Profile Settings"
          subtitle="View your account information"
          actions={
            <Button
              onClick={() => router.push("/settings/change-password")}
              variant="outline"
              className="rounded-lg flex items-center gap-2 border-gray-300 text-gray-700 dark:border-white/20 dark:text-[#c3ccdc]"
            >
              <Shield className="h-4 w-4" />
              Change Password
            </Button>
          }
        />

        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden dark:border-white/15 dark:bg-[#161d2e]">
          <div className="px-6 pt-6 pb-4 flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-blue-50 flex items-center justify-center shrink-0 border-2 border-blue-100 dark:border-blue-400/20 dark:bg-blue-400/10">
              <User className="h-7 w-7 text-blue-600 dark:text-blue-300" />
            </div>
            <div className="min-w-0">
              <h2 className="text-xl font-bold text-gray-900 truncate dark:text-[#e8ecf4]">
                {profile?.name || "User"}
              </h2>
              <p className="text-sm text-gray-500 dark:text-[#9aa6bd]">
                Administrator
              </p>
            </div>
          </div>
          <div className="border-t border-gray-100 dark:border-white/10" />
          <div className="px-6 py-4 space-y-4">
            <div className="flex items-center gap-3 text-sm">
              <Mail className="h-4 w-4 text-gray-400 shrink-0 dark:text-[#9aa6bd]" />
              <span className="text-gray-500 w-24 shrink-0 dark:text-[#9aa6bd]">
                Email
              </span>
              <span className="text-gray-900 font-medium dark:text-[#e8ecf4]">
                {profile?.email || "—"}
              </span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <Phone className="h-4 w-4 text-gray-400 shrink-0 dark:text-[#9aa6bd]" />
              <span className="text-gray-500 w-24 shrink-0 dark:text-[#9aa6bd]">
                Phone
              </span>
              <span className="text-gray-900 font-medium dark:text-[#e8ecf4]">
                {profile?.phone || "—"}
              </span>
            </div>
          </div>
        </div>

        <div className="mt-6 p-5 rounded-xl bg-blue-50 border border-blue-100 flex items-start gap-3 dark:border-blue-400/20 dark:bg-blue-400/10">
          <Shield className="h-5 w-5 text-blue-600 mt-0.5 shrink-0 dark:text-blue-300" />
          <div>
            <p className="text-sm font-semibold text-blue-800 dark:text-blue-200">
              Account Security
            </p>
            <p className="text-xs text-blue-600 mt-0.5 dark:text-blue-300">
              Keep your account secure by regularly updating your password.
            </p>
            <Button
              onClick={() => router.push("/settings/change-password")}
              className="mt-3 bg-blue-600 hover:bg-blue-700 dark:hover:bg-blue-500 text-white text-xs px-4 py-1.5 rounded-lg"
            >
              Change Password
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
