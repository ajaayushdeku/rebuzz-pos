"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { useSidebar } from "@/providers/SidebarProvider";
import { Tooltip, TooltipContent, TooltipTrigger } from "../ui/tooltip";

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
    // `whitespace-nowrap`: while the rail is widening the label is already at
    // full length inside 48px, and a wrapped label would push every item below
    // it down until the animation caught up.
    "flex items-center gap-3 whitespace-nowrap px-3 py-2 rounded-md text-foreground text-sm font-medium transition-colors",
    "hover:bg-blue-50 hover:text-blue-600",
    isActive && "bg-accent text-accent-foreground",
  );

  if (isCollapsed) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          {/* Button expands sidebar — user then picks a sub-link */}
          <button
            onClick={toggle}
            className={cn(baseClass, "justify-center px-2 w-full")}
          >
            <Icon
              className={`w-4 h-4 shrink-0 ${label === "Receipt AI" && "cursor-not-allowed opacity-50"}`}
            />
          </button>
        </TooltipTrigger>
        <TooltipContent side="right" sideOffset={8}>
          {label}
        </TooltipContent>
      </Tooltip>
    );
  }

  return (
    <Link
      href={label === "Receipt AI" ? "#" : href}
      className={cn(
        baseClass,
        label === "Receipt AI" && "cursor-not-allowed opacity-50",
      )}
      onClick={(e) => {
        if (label === "Receipt AI") {
          e.preventDefault();
          return;
        }

        closeMobile();
      }}
    >
      <Icon className="w-4 h-4 shrink-0" />

      <span
        className={cn(
          // Fades in as the rail widens, so the label arrives with the space
          // it needs rather than appearing on a 48px strip and being clipped.
          "animate-in fade-in-0 duration-300",
          label === "Receipt AI" && "line-through",
        )}
      >
        {label}
      </span>
    </Link>
  );
}
