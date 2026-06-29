"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Flame, LayoutDashboard, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CalendarDateFilter } from "@/components/dashboardComponents/staffDash/CalendarDateFilter";
import { useQuery } from "@tanstack/react-query";
import { fetchUserData } from "@/services/apiProfile";

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
    <div className="min-h-screen bg-50 px-6 py-8 md:px-10">
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
          <Button
            className="bg-blue-600 hover:bg-blue-700 px-4 py-2.5 text-white rounded-xl text-sm font-semibold"
            asChild
          >
            <Link href="/invoices/add">Create order</Link>
          </Button>
        </div>
      </div>

      {/* ── Tabs + Calendar — single row on all screen sizes ── */}
      <div className="flex items-center justify-between gap-2 pt-4">
        {/* Tabs — icons only on mobile, icons + label on md+ */}
        <div className="flex items-center gap-1.5">
          {tabs.map(({ label, href, icon: Icon }) => {
            const active = pathname === href;
            return (
              <Button
                key={href}
                asChild
                variant={active ? "default" : "outline"}
                className={`rounded-lg px-2.5 py-2 md:px-4 ${
                  active
                    ? "bg-blue-600 text-white hover:bg-blue-700"
                    : "border-gray-200 text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                }`}
              >
                <Link href={href} title={label}>
                  <Icon className="h-4 w-4 shrink-0" />
                  {/* Label hidden on mobile, shown on md+ */}
                  <span className="text-sm hidden md:block md:ml-1.5">
                    {label}
                  </span>
                </Link>
              </Button>
            );
          })}
        </div>

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
