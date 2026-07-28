"use client";

import Link from "next/link";
import User from "./User";
import HelpButton from "./HelpButton";
import MobileButton from "./MobileButton";
import { useBusiness } from "@/hooks/useBusiness";
import ServerEnvBadge from "@/components/ServerEnvBadge";
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
            className="text-xl font-bold tracking-tight text-blue-600 transition-opacity hover:opacity-80"
          >
            Rebuzz
          </Link>
          <ServerEnvBadge className="hidden sm:inline-flex" />
        </div>

        <div className="flex items-center gap-3">
          <ServerEnvBadge className="sm:hidden" />
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
