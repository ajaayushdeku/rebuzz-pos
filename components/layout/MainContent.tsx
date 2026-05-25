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
      className={cn(
        "pt-(--navbar-height) transition-all duration-300",
        isCollapsed ? "md:pl-12" : "md:pl-56",
      )}
    >
      {children}
    </main>
  );
}
