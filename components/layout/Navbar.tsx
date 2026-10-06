"use client";

import Link from "next/link";
import User from "./User";
import HelpButton from "./HelpButton";
import MobileButton from "./MobileButton";
import { useBusiness } from "@/hooks/useBusiness";
import { useCurrency } from "@/providers/CurrencyContext";
import ServerEnvBadge from "@/components/ServerEnvBadge";
import ThemeToggle from "@/components/ui/ThemeToggle";
import Image from "next/image";
// import { Button } from "../ui/button";
// import { Badge, Bell } from "lucide-react";

export default function Navbar() {
  const { data: businessData } = useBusiness();
  const { currency } = useCurrency();

  return (
    <nav className="w-full border-b bg-white z-200 dark:border-white/10 dark:bg-[#0f1420]">
      <div className="flex items-center justify-between pl-3 pr-4 py-3">
        <div className="flex items-center ">
          <MobileButton />
          <Link
            href="/"
            className="text-xl px-2 sm:px-3 font-bold tracking-tight text-blue-600 transition-opacity hover:opacity-80 flex flex-row items-center gap-1.5"
          >
            <Image
              src="/rebuzz.png"
              alt="ReBuzz Logo"
              width={32}
              height={32}
              className="rounded-lg hidden sm:block"
            />
            {/* <Image
              src="/rebuzz_dark.png"
              alt="ReBuzz Logo"
              width={32}
              height={32}
              className="rounded-lg"
            /> */}
            <span className=" text-lg font-bold tracking-tight">
              <span className="text-[#244074] dark:text-[#7ba2e3]">Re</span>
              <span style={{ color: "#E26924" }}>Buzz</span>
            </span>
          </Link>
          {/* <ServerEnvBadge className="hidden sm:inline-flex" /> */}
        </div>

        <div className="flex items-center gap-2">
          <ServerEnvBadge className="ml-1" />

          <ThemeToggle />

          <span
            aria-hidden
            className="mx-1 h-5 w-px shrink-0 bg-gray-200 dark:bg-white/15"
          />

          <Link
            href="/settings/currency"
            title={`Currency: ${currency.code} — click to change`}
            aria-label={`Change currency — currently ${currency.code}`}
            className="flex h-6.5 md:h-8 min-w-6 md:min-w-8 cursor-pointer items-center justify-center rounded-sm md:rounded-md border border-none bg-gray-50/70 text-[13px] font-semibold text-gray-700 transition-colors hover:text-blue-600 hover:bg-gray-100 dark:hover:bg-white/15 dark:bg-white/5 dark:text-[#c3ccdc] dark:hover:text-[#a8c4ee]"
          >
            {currency.symbol}
          </Link>

          <span
            aria-hidden
            className="hidden sm:inline-flex mx-1 h-5 w-px shrink-0 bg-gray-200 dark:bg-white/15"
          />

          <HelpButton />

          <span
            aria-hidden
            className="mx-1 h-5 w-px shrink-0 bg-gray-200 dark:bg-white/15"
          />

          <User
            initialBusinessName={businessData?.businessName || "My Business"}
            businessLogo={businessData?.logo ?? null}
          />
        </div>
      </div>
    </nav>
  );
}
