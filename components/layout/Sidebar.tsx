"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { ChevronsLeft, ChevronsRight, Plus } from "lucide-react";

import { cn } from "@/lib/utils";

import { useSidebar } from "@/providers/SidebarProvider";

import { Button } from "../ui/button";
import SidebarItem from "./SidebarItem";
import SidebarSection from "./SidebarSection";
import SidebarPlanCard from "./SidebarPlanCard";
import Link from "next/link";
import { navigationConfig } from "@/lib/config/navigation";
import { useHasSavedAiKey } from "@/hooks/useAiKey";

export default function Sidebar() {
  const pathname = usePathname();
  const { isCollapsed, toggle, closeMobile } = useSidebar();
  const hasAiKey = useHasSavedAiKey();

  // Entries for features the business has not set up are left out entirely
  // rather than shown disabled: there is nothing to do with them from here.
  const visibleNavigation = navigationConfig.filter(
    (item) => item.type !== "single" || !item.requiresAiKey || hasAiKey,
  );

  const activeSectionFromUrl = navigationConfig.find(
    (item) =>
      item.type === "section" &&
      item.items.some((subItem) => subItem.href === pathname),
  );

  const [openSectionLabel, setOpenSectionLabel] = useState<string | null>(() =>
    activeSectionFromUrl?.type === "section"
      ? activeSectionFromUrl.label
      : null,
  );

  const handleToggle = (label: string) => {
    setOpenSectionLabel((prev) => (prev === label ? null : label));
  };

  return (
    <aside
      className={cn(
        "relative flex h-full flex-col overflow-hidden border-r bg-background",
        "transition-[width] duration-300 ease-in-out",
        "motion-reduce:transition-none",
        isCollapsed ? "w-12" : "w-60",
      )}
    >
      <div
        className={cn(
          "my-1 pb-2 flex shrink-0 items-center border-b border-gray-100 px-1  dark:border-white/10 sm:my-2",
          "transition-all duration-300 ease-in-out motion-reduce:transition-none",
          isCollapsed ? "justify-center" : "justify-between",
        )}
      >
        <div
          className={cn(
            "min-w-0 overflow-hidden transition-all duration-300 ease-in-out",
            isCollapsed
              ? "w-0 -translate-x-2 opacity-0"
              : "ml-2 flex-1 translate-x-0 opacity-100",
          )}
          aria-hidden={isCollapsed}
        >
          <Link href="/invoices/add" tabIndex={isCollapsed ? -1 : 0}>
            <Button
              className="w-full py-5 whitespace-nowrap bg-white text-left text-blue-500 hover:bg-blue-100 dark:bg-transparent dark:text-[#7ba2e3] dark:hover:bg-white/10 cursor-pointer"
              size="sm"
            >
              <Plus className="mr-1 h-3 w-3 shrink-0 font-bold" />
              <span className="text-[14px] font-bold sm:text-[15px]">
                Create Invoice
              </span>
            </Button>
          </Link>
        </div>

        <Button
          variant="ghost"
          size="icon"
          className={cn(
            "h-8 w-8 shrink-0 cursor-pointer text-blue-500 hover:text-blue-600 dark:text-[#7ba2e3] dark:hover:text-[#a8c4ee]",
            "transition-transform duration-300 ease-in-out motion-reduce:transition-none",
            isCollapsed ? "rotate-180" : "rotate-0",
          )}
          onClick={toggle}
          aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          <ChevronsLeft className="h-4 w-4" />
        </Button>
      </div>

      <nav
        className={cn(
          "min-h-0 flex-1 overflow-x-hidden overflow-y-auto px-2",
          "[scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
          "transition-[padding] duration-300 ease-in-out motion-reduce:transition-none",
        )}
      >
        <div className="space-y-1">
          {visibleNavigation.map((item) => {
            // const isSectionActive = activeSectionFromUrl?.label === item.label;
            const isOpen = openSectionLabel === item.label;
            return item.type === "single" ? (
              <SidebarItem
                key={item.href}
                {...item}
                isCollapsed={isCollapsed}
              />
            ) : (
              <SidebarSection
                key={item.label}
                label={item.label}
                icon={item.icon}
                items={item.items}
                isOpen={isOpen}
                onToggle={() => handleToggle(item.label)}
                isCollapsed={isCollapsed}
              />
            );
          })}
        </div>
      </nav>

      {/* Pinned to the bottom of the flex column — the nav above is flex-1, so
          the current plan always sits at the foot of the sidebar. */}
      <SidebarPlanCard />
    </aside>
  );
}
