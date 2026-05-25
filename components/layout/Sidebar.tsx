"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { PanelLeftClose, PanelLeftOpen, Plus } from "lucide-react";

import { cn } from "@/lib/utils";

import { useSidebar } from "@/providers/SidebarProvider";

import { Button } from "../ui/button";
import SidebarItem from "./SidebarItem";
import SidebarSection from "./SidebarSection";
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
        "border-r bg-background h-screen flex flex-col transition-all duration-300",
        isCollapsed ? "w-12" : "w-56",
      )}
    >
      <div className="py-2 px-1 flex items-center justify-between gap-1">
        {!isCollapsed && (
          <Link href="/invoices/add">
            <Button
              className="flex-1 bg-white text-blue-500  font-bold hover:bg-blue-100"
              size="sm"
            >
              <Plus className="w-2 h-2 mr-1 font-bold" />
              <span className="text-[16px]">Create new</span>
            </Button>
          </Link>
        )}
        <Button
          variant="ghost"
          size="icon"
          className="shrink-0 h-8 w-8 text-blue-500 hover:text-blue-400"
          onClick={toggle}
        >
          {isCollapsed ? (
            <PanelLeftOpen className="h-4 w-4 hidden md:block" />
          ) : (
            <PanelLeftClose className="h-4 w-4 hidden md:block" />
          )}
        </Button>
      </div>

      <nav className="flex-1 overflow-y-auto p-2">
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
    </aside>
  );
}
