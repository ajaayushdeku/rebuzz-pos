import type { HelpFaq } from "@/lib/help/content";
import HomeFaq from "../HomeFaq";

const globalFaqs: HelpFaq[] = [
  {
    q: "How can RebuzzIQ help me improve my business?",
    a: "RebuzzIQ can turn your Rebuzz sales and operations data into suggestions, recommendations, and strategies for areas like menu combinations, pricing, customer retention, sales, and busy-hour planning. Connect your own Gemini or OpenRouter API key to generate insights for a completed period, then review each suggestion against your business context before acting.",
  },
  {
    q: "Can I create invoices and track customer credit?",
    a: "Yes. Create invoices, record payments, and review unpaid invoices and customer balances from the credit records.",
  },
  {
    q: "What do the AI business insights provide?",
    a: "Explore business performance stories and alerts, product and menu ideas, pricing and slow-stock reviews, customer retention patterns, sales recommendations, hourly and staffing plans, and seasonal preparation. The available insights depend on the business data and period being reviewed.",
  },
  {
    q: "Does AI change prices, stock, or offers automatically?",
    a: "No. AI insights provide suggestions for you to review. AI Fill can prepare a draft offer schedule, but you check its dates and terms and choose whether to save or publish it.",
  },
  {
    q: "How do I get insights from my own business data?",
    a: "Connect your own Google Gemini or OpenRouter API key in Settings → API Keys, then generate insights for a completed period. The same configured provider key powers AI Fill in the offer builder. Until your key is connected and the period is generated, insight cards may show sample data instead of your business results.",
  },
  {
    q: "What business information is sent for AI insights?",
    a: "A request sends a summary of the sales, products, customers, or staffing information needed for the insight and selected period to the AI provider you configured. Review that provider’s data terms before connecting a key.",
  },
  {
    q: "Can I use Rebuzz with different currencies?",
    a: "You can choose from the currencies available in the app for displaying business figures. Changing the selected currency changes how figures are shown; it does not convert past transactions.",
  },

  {
    q: "Does the free plan expire?",
    a: "No. The free plan does not expire and does not require a payment card. It currently includes a limit of 20 products.",
  },
];

export default function GlobalFaqSection() {
  return (
    <section
      id="faq"
      className="scroll-mt-20 px-6 py-20 md:px-16  bg-[#f7f8fb] dark:bg-[#131a29]"
    >
      <div className="mx-auto max-w-6xl">
        <div className="mb-10 max-w-2xl">
          <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.2em] text-[#E26924]">
            Before you start
          </p>
          <h2 className="text-balance text-3xl font-bold tracking-tight text-[#1b2537] dark:text-[#e8ecf4] md:text-4xl">
            Questions people ask first
          </h2>
          <p className="mt-4 text-base leading-relaxed text-gray-500 dark:text-[#9aa6bd]">
            Learn what Rebuzz can help you manage, how its AI insights support
            decisions, and what to know about plans and currencies.
          </p>
        </div>

        <HomeFaq faqs={globalFaqs} />
      </div>
    </section>
  );
}
