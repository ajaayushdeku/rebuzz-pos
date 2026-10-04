import { ArrowLeftRight, Clock, Cpu } from "lucide-react";

import { AI_TROUBLE_SECTION_ID } from "./aiTroubleAnchor";

/**
 * What to try when insights stop coming back.
 *
 * The failures this answers are the provider's, not the merchant's: a free
 * tier's per-minute cap, a model with no allowance on their plan, a model that
 * is simply busy. The key is fine in all three, so an error panel that says
 * "quota exceeded" sends them looking for a billing problem they do not have —
 * when the fix is two controls already on this screen.
 *
 * Built like `ProviderGuide`'s "How it works" card — a heading, then an icon,
 * title and line per item — because it is the same kind of thing and sits on
 * the same screen. No icon tile of its own at the top: on this page those mark
 * a card that reports live state, which the quota meter does and this does not.
 *
 * Placed last on the page, because it is read after something has gone wrong
 * rather than while setting a key up. Static text, no state: it must still be
 * there when the request that would have populated it is the thing failing.
 *
 * `AiTroubleJumpLink` in the page header scrolls here, which is what the id and
 * the `tabIndex={-1}` are for — the latter so focus can follow the scroll
 * instead of leaving a keyboard user at the top of a page that moved.
 */

const REMEDIES = [
  {
    icon: Cpu,
    title: "Choose a different model",
    body: "In the form above. The list comes from your own key, so anything in it is something that key is allowed to call.",
  },
  {
    icon: ArrowLeftRight,
    title: "Switch to another provider",
    body: "Using the cards at the top. Each one keeps its own key, so adding a second provider costs you nothing and switching back later still works.",
  },
  {
    icon: Clock,
    title: "Or give it a few minutes",
    body: "A free plan's limit often resets by the minute or by the hour, so the same model usually answers again shortly.",
  },
];

export default function AiTroubleNote() {
  return (
    <section
      id={AI_TROUBLE_SECTION_ID}
      tabIndex={-1}
      // scroll-mt keeps the card off the top edge when jumped to; focus:outline
      // is dropped because the scroll itself is the feedback, and a ring around
      // a whole card reads as an error.
      className="scroll-mt-4 rounded-2xl border border-[#dadce0] bg-white p-6 focus:outline-none dark:border-white/15 dark:bg-[#161d2e]"
    >
      <h3 className="text-[13px] font-semibold text-[#3c4043] dark:text-[#e8ecf4]">
        If the AI stops answering
      </h3>
      <p className="mt-1.5 text-[12px] leading-relaxed text-[#5f6368] dark:text-[#a9b4c7]">
        A provider can refuse a request for reasons that have nothing to do with
        your key being wrong — a busy model, a free plan&rsquo;s limit, or a
        model your plan does not include. Any of these usually fixes it:
      </p>

      <div className="mt-4 space-y-4">
        {REMEDIES.map(({ icon: Icon, title, body }) => (
          <div key={title} className="flex gap-3">
            <Icon
              className="mt-0.5 h-4 w-4 shrink-0 text-blue-600 dark:text-blue-300"
              aria-hidden
            />
            <div className="min-w-0">
              <p className="text-[13px] font-medium text-[#3c4043] dark:text-[#e8ecf4]">
                {title}
              </p>
              <p className="mt-0.5 text-[12px] leading-relaxed text-[#5f6368] dark:text-[#a9b4c7]">
                {body}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* The two limits on this screen are easy to confuse, and confusing them
          sends a merchant to stare at the counter that is not the one failing. */}
      <p className="mt-4 text-[11px] leading-relaxed text-[#9aa0a6] dark:text-[#9aa6bd]">
        A provider&rsquo;s limit is its own, and separate from the counter at the
        top of this page — that one is REBUZZ&rsquo;s hourly allowance, and it
        refills by itself.
      </p>
    </section>
  );
}
