"use client";

import { ExternalLink, Lock, ShieldCheck, Wallet } from "lucide-react";
import { googleColorAt } from "./googlePalette";

/**
 * How the key works and where to get one.
 *
 * Sits beside the form rather than behind a help link: a merchant asked for a
 * credential they have never heard of will either abandon the screen or paste
 * the wrong thing, and both are avoidable by answering the three questions
 * here — what it's for, what it costs, and who can see it.
 */

const STEPS: { title: string; body: React.ReactNode }[] = [
  {
    title: "Open Google AI Studio",
    body: (
      <>
        Go to{" "}
        <a
          href="https://aistudio.google.com/apikey"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 font-medium text-[#1967D2] hover:underline"
        >
          aistudio.google.com/apikey
          <ExternalLink className="h-3 w-3" />
        </a>{" "}
        and sign in with any Google account.
      </>
    ),
  },
  {
    title: "Create an API key",
    body: (
      <>
        Choose <span className="font-medium">Create API key</span>. Pick an
        existing Google Cloud project if you are asked, or let it make a new one
        for you.
      </>
    ),
  },
  {
    title: "Copy the key",
    body: (
      <>
        It is one long line beginning with either{" "}
        <span className="font-mono text-gray-700">AIza</span> or{" "}
        <span className="font-mono text-gray-700">AQ.</span> — Google is
        changing the format and both work. Copy the whole thing; Google will not
        show it again.
      </>
    ),
  },
  {
    title: "Paste it here and save",
    body: <>Paste it into the field on the left, then save.</>,
  },
];

const FACTS: { icon: typeof Lock; title: string; body: string }[] = [
  {
    icon: Wallet,
    title: "It uses your own quota",
    body: "AI features run on your Google account, not ours. Google offers a free tier that covers normal use; heavy use is billed to you by Google.",
  },
  {
    icon: Lock,
    title: "Stored, never shown again",
    body: "Once saved, the key is kept encrypted and only ever shown as a mask. If you lose it, create a new one and replace it here.",
  },
  {
    icon: ShieldCheck,
    title: "Only your business uses it",
    body: "Your key generates insights for this business alone. It is never shared with other businesses on the platform.",
  },
];

export default function GeminiKeyGuide() {
  return (
    <div className="space-y-5">
      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white">
        <div className="p-6">
          <h3 className="text-[13px] font-bold text-gray-900">
            How to get a Gemini API key
          </h3>

          <ol className="mt-4 space-y-4">
            {STEPS.map((step, index) => (
              <li key={step.title} className="flex gap-3">
                {/* Blue, red, yellow, green in order — the palette carries the
                  Google reference; `ink` keeps the digit readable, which the
                  raw brand yellow would not. */}
                <span
                  className="mt-px flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[11px] font-bold tabular-nums"
                  style={{
                    backgroundColor: googleColorAt(index).tint,
                    color: googleColorAt(index).ink,
                  }}
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
                </div>
              </li>
            ))}
          </ol>
        </div>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white p-6">
        <h3 className="text-[13px] font-bold text-gray-900">How it works</h3>

        <div className="mt-4 space-y-4">
          {FACTS.map(({ icon: Icon, title, body }, index) => (
            <div key={title} className="flex gap-3">
              <Icon
                className="mt-0.5 h-4 w-4 shrink-0"
                style={{ color: googleColorAt(index).ink }}
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
          ))}
        </div>
      </div>
    </div>
  );
}
