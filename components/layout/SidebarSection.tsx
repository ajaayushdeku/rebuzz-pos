"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ChevronRight,
  ChevronDown,
  LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useSidebar } from "@/providers/SidebarProvider";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "../ui/tooltip";

interface SidebarSectionProps {
  label: string;
  icon: LucideIcon;
  items: { label: string; href: string }[];
  isOpen: boolean;
  onToggle: () => void;
  isCollapsed?: boolean;
}

export default function SidebarSection({
  label,
  icon: Icon,
  items,
  isOpen,
  onToggle,
  isCollapsed,
}: SidebarSectionProps) {
  const pathname = usePathname();
  const isAnyActive = items.some(
    (item) => pathname === item.href,
  );
  const { toggle } = useSidebar();
  const baseClass = cn(
    "flex items-center gap-3 w-full px-3 py-2 rounded-md text-sm font-medium text-foreground transition-colors duration-200",
    "hover:bg-blue-50 hover:text-blue-600",
    isAnyActive &&
      !isOpen &&
      "bg-blue-50 text-blue-600",
  );
  if (isCollapsed) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          {/* Expand sidebar so user can see and pick sub-links */}
          <button
            onClick={toggle}
            className={cn(
              baseClass,
              "justify-center px-2",
            )}
          >
            <Icon className="w-4 h-4 shrink-0" />
          </button>
        </TooltipTrigger>
        <TooltipContent
          side="right"
          sideOffset={8}
        >
          {label}
        </TooltipContent>
      </Tooltip>
    );
  }

  return (
    <div className="mb-1">
      <button
        onClick={onToggle}
        className={baseClass}
      >
        <Icon className="w-4 h-4 shrink-0" />
        <span className="flex-1 text-left">
          {label}
        </span>
        {isOpen ? (
          <ChevronDown className="w-4 h-4 shrink-0" />
        ) : (
          <ChevronRight className="w-4 h-4 shrink-0" />
        )}
      </button>

      {isOpen && (
        <div className="ml-7 mt-1 space-y-1">
          {items.map((item) => {
            const isActive =
              pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "block px-3 py-2 rounded-md text-sm transition-colors",
                  isActive
                    ? "bg-blue-50 text-blue-600 font-medium"
                    : "text-muted-foreground hover:bg-accent hover:text-blue-600",
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
