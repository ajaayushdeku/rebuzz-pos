import type { Metadata } from "next";
import { cookies } from "next/headers";
import { Archive } from "lucide-react";

import PageHeader from "@/components/ui/PageHeader";
import SavedInsightsScreen from "@/components/aiInsights/SavedInsightsScreen";
import { ROLE_COOKIE, isAdminRole } from "@/lib/auth/roles";

export const metadata: Metadata = {
  title: "Saved Insights",
};

export default async function Page() {
  const role = (await cookies()).get(ROLE_COOKIE)?.value;

  return (
    <div className="min-h-screen bg-surface-page px-6 py-5 sm:py-8 md:px-10 dark:bg-[#0f1420]">
      <div className="mx-auto flex w-full flex-col">
        <PageHeader
          title="Saved Insights"
          subtitle={
            <span className="inline-flex items-center gap-1.5">
              Manage your previously generated period insights.
              <Archive
                size={16}
                className="shrink-0 text-blue-500 dark:text-blue-300"
                aria-hidden
              />
            </span>
          }
        />

        <div className="mt-0">
          <SavedInsightsScreen isAdmin={isAdminRole(role)} />
        </div>
      </div>
    </div>
  );
}
