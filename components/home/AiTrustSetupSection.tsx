import Link from "next/link";
import {
  ArrowRight,
  Database,
  KeyRound,
  WalletCards,
} from "lucide-react";

export default function AiTrustSetupSection({
  token,
}: {
  token?: string;
}) {
  return (
    <section className="scroll-mt-20 bg-[#f7f8fb] px-6 py-20 dark:bg-[#131a29] md:px-16">
      <div className="mx-auto max-w-6xl">
        <div className="mb-10 max-w-2xl">
          <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.2em] text-[#E26924]">
            Trust and AI setup
          </p>
          <h2 className="text-balance text-3xl font-bold tracking-tight text-[#1b2537] dark:text-[#e8ecf4] md:text-4xl">
            Know what AI uses and how to connect it.
          </h2>
          <p className="mt-4 text-base leading-relaxed text-gray-500 dark:text-[#9aa6bd]">
            Rebuzz prepares business information for analysis by the AI provider
            configured for your account. Here is what to expect before you
            connect a key.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <article className="rounded-2xl border border-gray-200/80 bg-white p-6 dark:border-white/10 dark:bg-[#0f1420]">
            <span className="mb-5 flex h-11 w-11 items-center justify-center rounded-xl bg-[#244074]/10 text-[#244074] dark:bg-[#244074]/30 dark:text-[#9bb8f0]">
              <Database size={20} aria-hidden="true" />
            </span>
            <h3 className="text-base font-semibold text-[#1b2537] dark:text-[#e8ecf4]">
              Business data used for insights
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-gray-500 dark:text-[#9aa6bd]">
              Depending on the insight, the analysis can include sales and order
              totals, product names and performance, prices and stock levels,
              customer activity, transaction details, and trends over time.
              This information is sent to the configured AI provider to generate
              the response.
            </p>
          </article>

          <article className="rounded-2xl border border-gray-200/80 bg-white p-6 dark:border-white/10 dark:bg-[#0f1420]">
            <span className="mb-5 flex h-11 w-11 items-center justify-center rounded-xl bg-[#244074]/10 text-[#244074] dark:bg-[#244074]/30 dark:text-[#9bb8f0]">
              <KeyRound size={20} aria-hidden="true" />
            </span>
            <h3 className="text-base font-semibold text-[#1b2537] dark:text-[#e8ecf4]">
              Connect a supported provider
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-gray-500 dark:text-[#9aa6bd]">
              Add your provider API key in AI settings. Business insights
              currently support Google Gemini and OpenRouter. The key is used
              for AI requests made by your account.
            </p>
          </article>

          <article className="rounded-2xl border border-gray-200/80 bg-white p-6 dark:border-white/10 dark:bg-[#0f1420]">
            <span className="mb-5 flex h-11 w-11 items-center justify-center rounded-xl bg-[#244074]/10 text-[#244074] dark:bg-[#244074]/30 dark:text-[#9bb8f0]">
              <WalletCards size={20} aria-hidden="true" />
            </span>
            <h3 className="text-base font-semibold text-[#1b2537] dark:text-[#e8ecf4]">
              Provider usage and fees
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-gray-500 dark:text-[#9aa6bd]">
              AI providers set their own usage limits and pricing. Depending on
              your provider account and usage, separate charges may apply. Check
              the provider&apos;s current terms and pricing before connecting a
              key.
            </p>
          </article>
        </div>

        <Link
          href={token ? "/settings/api-keys" : "/signup"}
          className="mt-8 inline-flex items-center gap-2 rounded-xl bg-[#244074] px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#1b3159]"
        >
          {token ? "Set up AI provider" : "Create an account to set up AI"}
          <ArrowRight size={16} aria-hidden="true" />
        </Link>
      </div>
    </section>
  );
}
