"use client";

import { ExternalLink, Lock, ShieldCheck, Wallet, Zap } from "lucide-react";

import { googleColorAt } from "./googlePalette";
import { metaFor, type ProviderFact } from "./providerMeta";

/**
 * How this provider's key works and where to get one.
 *
 * Sits beside the form rather than behind a help link: a merchant asked for a
 * credential they have never heard of will either abandon the screen or paste
 * the wrong thing, and both are avoidable by answering the three questions
 * here — what it's for, what it costs, and who can see it.
 *
 * The content follows the provider being set up. It used to be Gemini's steps
 * whatever was selected, which is worse than no guide: a merchant on another
 * provider would follow instructions that create a key their setup cannot use.
 */

const FACT_ICONS: Record<ProviderFact["icon"], typeof Lock> = {
  wallet: Wallet,
  lock: Lock,
  shield: ShieldCheck,
  zap: Zap,
};

export default function ProviderGuide({
  provider,
  label,
  /**
   * Which half to render. The steps belong beside the form, where they are
   * being followed; the facts read afterwards and sit under it, which also
   * keeps the two columns near the same height.
   */
  part = "both",
}: {
  provider: string;
  label: string;
  part?: "steps" | "facts" | "both";
}) {
  const meta = metaFor(provider);

  /**
   * Gemini's steps keep Google's four brand colours, cycling. Every other
   * provider numbers its steps in its own accent — one colour is the honest
   * default, since only Google has a four-colour mark to borrow.
   */
  const stepColour = (index: number) =>
    provider === "gemini"
      ? {
          backgroundColor: googleColorAt(index).tint,
          color: googleColorAt(index).ink,
        }
      : {
          backgroundColor: meta.stepBg ?? meta.tint,
          color: meta.stepInk ?? meta.accent,
        };

  /** Near-black reads as text, not as a link; a provider may name its own. */
  const linkColour = meta.link ?? meta.accent;

  return (
    <div className="space-y-5">
      {part !== "facts" && (
        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white">
          <div className="p-6">
            {/* "your", not "a": a label starting with a vowel would need "an",
              and the article is not worth deriving from a provider's name. */}
            <h3 className="text-[13px] font-bold text-gray-900">
              How to get your {label} key
            </h3>

            <ol className="mt-4 space-y-4">
              {meta.steps.map((step, index) => (
                <li key={step.title} className="flex gap-3">
                  <span
                    className="mt-px flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[11px] font-bold tabular-nums"
                    style={stepColour(index)}
                  >
                    {index + 1}
                  </span>
                  <div className="min-w-0">
                    <p className="text-[13px] font-semibold text-gray-800">
                      {step.title}
                    </p>
                    <p className="mt-0.5 text-[12px] leading-relaxed text-gray-500">
                      {step.body}
                    </p>

                    {step.code && (
                      <p className="mt-1.5 flex flex-wrap items-center gap-1.5">
                        {step.code.map((code) => (
                          <span
                            key={code}
                            className="rounded bg-gray-100 px-1.5 py-0.5 font-mono text-[11px] text-gray-700"
                          >
                            {code}
                          </span>
                        ))}
                      </p>
                    )}

                    {step.link && (
                      <a
                        href={step.link.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-1.5 inline-flex items-center gap-1 text-[12px] font-medium hover:underline"
                        style={{ color: linkColour }}
                      >
                        {step.link.label}
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    )}
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </div>
      )}

      {part !== "steps" && (
        <div className="rounded-2xl border border-gray-200 bg-white p-6">
          <h3 className="text-[13px] font-bold text-gray-900">How it works</h3>

          <div className="mt-4 space-y-4">
            {meta.facts.map(({ icon, title, body }, index) => {
              const Icon = FACT_ICONS[icon];
              return (
                <div key={title} className="flex gap-3">
                  <Icon
                    className="mt-0.5 h-4 w-4 shrink-0"
                    style={{
                      color:
                        provider === "gemini"
                          ? googleColorAt(index).ink
                          : linkColour,
                    }}
                  />
                  <div className="min-w-0">
                    <p className="text-[13px] font-semibold text-gray-800">
                      {title}
                    </p>
                    <p className="mt-0.5 text-[12px] leading-relaxed text-gray-500">
                      {body}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
