import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  Boxes,
  CreditCard,
  ReceiptText,
  UsersRound,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { STAT_ROW_ITEM } from "../dashboardComponents/overviewDash/statRow";

const tools = [
  {
    icon: Boxes,
    title: "Inventory",
    description: "Organize products and keep an eye on stock levels.",
  },
  {
    icon: ReceiptText,
    title: "Expenses",
    description: "Record business spending alongside sales activity.",
  },
  {
    icon: UsersRound,
    title: "Customer records",
    description: "Keep customer details and loyalty activity together.",
  },
  {
    icon: CreditCard,
    title: "Payments",
    description: "Record payment methods and review payment activity.",
  },
  {
    icon: BarChart3,
    title: "Reporting",
    description: "Review sales, products, and business performance.",
  },
];

export default function BusinessToolsSection({ token }: { token?: string }) {
  return (
    <section id="features" className="scroll-mt-20 px-6 py-16 md:px-16">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8 max-w-2xl">
          <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.2em] text-[#E26924]">
            The rest of your POS toolkit
          </p>
          <h2 className="text-balance text-3xl font-bold tracking-tight text-[#1b2537] dark:text-[#e8ecf4] md:text-4xl">
            Everyday tools, all connected.
          </h2>
        </div>

        <div
          className={cn(
            "flex items-start gap-3 -mx-6 snap-x snap-mandatory overflow-x-auto scroll-pl-6 px-6  scrollbar-hide",
            "sm:mx-0 sm:grid sm:grid-cols-3 sm:gap-2 sm:snap-none sm:overflow-visible sm:px-0 sm:pb-0",
            "md:gap-3 lg:grid-cols-5",
          )}
        >
          {tools.map(({ icon: Icon, title, description }) => (
            <article
              key={title}
              className={cn(
                "rounded-2xl border border-gray-200/80 bg-white p-5 dark:border-white/10 dark:bg-[#161d2e]",
                STAT_ROW_ITEM,
              )}
            >
              <span className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-[#eef1f7] text-[#244074] dark:bg-[#244074]/30 dark:text-[#9bb8f0]">
                <Icon size={18} aria-hidden="true" />
              </span>
              <h3 className="text-sm font-semibold text-[#1b2537] dark:text-[#e8ecf4]">
                {title}
              </h3>
              <p className="mt-2 text-xs leading-relaxed text-gray-500 dark:text-[#9aa6bd]">
                {description}
              </p>
            </article>
          ))}
        </div>

        <Link
          href={token ? "/dashboard" : "/signup"}
          className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-[#244074] transition-colors hover:text-[#E26924] dark:text-[#7ba2e3]"
        >
          {token ? "Open your dashboard" : "Explore Rebuzz"}
          <ArrowRight size={15} aria-hidden="true" />
        </Link>
      </div>
    </section>
  );
}
