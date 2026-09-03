"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { PanelLeftClose, PanelLeftOpen, Plus } from "lucide-react";

import { cn } from "@/lib/utils";

import { useSidebar } from "@/providers/SidebarProvider";

import { Button } from "../ui/button";
import SidebarItem from "./SidebarItem";
import SidebarSection from "./SidebarSection";
import SidebarPlanCard from "./SidebarPlanCard";
import Link from "next/link";
import { navigationConfig } from "@/lib/config/navigation";

export default function Sidebar() {
  const pathname = usePathname();
  const { isCollapsed, toggle, closeMobile } = useSidebar();

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
        "border-r bg-background h-full flex flex-col overflow-hidden transition-[width] duration-300 ease-in-out",
        isCollapsed ? "w-12" : "w-64",
      )}
    >
      <div
        className={`my-2 flex items-center justify-between gap-1 px-1 py-2 border-b border-gray-100 transition-[width] duration-300 ease-in-out ${isCollapsed ? "justify-center " : "justify-between"}`}
      >
        {!isCollapsed && (
          <Link href="/invoices/add" className="min-w-0  ml-2">
            <Button
              className="w-full text-left animate-in fade-in-0 bg-white font-bold text-blue-500 duration-300 hover:bg-blue-100"
              size="sm"
            >
              <Plus className="w-2 h-2 mr-1 font-bold" />
              <span className="whitespace-nowrap text-[16px]">Create new</span>
            </Button>
          </Link>
        )}

        <Button
          variant="ghost"
          size="icon"
          className={`h-8 w-8 shrink-0 ${isCollapsed ? "ml-1" : "mr-2"} cursor-pointer text-blue-500 hover:text-blue-600`}
          onClick={toggle}
          aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {isCollapsed ? (
            <PanelLeftOpen className="h-4 w-4 hidden md:block" />
          ) : (
            <PanelLeftClose className="h-4 w-4 hidden md:block" />
          )}
        </Button>
      </div>

      <nav className="flex-1 overflow-y-auto overflow-x-hidden px-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <div className="space-y-1">
          {navigationConfig.map((item) => {
            const isSectionActive = activeSectionFromUrl?.label === item.label;
            const isOpen =
              openSectionLabel === item.label ||
              (openSectionLabel === null && isSectionActive);

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
