import Link from "next/link";
import {
  ArrowRight,
  CreditCard,
  FileText,
  History,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";

const workflowSteps = [
  {
    number: "01",
    title: "Create the invoice",
    description:
      "Add products and customer details, then apply your configured taxes and discounts.",
    icon: FileText,
  },
  {
    number: "02",
    title: "Record payment or credit",
    description:
      "Keep payment details with the sale, or move an unpaid invoice into customer credit.",
    icon: CreditCard,
  },
  {
    number: "03",
    title: "Follow the balance",
    description:
      "Review credited invoices, outstanding dues, and payment activity in one place.",
    icon: History,
  },
];

export function InvoiceCreditWorkflowSection({
  token,
}: {
  token?: string;
}) {
  return (
    <section
      id="invoicing"
      className="scroll-mt-20 bg-white px-6 py-20 dark:bg-[#0f1420] md:px-16"
    >
      <div className="mx-auto max-w-6xl">
        <div className="mx-auto mb-12 max-w-3xl text-center">
          <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.2em] text-[#E26924]">
            Invoices and customer credit
          </p>
          <h2 className="text-balance text-3xl font-bold tracking-tight text-[#1b2537] dark:text-[#e8ecf4] md:text-4xl">
            Take each sale from invoice to payment follow-up.
          </h2>
          <p className="mt-4 text-base leading-relaxed text-gray-500 dark:text-[#9aa6bd]">
            Create professional invoices, record payments, and keep customer
            credit balances visible as your business moves through the day.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {workflowSteps.map(({ number, title, description, icon: Icon }) => (
            <article
              key={number}
              className="relative rounded-2xl border border-gray-200/80 bg-[#f8f9fc] p-6 dark:border-white/10 dark:bg-[#131a29] sm:p-7"
            >
              <div className="mb-6 flex items-center justify-between">
                <span className="text-xs font-semibold tracking-[0.18em] text-[#244074]/60 dark:text-[#7ba2e3]/70">
                  {number}
                </span>
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#244074]/10 text-[#244074] dark:bg-[#244074]/30 dark:text-[#9bb8f0]">
                  <Icon size={20} aria-hidden="true" />
                </span>
              </div>
              <h3 className="text-lg font-semibold text-[#1b2537] dark:text-[#e8ecf4]">
                {title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-gray-500 dark:text-[#9aa6bd]">
                {description}
              </p>
            </article>
          ))}
        </div>

        <div className="mt-6 flex flex-col gap-5 rounded-2xl border border-[#244074]/15 bg-[#244074]/[0.04] p-5 dark:border-white/10 dark:bg-white/[0.03] sm:flex-row sm:items-center sm:justify-between sm:p-6">
          <div className="flex items-start gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#244074]/10 text-[#244074] dark:bg-[#244074]/30 dark:text-[#9bb8f0]">
              <Sparkles size={19} aria-hidden="true" />
            </span>
            <div>
              <h3 className="text-sm font-semibold text-[#1b2537] dark:text-[#e8ecf4]">
                Sales records give your AI insights useful context.
              </h3>
              <p className="mt-1 text-sm leading-relaxed text-gray-500 dark:text-[#9aa6bd]">
                Explore how Rebuzz turns business activity into trends and
                suggestions for your next decision.
              </p>
            </div>
          </div>

          <div className="flex shrink-0 flex-col gap-2 sm:flex-row">
            <Button
              asChild
              className="rounded-xl bg-[#244074] text-white hover:bg-[#1b3159]"
            >
              <Link href={token ? "/invoices/add" : "/signup"}>
                {token ? "Create an invoice" : "Start for free"}
                <ArrowRight size={15} className="ml-2" aria-hidden="true" />
              </Link>
            </Button>
            <Button asChild variant="outline" className="rounded-xl">
              <Link
                href={token ? "/dashboard/ai-insights" : "#ai-insights"}
              >
                Explore AI insights
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
