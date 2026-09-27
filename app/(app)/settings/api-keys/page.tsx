import type { Metadata } from "next";
import ApiKeysScreen from "@/components/settingsComponents/apiKeys/ApiKeysScreen";
import PageHeader from "@/components/ui/PageHeader";

export const metadata: Metadata = { title: "API Keys" };

/**
 * Connect the outside services the app's AI features run on.
 *
 * The screen itself is a client component: which provider is being set up
 * drives the list, the form and the guide together, and that is state. Adding
 * a fourth provider is a row in the list, not a redesign.
 */
export default function Page() {
  return (
    <div className="min-h-screen bg-surface-page px-6 py-8 md:px-10 mx-auto w-full">
      <PageHeader
        title="API Keys"
        subtitle="Connect your own AI provider to power insights and suggestions."
        spaceBelow={false}
      />

      <div className="mt-6">
        <ApiKeysScreen />
      </div>
    </div>
  );
}
