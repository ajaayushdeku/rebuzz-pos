"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Flame, LayoutDashboard, Plus, TrendingUp } from "lucide-react";
import { CalendarDateFilter } from "@/components/dashboardComponents/staffDash/CalendarDateFilter";
import { useQuery } from "@tanstack/react-query";
import { fetchUserData } from "@/services/apiProfile";
import HeaderActionButton from "@/components/ui/HeaderActionButton";

const tabs = [
  { label: "Overview", href: "/dashboard", icon: LayoutDashboard },
  {
    label: "Growth Tracker",
    href: "/dashboard/growth-tracker",
    icon: TrendingUp,
  },
  { label: "Heatmap", href: "/dashboard/heatmap", icon: Flame },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  const { data: profile, isLoading } = useQuery({
    queryKey: ["profile"],
    queryFn: fetchUserData,
  });

  return (
    <div className="min-h-screen bg-surface-page px-6 py-8 md:px-10">
      {/* ── Header ── */}
      <div className="w-full flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-200">
        <div>
          <h1 className="font-bold text-xl md:text-2xl truncate">
            Dashboard Overview
          </h1>
          {!isLoading && (
            <p className="text-xs text-gray-400 mt-0.5">
              Welcome back, {profile?.name}. Here&lsquo;s what&lsquo;s happening
              with Rebuzz POS
            </p>
          )}
        </div>

        <div className="flex items-center gap-2">
          <HeaderActionButton
            variant="dashed"
            icon={Plus}
            label="Create Order"
            href="/invoices/add"
          />
        </div>
      </div>

      {/* ── Tabs + Calendar — single row on all screen sizes ── */}
      <div className="flex items-center justify-between gap-2 pt-4">
        {/* Tabs — one segmented control rather than three loose buttons, so the
            group reads as a single switch. Icons only on mobile, icons +
            label on md+. Matches the pill tabs on the discount settings page. */}
        <nav
          aria-label="Dashboard sections"
          className="inline-flex items-center gap-1 rounded-full bg-[#e4f2fe] p-1"
        >
          {tabs.map(({ label, href, icon: Icon }) => {
            const active = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                title={label}
                aria-current={active ? "page" : undefined}
                className={`flex items-center gap-1.5 rounded-full px-3 py-2 text-[13px] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-[#e4f2fe] md:px-4 ${
                  active
                    ? "bg-white font-bold text-blue-950 shadow-sm"
                    : "font-semibold text-blue-800 hover:text-blue-950"
                }`}
              >
                <Icon className="h-4 w-4 shrink-0" />
                {/* Label hidden on mobile, shown on md+ */}
                <span className="hidden md:block">{label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Calendar — compact icon-only trigger on mobile */}
        {pathname === "/dashboard" && (
          <div className="shrink-0">
            <CalendarDateFilter />
          </div>
        )}
      </div>

      {/* ── Content ── */}
      <div>{children}</div>
    </div>
  );
}
