"use client";

import { cn } from "@/lib/utils";
import { useSidebar } from "@/providers/SidebarProvider";
import Sidebar from "./Sidebar";

/**
 * The mobile drawer sits in the same slot the desktop sidebar occupies —
 * pinned below the navbar, not over it — so opening it slides the sidebar in
 * beside the page rather than covering the whole screen. The navbar (and its
 * hamburger) stays visible and clickable, which is what closes the drawer
 * again. Both layers therefore start at `--navbar-height` and sit below the
 * navbar's z-50.
 */
export default function MobileSidebarOverlay() {
  const { isMobileOpen, closeMobile } = useSidebar();

  return (
    <>
      {/* Backdrop — dims the page only, leaving the navbar untouched */}
      <div
        className={cn(
          "fixed top-(--navbar-height) right-0 bottom-0 left-0 z-30 bg-black/40 transition-opacity md:hidden",
          isMobileOpen
            ? "opacity-100 pointer-events-auto"
            : "opacity-0 pointer-events-none",
        )}
        onClick={closeMobile}
      />

      {/* Slide-in drawer */}
      <div
        className={cn(
          "fixed top-(--navbar-height) bottom-0 left-0 z-40 transition-transform duration-300 md:hidden",
          isMobileOpen ? "translate-x-0" : "-translate-x-full",
        )}
        // The drawer stays mounted so it can animate; `inert` keeps the
        // off-screen links out of the tab order and the accessibility tree.
        inert={!isMobileOpen}
      >
        <Sidebar />
      </div>
    </>
  );
}
