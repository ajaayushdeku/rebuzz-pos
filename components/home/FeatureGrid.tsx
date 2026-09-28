import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { FEATURES } from "./content";

/**
 * * ── Features ──
 * The heading beside the cards rather than above them, and the first
 * feature given a column of its own: four equal tiles under a centred
 * title gave the eye nowhere to start, and left a long strip of empty
 * page beside the heading. *
 */
export default function FeatureGrid({ token }: { token?: string }) {
  return (
    <section id="features" className="scroll-mt-20 px-6 py-20 md:px-16">
      <div className="mx-auto grid max-w-6xl grid-cols-1 gap-10 lg:grid-cols-12 lg:gap-12">
        <div className="lg:col-span-4 lg:sticky lg:top-24 lg:self-start">
          <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.2em] text-[#E26924]">
            What you get
          </p>
          <h2 className="text-3xl font-bold tracking-tight text-[#1b2537] md:text-4xl">
            Everything you need to grow
          </h2>
          <p className="mt-4 text-base leading-relaxed text-gray-500">
            A complete toolkit for managing sales, staff, customers and
            inventory — without stitching four tools together.
          </p>

          <Link
            href={token ? "/dashboard" : "/signup"}
            className="mt-6 inline-flex items-center gap-1.5 text-sm font-semibold text-[#244074] transition-colors hover:text-[#E26924]"
          >
            {token ? "Open your dashboard" : "See it on your own numbers"}
            <ArrowRight size={15} aria-hidden />
          </Link>
        </div>

        {/* Four equal tiles, two by two. The lead feature is marked by
            colour rather than by width: spanning it left the fourth card
            alone on a row with a hole beside it. */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:col-span-8">
          {FEATURES.map(({ icon: Icon, title, description, wide }) => (
            <div
              key={title}
              className={`group relative overflow-hidden rounded-2xl border p-6 transition-all duration-200 hover:-translate-y-0.5 ${
                wide
                  ? "border-[#244074] bg-[#244074] text-white"
                  : "border-gray-200/80 bg-white hover:border-[#b9c5da] hover:shadow-lg hover:shadow-[#244074]/10"
              }`}
            >
              {wide && (
                <div
                  aria-hidden
                  className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-[#E26924]/20 blur-2xl"
                />
              )}
              <div
                className={`relative mb-5 flex h-11 w-11 items-center justify-center rounded-xl transition-colors ${
                  wide
                    ? "bg-white/10 text-[#f0b184]"
                    : "bg-[#eef1f7] text-[#244074] group-hover:bg-[#244074] group-hover:text-white"
                }`}
              >
                <Icon size={19} />
              </div>
              <h3
                className={`relative text-base font-semibold ${
                  wide ? "text-white" : "text-gray-900"
                }`}
              >
                {title}
              </h3>
              <p
                className={`relative mt-2 text-sm leading-relaxed ${
                  wide ? "text-white/70" : "text-gray-500"
                }`}
              >
                {description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
