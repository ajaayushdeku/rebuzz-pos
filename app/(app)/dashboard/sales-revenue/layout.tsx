"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function SalesRevenueLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="p-3">
      <div className="flex justify-between items-center w-full py-2">
        <div className="py-4 px-7">
          <h1 className="font-bold text-xl md:text-2xl truncate">
            Sales & Revenue
          </h1>
          <p className="text-gray-500 text-sm md:text-base hidden sm:block">
            Detailed breakdown of your store&apos;s financial performance
          </p>
        </div>

        <div className="mx-1 md:mx-3">
          <Button
            className="bg-blue-600 hover:bg-blue-700 px-6 py-6 text-white rounded-2xl"
            asChild
          >
            <Link href="/invoices/add">Create order</Link>
          </Button>
        </div>
      </div>

      {children}
    </div>
  );
}
