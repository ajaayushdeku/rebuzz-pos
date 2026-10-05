import Link from "next/link";
import { HelpCircle } from "lucide-react";
import { Button } from "../ui/button";

/**
 * The way into Help & Support from the navbar.
 *
 * A link rather than a button with a handler: it goes to a page, so it should
 * behave like every other link — middle-click, open in a new tab, and a real
 * destination on hover.
 */
export default function HelpButton() {
  return (
    <Button
      asChild
      variant="ghost"
      size="icon"
      className=" p-4 hidden sm:inline-flex"
    >
      <Link href="/help" aria-label="Help and support" title="Help & support">
        <HelpCircle className="md:h-5 md:w-5 h-10 w-10 text-gray-600 dark:text-[#7ba2e3]" />
      </Link>
    </Button>
  );
}
