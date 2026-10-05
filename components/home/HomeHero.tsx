import Image from "next/image";
import Link from "next/link";
import { ArrowRight, CheckCircle2, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import InvoiceSs from "@/public/InvoiceScreenshot.png";
import {
  AUTH_HIGHLIGHTS,
  DARK_GRID_STYLE,
  GRID_STYLE,
  GUEST_HIGHLIGHTS,
} from "./content";
import NavbarWelcome from "../NavbarWelcome";

/**
 * * ── Hero ──
 * Split rather than centred: the words take the left and the product
 * takes the right, so the claim and the thing it describes are read
 * together. Centred copy above a full-width screenshot made the reader
 * scroll from one to the other, and the screenshot arrived after the
 * decision had already been made. *
 */
export default function HomeHero({ token }: { token?: string }) {
  return (
    // `-mt-[61px] pt-[61px]`: the section begins a navbar's height higher
    // than it sits, so its tint, grid and washes run up behind the bar and
    // there is no line where one surface ends and the other starts. The
    // padding puts the content back where it was.
    <section className="relative -mt-[61px] overflow-hidden border-b border-gray-100 bg-[#f7f8fb] pt-[61px] dark:bg-[#131a29] dark:border-white/10">
      <div
        aria-hidden
        className="absolute inset-0 dark:hidden"
        style={GRID_STYLE}
      />
      <div
        aria-hidden
        className="absolute inset-0 hidden dark:block"
        style={DARK_GRID_STYLE}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -right-32 -top-40 h-[32rem] w-[32rem] rounded-full bg-[#244074]/10 blur-3xl"
      />
      {/* A second wash in the brand's orange, low and to the left, so the
          ground carries both halves of the wordmark. */}
      <div
        aria-hidden
        className="pointer-events-none absolute -left-24 top-1/3 h-80 w-80 rounded-full bg-[#E26924]/10 blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 h-40 bg-gradient-to-b from-transparent to-white dark:to-[#0f1420]"
      />

      <div className="relative mx-auto grid max-w-6xl grid-cols-1 items-center gap-12 px-6 pb-20 pt-16 md:px-16 md:pt-20 lg:grid-cols-12 lg:gap-8 lg:pb-24">
        <div className="lg:col-span-6">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-[#244074]/25 bg-[#244074]/10 px-3 py-1 text-xs font-semibold text-[#244074] dark:text-[#7ba2e3]">
            <Zap size={11} />
            Built for Nepal&lsquo;s businesses
          </span>

          <div className="mt-5 flex flex-col items-left gap-0.5">
            {" "}
            {token && (
              <span>
                <NavbarWelcome />
              </span>
            )}
            <h1 className=" text-balance text-4xl font-bold leading-[1.05] tracking-tighter text-[#1b2537] sm:text-5xl lg:text-[3.5rem] dark:text-[#e8ecf4]">
              {token ? (
                <>
                  Welcome back to{" "}
                  <span className="text-[#244074] dark:text-[#7ba2e3]">Re</span>
                  <span className="text-[#E26924]">Buzz</span>
                </>
              ) : (
                <>
                  Run your business{" "}
                  <span className="relative whitespace-nowrap text-[#244074] dark:text-[#7ba2e3]">
                    smarter
                    {/* Underlined in the brand's orange, the way the wordmark
                      splits: the emphasis lands on the word, not the line. */}
                    <span
                      aria-hidden
                      className="absolute inset-x-0 -bottom-1 h-[6px] rounded-full bg-[#E26924]/30"
                    />
                  </span>
                  , not harder
                </>
              )}
            </h1>
          </div>

          <p className="mt-6 max-w-lg text-base leading-relaxed text-gray-500 md:text-lg dark:text-[#9aa6bd]">
            {token
              ? "Monitor sales, manage inventory, track expenses, and grow your business from a single dashboard."
              : "Invoices, inventory, payments and the numbers behind them — in one dashboard a shop can actually run its day from."}
          </p>

          {/* The two buttons the same width as each other rather than the
              row: on a phone they stack full width, and from sm they sit
              side by side at their own size. */}
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Button
              asChild
              className="h-12 rounded-xl bg-[#244074] px-7 text-base font-semibold text-white shadow-lg shadow-[#244074]/20 transition-all hover:bg-[#1b3159] hover:shadow-[#244074]/30"
            >
              <Link
                href={token ? "/sales-revenue" : "/signup"}
                className="flex items-center justify-center gap-2"
              >
                {token ? "Manage Sales" : "Start for free"}
                <ArrowRight size={16} />
              </Link>
            </Button>

            <Button
              asChild
              variant="outline"
              className="h-12 rounded-xl border-gray-200 bg-white px-7 text-base font-medium text-gray-700 hover:text-white transition-colors hover:bg-[#E26924] dark:bg-[#0f1420] dark:text-[#c3ccdc] dark:border-white/10 dark:hover:text-white"
            >
              <Link href={token ? "/dashboard/growth-tracker" : "/login"}>
                {token ? "View Reports" : "Sign in"}
              </Link>
            </Button>
          </div>

          {/* Two columns, not a centred row: at half the page a single line
              wraps awkwardly, and a list reads as a list. */}
          <ul className="mt-8 grid grid-cols-1 gap-x-6 gap-y-2.5 sm:grid-cols-2">
            {(token ? AUTH_HIGHLIGHTS : GUEST_HIGHLIGHTS).map((item) => (
              <li
                key={item}
                className="flex items-center gap-2 text-sm text-gray-600 dark:text-[#a9b4c7]"
              >
                <CheckCircle2 size={14} className="shrink-0 text-[#E26924]" />
                {item}
              </li>
            ))}
          </ul>
        </div>

        {/* The product. Bleeding past the right edge on wide screens, so it
            reads as a window onto something larger rather than a picture
            pasted into a box. */}
        <div className="relative lg:col-span-6 lg:-mr-24 xl:-mr-32">
          <div
            aria-hidden
            className="pointer-events-none absolute -inset-4 rounded-[2rem] bg-[#244074]/10 blur-2xl"
          />
          <div className="relative overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl shadow-gray-900/10 ring-1 ring-gray-900/5 dark:bg-[#0f1420] dark:border-white/10">
            <div className="flex items-center gap-1.5 border-b border-gray-200 bg-gray-50 px-4 py-2.5 dark:bg-white/5 dark:border-white/10">
              <span className="h-2.5 w-2.5 rounded-full bg-red-400" />
              <span className="h-2.5 w-2.5 rounded-full bg-yellow-400" />
              <span className="h-2.5 w-2.5 rounded-full bg-green-400" />
              <span className="ml-3 rounded-md bg-white px-2 py-0.5 text-[11px] text-gray-400 ring-1 ring-gray-200 dark:ring-white/20 dark:bg-[#0f1420] dark:text-[#7b869b]">
                manager.rebuzzpos.com
              </span>
            </div>
            <Image
              src={InvoiceSs}
              placeholder="blur"
              quality={85}
              width={1000}
              alt="Rebuzz POS dashboard screenshot"
              className="h-auto w-full"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
