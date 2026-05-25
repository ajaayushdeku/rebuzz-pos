"use client";
import { useSidebar } from "@/providers/SidebarProvider";
import { Button } from "../ui/button";
import { Menu } from "lucide-react";

export default function MobileButton() {
  const { toggleMobile } = useSidebar();
  return (
    <Button
      variant="ghost"
      size="icon"
      className="md:hidden h-8 w-8 text-gray-600"
      onClick={toggleMobile}
    >
      <Menu className="h-5 w-5" />
    </Button>
  );
}
