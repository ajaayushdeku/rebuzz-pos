"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  Mail,
  MessageCircle,
  Phone,
  Search,
  X,
  type LucideIcon,
} from "lucide-react";

import { present } from "@/components/aiInsights/AiInsightsErrorState";
import { navigationConfig } from "@/lib/config/navigation";
import {
  HELP_CONCEPTS,
  HELP_CONTACT,
  HELP_ERROR_CODES,
  HELP_GUIDES,
  HELP_METRICS,
  HELP_PAGES,
  type HelpConcept,
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
  { id: "concepts", label: "Good to know" },
  { id: "numbers", label: "What the numbers mean" },
  { id: "errors", label: "When something breaks" },
] as const;

type SectionId = (typeof SECTIONS)[number]["id"];

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
 * The sidebar, flattened into rows, in the order the menu itself lists them.
 *
 * Read from `navigationConfig` rather than written out again, so a page added
 * to the menu appears here on its own. One without an entry in `HELP_PAGES`
 * is still listed — a described page and an undescribed one are both better
 * than a missing one — and only its description is left blank.
 */
const MENU_ROWS = navigationConfig.flatMap<MenuRow>((item) =>
  item.type === "section"
    ? item.items.map((sub) => ({ ...sub, group: item.label }))
    : [{ label: item.label, href: item.href, icon: item.icon, group: null }],
);

export default function HelpScreen() {
  const [query, setQuery] = useState("");
  const [openGuide, setOpenGuide] = useState<string | null>(null);
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
    concepts: concepts.length,
    numbers: metrics.length,
    errors: errors.length,
  };
  const total =
    guides.length +
    pages.length +
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
          {/* The rail is the page's spine on a wide screen. Below lg the
              sections simply follow one another, which is the order they
              should be read in anyway. */}
          <nav
            aria-label="Help sections"
            className="sticky top-6 hidden w-52 shrink-0 lg:block"
          >
            <p className="mb-3 pl-3 text-[10px] font-semibold uppercase tracking-[0.12em] text-[#9aa0a6]">
              On this page
            </p>
            <ul className="flex flex-col">
              {SECTIONS.map((s) => {
                const isActive = active === s.id;
                return (
                  <li key={s.id}>
                    <a
                      href={`#${s.id}`}
                      aria-current={isActive ? "true" : undefined}
                      className={`flex items-center justify-between gap-2 border-l-2 py-2 pl-3 pr-2 text-[13px] transition-colors ${
                        isActive
                          ? "border-[#1a73e8] font-medium text-[#1a73e8]"
                          : "border-[#e8eaed] text-[#5f6368] hover:border-[#dadce0] hover:text-[#3c4043]"
                      }`}
                    >
                      <span className="truncate">{s.label}</span>
                      <span className="shrink-0 text-[11px] tabular-nums text-[#9aa0a6]">
                        {counts[s.id]}
                      </span>
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
                <ul className="divide-y divide-[#e8eaed] border-y border-[#e8eaed]">
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
                <dl className="divide-y divide-[#e8eaed] border-y border-[#e8eaed]">
                  {metrics.map((m) => (
                    <div
                      key={m.label}
                      className="flex flex-col gap-1 py-4 sm:flex-row sm:gap-8"
                    >
                      <dt className="w-full shrink-0 text-[13px] font-medium text-[#3c4043] sm:w-52">
                        {m.label}
                        <span className="mt-0.5 block text-[11px] font-normal text-[#9aa0a6]">
                          {m.where}
                        </span>
                      </dt>
                      <dd className="min-w-0 flex-1 text-[13px] leading-relaxed text-[#5f6368]">
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
                <dl className="divide-y divide-[#e8eaed] border-y border-[#e8eaed]">
                  {errors.map((e) => (
                    <div
                      key={e.code}
                      className="flex flex-col gap-1.5 py-4 sm:flex-row sm:gap-8"
                    >
                      <dt className="w-full shrink-0 sm:w-52">
                        <code className="rounded bg-[#f1f3f4] px-1.5 py-0.5 font-mono text-[10px] tracking-wide text-[#5f6368]">
                          {e.code}
                        </code>
                      </dt>
                      <dd className="min-w-0 flex-1">
                        <p className="text-[13px] font-medium text-[#3c4043]">
                          {e.title}
                        </p>
                        <p className="mt-1 text-[13px] leading-relaxed text-[#5f6368]">
                          {e.hint}
                        </p>
                        {e.action && (
                          <Link
                            href={e.action.href}
                            className="mt-2 inline-flex items-center gap-1 text-[12px] font-medium text-[#1a73e8] hover:underline"
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

            <ContactPanel />
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
    // The one tinted surface in the app: it marks help as somewhere else, and
    // gives the search the prominence it needs to be used at all.
    <section className="overflow-hidden rounded-3xl border border-[#e3ecfd] bg-gradient-to-br from-[#f4f8ff] via-white to-[#faf6ff] px-6 py-9 md:px-10 md:py-11">
      <div className="mx-auto max-w-2xl text-center">
        <h2 className="text-[19px] font-medium text-[#3c4043] md:text-[22px]">
          What do you need help with?
        </h2>
        <p className="mx-auto mt-1.5 max-w-md text-[13px] leading-relaxed text-[#5f6368]">
          Search the guides, or jump to a section below.
        </p>

        <div className="relative mt-5">
          <Search
            size={16}
            aria-hidden
            className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#9aa0a6]"
          />
          <input
            type="search"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder="tax, refund, staff, insights…"
            aria-label="Search help"
            className="h-12 w-full rounded-full border border-[#dadce0] bg-white pl-11 pr-11 text-[14px] text-[#3c4043] outline-none transition placeholder:text-[#9aa0a6] focus:border-transparent focus:ring-2 focus:ring-blue-500"
          />
          {value && (
            <button
              type="button"
              onClick={() => onChange("")}
              aria-label="Clear search"
              className="absolute right-3.5 top-1/2 -translate-y-1/2 cursor-pointer rounded-full p-1 text-[#9aa0a6] transition-colors hover:bg-[#f1f3f4] hover:text-[#5f6368]"
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
                  className="cursor-pointer rounded-full border border-[#dadce0] bg-white/80 px-3 py-1.5 text-[12px] text-[#3c4043] transition-colors hover:bg-white"
                >
                  {s.label}
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-4 text-[12px] text-[#5f6368]">
            {matches} {matches === 1 ? "result" : "results"}
          </p>
        )}
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
    // `scroll-mt`: the navbar is fixed, and an anchor without this lands the
    // heading underneath it.
    <section id={id} className="scroll-mt-24">
      <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[#1a73e8]">
        {kicker}
      </p>
      <h2 className="mt-1.5 text-[20px] font-medium tracking-tight text-[#3c4043] md:text-[22px]">
        {title}
      </h2>
      <p className="mt-1.5 max-w-xl text-[13px] leading-relaxed text-[#5f6368]">
        {lede}
      </p>
      <div className="mt-5">{children}</div>
    </section>
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
              ? "text-[#1a73e8]"
              : "text-[#9aa0a6] group-hover:text-[#5f6368]"
          }`}
        />
        <span className="min-w-0 flex-1">
          <span
            className={`block truncate text-[14px] transition-colors ${
              open ? "font-medium text-[#1a73e8]" : "text-[#3c4043]"
            }`}
          >
            {guide.title}
          </span>
          <span className="mt-0.5 block truncate text-[12px] text-[#9aa0a6]">
            {guide.summary}
          </span>
        </span>
        {/* A plus that becomes a minus: quieter than a chevron, and it says
            "there is more here" rather than "this goes somewhere". */}
        <span
          aria-hidden
          className="relative h-4 w-4 shrink-0 text-[#9aa0a6] group-hover:text-[#5f6368]"
        >
          <span className="absolute left-0 top-1/2 h-px w-4 -translate-y-1/2 bg-current" />
          <span
            className={`absolute left-1/2 top-0 h-4 w-px -translate-x-1/2 bg-current transition-transform duration-200 ${
              open ? "scale-y-0" : "scale-y-100"
            }`}
          />
        </span>
      </button>

      {open && (
        // The accent rail shows how far the open guide reaches, in place of
        // the box the rest of the app would have drawn around it.
        <div className="mb-5 ml-8 border-l-2 border-[#e3ecfd] pl-5">
          <ol className="flex flex-col gap-3">
            {guide.steps.map((step, i) => (
              <li key={i} className="flex gap-3">
                <span className="mt-0.5 text-[11px] font-semibold tabular-nums text-[#1a73e8]">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span className="text-[13px] leading-relaxed text-[#5f6368]">
                  {step}
                </span>
              </li>
            ))}
          </ol>

          {guide.note && (
            <p className="mt-4 text-[12px] leading-relaxed text-[#9aa0a6]">
              {guide.note}
            </p>
          )}

          <Link
            href={guide.href}
            className="mt-4 inline-flex items-center gap-1 text-[12px] font-medium text-[#1a73e8] hover:underline"
          >
            {guide.hrefLabel}
            <ArrowUpRight size={12} aria-hidden />
          </Link>
        </div>
      )}
    </li>
  );
}

/**
 * The sidebar, described.
 *
 * Rows keep the menu's own order, and a sidebar section's name is printed
 * once above the rows that belong to it — so the list can be read against
 * the menu beside it rather than being a second, differently-sorted index.
 */
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
              <p className="mt-7 pb-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-[#9aa0a6] first:mt-0">
                {row.group}
              </p>
            )}

            <div className="flex flex-col gap-1.5 border-t border-[#e8eaed] py-4 sm:flex-row sm:gap-8">
              <div className="w-full shrink-0 sm:w-52">
                <Link
                  href={row.href}
                  className="group inline-flex items-center gap-2 text-[13px] font-medium text-[#3c4043] transition-colors hover:text-[#1a73e8]"
                >
                  <Icon
                    size={14}
                    aria-hidden
                    className="shrink-0 text-[#9aa0a6] transition-colors group-hover:text-[#1a73e8]"
                  />
                  {row.label}
                  <ArrowUpRight
                    size={12}
                    aria-hidden
                    className="shrink-0 text-[#dadce0] transition-colors group-hover:text-[#1a73e8]"
                  />
                </Link>
              </div>

              <div className="min-w-0 flex-1">
                {entry ? (
                  <>
                    <p className="text-[13px] leading-relaxed text-[#5f6368]">
                      {entry.what}
                    </p>
                    <p className="mt-1.5 text-[12px] leading-relaxed text-[#9aa0a6]">
                      <span className="font-medium text-[#5f6368]">Shows </span>
                      {entry.shows}
                    </p>
                  </>
                ) : (
                  <p className="text-[13px] text-[#9aa0a6]">
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

function ConceptBlock({ concept }: { concept: HelpConcept }) {
  return (
    <div className="flex flex-col gap-1.5 sm:flex-row sm:gap-8">
      <h3 className="w-full shrink-0 text-[14px] font-medium text-[#3c4043] sm:w-52">
        {concept.term}
      </h3>
      <div className="min-w-0 flex-1">
        <p className="text-[13px] leading-relaxed text-[#5f6368]">
          {concept.body}
        </p>
        {concept.watchOut && (
          // Amber, and only here: this is the sentence that prevents a costly
          // mistake, and it should not read like more explanation.
          <p className="mt-2.5 border-l-2 border-amber-300 pl-3 text-[12px] leading-relaxed text-amber-800">
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
      <p className="text-[15px] text-[#3c4043]">
        Nothing here matches “{query}”.
      </p>
      <p className="mx-auto mt-1.5 max-w-sm text-[13px] leading-relaxed text-[#9aa0a6]">
        Try a plainer word — tax, refund, staff — or get in touch and
        we&rsquo;ll answer it directly.
      </p>
      <button
        type="button"
        onClick={onClear}
        className="mt-5 cursor-pointer rounded-full border border-[#dadce0] bg-white px-4 py-2 text-[12px] font-medium text-[#3c4043] transition-colors hover:bg-[#f8f9fa]"
      >
        Clear search
      </button>
    </div>
  );
}

// ── The end of the page ───────────────────────────────────────────────────

function ContactPanel() {
  const { whatsapp, phone, email } = HELP_CONTACT;
  const hasAny = Boolean(whatsapp || phone || email);

  return (
    // Dark, and the only dark thing here: it closes the document, and it is
    // what someone scrolling past everything else is looking for.
    <section className="rounded-3xl bg-[#202124] px-6 py-8 text-white md:px-10 md:py-10">
      <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
        <div className="min-w-0">
          <h2 className="text-[19px] font-medium md:text-[20px]">
            Still stuck?
          </h2>
          <p className="mt-1.5 max-w-md text-[13px] leading-relaxed text-white/60">
            Tell us the screen you were on and, if an error appeared, the code
            in its corner — it points straight at what failed.
          </p>
        </div>

        {hasAny ? (
          <div className="flex flex-wrap gap-2">
            {whatsapp && (
              <a
                href={`https://wa.me/${whatsapp}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-full bg-[#25D366] px-4 py-2 text-[13px] font-medium text-white transition-colors hover:bg-[#1da851]"
              >
                <MessageCircle size={14} aria-hidden />
                WhatsApp
              </a>
            )}
            {phone && (
              <a
                href={`tel:${phone}`}
                className="inline-flex items-center gap-2 rounded-full border border-white/20 px-4 py-2 text-[13px] font-medium text-white transition-colors hover:bg-white/10"
              >
                <Phone size={14} aria-hidden />
                {phone}
              </a>
            )}
            {email && (
              <a
                href={`mailto:${email}`}
                className="inline-flex items-center gap-2 rounded-full border border-white/20 px-4 py-2 text-[13px] font-medium text-white transition-colors hover:bg-white/10"
              >
                <Mail size={14} aria-hidden />
                {email}
              </a>
            )}
          </div>
        ) : (
          <p className="text-[13px] text-white/50">
            Support contact details haven&rsquo;t been added yet.
          </p>
        )}
      </div>
    </section>
  );
}

// ── Which section the reader is in ────────────────────────────────────────

/**
 * Highlights the rail entry for whatever is on screen.
 *
 * The watched line is near the top of the viewport rather than its middle: a
 * section becomes "the one being read" as its heading arrives there, which is
 * where a reader's eye actually is.
 */
function useActiveSection(): SectionId | null {
  const [active, setActive] = useState<SectionId | null>(null);
  const onScreen = useRef<Set<string>>(new Set());

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) onScreen.current.add(entry.target.id);
          else onScreen.current.delete(entry.target.id);
        }
        // Resolved in document order, so scrolling up lands on the higher
        // section rather than on whichever entry happened to fire last.
        const first = SECTIONS.find((s) => onScreen.current.has(s.id));
        if (first) setActive(first.id);
      },
      { rootMargin: "-80px 0px -75% 0px" },
    );

    for (const s of SECTIONS) {
      const el = document.getElementById(s.id);
      if (el) observer.observe(el);
    }
    return () => observer.disconnect();
    // Sections come and go with the search, so the observer is rebound on
    // every render rather than only on mount.
  });

  return active;
}
