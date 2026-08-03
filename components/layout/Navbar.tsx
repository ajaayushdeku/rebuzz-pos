"use client";

import Link from "next/link";
import User from "./User";
import HelpButton from "./HelpButton";
import MobileButton from "./MobileButton";
import { useBusiness } from "@/hooks/useBusiness";
import ServerEnvBadge from "@/components/ServerEnvBadge";
import Image from "next/image";
// import { Button } from "../ui/button";
// import { Badge, Bell } from "lucide-react";

export default function Navbar() {
  const { data: businessData } = useBusiness();

  return (
    <nav className="w-full border-b bg-white z-200">
      <div className="flex items-center justify-between px-6 py-3">
        <div className="flex items-center gap-3">
          <MobileButton />
          <Link
            href="/"
            className="text-xl font-bold tracking-tight text-blue-600 transition-opacity hover:opacity-80 flex flex-row items-center gap-2"
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

        <div className="flex items-center gap-3">
          {/* <ServerEnvBadge className="sm:hidden xs:hidden" /> */}
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
