import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";

export default function FinalSignupSection({
  token,
}: {
  token?: string;
}) {
  return (
    <section className="px-6 pb-20 pt-4 md:px-16">
      <div className="relative mx-auto max-w-6xl overflow-hidden rounded-3xl bg-[#244074] px-6 py-12 text-center sm:px-10 sm:py-14">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-20 -top-24 h-72 w-72 rounded-full bg-[#E26924]/20 blur-3xl"
        />
        <div className="relative mx-auto max-w-2xl">
          <span className="mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 text-[#f0b184]">
            <Sparkles size={22} aria-hidden="true" />
          </span>
          <h2 className="text-balance text-3xl font-bold tracking-tight text-white md:text-4xl">
            Ready to bring your business into focus?
          </h2>
          <p className="mt-4 text-base leading-relaxed text-white/70">
            Create invoices, keep daily operations organized, and explore what
            your business data can tell you.
          </p>
          <Link
            href={token ? "/dashboard" : "/signup"}
            className="mt-7 inline-flex items-center justify-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-semibold text-[#244074] transition-colors hover:bg-[#f0b184] hover:text-[#1b3159]"
          >
            {token ? "Open your dashboard" : "Start free"}
            <ArrowRight size={16} aria-hidden="true" />
          </Link>
        </div>
      </div>
    </section>
  );
}
