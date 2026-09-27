import type { Metadata } from "next";
import PageHeader from "@/components/ui/PageHeader";
import HelpScreen from "@/components/help/HelpScreen";

export const metadata: Metadata = { title: "Help" };

/**
 * Help & Support.
 *
 * Written for the owner or manager — the person who sets the business up and
 * reads the dashboards — rather than for a cashier at the till.
 *
 * The page itself stays a server component so it keeps its metadata; the
 * searching and the opening of guides is state, and lives in HelpScreen.
 */
export default function HelpPage() {
  return (
    <div className="min-h-screen bg-surface-page px-6 py-8 md:px-10">
      <div className="mx-auto w-full">
        <PageHeader
          title="Help & Support"
          subtitle="Guides, answers and a way to reach us."
        />

        <HelpScreen />
      </div>
    </div>
  );
}
