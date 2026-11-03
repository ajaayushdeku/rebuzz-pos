import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  Boxes,
  FileText,
  UsersRound,
} from "lucide-react";

const businessTools = [
  {
    icon: FileText,
    title: "Invoices and sales",
    description:
      "Create invoices, apply configured taxes or discounts, and keep each sale recorded.",
  },
  {
    icon: Boxes,
    title: "Products and inventory",
    description:
      "Organize your products and keep stock information connected to daily sales.",
  },
  {
    icon: UsersRound,
    title: "Customers and payments",
    description:
      "Keep customer records, payment activity, and outstanding credit together.",
  },
  {
    icon: BarChart3,
    title: "Business performance",
    description:
      "Review sales and business activity to understand how your operations are moving.",
  },
];

export default function BusinessToolsSection({
  token,
}: {
  token?: string;
}) {
  return (
    <section id="features" className="scroll-mt-20 px-6 py-20 md:px-16">
      <div className="mx-auto max-w-6xl">
        <div className="mb-10 max-w-2xl">
          <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.2em] text-[#E26924]">
            Everyday business tools
          </p>
          <h2 className="text-balance text-3xl font-bold tracking-tight text-[#1b2537] dark:text-[#e8ecf4] md:text-4xl">
            The essentials, connected in one workspace.
          </h2>
          <p className="mt-4 text-base leading-relaxed text-gray-500 dark:text-[#9aa6bd]">
            Bring sales, products, customers, and performance information
            together, then use your business data to guide what comes next.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {businessTools.map(({ icon: Icon, title, description }) => (
            <article
              key={title}
              className="rounded-2xl border border-gray-200/80 bg-white p-6 transition-colors hover:border-[#b9c5da] dark:border-white/10 dark:bg-[#161d2e] dark:hover:border-white/25"
            >
              <span className="mb-5 flex h-11 w-11 items-center justify-center rounded-xl bg-[#eef1f7] text-[#244074] dark:bg-[#244074]/30 dark:text-[#9bb8f0]">
                <Icon size={19} aria-hidden="true" />
              </span>
              <h3 className="text-base font-semibold text-[#1b2537] dark:text-[#e8ecf4]">
                {title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-gray-500 dark:text-[#9aa6bd]">
                {description}
              </p>
            </article>
          ))}
        </div>

        <Link
          href={token ? "/dashboard" : "/signup"}
          className="mt-8 inline-flex items-center gap-2 text-sm font-semibold text-[#244074] transition-colors hover:text-[#E26924] dark:text-[#7ba2e3]"
        >
          {token ? "Open your dashboard" : "Explore Rebuzz"}
          <ArrowRight size={15} aria-hidden="true" />
        </Link>
      </div>
    </section>
  );
}
