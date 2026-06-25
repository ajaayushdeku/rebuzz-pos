"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function SalesRevenueLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-50 px-6 py-8 md:px-10">
      {/* ── Header ── */}
      <div className="max-w-7xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-200">
        <div>
          <h1 className="font-bold text-xl md:text-2xl truncate">
            Sales & Revenue
          </h1>

          <p className="text-xs text-gray-400 mt-0.5">
            Detailed breakdown of your store&lsquo;s financial performance
          </p>
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

      {/* ── Content ── */}
      <div>{children}</div>
    </div>
  );
}
