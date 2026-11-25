"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import Link from "next/link";
import Image from "next/image";

import {
  ChevronDown,
  HelpCircle,
  Loader2,
  LogOut,
  Plus,
  Settings,
  User2,
  X,
} from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { Button } from "@/components/ui/button";
import { Badge } from "../ui/badge";
import { planBadge } from "@/lib/config/plans";
import { useSubscriptionType } from "@/hooks/useSubscriptionType";
import LogoutModal from "../signup/LogoutModal";

interface UserProps {
  initialBusinessName: string;
  businessLogo?: string | null;
}

type Account = {
  id: string;
  label: string;
  businessName: string | null;
  role: string | null;
  active: boolean;
};

const NAME_LIMIT = 8;

function shortName(name: string): string {
  const clean = name.trim();
  return clean.length > NAME_LIMIT ? `${clean.slice(0, NAME_LIMIT)}...` : clean;
}

function initials(text: string): string {
  const clean = text.trim();
  if (!clean) return "?";

  const namePart = clean.split("@")[0];
  const words = namePart.split(/[\s._-]+/).filter(Boolean);

  if (words.length >= 2) {
    return (words[0][0] + words[1][0]).toUpperCase();
  }

  return namePart.slice(0, 2).toUpperCase();
}

export default function User({ initialBusinessName, businessLogo }: UserProps) {
  const router = useRouter();
  const queryClient = useQueryClient();

  const [busyId, setBusyId] = useState<string | null>(null);
  const [loggingOut, setLoggingOut] = useState(false);
  const [loggingOutOpen, setLoggingOutOpen] = useState(false);

  const { subscriptionType } = useSubscriptionType();
  const plan = planBadge(subscriptionType);

  const { data: accounts = [] } = useQuery<Account[]>({
    queryKey: ["auth-accounts"],
    queryFn: async () => {
      const res = await fetch("/api/auth/accounts");

      if (!res.ok) return [];

      const json = await res.json();

      return Array.isArray(json.accounts) ? json.accounts : [];
    },
    staleTime: 60 * 1000,
    refetchOnWindowFocus: false,
  });

  const activeAccount = accounts.find((account) => account.active);
  const otherAccounts = accounts.filter((account) => !account.active);

  const handleSwitch = async (id: string) => {
    setBusyId(id);

    try {
      const res = await fetch("/api/auth/accounts/switch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });

      const json = await res.json().catch(() => ({}));

      if (json?.expired) {
        const email = encodeURIComponent(json.label ?? "");
        window.location.assign(`/login?add=1&email=${email}`);
        return;
      }

      if (json?.forbidden) {
        toast.error(json.error ?? "That account cannot use the POS.");
        setBusyId(null);
        return;
      }

      if (res.ok && json?.ok) {
        window.location.assign("/dashboard");
        return;
      }

      toast.error(json.error ?? "Unable to switch account.");
    } catch {
      toast.error("Something went wrong. Please try again.");
    }

    setBusyId(null);
  };

  const handleRemove = async (id: string) => {
    setBusyId(id);

    try {
      const res = await fetch("/api/auth/accounts/remove", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });

      const json = await res.json().catch(() => ({}));

      if (!res.ok) {
        toast.error(json.error ?? "Unable to remove account.");
        setBusyId(null);
        return;
      }

      if (json.signedOut) {
        window.location.assign("/login");
        return;
      }

      if (json.switchedTo && accounts.find((a) => a.id === id)?.active) {
        window.location.assign("/dashboard");
        return;
      }

      await queryClient.invalidateQueries({
        queryKey: ["auth-accounts"],
      });

      toast.success("Account removed.");
    } catch {
      toast.error("Unable to remove account.");
    }

    setBusyId(null);
  };

  const handleAddAccount = () => {
    router.push("/login?add=1");
  };

  const handleLogout = async () => {
    if (!activeAccount) {
      toast.error("Unable to identify the active account.");
      return;
    }

    setLoggingOut(true);

    try {
      const res = await fetch("/api/auth/accounts/remove", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: activeAccount.id }),
      });

      const json = await res.json().catch(() => ({}));

      if (!res.ok || !json.ok) {
        toast.error(json.error ?? "Unable to log out.");
        setLoggingOut(false);
        return;
      }

      if (json.signedOut) {
        window.location.assign("/login");
        return;
      }

      if (json.switchedTo) {
        window.location.assign("/dashboard");
        return;
      }

      await queryClient.invalidateQueries({
        queryKey: ["auth-accounts"],
      });

      setLoggingOut(false);
      setLoggingOutOpen(false);
    } catch {
      toast.error("Something went wrong. Please try again.");
      setLoggingOut(false);
    }
  };

  return (
    <div>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            className="group flex h-auto items-center gap-2 rounded-xl px-2 py-1.5 transition-colors hover:bg-gray-100 dark:hover:bg-white/[0.07]"
          >
            {businessLogo ? (
              <span className="h-8 w-8 shrink-0 overflow-hidden rounded-full border border-gray-200 bg-white dark:border-white/15">
                <Image
                  src={businessLogo}
                  alt="Business logo"
                  width={32}
                  height={32}
                  className="h-full w-full object-cover"
                />
              </span>
            ) : (
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#244074] text-[11px] font-semibold tracking-wide text-white">
                {initials(initialBusinessName)}
              </span>
            )}

            <span
              title={initialBusinessName}
              className="hidden max-w-[130px] truncate text-[13px] font-medium text-gray-700 sm:block dark:text-gray-200"
            >
              {shortName(initialBusinessName)}
            </span>

            <ChevronDown
              size={15}
              className="shrink-0 text-gray-400 transition-transform duration-200 group-data-[state=open]:rotate-180 dark:text-gray-500"
            />
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent
          align="end"
          sideOffset={10}
          className="w-[300px] overflow-hidden rounded-xl border border-gray-200 bg-white p-1.5 shadow-[0_12px_40px_rgba(0,0,0,0.12)] dark:border-white/10 dark:bg-[#171e2b] dark:shadow-[0_12px_40px_rgba(0,0,0,0.35)]"
        >
          {/* Active account header */}
          <div className="px-2.5 pb-3 pt-2">
            <div className="flex items-center gap-3">
              {businessLogo ? (
                <div className="h-11 w-11 shrink-0 overflow-hidden rounded-full border border-gray-200 bg-white dark:border-white/10">
                  <Image
                    src={businessLogo}
                    alt="Business logo"
                    width={44}
                    height={44}
                    className="h-full w-full object-cover"
                  />
                </div>
              ) : (
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#244074] text-sm font-semibold text-white">
                  {initials(initialBusinessName)}
                </div>
              )}

              <div className="min-w-0 flex-1">
                <p className="truncate text-[13px] font-semibold text-gray-900 dark:text-gray-100">
                  {initialBusinessName}
                </p>

                {activeAccount?.label && (
                  <p className="mt-0.5 truncate text-[11px] text-gray-500 dark:text-gray-400">
                    {activeAccount.label}
                  </p>
                )}

                <div className="mt-1.5">
                  <Badge
                    variant="secondary"
                    className={`h-[19px] rounded-md px-1.5 text-[9px] font-semibold tracking-wide ${plan.className}`}
                  >
                    {plan.label}
                  </Badge>
                </div>
              </div>

              <div className="flex shrink-0 items-center gap-1 rounded-full bg-emerald-50 px-2 py-1 text-[9px] font-semibold text-emerald-700 dark:bg-emerald-400/10 dark:text-emerald-400">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                Active
              </div>
            </div>
          </div>

          {/* Account switcher */}
          {otherAccounts.length > 0 && (
            <>
              <DropdownMenuSeparator className="mx-1 bg-gray-100 dark:bg-white/10" />

              <div className="px-2.5 pb-1 pt-2">
                <p className="text-[10px] font-semibold uppercase tracking-[0.09em] text-gray-400 dark:text-gray-500">
                  Switch account
                </p>
              </div>

              <div className="max-h-52 overflow-y-auto">
                {otherAccounts.map((acc) => (
                  <DropdownMenuItem
                    key={acc.id}
                    className="group/account flex cursor-pointer items-center gap-2.5 rounded-lg px-2.5 py-2 focus:bg-gray-100 dark:focus:bg-white/[0.07]"
                    onSelect={(e) => {
                      e.preventDefault();
                      if (!busyId) handleSwitch(acc.id);
                    }}
                  >
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gray-100 text-[10px] font-semibold text-gray-600 dark:bg-white/[0.08] dark:text-gray-300">
                      {initials(acc.businessName || acc.label)}
                    </span>

                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[12px] font-medium text-gray-800 dark:text-gray-200">
                        {acc.businessName || acc.label}
                      </p>

                      <p className="mt-0.5 truncate text-[10px] text-gray-400 dark:text-gray-500">
                        {acc.businessName ? acc.label : acc.role || "Account"}
                      </p>
                    </div>

                    {busyId === acc.id ? (
                      <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin text-gray-400" />
                    ) : (
                      <button
                        type="button"
                        title="Remove account"
                        aria-label={`Remove ${acc.businessName || acc.label}`}
                        disabled={!!busyId}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemove(acc.id);
                        }}
                        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-gray-400 opacity-0 transition-all hover:bg-red-50 hover:text-red-500 group-hover/account:opacity-100 focus:opacity-100 disabled:pointer-events-none dark:hover:bg-red-400/10 dark:hover:text-red-400"
                      >
                        <X size={13} />
                      </button>
                    )}
                  </DropdownMenuItem>
                ))}
              </div>
            </>
          )}

          {/* Add account */}
          <DropdownMenuSeparator className="mx-1 bg-gray-100 dark:bg-white/10" />

          <DropdownMenuItem
            className="cursor-pointer gap-2.5 rounded-lg px-2.5 py-2 text-gray-600 focus:bg-gray-100 dark:text-gray-300 dark:focus:bg-white/[0.07]"
            onSelect={(e) => {
              e.preventDefault();
              handleAddAccount();
            }}
          >
            <span className="flex h-7 w-7 items-center justify-center rounded-lg border border-dashed border-gray-300 text-gray-500 dark:border-white/20 dark:text-gray-400">
              <Plus size={14} />
            </span>
            <span className="text-[12px] font-medium">Add another account</span>
          </DropdownMenuItem>

          {/* Navigation */}
          <DropdownMenuSeparator className="mx-1 bg-gray-100 dark:bg-white/10" />

          <div className="space-y-0.5 py-1">
            <DropdownMenuItem
              asChild
              className="cursor-pointer gap-2.5 rounded-lg px-2.5 py-2 text-gray-600 focus:bg-gray-100 dark:text-gray-300 dark:focus:bg-white/[0.07]"
            >
              <Link href="/settings/business">
                <User2 size={15} className="text-gray-400" />
                <span className="text-[12px] font-medium">Profile</span>
              </Link>
            </DropdownMenuItem>

            <DropdownMenuItem
              className="cursor-pointer gap-2.5 rounded-lg px-2.5 py-2 text-gray-600 focus:bg-gray-100 dark:text-gray-300 dark:focus:bg-white/[0.07]"
              onSelect={(e) => {
                e.preventDefault();
                router.push("/settings/change-password");
              }}
            >
              <Settings size={15} className="text-gray-400" />
              <span className="text-[12px] font-medium">Settings</span>
            </DropdownMenuItem>

            <DropdownMenuItem
              className="flex cursor-pointer gap-2.5 rounded-lg px-2.5 py-2 text-gray-600 focus:bg-gray-100 sm:hidden dark:text-gray-300 dark:focus:bg-white/[0.07]"
              asChild
            >
              <Link href="/help">
                <HelpCircle size={15} className="text-gray-400" />
                <span className="text-[12px] font-medium">Help & Support</span>
              </Link>
            </DropdownMenuItem>
          </div>

          {/* Logout */}
          <DropdownMenuSeparator className="mx-1 bg-gray-100 dark:bg-white/10" />

          <DropdownMenuItem
            onSelect={(e) => {
              e.preventDefault();
              setLoggingOutOpen(true);
            }}
            disabled={loggingOut}
            className="cursor-pointer gap-2.5 rounded-lg px-2.5 py-2 text-red-600 focus:bg-red-50 focus:text-red-600 dark:text-red-400 dark:focus:bg-red-400/10 dark:focus:text-red-400"
          >
            {loggingOut ? (
              <Loader2 size={15} className="animate-spin" />
            ) : (
              <LogOut size={15} />
            )}
            <span className="text-[12px] font-medium">Log out</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <LogoutModal
        open={loggingOutOpen}
        onClose={() => setLoggingOutOpen(false)}
        loggingOut={loggingOut}
        onConfirm={handleLogout}
      />
    </div>
  );
}
