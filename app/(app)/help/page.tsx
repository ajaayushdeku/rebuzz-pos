import type { Metadata } from "next";
import PageHeader from "@/components/ui/PageHeader";
import HelpScreen from "@/components/help/HelpScreen";
import AskShortcut from "@/components/help/AskShortcut";

export const metadata: Metadata = { title: "Help" };

export default function HelpPage() {
  return (
    <div className="min-h-full bg-surface-page px-6 py-8 md:px-10">
      <div className="mx-auto w-full">
        <PageHeader
          title="Help & Support"
          subtitle="Guides, answers and a way to reach us."
          actions={<AskShortcut />}
        />

        <HelpScreen />
      </div>
    </div>
  );
}
