import { CAPABILITIES } from "./content";

/**
 * * ── Capability band ──
 * A navy strip, ruled into four: it separates the hero from the
 * features with something solid rather than a third white section,
 * and it is where the brand's own colour first covers real width. *
 */
export default function CapabilityBand() {
  return (
    <section className="bg-[#244074] px-6 py-8 md:px-16">
      <div className="mx-auto grid max-w-6xl grid-cols-1 gap-y-6 sm:grid-cols-2 lg:grid-cols-4 lg:gap-y-0 lg:divide-x lg:divide-white/10">
        {CAPABILITIES.map(({ icon: Icon, label, value }, i) => (
          <div
            key={label}
            className={`flex items-start gap-3 ${i === 0 ? "lg:pr-6" : "lg:px-6"}`}
          >
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/10 text-[#f0b184]">
              <Icon size={17} />
            </span>
            <div className="min-w-0">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-white/50">
                {label}
              </p>
              <p className="mt-0.5 text-sm font-semibold text-white">{value}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
