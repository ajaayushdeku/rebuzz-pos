"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { useSidebar } from "@/providers/SidebarProvider";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "../ui/tooltip";

interface SidebarItemProps {
  label: string;
  href: string;
  icon: LucideIcon;
  isCollapsed?: boolean;
}

export default function SidebarItem({
  label,
  href,
  icon: Icon,
  isCollapsed,
}: SidebarItemProps) {
  const pathname = usePathname();
  const isActive = pathname === href;
  const { toggle, closeMobile } = useSidebar();

  const baseClass = cn(
    "flex items-center gap-3 px-3 py-2 rounded-md text-foreground text-sm font-medium transition-colors",
    "hover:bg-blue-200 hover:text-blue-600",
    isActive &&
      "bg-accent text-accent-foreground",
  );

  if (isCollapsed) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          {/* Button expands sidebar — user then picks a sub-link */}
          <button
            onClick={toggle}
            className={cn(
              baseClass,
              "justify-center px-2 w-full",
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
    <Link
      href={href}
      className={baseClass}
      onClick={closeMobile}
    >
      <Icon className="w-4 h-4 shrink-0" />
      <span>{label}</span>
    </Link>
  );
}
