"use client";

import { cn } from "@/lib/utils";
import { useSidebar } from "@/providers/SidebarProvider";

export default function MainContent({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isCollapsed } = useSidebar();

  return (
    <main
      // The page's scroll container, and the only thing on the shell that
      // scrolls. `data-app-scroll` is how `useLockAppScroll` finds it.
      //
      // Offset by a margin rather than padding so it starts below the fixed
      // navbar, and `dvh` rather than `vh` so a mobile URL bar does not push
      // the bottom off-screen.
      //
      // `scrollbar-hide` leaves the scrollbar out of the layout entirely: with
      // nothing drawn, there is nothing to appear on one page and vanish on
      // the next. Wheel, touch, keyboard and drag-select all still scroll it;
      // what is lost is the position indicator, which the page's own content
      // has to carry instead.
      data-app-scroll
      className={cn(
        "scrollbar-hide mt-(--navbar-height) h-[calc(100dvh-var(--navbar-height))] overflow-y-auto transition-all duration-300",
        isCollapsed ? "md:pl-12" : "md:pl-64",
      )}
    >
      {children}
    </main>
  );
}
