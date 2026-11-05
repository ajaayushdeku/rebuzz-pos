import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";
import FinalSignupContactForm from "./FinalSignupContactForm";

export default function FinalSignupSection({
  token,
}: {
  token?: string;
}) {
  return (
    <section className="px-6 pb-20 pt-10 md:px-16">
      <div className="mx-auto grid max-w-6xl overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-xl shadow-slate-900/[0.06] lg:grid-cols-[0.9fr_1.1fr] dark:border-white/10 dark:bg-[#161d2e]">
        <div className="relative isolate flex flex-col justify-center overflow-hidden bg-gradient-to-br from-[#244074] to-[#182d50] px-6 py-9 sm:px-10 sm:py-12 lg:px-12 lg:py-14">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -right-24 -top-20 -z-10 h-72 w-72 rounded-full bg-[#E26924]/20 blur-3xl"
          />
          <span className="mb-6 inline-flex w-fit items-center gap-2 rounded-full border border-white/15 bg-white/[0.07] px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-[#f0c7a8]">
            <Sparkles size={14} aria-hidden="true" />
            Make your next move
          </span>
          <h2 className="max-w-xl text-balance text-3xl font-bold tracking-tight text-white sm:text-4xl md:leading-[1.12]">
            Ready to bring your business into focus?
          </h2>
          <p className="mt-5 max-w-lg text-sm leading-7 text-blue-100/75 sm:text-base">
            Create invoices, keep daily operations organized, and uncover what
            your business data can tell you. Need a hand getting started? Our
            team is one message away.
          </p>
          <Link
            href={token ? "/dashboard" : "/signup"}
            className="mt-7 inline-flex min-h-11 w-fit items-center justify-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-semibold text-[#244074] transition duration-200 hover:-translate-y-0.5 hover:bg-[#f0b184] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#f0b184] focus-visible:ring-offset-2 focus-visible:ring-offset-[#244074]"
          >
            {token ? "Open your dashboard" : "Start free"}
            <ArrowRight size={16} aria-hidden="true" />
          </Link>
          <p className="mt-5 text-xs text-white/55">
            Free plan available · Talk with our team anytime
          </p>
        </div>
        <div className="px-6 py-8 sm:px-10 sm:py-10 lg:px-12 lg:py-12">
          <FinalSignupContactForm />
        </div>
      </div>
    </section>
  );
}
