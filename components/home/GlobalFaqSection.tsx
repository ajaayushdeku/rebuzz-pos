import type { HelpFaq } from "@/lib/help/content";
import HomeFaq from "./HomeFaq";

const globalFaqs: HelpFaq[] = [
  {
    q: "What can I manage with Rebuzz POS?",
    a: "Rebuzz brings sales, invoices, products, inventory, customer records, and business reporting into one workspace.",
  },
  {
    q: "Can I create invoices and track customer credit?",
    a: "Yes. Create invoices, record payments, and review unpaid invoices and customer balances from the credit records.",
  },
  {
    q: "What do the AI business insights provide?",
    a: "AI insights can summarize business activity and surface trends or suggestions based on sales and operational data. Using the AI insight features requires connecting your own Gemini API key.",
  },
  {
    q: "Can I use Rebuzz with different currencies?",
    a: "You can choose from the currencies available in the app for displaying business figures. Changing the selected currency changes how figures are shown; it does not convert past transactions.",
  },
  {
    q: "Do the plans bill in US dollars?",
    a: "The homepage shows rounded USD equivalents for reference. Plan billing is currently in NPR; check the in-app plan details before choosing a paid plan.",
  },
  {
    q: "Does the free plan expire?",
    a: "No. The free plan does not expire and does not require a payment card. It currently includes a limit of 20 products.",
  },
];

export default function GlobalFaqSection() {
  return (
    <section id="faq" className="scroll-mt-20 px-6 py-20 md:px-16">
      <div className="mx-auto max-w-6xl">
        <div className="mb-10 max-w-2xl">
          <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.2em] text-[#E26924]">
            Before you start
          </p>
          <h2 className="text-balance text-3xl font-bold tracking-tight text-[#1b2537] dark:text-[#e8ecf4] md:text-4xl">
            Questions people ask first
          </h2>
          <p className="mt-4 text-base leading-relaxed text-gray-500 dark:text-[#9aa6bd]">
            Learn what Rebuzz can help you manage, how AI insights work, and
            what to know about plans and currencies.
          </p>
        </div>

        <HomeFaq faqs={globalFaqs} />
      </div>
    </section>
  );
}
