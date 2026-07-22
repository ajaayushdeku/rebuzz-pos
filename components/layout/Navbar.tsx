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
  const { data: businessDData } = useBusiness();

  return (
    <nav className="w-full border-b bg-white z-200">
      <div className="flex items-center justify-between px-6 py-3">
        <div className="flex items-center gap-3">
          <MobileButton />
          <div className="text-xl font-semibold text-blue-600">
            <Link href="/">Rebuzz</Link>
          </div>
          <ServerEnvBadge className="hidden sm:inline-flex" />
        </div>

        <div className="flex items-center gap-3">
          <ServerEnvBadge className="sm:hidden" />
          {/* <Button variant="ghost" size="icon" className="relative">
            <Bell className="h-5 w-5 text-gray-600" />
            <Badge
              // variant="destructive"
              className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
            >
              2
            </Badge>
          </Button> */}
          <HelpButton />
          <User
            initialBusinessName={businessDData?.businessName || "My Business"}
          />
        </div>
      </div>
    </nav>
  );
}
