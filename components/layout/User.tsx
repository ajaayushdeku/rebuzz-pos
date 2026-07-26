"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";

import {
  ChevronDown,
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
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Badge } from "../ui/badge";

interface UserProps {
  initialBusinessName: string;
}

type Account = {
  id: string;
  label: string;
  businessName: string | null;
  role: string | null;
  active: boolean;
};

/** Two-letter initials from a label (email/phone/business name). */
function initials(text: string): string {
  const clean = text.trim();
  if (!clean) return "?";
  const namePart = clean.split("@")[0];
  const words = namePart.split(/[\s._-]+/).filter(Boolean);
  if (words.length >= 2) return (words[0][0] + words[1][0]).toUpperCase();
  return namePart.slice(0, 2).toUpperCase();
}

export default function User({ initialBusinessName }: UserProps) {
  const router = useRouter();

  const queryClient = useQueryClient();
  const [busyId, setBusyId] = useState<string | null>(null); // switching/removing
  const [loggingOut, setLoggingOut] = useState(false);

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

  const activeAccount = accounts.find((a) => a.active);
  const otherAccounts = accounts.filter((a) => !a.active);

  const handleSwitch = async (id: string) => {
    setBusyId(id);
    try {
      const res = await fetch("/api/auth/accounts/switch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      const json = await res.json().catch(() => ({}));

      // The saved token expired — re-authenticate this account instead.
      if (json?.expired) {
        const email = encodeURIComponent(json.label ?? "");
        window.location.assign(`/login?add=1&email=${email}`);
        return;
      }

      if (res.ok && json?.ok) {
        // Hard-reload into the new session so server components + cached
        // queries all reflect the switched account.
        window.location.assign("/dashboard");
        return;
      }
    } catch {
      // fall through
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
      if (res.ok) {
        if (json.signedOut) {
          window.location.assign("/login");
          return;
        }
        if (json.switchedTo && accounts.find((a) => a.id === id)?.active) {
          // The active account was removed → session switched to another.
          window.location.assign("/dashboard");
          return;
        }
        await queryClient.invalidateQueries({ queryKey: ["auth-accounts"] });
      }
    } catch {
      // ignore
    }
    setBusyId(null);
  };

  const handleAddAccount = () => {
    router.push("/login?add=1");
  };

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      const res = await fetch("/api/auth/logout", { method: "POST" });
      if (res.ok) {
        window.location.assign("/login");
        return;
      }
    } catch (error) {
      console.error("Logout request failed", error);
    }
    setLoggingOut(false);
  };

  return (
    <div className="bg-blue-100 rounded-xl px-3 py-0.5">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            className="flex items-center gap-2 md:px-3 px-1"
          >
            <span className="font-medium text-gray-600">
              {initialBusinessName}{" "}
            </span>
            <Badge variant="secondary" className="hidden md:block">
              STARTER
            </Badge>
            <ChevronDown className="h-4 w-4 text-gray-600" />
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent align="end" className="w-64">
          {/* Active account */}
          <DropdownMenuLabel className="flex items-center gap-2.5 py-2">
            <span className="w-8 h-8 rounded-full bg-blue-600 text-white text-xs font-semibold flex items-center justify-center shrink-0">
              {initials(initialBusinessName)}
            </span>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-gray-800 truncate">
                {initialBusinessName}
              </p>
              {activeAccount && (
                <p className="text-[11px] text-gray-400 truncate">
                  {activeAccount.label}
                </p>
              )}
            </div>
          </DropdownMenuLabel>

          <DropdownMenuSeparator />

          {/* Other saved accounts — click to switch */}
          {otherAccounts.length > 0 && (
            <>
              <DropdownMenuLabel className="text-[10px] uppercase tracking-wide text-gray-400 font-medium py-1">
                Switch account
              </DropdownMenuLabel>
              <div className="max-h-56 overflow-y-auto">
                {otherAccounts.map((acc) => (
                  <DropdownMenuItem
                    key={acc.id}
                    className="cursor-pointer gap-2.5 py-2"
                    onSelect={(e) => {
                      e.preventDefault();
                      if (!busyId) handleSwitch(acc.id);
                    }}
                  >
                    <span className="w-7 h-7 rounded-full bg-gray-200 text-gray-600 text-[11px] font-semibold flex items-center justify-center shrink-0">
                      {initials(acc.businessName || acc.label)}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-medium text-gray-700 truncate">
                        {acc.businessName || acc.label}
                      </p>
                      <p className="text-[10px] text-gray-400 truncate">
                        {acc.businessName ? acc.label : (acc.role ?? "")}
                      </p>
                    </div>
                    {busyId === acc.id ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin text-gray-400 shrink-0" />
                    ) : (
                      <button
                        type="button"
                        title="Remove account"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemove(acc.id);
                        }}
                        className="p-1 rounded-md text-gray-300 hover:text-red-500 hover:bg-red-50 shrink-0"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </DropdownMenuItem>
                ))}
              </div>
              <DropdownMenuSeparator />
            </>
          )}

          {/* Add another account */}
          <DropdownMenuItem
            className="text-blue-600 cursor-pointer"
            onSelect={(e) => {
              e.preventDefault();
              handleAddAccount();
            }}
          >
            <Plus className="mr-2 h-4 w-4" />
            Add another account
          </DropdownMenuItem>

          <DropdownMenuSeparator />

          <DropdownMenuItem className="text-gray-600 cursor-pointer" asChild>
            <Link href="/settings/business" className="flex gap-2">
              <User2 className="mr-2 h-4 w-4" />
              Profile
            </Link>
          </DropdownMenuItem>

          <DropdownMenuItem
            className="text-gray-600 cursor-pointer"
            onClick={() => router.push("/settings/change-password")}
          >
            <Settings className="mr-2 h-4 w-4" />
            Settings
          </DropdownMenuItem>

          <DropdownMenuItem
            onSelect={(e) => {
              e.preventDefault();
              if (!loggingOut) handleLogout();
            }}
            className="text-red-600 cursor-pointer"
          >
            {loggingOut ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <LogOut className="mr-2 h-4 w-4" />
            )}
            Log out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
