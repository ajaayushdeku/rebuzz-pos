"use client";

import Link from "next/link";
import User from "./User";
import HelpButton from "./HelpButton";
import MobileButton from "./MobileButton";
import { useBusiness } from "@/hooks/useBusiness";
import ServerEnvBadge from "@/components/ServerEnvBadge";
import Image from "next/image";
import { useCurrency } from "@/providers/CurrencyContext";
// import { Button } from "../ui/button";
// import { Badge, Bell } from "lucide-react";

/** Currency code → ISO 3166-1 alpha-2 country code for the flagcdn flag. */
const CURRENCY_FLAGS: Record<string, string> = {
  NPR: "np",
  USD: "us",
  EUR: "eu",
  GBP: "gb",
  INR: "in",
  AUD: "au",
  CAD: "ca",
  JPY: "jp",
  CNY: "cn",
  SGD: "sg",
  AED: "ae",
  SAR: "sa",
  NZD: "nz",
  KRW: "kr",
  MYR: "my",
  THB: "th",
  PHP: "ph",
  CHF: "ch",
  SEK: "se",
  HKD: "hk",
  BRL: "br",
};

export default function Navbar() {
  const { data: businessData } = useBusiness();
  const { currency } = useCurrency();
  const flagCode = CURRENCY_FLAGS[currency.code] ?? "np";

  return (
    <nav className="w-full border-b bg-white z-200">
      <div className="flex items-center justify-between pl-3 pr-4 py-3">
        <div className="flex items-center ">
          <MobileButton />
          <Link
            href="/"
            className="text-xl pl-3 font-bold tracking-tight text-blue-600 transition-opacity hover:opacity-80 flex flex-row items-center gap-2"
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
          <span className="text-xs text-gray-600">{currency.symbol}</span>{" "}
          {/* <ServerEnvBadge className="sm:hidden xs:hidden" /> */}
          <span
            title={currency.code}
            className="w-8 h-5 inline-flex items-center justify-center shrink-0 overflow-hidden  rounded-xs "
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={`https://flagcdn.com/${flagCode}.svg`}
              alt={currency.code}
              className="max-w-full max-h-full object-contain"
              loading="lazy"
            />
          </span>
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
