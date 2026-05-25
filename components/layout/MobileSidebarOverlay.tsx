"use client";

import { cn } from "@/lib/utils";
import { useSidebar } from "@/providers/SidebarProvider";
import Sidebar from "./Sidebar";

export default function MobileSidebarOverlay() {
  const { isMobileOpen, closeMobile } =
    useSidebar();

  return (
    <>
      {/* Backdrop */}
      <div
        className={cn(
          "fixed inset-0 z-40 bg-black/40 transition-opacity md:hidden",
          isMobileOpen
            ? "opacity-100 pointer-events-auto"
            : "opacity-0 pointer-events-none",
        )}
        onClick={closeMobile}
      />

      {/* Slide-in drawer */}
      <div
        className={cn(
          "fixed top-0 left-0 bottom-0 z-50 transition-transform duration-300 md:hidden",
          isMobileOpen
            ? "translate-x-0"
            : "-translate-x-full",
        )}
      >
        <Sidebar />
      </div>
    </>
  );
}
