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
      <div className="max-w-7xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-200">
        <div>
          <h1 className="font-bold text-xl md:text-2xl truncate">
            Dashboard Overview
          </h1>

          {!isLoading && (
            <p className="text-sm text-gray-500 mt-0.5">
              Welcome back, {profile?.name}. Here&lsquo;s what&lsquo;s happening
              with Rebuzz POS
            </p>
          )}
        </div>

        <div className="flex items-center gap-2">
          <Button
            className="flex items-center gap-2 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-lg px-4 py-2"
            asChild
          >
            <Link href="/invoices/add">Create order</Link>
          </Button>
        </div>
      </div>

      {/* ── Tabs + Calendar Date Filter (Overview page only) ── */}
      <div className="flex items-center justify-between pt-4">
        <div className="flex items-center gap-2">
          {tabs.map(({ label, href, icon: Icon }) => (
            <Button
              key={href}
              asChild
              variant={pathname === href ? "default" : "outline"}
              className={
                pathname === href
                  ? "bg-blue-600 text-white hover:bg-blue-700 rounded-lg"
                  : "rounded-lg border-gray-200 text-gray-600 hover:text-gray-900 hover:bg-gray-50"
              }
            >
              <Link href={href}>
                <Icon className="h-4 w-4 mr-1.5" />
                <span className="text-sm hidden md:block">{label}</span>
              </Link>
            </Button>
          ))}
        </div>

        {pathname === "/dashboard" && <CalendarDateFilter />}
      </div>

      {/* ── Content ── */}
      <div>{children}</div>
    </div>
  );
}
