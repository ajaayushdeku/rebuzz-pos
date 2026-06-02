"use client";

import React from "react";
import { useRouter } from "next/navigation";

import { ChevronDown, LogOut, Settings, User2 } from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "../ui/badge";

interface UserProps {
  initialBusinessName: string;
}

export default function User({ initialBusinessName }: UserProps) {
  const router = useRouter();

  const handleLogout = async () => {
    try {
      const res = await fetch("/api/auth/logout", {
        method: "POST",
      });

      if (res.ok) {
        router.push("/login");
        router.refresh();
      }
    } catch (error) {
      console.error("Logout request failed", error);
    }
  };

  return (
    <div className="bg-blue-100 rounded-xl px-3 py-0.5">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            className="flex items-center gap-2 md:px-3 px-1"
          >
            <span className="font-medium text-gray-600">
              {initialBusinessName}{" "}
            </span>
            <Badge variant="secondary" className="hidden md:block">
              STARTER
            </Badge>
            <ChevronDown className="h-4 w-4 text-gray-600" />
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuItem
            className="text-gray-600 cursor-pointer"
            onClick={() => router.push("/settings/business")}
          >
            <Link href="/settings/business" className="flex gap-2">
              <User2 className="mr-2 h-4 w-4" />
              Profile
            </Link>
          </DropdownMenuItem>

          <DropdownMenuItem
            className="text-gray-600 cursor-pointer"
            onClick={() => router.push("/settings/change-password")}
          >
            <Settings className="mr-2 h-4 w-4" />
            Settings
          </DropdownMenuItem>

          <DropdownMenuItem
            onClick={handleLogout}
            className="text-red-600 cursor-pointer"
          >
            <LogOut className="mr-2 h-4 w-4" />
            Logout
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
