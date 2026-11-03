"use client";

import Link from "next/link";
import { useState } from "react";
import { LayoutDashboard, LoaderCircle } from "lucide-react";

export function DashboardNavLink() {
  const [isNavigating, setIsNavigating] = useState(false);

  return (
    <Link
      href="/dashboard"
      aria-label={isNavigating ? "Loading dashboard" : "Go to Dashboard"}
      aria-busy={isNavigating}
      onNavigate={() => setIsNavigating(true)}
      className="group inline-flex h-8 items-center justify-center gap-2 border border-transparent bg-transparent px-1 tracking-wider text-sm font-medium text-gray-600 transition-all duration-200 hover:-translate-y-px hover:bg-[#1b3159] hover:shadow-md focus:outline-none focus:ring-2 focus:ring-[#244074]/30 md:h-9 md:rounded-md md:border-[#244074]/20 md:bg-[#244074] md:px-3 md:text-white md:shadow-sm dark:text-[#7BA2CA] dark:md:text-white"
    >
      {isNavigating ? (
        <LoaderCircle
          size={16}
          strokeWidth={2.5}
          className="animate-spin"
          aria-hidden
        />
      ) : (
        <LayoutDashboard
          size={16}
          strokeWidth={2.5}
          className="transition-transform duration-200 group-hover:scale-105"
          aria-hidden
        />
      )}
      <span className="hidden md:inline">
        {isNavigating ? "Loading…" : "Dashboard"}
      </span>
    </Link>
  );
}
