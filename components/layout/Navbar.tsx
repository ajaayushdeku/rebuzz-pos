"use client";

import Link from "next/link";
import User from "./User";
import HelpButton from "./HelpButton";
import MobileButton from "./MobileButton";
import { useBusiness } from "@/hooks/useBusiness";
import { useCurrency } from "@/providers/CurrencyContext";
import ServerEnvBadge from "@/components/ServerEnvBadge";
import Image from "next/image";
// import { Button } from "../ui/button";
// import { Badge, Bell } from "lucide-react";

export default function Navbar() {
  const { data: businessData } = useBusiness();
  const { currency } = useCurrency();

  return (
    <nav className="w-full border-b bg-white z-200">
      <div className="flex items-center justify-between pl-3 pr-4 py-3">
        <div className="flex items-center ">
          <MobileButton />
          <Link
            href="/"
            className="text-xl px-3 font-bold tracking-tight text-blue-600 transition-opacity hover:opacity-80 flex flex-row items-center gap-2"
          >
            <Image
              src="/rebuzz.png"
              alt="ReBuzz Logo"
              width={32}
              height={32}
              className="rounded-lg"
            />
            <span className="text-gray-900 text-lg font-bold tracking-tight">
              ReBuzz
            </span>
          </Link>
          <ServerEnvBadge className="hidden sm:inline-flex" />
        </div>

        <div className="flex items-center gap-2">
          {/* The symbol alone — it is what shows up on every figure in the
              app, so it names the setting better than the code does. The code
              is in the tooltip and for screen readers.

              `min-w-9` rather than a fixed width: two-character symbols like
              "Rs" and "kr" would otherwise be squeezed. */}
          <Link
            href="/settings/currency"
            title={`Currency: ${currency.code} — click to change`}
            aria-label={`Change currency — currently ${currency.code}`}
            className="flex h-8.5 min-w-9 cursor-pointer items-center justify-center bg-gray-50/70 rounded-md border border-none  text-[13px] font-semibold text-gray-700 transition-colors  hover:text-blue-600"
          >
            {currency.symbol}
          </Link>
          <div className="h-5 border-1  border-gray-200 mr-2" />
          <HelpButton />
          <User
            initialBusinessName={businessData?.businessName || "My Business"}
            businessLogo={businessData?.logo ?? null}
          />
        </div>
      </div>
    </nav>
  );
}
