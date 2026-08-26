"use client";

import Link from "next/link";
import User from "./User";
import HelpButton from "./HelpButton";
import MobileButton from "./MobileButton";
import { useBusiness } from "@/hooks/useBusiness";
import ServerEnvBadge from "@/components/ServerEnvBadge";
import Image from "next/image";
import { useCurrency } from "@/providers/CurrencyContext";
import { findCurrency } from "@/lib/config/currencies";
import CountryFlag from "@/components/ui/CountryFlag";
// import { Button } from "../ui/button";
// import { Badge, Bell } from "lucide-react";

export default function Navbar() {
  const { data: businessData } = useBusiness();
  const { currency } = useCurrency();
  // Resolved from the same list the picker offers, so every currency it can
  // select has a flag here — a local map would go stale the next time one is
  // added.
  const flagCode = findCurrency(currency.code)?.countryCode ?? "np";

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
          {/* The code and its flag read as one control — clicking either goes
              to where the currency is actually changed. */}
          <Link
            href="/settings/currency"
            title={`${currency.code} — change currency`}
            aria-label={`Currency ${currency.code}. Change currency`}
            className="flex items-center gap-2 rounded-lg px-1.5 py-1 cursor-pointer transition-colors hover:bg-gray-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
          >
            <span className="text-xs text-gray-600">
              {currency.code} ( {currency.symbol} )
            </span>
            <CountryFlag countryCode={flagCode} label="" className="h-6 w-6" />
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
