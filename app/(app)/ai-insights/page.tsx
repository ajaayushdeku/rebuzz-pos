import type { Metadata } from "next";
import { cookies } from "next/headers";
import { Sparkles } from "lucide-react";

import AiInsightsScreen from "@/components/aiInsights/AiInsightsScreen";
import PageHeader from "@/components/ui/PageHeader";
import { ROLE_COOKIE, isAdminRole } from "@/lib/auth/roles";

export const metadata: Metadata = { title: "AI Insights" };

/**
 * AI Insights: advice generated from this business's own completed months,
 * quarters and years.
 *
 * A server component so it can read the role. Generating insights spends the
 * merchant's provider quota, so only the business admin may — the service
 * enforces that, and the page needs to know in order to say so before anyone
 * waits through seven refused requests. The role is in an httpOnly cookie, which
 * the browser cannot read, so it is read here and passed down.
 *
 * Everything else is the screen's: which period, what is stored for it, and the
 * one button that costs anything.
 */
export default async function Page() {
  const role = (await cookies()).get(ROLE_COOKIE)?.value;

  return (
    <div className="min-h-screen bg-surface-page px-6 py-8 md:px-10 dark:bg-[#0f1420]">
      <div className="mx-auto flex w-full flex-col">
        <PageHeader
          title="AI Insights"
          subtitle={
            /* inline-flex so the mark sits on the sentence's line rather than
               on the text baseline. */
            <span className="inline-flex items-center gap-1">
              What your sales, menu, customers and staff say about a finished
              period — and what to do next.
              <Sparkles
                size={16}
                className="shrink-0 text-violet-500 dark:text-violet-300"
                aria-hidden
              />
            </span>
          }
        />

        <div className="mt-0">
          <AiInsightsScreen isAdmin={isAdminRole(role)} />
        </div>
      </div>
    </div>
  );
}
