import { Building2, CheckCircle2, Globe, Mail } from "lucide-react";
import { COMPANY } from "./content";

const reasons = [
  "Create invoices and keep sales activity recorded",
  "Manage product, inventory, and customer information together",
  "Review business performance in one place",
  "Use AI insights to spot trends and find practical next steps",
];

export default function GlobalAboutSection() {
  return (
    <section
      id="about"
      className="scroll-mt-20 bg-[#f7f8fb] px-6 py-20 dark:bg-[#131a29] md:px-16"
    >
      <div className="mx-auto max-w-6xl">
        <div className="mb-12 max-w-2xl">
          <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.2em] text-[#244074] dark:text-[#7ba2e3]">
            About Rebuzz
          </p>
          <h2 className="text-balance text-3xl font-bold tracking-tight text-gray-900 dark:text-[#e8ecf4] md:text-4xl">
            Clearer operations for every business day.
          </h2>
          <p className="mt-4 text-base leading-relaxed text-gray-500 dark:text-[#9aa6bd]">
            Rebuzz POS brings sales, invoicing, products, customers, and
            business insights together in one workspace. Use your business
            activity to understand what is happening and decide what to do
            next.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <div className="rounded-2xl border border-gray-200/80 bg-white p-8 dark:border-white/10 dark:bg-[#0f1420]">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-[#e8ecf4]">
              One workspace for daily work
            </h3>
            <p className="mt-3 text-sm leading-relaxed text-gray-500 dark:text-[#9aa6bd]">
              From recording a sale to reviewing business performance, Rebuzz
              keeps core operations connected. AI powered insights can help
              surface patterns and suggestions from your business data.
            </p>
            <p className="mt-4 text-sm text-gray-500 dark:text-[#9aa6bd]">
              Made by {COMPANY.name}.
            </p>
          </div>

          <div className="rounded-2xl border border-gray-200/80 bg-white p-8 dark:border-white/10 dark:bg-[#0f1420]">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-[#e8ecf4]">
              What you can do with Rebuzz
            </h3>
            <ul className="mt-4 space-y-3">
              {reasons.map((reason) => (
                <li key={reason} className="flex gap-3">
                  <CheckCircle2
                    size={17}
                    aria-hidden="true"
                    className="mt-0.5 shrink-0 text-[#244074] dark:text-[#7ba2e3]"
                  />
                  <span className="text-sm leading-relaxed text-gray-500 dark:text-[#9aa6bd]">
                    {reason}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <dl className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
          {[
            {
              icon: Mail,
              label: "Support email",
              value: COMPANY.email,
              href: `mailto:${COMPANY.email}`,
            },
            { icon: Building2, label: "Company", value: COMPANY.name },
            {
              icon: Globe,
              label: "Website",
              value: COMPANY.website.replace(/^https?:\/\/|\/$/g, ""),
              href: COMPANY.website,
            },
          ].map(({ icon: Icon, label, value, href }) => (
            <div
              key={label}
              className="rounded-2xl border border-[#244074] bg-[#244074] p-6 text-center text-white"
            >
              <Icon size={18} aria-hidden="true" className="mx-auto" />
              <dt className="mt-1 text-sm font-semibold">{label}</dt>
              <dd className="mt-2 text-sm text-white/80">
                {href ? (
                  <a
                    href={href}
                    target={href.startsWith("http") ? "_blank" : undefined}
                    rel={
                      href.startsWith("http") ? "noopener noreferrer" : undefined
                    }
                    className="transition-colors hover:text-[#F0B184]"
                  >
                    {value}
                  </a>
                ) : (
                  value
                )}
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}
