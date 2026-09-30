"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  Mail,
  Phone,
  ChevronsLeft,
  ChevronsRight,
  Search,
  X,
  type LucideIcon,
} from "lucide-react";

import { present } from "@/components/aiInsights/AiInsightsErrorState";
import { WhatsAppIcon } from "@/components/ui/WhatsAppIcon";
import { YouTubeIcon } from "@/components/ui/YouTubeIcon";
import { navigationConfig } from "@/lib/config/navigation";
import AskPanel from "@/components/help/AskPanel";
import {
  HELP_CONCEPTS,
  HELP_CONTACT,
  HELP_ERROR_CODES,
  HELP_FAQS,
  HELP_GUIDES,
  HELP_METRICS,
  HELP_PAGES,
  type HelpConcept,
  type HelpFaq,
  type HelpGuide,
} from "@/lib/help/content";

/**
 * Help & Support.
 *
 * Deliberately not built from the app's cards. Everywhere else in Rebuzz is a
 * grid of white panels on a white page; help is a document, and reads better
 * as one — a band to search from, a rail to navigate by, and long sections
 * ruled apart rather than boxed. Arriving here should feel like stepping out
 * of the dashboard, not like another screen of it.
 *
 * One search filters every section at once, matching each entry's own
 * keywords as well as its text: merchants search for "vat", "bill" and
 * "udhaaro" while the app prints "tax", "invoice" and "credit".
 */

const SECTIONS = [
  { id: "guides", label: "Step by step" },
  { id: "pages", label: "The menu, page by page" },
  { id: "faqs", label: "Frequently asked" },
  { id: "concepts", label: "Good to know" },
  { id: "numbers", label: "What the numbers mean" },
  { id: "errors", label: "When something breaks" },
] as const;

type SectionId = (typeof SECTIONS)[number]["id"];

/**
 * The page's running order, for the number above each kicker. Includes the
 * form, which the rail leaves out. A number is a section's place in the
 * document, not in what survived the search — so 02 stays 02.
 */
const SECTION_ORDER: readonly string[] = [...SECTIONS.map((s) => s.id), "ask"];

/** Everything a row can be matched on, lowercased once. */
function haystack(...parts: (string | undefined)[]) {
  return parts.filter(Boolean).join(" ").toLowerCase();
}

interface MenuRow {
  label: string;
  href: string;
  icon: LucideIcon;
  /** The section of the sidebar it sits under, if any. */
  group: string | null;
}

/**
 * The sidebar flattened into rows, read from `navigationConfig` rather than
 * written out again: a page added to the menu appears here on its own, with
 * or without an entry in `HELP_PAGES`.
 */
const MENU_ROWS = navigationConfig.flatMap<MenuRow>((item) =>
  item.type === "section"
    ? item.items.map((sub) => ({ ...sub, group: item.label }))
    : [{ label: item.label, href: item.href, icon: item.icon, group: null }],
);

export default function HelpScreen() {
  const [query, setQuery] = useState("");
  const [openGuide, setOpenGuide] = useState<string | null>(null);
  const [openFaq, setOpenFaq] = useState<string | null>(null);
  const [railOpen, setRailOpen] = useState(true);
  const q = query.trim().toLowerCase();

  const guides = useMemo(
    () =>
      !q
        ? HELP_GUIDES
        : HELP_GUIDES.filter((g) =>
            haystack(
              g.title,
              g.summary,
              g.note,
              g.steps.join(" "),
              g.keywords.join(" "),
            ).includes(q),
          ),
    [q],
  );

  const concepts = useMemo(
    () =>
      !q
        ? HELP_CONCEPTS
        : HELP_CONCEPTS.filter((c) =>
            haystack(c.term, c.body, c.watchOut, c.keywords.join(" ")).includes(
              q,
            ),
          ),
    [q],
  );

  const pages = useMemo(
    () =>
      !q
        ? MENU_ROWS
        : MENU_ROWS.filter((r) => {
            const entry = HELP_PAGES[r.href];
            return haystack(
              r.label,
              r.href,
              r.group ?? undefined,
              entry?.what,
              entry?.shows,
            ).includes(q);
          }),
    [q],
  );

  const faqs = useMemo(() => {
    if (!q) return HELP_FAQS;
    return HELP_FAQS.map((g) => ({
      ...g,
      items: g.items.filter((f) => haystack(g.group, f.q, f.a).includes(q)),
    })).filter((g) => g.items.length > 0);
  }, [q]);

  const faqCount = faqs.reduce((n, g) => n + g.items.length, 0);

  const metrics = useMemo(
    () =>
      !q
        ? HELP_METRICS
        : HELP_METRICS.filter((m) =>
            haystack(m.label, m.meaning, m.where).includes(q),
          ),
    [q],
  );

  const errors = useMemo(() => {
    const rows = HELP_ERROR_CODES.map((code) => ({ code, ...present(code) }));
    return !q
      ? rows
      : rows.filter((r) => haystack(r.code, r.title, r.hint).includes(q));
  }, [q]);

  const counts: Record<SectionId, number> = {
    guides: guides.length,
    pages: pages.length,
    faqs: faqCount,
    concepts: concepts.length,
    numbers: metrics.length,
    errors: errors.length,
  };
  const total =
    guides.length +
    pages.length +
    faqCount +
    concepts.length +
    metrics.length +
    errors.length;
  const active = useActiveSection();

  return (
    <div className="flex flex-col gap-8">
      <SearchBand
        value={query}
        onChange={setQuery}
        matches={q ? total : null}
        onJump={(id) =>
          document
            .getElementById(id)
            ?.scrollIntoView({ behavior: "smooth", block: "start" })
        }
      />

      {total === 0 ? (
        <NoMatches query={query} onClear={() => setQuery("")} />
      ) : (
        <div className="flex items-start gap-10">
          {/* Below lg the sections just follow one another. */}
          <nav
            aria-label="Help sections"
            className={`sticky top-6 hidden shrink-0 transition-[width] duration-200 lg:block ${
              railOpen ? "w-52" : "w-12"
            }`}
          >
            <div
              className={`mb-3 flex items-center gap-2 ${
                railOpen ? "pl-3 pr-1" : "justify-center"
              }`}
            >
              {railOpen && (
                <p className="flex-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-[#9aa0a6] dark:text-[#9aa6bd]">
                  On this page
                </p>
              )}
              {/* Collapsed, the numbers stay: they say where you are. */}
              <button
                type="button"
                onClick={() => setRailOpen((o) => !o)}
                aria-expanded={railOpen}
                aria-label={
                  railOpen ? "Collapse section list" : "Expand section list"
                }
                title={railOpen ? "Collapse" : "Expand"}
                className="cursor-pointer rounded-md p-1 text-[#9aa0a6] transition-colors hover:bg-[#f1f3f4] hover:text-[#5f6368] dark:hover:text-[#e8ecf4] dark:hover:bg-white/10 dark:text-[#9aa6bd]"
              >
                {railOpen ? (
                  <ChevronsLeft size={14} aria-hidden />
                ) : (
                  <ChevronsRight size={14} aria-hidden />
                )}
              </button>
            </div>

            <ul className="flex flex-col">
              {SECTIONS.map((s) => {
                const isActive = active === s.id;
                const number = String(SECTION_ORDER.indexOf(s.id) + 1).padStart(
                  2,
                  "0",
                );
                return (
                  <li key={s.id}>
                    <a
                      href={`#${s.id}`}
                      aria-current={isActive ? "true" : undefined}
                      title={railOpen ? undefined : s.label}
                      className={`flex items-center gap-2 border-l-2 py-2 text-[13px] transition-colors ${
                        railOpen ? "pl-3 pr-2" : "justify-center pl-0 pr-0"
                      } ${
                        isActive
                          ? "border-[#1a73e8] font-medium text-[#1a73e8] dark:border-[#7ba2e3] dark:text-[#7ba2e3]"
                          : "border-[#e8eaed] text-[#5f6368] hover:border-[#dadce0] hover:text-[#3c4043] dark:hover:border-white/25 dark:hover:text-[#e8ecf4] dark:border-white/10 dark:text-[#a9b4c7]"
                      }`}
                    >
                      <span
                        className={`shrink-0 tabular-nums text-[11px] ${
                          isActive
                            ? "text-[#1a73e8] dark:text-[#7ba2e3]"
                            : "text-[#9aa0a6] dark:text-[#9aa6bd]"
                        }`}
                      >
                        {number}
                      </span>
                      {railOpen && (
                        <>
                          <span className="min-w-0 flex-1 truncate">
                            {s.label}
                          </span>
                          <span className="shrink-0 text-[11px] tabular-nums text-[#9aa0a6] dark:text-[#9aa6bd]">
                            {counts[s.id]}
                          </span>
                        </>
                      )}
                    </a>
                  </li>
                );
              })}
            </ul>
          </nav>

          <div className="flex min-w-0 flex-1 flex-col gap-14">
            {guides.length > 0 && (
              <Section
                id="guides"
                kicker="Do it"
                title="Step by step"
                lede="Each guide is one job, in the order the screen asks for it."
              >
                <ul className="divide-y divide-[#e8eaed] border-y border-[#e8eaed] dark:border-white/10 dark:divide-white/10">
                  {guides.map((g) => (
                    <GuideRow
                      key={g.id}
                      guide={g}
                      open={openGuide === g.id}
                      onToggle={() =>
                        setOpenGuide(openGuide === g.id ? null : g.id)
                      }
                    />
                  ))}
                </ul>
              </Section>
            )}

            {pages.length > 0 && (
              <Section
                id="pages"
                kicker="Find it"
                title="The menu, page by page"
                lede="What each screen in the sidebar is for, and what it puts in front of you."
              >
                <MenuDirectory rows={pages} />
              </Section>
            )}

            {faqCount > 0 && (
              <Section
                id="faqs"
                kicker="Ask it"
                title="Frequently asked"
                lede="The questions support answers most often, about the whole POS rather than only this dashboard."
              >
                <div className="flex flex-col gap-8">
                  {faqs.map((g) => (
                    <div key={g.group}>
                      <p className="pb-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-[#9aa0a6] dark:text-[#9aa6bd]">
                        {g.group}
                      </p>
                      <dl className="border-t border-[#e8eaed] dark:border-white/10">
                        {g.items.map((f) => (
                          <FaqRow
                            key={f.q}
                            faq={f}
                            open={openFaq === f.q}
                            onToggle={() =>
                              setOpenFaq(openFaq === f.q ? null : f.q)
                            }
                          />
                        ))}
                      </dl>
                    </div>
                  ))}
                </div>
              </Section>
            )}

            {concepts.length > 0 && (
              <Section
                id="concepts"
                kicker="Understand it"
                title="Good to know"
                lede="Not a glossary of everything — the few ideas that cost money when they are misread."
              >
                <div className="flex flex-col gap-8">
                  {concepts.map((c) => (
                    <ConceptBlock key={c.id} concept={c} />
                  ))}
                </div>
              </Section>
            )}

            {metrics.length > 0 && (
              <Section
                id="numbers"
                kicker="Read it"
                title="What the numbers mean"
                lede="The words the dashboards use, in plain terms."
              >
                <dl className="divide-y divide-[#e8eaed] border-y border-[#e8eaed] dark:border-white/10 dark:divide-white/10">
                  {metrics.map((m) => (
                    <div
                      key={m.label}
                      className="flex flex-col gap-1 py-4 sm:flex-row sm:gap-8"
                    >
                      <dt className="w-full shrink-0 text-[13px] font-medium text-[#3c4043] sm:w-52 dark:text-[#e8ecf4]">
                        {m.label}
                        <span className="mt-0.5 block text-[11px] font-normal text-[#9aa0a6] dark:text-[#9aa6bd]">
                          {m.where}
                        </span>
                      </dt>
                      <dd className="min-w-0 flex-1 text-[13px] leading-relaxed text-[#5f6368] dark:text-[#a9b4c7]">
                        {m.meaning}
                      </dd>
                    </div>
                  ))}
                </dl>
              </Section>
            )}

            {errors.length > 0 && (
              <Section
                id="errors"
                kicker="Fix it"
                title="When something breaks"
                lede="Every failure panel prints a code in its corner. This is what each one means."
              >
                <dl className="divide-y divide-[#e8eaed] border-y border-[#e8eaed] dark:border-white/10 dark:divide-white/10">
                  {errors.map((e) => (
                    <div
                      key={e.code}
                      className="flex flex-col gap-1.5 py-4 sm:flex-row sm:gap-8"
                    >
                      <dt className="w-full shrink-0 sm:w-52">
                        <code className="rounded bg-[#f1f3f4] px-1.5 py-0.5 font-mono text-[10px] tracking-wide text-[#5f6368] dark:text-[#a9b4c7] dark:bg-white/10">
                          {e.code}
                        </code>
                      </dt>
                      <dd className="min-w-0 flex-1">
                        <p className="text-[13px] font-medium text-[#3c4043] dark:text-[#e8ecf4]">
                          {e.title}
                        </p>
                        <p className="mt-1 text-[13px] leading-relaxed text-[#5f6368] dark:text-[#a9b4c7]">
                          {e.hint}
                        </p>
                        {e.action && (
                          <Link
                            href={e.action.href}
                            className="mt-2 inline-flex items-center gap-1 text-[12px] font-medium text-[#1a73e8] hover:underline dark:text-[#7ba2e3]"
                          >
                            {e.action.label}
                            <ArrowRight size={12} aria-hidden />
                          </Link>
                        )}
                      </dd>
                    </div>
                  ))}
                </dl>
              </Section>
            )}

            {/* Never filtered: with nothing found, asking is what's left. */}
            <Section
              id="ask"
              kicker="Still stuck"
              title="Write to us"
              lede="A question comes back by email. Feedback needs no reply and asks for nothing about you."
            >
              <AskPanel />
              <ContactStrip />
            </Section>
          </div>
        </div>
      )}
    </div>
  );
}

// ── The band at the top ───────────────────────────────────────────────────

function SearchBand({
  value,
  onChange,
  matches,
  onJump,
}: {
  value: string;
  onChange: (v: string) => void;
  /** Result count while searching; null when the field is empty. */
  matches: number | null;
  onJump: (id: SectionId) => void;
}) {
  return (
    // The one tinted surface in the app: help is somewhere else.
    <section className="overflow-hidden rounded-3xl border border-[#e3ecfd] bg-gradient-to-br from-[#f4f8ff] via-white to-[#faf6ff] dark:from-[#182039] dark:via-[#161d2e] dark:to-[#1e1a33] px-6 py-9 md:px-10 md:py-11 dark:border-white/10">
      <div className="mx-auto max-w-2xl text-center">
        <h2 className="text-[19px] font-medium text-[#3c4043] md:text-[22px] dark:text-[#e8ecf4]">
          What do you need help with?
        </h2>
        <p className="mx-auto mt-1.5 max-w-md text-[13px] leading-relaxed text-[#5f6368] dark:text-[#a9b4c7]">
          Search the guides, or jump to a section below.
        </p>

        <div className="relative mt-5">
          <Search
            size={16}
            aria-hidden
            className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#9aa0a6] dark:text-[#9aa6bd]"
          />
          <input
            type="search"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder="tax, refund, staff, insights…"
            aria-label="Search help"
            // WebKit draws its own clear cross on `type="search"`, which
            // put two in the field. Ours is always visible; that one is not.
            className="h-12 w-full appearance-none rounded-full border border-[#dadce0] bg-white dark:bg-white/5 pl-11 pr-11 text-[14px] text-[#3c4043] outline-none transition placeholder:text-[#9aa0a6] focus:border-transparent focus:ring-2 focus:ring-blue-500 [&::-webkit-search-cancel-button]:appearance-none [&::-webkit-search-decoration]:appearance-none dark:placeholder:text-[#7b869b] dark:border-white/15 dark:text-[#e8ecf4]"
          />
          {value && (
            <button
              type="button"
              onClick={() => onChange("")}
              aria-label="Clear search"
              className="absolute right-3.5 top-1/2 -translate-y-1/2 cursor-pointer rounded-full p-1 text-[#9aa0a6] transition-colors hover:bg-[#f1f3f4] hover:text-[#5f6368] dark:hover:text-[#e8ecf4] dark:hover:bg-white/10 dark:text-[#9aa6bd]"
            >
              <X size={14} />
            </button>
          )}
        </div>

        {matches === null ? (
          <ul className="mt-4 flex flex-wrap items-center justify-center gap-2">
            {SECTIONS.map((s) => (
              <li key={s.id}>
                <button
                  type="button"
                  onClick={() => onJump(s.id)}
                  className="cursor-pointer rounded-full border border-[#dadce0] bg-white/80 dark:bg-white/5 px-3 py-1.5 text-[12px] text-[#3c4043] transition-colors hover:bg-white dark:border-white/15 dark:text-[#e8ecf4] dark:hover:bg-white/10"
                >
                  {s.label}
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-4 text-[12px] text-[#5f6368] dark:text-[#a9b4c7]">
            {matches} {matches === 1 ? "result" : "results"}
          </p>
        )}

        {/* Its own line: it leaves the app. */}
        <div className="mt-5 flex items-center justify-center gap-2 border-t border-[#e3ecfd] pt-5 dark:border-white/10">
          <span className="text-[12px] text-[#5f6368] dark:text-[#a9b4c7]">
            Prefer to watch?
          </span>
          <WatchButton
            video={HELP_CONTACT.youtube}
            name="Rebuzz POS tutorials"
            label="Video tutorials"
          />
        </div>
      </div>
    </section>
  );
}

// ── Sections ──────────────────────────────────────────────────────────────

function Section({
  id,
  kicker,
  title,
  lede,
  children,
}: {
  id: string;
  kicker: string;
  title: string;
  lede: string;
  children: React.ReactNode;
}) {
  return (
    // `scroll-mt`: the navbar is fixed, and would cover the heading.
    <section id={id} className="scroll-mt-24">
      <p className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-[#1a73e8] dark:text-[#7ba2e3]">
        <span className="tabular-nums ">
          {String(SECTION_ORDER.indexOf(id) + 1).padStart(2, "0")}
        </span>
        <span aria-hidden className="h-px w-2 bg-[#1a73e8]" />
        {kicker}
      </p>
      <h2 className="mt-1.5 text-[20px] font-medium tracking-tight text-[#3c4043] md:text-[22px] dark:text-[#e8ecf4]">
        {title}
      </h2>
      <p className="mt-1.5 max-w-xl text-[13px] leading-relaxed text-[#5f6368] dark:text-[#a9b4c7]">
        {lede}
      </p>
      <div className="mt-5">{children}</div>
    </section>
  );
}

/**
 * Opens and closes on its own height.
 *
 * A grid track animated from `0fr` to `1fr`: `height: auto` is not something
 * CSS can transition, and a max-height guess either clips a long guide or
 * makes a short one drift open at the wrong speed.
 *
 * The content stays mounted so it has a height to grow into, and `inert`
 * takes it out of tab order and the accessibility tree while it is closed —
 * otherwise Tab would land on links inside a row that looks shut.
 */
function Collapse({ open, children }: { open: boolean; children: ReactNode }) {
  return (
    <div
      inert={!open}
      className={`grid transition-[grid-template-rows,opacity] duration-200 ease-out motion-reduce:transition-none ${
        open ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
      }`}
    >
      <div className="overflow-hidden">{children}</div>
    </div>
  );
}

function GuideRow({
  guide,
  open,
  onToggle,
}: {
  guide: HelpGuide;
  open: boolean;
  onToggle: () => void;
}) {
  const Icon = guide.icon;
  return (
    <li>
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        className="group flex w-full cursor-pointer items-center gap-4 py-4 text-left"
      >
        <Icon
          size={16}
          aria-hidden
          className={`shrink-0 transition-colors ${
            open
              ? "text-[#1a73e8] dark:text-[#7ba2e3]"
              : "text-[#9aa0a6] group-hover:text-[#5f6368] dark:group-hover:text-[#e8ecf4] dark:text-[#9aa6bd]"
          }`}
        />
        <span className="min-w-0 flex-1">
          <span
            className={`block truncate text-[14px] transition-colors ${
              open
                ? "font-medium text-[#1a73e8] dark:text-[#7ba2e3]"
                : "text-[#3c4043] dark:text-[#e8ecf4]"
            }`}
          >
            {guide.title}
          </span>
          <span className="mt-0.5 block truncate text-[12px] text-[#9aa0a6] dark:text-[#9aa6bd]">
            {guide.summary}
          </span>
        </span>
        {/* A plus that becomes a minus: "more here", not "goes somewhere". */}
        <span
          aria-hidden
          className="relative h-4 w-4 shrink-0 text-[#9aa0a6] group-hover:text-[#5f6368] dark:group-hover:text-[#e8ecf4] dark:text-[#9aa6bd]"
        >
          <span className="absolute left-0 top-1/2 h-px w-4 -translate-y-1/2 bg-current" />
          <span
            className={`absolute left-1/2 top-0 h-4 w-px -translate-x-1/2 bg-current transition-transform duration-200 ${
              open ? "scale-y-0" : "scale-y-100"
            }`}
          />
        </span>
      </button>

      <Collapse open={open}>
        {/* An accent rail marks the open guide, in place of a box. */}
        <div className="mb-5 ml-8 border-l-2 border-[#e3ecfd] pl-5 dark:border-white/10">
          <ol className="flex flex-col gap-3">
            {guide.steps.map((step, i) => (
              <li key={i} className="flex gap-3">
                <span className="mt-0.5 text-[11px] font-semibold tabular-nums text-[#1a73e8] dark:text-[#7ba2e3]">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span className="text-[13px] leading-relaxed text-[#5f6368] dark:text-[#a9b4c7]">
                  {step}
                </span>
              </li>
            ))}
          </ol>

          {guide.note && (
            <p className="mt-4 text-[12px] leading-relaxed text-[#9aa0a6] dark:text-[#9aa6bd]">
              {guide.note}
            </p>
          )}

          <div className="mt-4 flex flex-wrap items-center gap-2">
            <Link
              href={guide.href}
              className="inline-flex items-center gap-1.5 rounded-full border border-[#dadce0] bg-white dark:bg-white/5 px-3 py-1.5 text-[12px] font-medium text-[#3c4043] transition-colors hover:bg-[#f8f9fa] dark:hover:bg-white/5 dark:border-white/15 dark:text-[#e8ecf4]"
            >
              {guide.hrefLabel}
              <ArrowUpRight size={12} aria-hidden />
            </Link>

            <WatchButton video={guide.video} name={guide.title} />
          </div>
        </div>
      </Collapse>
    </li>
  );
}

/** The sidebar, described, in the menu's own order. */
function MenuDirectory({ rows }: { rows: MenuRow[] }) {
  return (
    <div className="flex flex-col">
      {rows.map((row, i) => {
        const entry = HELP_PAGES[row.href];
        const Icon = row.icon;
        // Printed when the group changes, which in menu order means once.
        const heading = row.group !== (rows[i - 1]?.group ?? null);

        return (
          <div key={row.href}>
            {heading && row.group && (
              <p className="mt-7 pb-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-[#9aa0a6] first:mt-0 dark:text-[#9aa6bd]">
                {row.group}
              </p>
            )}

            <div className="flex flex-col gap-1.5 border-t border-[#e8eaed] py-4 sm:flex-row sm:gap-8 dark:border-white/10">
              <div className="w-full shrink-0 sm:w-52">
                <Link
                  href={row.href}
                  className="group inline-flex items-center gap-2 text-[13px] font-medium text-[#3c4043] transition-colors hover:text-[#1a73e8] dark:hover:text-[#a8c4ee] dark:text-[#e8ecf4]"
                >
                  <Icon
                    size={14}
                    aria-hidden
                    className="shrink-0 text-[#9aa0a6] transition-colors group-hover:text-[#1a73e8] dark:group-hover:text-[#a8c4ee] dark:text-[#9aa6bd]"
                  />
                  {row.label}
                  <ArrowUpRight
                    size={12}
                    aria-hidden
                    className="shrink-0 text-[#dadce0] transition-colors group-hover:text-[#1a73e8] dark:group-hover:text-[#a8c4ee] dark:text-[#3d4657]"
                  />
                </Link>
              </div>

              <div className="min-w-0 flex-1">
                {entry ? (
                  <>
                    <p className="text-[13px] leading-relaxed text-[#5f6368] dark:text-[#a9b4c7]">
                      {entry.what}
                    </p>
                    <p className="mt-1.5 text-[12px] leading-relaxed text-[#9aa0a6] dark:text-[#9aa6bd]">
                      <span className="font-medium text-[#5f6368] dark:text-[#a9b4c7]">
                        Shows{" "}
                      </span>
                      {entry.shows}
                    </p>
                  </>
                ) : (
                  <p className="text-[13px] text-[#9aa0a6] dark:text-[#9aa6bd]">
                    Not described yet.
                  </p>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

/** A <dl>, so a question and its answer are announced as a pair. */
function FaqRow({
  faq,
  open,
  onToggle,
}: {
  faq: HelpFaq;
  open: boolean;
  onToggle: () => void;
}) {
  return (
    <>
      <dt className="border-b border-[#e8eaed] dark:border-white/10">
        <button
          type="button"
          onClick={onToggle}
          aria-expanded={open}
          className="group flex w-full cursor-pointer items-center gap-4 py-3.5 text-left"
        >
          <span
            className={`min-w-0 flex-1 text-[13px] transition-colors ${
              open
                ? "font-medium text-[#1a73e8] dark:text-[#7ba2e3]"
                : "text-[#3c4043] dark:text-[#e8ecf4]"
            }`}
          >
            {faq.q}
          </span>
          {/* The guides' plus-to-minus, so both read as one control. */}
          <span
            aria-hidden
            className="relative h-3.5 w-3.5 shrink-0 text-[#9aa0a6] group-hover:text-[#5f6368] dark:group-hover:text-[#e8ecf4] dark:text-[#9aa6bd]"
          >
            <span className="absolute left-0 top-1/2 h-px w-3.5 -translate-y-1/2 bg-current" />
            <span
              className={`absolute left-1/2 top-0 h-3.5 w-px -translate-x-1/2 bg-current transition-transform duration-200 ${
                open ? "scale-y-0" : "scale-y-100"
              }`}
            />
          </span>
        </button>
      </dt>
      {/* The <dd> stays in the list either way, so the pair is always a term
          and its definition; only its border follows the open state, since a
          rule under a row of no height would read as a double line. */}
      <dd
        className={
          open ? "border-b border-[#e8eaed] dark:border-white/10" : undefined
        }
      >
        <Collapse open={open}>
          <div className="pb-4 pr-8">
            <p className="mt-2 text-[13px] leading-relaxed text-[#5f6368] dark:text-[#a9b4c7]">
              {faq.a}
            </p>
            <div className="mt-3">
              <WatchButton video={faq.video} name={faq.q} />
            </div>
          </div>
        </Collapse>
      </dd>
    </>
  );
}

/**
 * "Watch tutorial", whether or not there is one yet.
 *
 * Without a video it stays in place, muted and saying why: a button that
 * comes and goes between releases is harder to learn than one that waits.
 */
function WatchButton({
  video,
  name,
  label = "Watch tutorial",
}: {
  video?: string;
  /** What the tutorial is of, for the screen-reader label. */
  name: string;
  /** The words on the button, where "Watch tutorial" is not what it does. */
  label?: string;
}) {
  if (!video) {
    return (
      <span
        role="button"
        aria-disabled="true"
        title="Tutorial coming soon"
        className="inline-flex cursor-not-allowed items-center gap-1.5 rounded-full border border-gray-200 bg-gray-50 px-3 py-1.5 text-[12px] font-medium text-[#9aa0a6] dark:border-white/15 dark:text-[#9aa6bd] dark:bg-white/5"
      >
        <YouTubeIcon size={14} className="text-[#ff0000]/40" />
        {label}
        <span className="ml-0.5 rounded-full bg-white px-1.5 py-px text-[10px] font-semibold tracking-wide text-[#9aa0a6] dark:bg-white/15 dark:text-[#c3ccdc]">
          Soon
        </span>
      </span>
    );
  }

  return (
    <a
      href={video}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={`${label}: ${name}`}
      className="inline-flex items-center gap-1.5 rounded-full bg-[#ff0000] px-3 py-1.5 text-[12px] font-medium text-white transition-colors hover:bg-[#cc0000]"
    >
      <YouTubeIcon size={14} />
      {label}
      <ArrowUpRight size={12} aria-hidden />
    </a>
  );
}

function ConceptBlock({ concept }: { concept: HelpConcept }) {
  return (
    <div className="flex flex-col gap-1.5 sm:flex-row sm:gap-8">
      <h3 className="w-full shrink-0 text-[14px] font-medium text-[#3c4043] sm:w-52 dark:text-[#e8ecf4]">
        {concept.term}
      </h3>
      <div className="min-w-0 flex-1">
        <p className="text-[13px] leading-relaxed text-[#5f6368] dark:text-[#a9b4c7]">
          {concept.body}
        </p>
        {concept.watchOut && (
          // Amber, and only here: the sentence that prevents a mistake.
          <p className="mt-2.5 border-l-2 border-amber-300 pl-3 text-[12px] leading-relaxed text-amber-800 dark:border-amber-400/40 dark:text-amber-200">
            {concept.watchOut}
          </p>
        )}
      </div>
    </div>
  );
}

function NoMatches({ query, onClear }: { query: string; onClear: () => void }) {
  return (
    <div className="py-20 text-center">
      <p className="text-[15px] text-[#3c4043] dark:text-[#e8ecf4]">
        Nothing here matches “{query}”.
      </p>
      <p className="mx-auto mt-1.5 max-w-sm text-[13px] leading-relaxed text-[#9aa0a6] dark:text-[#9aa6bd]">
        Try a plainer word — tax, refund, staff — or get in touch and
        we&rsquo;ll answer it directly.
      </p>
      <button
        type="button"
        onClick={onClear}
        className="mt-5 cursor-pointer rounded-full border border-[#dadce0] bg-white dark:bg-white/5 px-4 py-2 text-[12px] font-medium text-[#3c4043] transition-colors hover:bg-[#f8f9fa] dark:hover:bg-white/5 dark:border-white/15 dark:text-[#e8ecf4]"
      >
        Clear search
      </button>
    </div>
  );
}

// ── The end of the page ───────────────────────────────────────────────────

/** Lucide's icons and the WhatsApp mark are both just this. */
interface Channel {
  icon: React.ComponentType<{ size?: number; className?: string }>;
  label: string;
  lines: ReactNode[];
}

function ContactStrip() {
  const { email, whatsapp, phones, youtube } = HELP_CONTACT;

  const channels: Channel[] = [
    email && {
      icon: Mail,
      label: "Email",
      lines: [
        <a key="e" href={`mailto:${email}`} className={channelLink}>
          {email}
        </a>,
      ],
    },
    whatsapp && {
      icon: WhatsAppIcon,
      label: "WhatsApp",
      lines: [
        <a
          key="w"
          href={`https://wa.me/${whatsapp}`}
          target="_blank"
          rel="noopener noreferrer"
          className={channelLink}
        >
          Start a chat
        </a>,
      ],
    },
    phones.length > 0 && {
      icon: Phone,
      label: phones.length > 1 ? "Call us" : "Call",
      // Each number is its own line: on a phone these are the tap targets.
      lines: phones.map((p) => (
        <a key={p} href={`tel:${p.replace(/\s/g, "")}`} className={channelLink}>
          {p}
        </a>
      )),
    },
    {
      icon: YouTubeIcon,
      label: "YouTube",
      lines: [
        youtube ? (
          <a
            key="y"
            href={youtube}
            target="_blank"
            rel="noopener noreferrer"
            className={channelLink}
          >
            Watch the tutorials
          </a>
        ) : (
          <span key="y" className="text-[13px] text-white/40">
            Tutorials coming soon
          </span>
        ),
      ],
    },
  ].filter(Boolean) as Channel[];

  return (
    // The page's one dark block, closing the form above it.
    <div className="mt-8 rounded-2xl bg-[#202124] px-6 py-6 text-white">
      <p className="text-[13px] font-medium">Or reach us directly</p>
      <p className="mt-1 max-w-md text-[12px] leading-relaxed text-white/60">
        Mention the screen you were on and, if an error appeared, the code in
        its corner — it points straight at what failed.
      </p>

      {channels.length > 0 ? (
        <dl className="mt-5 grid grid-cols-1 gap-x-8 gap-y-5 sm:grid-cols-2 lg:grid-cols-4">
          {channels.map((c) => {
            const Icon = c.icon;
            return (
              <div key={c.label} className="min-w-0">
                <dt className="flex items-center gap-2 text-[11px] font-medium uppercase tracking-[0.08em] text-white/50">
                  <Icon size={13} className="shrink-0" />
                  {c.label}
                </dt>
                <dd className="mt-1.5 flex flex-col gap-0.5">{c.lines}</dd>
              </div>
            );
          })}
        </dl>
      ) : (
        <p className="mt-4 text-[12px] text-white/50">
          Support contact details haven&rsquo;t been added yet.
        </p>
      )}
    </div>
  );
}

const channelLink =
  "w-fit text-[13px] text-white/90 underline-offset-4 transition-colors hover:text-white hover:underline";

// ── Which section the reader is in ────────────────────────────────────────

/**
 * Highlights the rail entry for the section being read.
 *
 * A reading line, not an IntersectionObserver band: a band catches both the
 * section jumped to and the one above it, and the earlier one wins — the
 * off-by-one the rail used to show. "The last section whose top has passed
 * the line" has one answer at any scroll position.
 *
 * The listener goes on the shell's scroller; `main` is what scrolls, so a
 * window listener would never fire.
 */
function useActiveSection(): SectionId | null {
  const [active, setActive] = useState<SectionId | null>(null);

  useEffect(() => {
    const scroller = document.querySelector("[data-app-scroll]");
    const target: HTMLElement | Window =
      (scroller as HTMLElement | null) ?? window;

    let frame = 0;
    const measure = () => {
      frame = 0;
      const top =
        scroller instanceof HTMLElement
          ? scroller.getBoundingClientRect().top
          : 0;
      // Where a heading sits once it has been scrolled to.
      const line = top + 120;

      let current: SectionId | null = null;
      for (const s of SECTIONS) {
        const el = document.getElementById(s.id);
        if (!el) continue;
        if (el.getBoundingClientRect().top <= line) current = s.id;
      }

      // Above the first heading, the first section is the one being read.
      setActive(
        current ??
          SECTIONS.find((s) => document.getElementById(s.id))?.id ??
          null,
      );
    };

    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(measure);
    };

    measure();
    target.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      if (frame) cancelAnimationFrame(frame);
      target.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
    // Sections come and go with the search, so this re-measures on every
    // render rather than only on mount.
  });

  return active;
}
