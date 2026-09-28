import { Building2, CheckCircle2, Globe, Mail } from "lucide-react";
import { COMPANY, WHY_REBUZZ } from "./content";

export default function AboutSection() {
  return (
    <section
      id="about"
      className="scroll-mt-20 bg-[#f7f8fb] px-6 py-20 md:px-16"
    >
      <div className="mx-auto max-w-6xl">
        <div className="mb-12 max-w-2xl">
          <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.2em] text-[#244074]">
            About us
          </p>
          <h2 className="text-3xl font-bold tracking-tight text-gray-900 md:text-4xl">
            Built in Nepal, for businesses here
          </h2>
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <div className="rounded-2xl border border-gray-200/80 bg-white p-8 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900">Who we are</h3>
            <p className="mt-3 text-sm leading-relaxed text-gray-500">
              Rebuzz POS is a Nepal-focused Point of Sale system built for
              cafes, salons, restaurants and service businesses — the shops that
              need invoicing, stock and payments in one place without a back
              office to run them.
            </p>
            <p className="mt-3 text-sm leading-relaxed text-gray-500">
              It is made by {COMPANY.name}, in {COMPANY.address}.
            </p>
          </div>

          <div className="rounded-2xl border border-gray-200/80 bg-white p-8 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900">
              Why Rebuzz POS
            </h3>
            <ul className="mt-4 space-y-3">
              {WHY_REBUZZ.map((line) => (
                <li key={line} className="flex gap-3">
                  <CheckCircle2
                    size={17}
                    aria-hidden
                    className="mt-0.5 shrink-0 text-[#244074]"
                  />
                  <span className="text-sm leading-relaxed text-gray-500">
                    {line}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* The three things someone asks next: who do I write to, who am I
            buying from, and where do I read more. */}
        <dl className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
          {[
            {
              icon: Mail,
              label: "Support email",
              value: COMPANY.email,
              href: `mailto:${COMPANY.email}`,
            },
            {
              icon: Building2,
              label: "Company",
              value: COMPANY.name,
            },
            {
              icon: Globe,
              label: "Website",
              value: COMPANY.website.replace(/^https?:\/\/|\/$/g, ""),
              href: COMPANY.website,
            },
          ].map(({ icon: Icon, label, value, href }) => (
            <div
              key={label}
              className="rounded-2xl border border-[#244074] bg-[#244074] text-white shadow-xl  p-6 text-center"
            >
              <Icon size={18} aria-hidden className="mx-auto text-white" />
              <dt className="mt-1 text-sm font-semibold text-white">{label}</dt>
              <dd className="mt-2 text-sm text-white/80">
                {href ? (
                  <a
                    href={href}
                    target={href.startsWith("http") ? "_blank" : undefined}
                    rel={
                      href.startsWith("http")
                        ? "noopener noreferrer"
                        : undefined
                    }
                    className="transition-colors hover:text-[#E26924]"
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
