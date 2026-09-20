/**
 * How each AI provider is presented on the API Keys screen.
 *
 * The service is the authority on which providers exist — it sends the list
 * with the key status — so this holds only what the browser needs to draw one:
 * an accent colour, a sentence, how to get a key, and what to know before
 * using it. A provider the service adds later still renders, with the fallback
 * below, rather than breaking the screen.
 *
 * Plain data, no JSX: the guide renders it, so a new provider is an entry here
 * rather than a new component.
 */

import { GEMINI_COLORS } from "./googlePalette";

/** One numbered step in "How to get a key". */
export interface ProviderStep {
  title: string;
  body: string;
  /** Rendered at the end of the step, when it is somewhere to go. */
  link?: { label: string; href: string };
  /** Shown in monospace after the body — a key prefix, a model name. */
  code?: string[];
}

export interface ProviderFact {
  icon: "wallet" | "lock" | "shield" | "zap";
  title: string;
  body: string;
}

/**
 * A provider's button, as its own brand draws it.
 *
 * Both halves are given because a brand colour is not automatically a
 * background: Google's blue takes white text, OpenRouter's lime would make
 * white text invisible and takes near-black instead.
 */
export interface ProviderButton {
  bg: string;
  ink: string;
  hover: string;
}

export interface ProviderMeta {
  /** Ink: icons, step text, links. Must be readable on white. */
  accent: string;
  /** When the accent is too dark to read as a link. Defaults to `accent`. */
  link?: string;
  /** A pale wash, behind provider marks. */
  tint: string;
  /** Step-number chip. Defaults to `tint` behind `accent`. */
  stepBg?: string;
  stepInk?: string;
  /** The square the provider's mark sits in. Defaults to `tint`/`accent`. */
  mark?: { bg: string; ink: string };
  /**
   * The selected card in the provider list. Defaults to `accent` on `tint`.
   *
   * Given separately because three providers here are orange — Groq, Cerebras
   * and Mistral — and a tint derived from each of their accents left the
   * three cards near-identical. Each picks the shade of its own ramp that
   * separates it from the other two, rather than the one nearest its ink.
   */
  card?: { border: string; bg: string };
  /**
   * Stops for the mark's stroke, corner to corner.
   *
   * A gradient is invisible at 16px on a filled shape, but these marks are
   * line icons: the sweep crosses each stroke, so two or three brand colours
   * read at this size where a flat one would say nothing. Given the stops
   * here, drawn by ProviderMarkDefs, and used in place of `mark.ink`.
   */
  gradient?: string[];
  button: ProviderButton;
  /** One line under the provider's name. */
  blurb: string;
  /** Two or three words in the provider list, about its free tier. */
  tagline: string;
  placeholder: string;
  steps: ProviderStep[];
  facts: ProviderFact[];
}

const SHARED_FACTS: ProviderFact[] = [
  {
    icon: "lock",
    title: "Stored, never shown again",
    body: "Once saved, the key is kept encrypted and only ever shown as a mask. If you lose it, create a new one and replace it here.",
  },
  {
    icon: "shield",
    title: "Only your business uses it",
    body: "Your key generates insights for this business alone. It is never shared with other businesses on the platform.",
  },
];

export const PROVIDER_META: Record<string, ProviderMeta> = {
  gemini: {
    // Solid Google blue rather than the brand gradient: white 13px bold over
    // the sweep crosses the yellow stop at 1.71:1, illegible exactly where it
    // is brightest. #1967D2 measures 5.37:1 and still reads as Google.
    accent: "#1967D2",
    tint: "#E8F0FE",
    // Gemini's own blue → violet → rose sweep, not Google's four brand
    // colours: the mark names the product, not the company.
    gradient: GEMINI_COLORS,
    button: { bg: "#1967D2", ink: "#FFFFFF", hover: "#1557b0" },
    blurb: "Powers AI features across your dashboard",
    tagline: "Free tier · no card",
    placeholder: "Paste your Gemini key…",
    steps: [
      {
        title: "Open Google AI Studio",
        body: "Sign in with any Google account.",
        link: {
          label: "aistudio.google.com/apikey",
          href: "https://aistudio.google.com/apikey",
        },
      },
      {
        title: "Create an API key",
        body: "Choose “Create API key”. Pick an existing Google Cloud project if you are asked, or let it make a new one for you.",
      },
      {
        title: "Copy the key",
        body: "It is one long line beginning with either of these — Google is changing the format and both work. Copy the whole thing; Google will not show it again.",
        code: ["AIza", "AQ."],
      },
      {
        title: "Paste it here and save",
        body: "Paste it into the field above, then save. The key is checked with Google before it is stored.",
      },
    ],
    facts: [
      {
        icon: "wallet",
        title: "It uses your own quota",
        body: "AI features run on your Google account, not ours. Google's free tier covers the Flash models we use; Pro models need billing enabled, and heavy use is billed to you by Google.",
      },
      ...SHARED_FACTS,
    ],
  },

  openrouter: {
    /**
     * OpenRouter's own pair: lime #C8FF00 on near-black #03080A.
     *
     * Which way round matters. The lime is a background colour, not an ink —
     * on white it measures about 1.3:1 and disappears — so the near-black
     * carries the text and icons, and the lime carries the button and the
     * step numbers with that near-black on top of it. Two supporting shades
     * are derived rather than invented: a pale lime wash behind the mark, and
     * a darker lime for links, which near-black would not read as.
     */
    accent: "#03080A",
    link: "#4D6B00",
    tint: "#F2FFCC",
    stepBg: "#C8FF00",
    stepInk: "#03080A",
    // A faded lime square, with the mark swept from the near-black into the
    // lime — both brand colours in one small shape.
    mark: { bg: "#effdc4", ink: "#03080A" },
    gradient: ["#C8FF00", "#88bb08"],
    button: { bg: "#C8FF00", ink: "#03080A", hover: "#B4E600" },
    blurb: "One key, many free models",
    tagline: "Free models · no card",
    placeholder: "Paste your OpenRouter key…",
    steps: [
      {
        title: "Create an OpenRouter account",
        body: "Sign up with an email or a Google account. No card is needed for the free models.",
        link: { label: "openrouter.ai", href: "https://openrouter.ai" },
      },
      {
        title: "Create an API key",
        body: "Open the Keys page and choose “Create key”. Leave any spending limit at zero to stay on free models only.",
        link: {
          label: "openrouter.ai/keys",
          href: "https://openrouter.ai/keys",
        },
      },
      {
        title: "Copy the key",
        body: "It is one long line beginning with this prefix. Copy the whole thing; OpenRouter will not show it again.",
        code: ["sk-or-v1-"],
      },
      {
        title: "Paste it here and save",
        body: "Paste it into the field above, then save. Your key is checked with OpenRouter before it is stored.",
      },
    ],
    facts: [
      {
        icon: "zap",
        title: "Free models only",
        body: "The model list never offers one that would charge you, and “openrouter/free” lets OpenRouter pick a working free model for each request — free models come and go, and a pinned name eventually stops existing.",
      },
      {
        icon: "wallet",
        title: "About 50 requests a day",
        body: "Insights are generated once a day and kept, so a day's eight sections use a fraction of that. Hit the limit and the app says so instead of failing quietly.",
      },
      ...SHARED_FACTS,
    ],
  },

  groq: {
    /**
     * Groq's orange, twice over. The brand orange (#F55036) measures about
     * 3.5:1 on white — fine as a mark, too weak under 13px bold text — so the
     * ink and the button take a deepened version of it, and the bright one
     * stays in the mark's sweep where nothing has to be read through it.
     */
    accent: "#C2340F",
    tint: "#FFEDE7",
    gradient: ["#FF7A59", "#F55036", "#A32B0C"],
    mark: { bg: "#FFEDE7", ink: "#C2340F" },
    button: { bg: "#C2340F", ink: "#FFFFFF", hover: "#A32B0C" },
    blurb: "Fast answers on a free tier",
    tagline: "Free tier · no card",
    placeholder: "Paste your Groq key…",
    steps: [
      {
        title: "Create a Groq Cloud account",
        body: "Sign up with an email or a Google account. No card is needed for the free tier.",
        link: { label: "console.groq.com", href: "https://console.groq.com" },
      },
      {
        title: "Create an API key",
        body: "Open the API Keys page and choose “Create API Key”. Give it any name you like.",
        link: {
          label: "console.groq.com/keys",
          href: "https://console.groq.com/keys",
        },
      },
      {
        title: "Copy the key",
        body: "It is one long line beginning with this prefix. Copy the whole thing; Groq will not show it again.",
        code: ["gsk_"],
      },
      {
        title: "Paste it here and save",
        body: "Paste it into the field above, then save. Your key is checked with Groq before it is stored.",
      },
    ],
    facts: [
      {
        icon: "zap",
        title: "Built for speed",
        body: "Groq runs models on its own hardware, so insights usually come back faster than from other free tiers.",
      },
      {
        icon: "wallet",
        title: "A generous free tier",
        body: "Roughly 30 requests a minute and about a thousand a day. Insights are generated once a day and kept, so a day's eight sections use a fraction of that.",
      },
      {
        icon: "shield",
        title: "Only some of its models are offered",
        body: "Groq's list includes speech and moderation models, and only some can answer in the fixed format insights need. The selector shows just those.",
      },
      ...SHARED_FACTS,
    ],
  },

  cerebras: {
    /**
     * Cerebras orange, #F05A28, and shades of it.
     *
     * The brand orange measures about 3.4:1 on white: enough for a mark, not
     * enough to carry 13px bold white text. So the ramp is darkened for the
     * ink and the button (#B23A14 is 6:1, #8C2C0D darker still for hover),
     * lightened for the wash behind the mark, and the orange itself leads the
     * mark's sweep, where nothing has to be read through it.
     */
    accent: "#B23A14",
    tint: "#FEF0EA",
    // gradient: ["#FFB08C", "#F7906B", "#F05A28"],
    // mark: { bg: "#2A1008", ink: "#F05A28" },
    // Dark end first: the rings are thin, and starting bright left them
    // washed out on a pale tile. A deeper tile than Groq's, too — both are
    // orange, and at 20px the tile is what tells them apart in the list.
    gradient: ["#B23A14", "#F05A28", "#F7906B"],
    mark: { bg: "#FFDCC9", ink: "#B23A14" },

    card: { border: "#F05A28", bg: "#FFE9DD" },
    button: { bg: "#B23A14", ink: "#FFFFFF", hover: "#8C2C0D" },
    blurb: "Very fast, but no longer free",
    tagline: "Trial credits · card needed",
    placeholder: "Paste your Cerebras key…",
    steps: [
      {
        title: "Create a Cerebras Cloud account",
        body: "Cerebras ended its free tier in August 2026. New accounts get one-off trial credits, and the API stays inactive until a payment method is added.",
        link: { label: "cloud.cerebras.ai", href: "https://cloud.cerebras.ai" },
      },
      {
        title: "Create an API key",
        body: "In the console, open API Keys and create one. Give it any name you like.",
      },
      {
        title: "Copy the key",
        body: "Copy the whole line; Cerebras will not show it again.",
      },
      {
        title: "Paste it here and save",
        body: "Paste it into the field above, then save. Your key is checked with Cerebras before it is stored.",
      },
    ],
    facts: [
      {
        icon: "zap",
        title: "Built on its own hardware",
        body: "Cerebras runs models on wafer-scale chips, so answers usually come back faster than from any other free tier.",
      },
      {
        icon: "wallet",
        title: "Its free tier ended in August 2026",
        body: "New accounts now get one-off credits that unlock only after a payment method is added, and they expire about a month later. A key with nothing left reports “no quota” when you save it here.",
      },
      {
        icon: "shield",
        title: "Only some of its models are offered",
        body: "Only some Cerebras models can answer in the fixed format insights need. The selector shows just those.",
      },
      ...SHARED_FACTS,
    ],
  },

  mistral: {
    /**
     * Mistral's own ramp, taken from their site: #FEC63A yellow, #FF8204
     * orange, #FA500F red and #933800 for the dark end. Their mark is a
     * stepped flag in exactly that order, so the gradient is the logo rather
     * than an invention. The red measures about 3.4:1 on white, so as
     * everywhere else the dark end carries the text and the button.
     */
    accent: "#933800",
    tint: "#FFF7E3",
    gradient: ["#FEC63A", "#FF8204", "#FA500F"],
    // The yellow end of their own ramp, which is the half of it no other
    // provider here uses — Groq and Cerebras are both red-orange.
    mark: { bg: "#FFF3CE", ink: "#933800" },
    card: { border: "#FFAF01", bg: "#FFF6DC" },
    button: { bg: "#933800", ink: "#FFFFFF", hover: "#7A2E00" },
    blurb: "A large free allowance",
    tagline: "Free tier · trains on data",
    placeholder: "Paste your Mistral key…",
    steps: [
      {
        title: "Create a Mistral account",
        body: "Sign up and verify a phone number, which their free tier requires.",
        link: {
          label: "console.mistral.ai",
          href: "https://console.mistral.ai",
        },
      },
      {
        title: "Turn on the free tier",
        body: "In the console, choose the free plan and accept its terms — which include allowing Mistral to train on what you send.",
      },
      {
        title: "Create an API key",
        body: "Open API Keys and create one. Copy the whole line; Mistral will not show it again.",
        link: {
          label: "console.mistral.ai/api-keys",
          href: "https://console.mistral.ai/api-keys",
        },
      },
      {
        title: "Paste it here and save",
        body: "Paste it into the field above, then save. Your key is checked with Mistral before it is stored.",
      },
    ],
    facts: [
      {
        icon: "shield",
        title: "Their free tier trains on your data",
        body: "Mistral's free plan is granted in exchange for letting them train on the traffic you send. Insights carry your sales figures and product names — customer and staff names are never sent, but the rest is. Their paid tier does not train on your data.",
      },
      {
        icon: "wallet",
        title: "A very large monthly allowance",
        body: "Far more than a day's eight sections use. Insights are generated once a day and kept, so the limit is unlikely to be the thing that stops you.",
      },
      {
        icon: "zap",
        title: "Only its chat models are offered",
        body: "Mistral also publishes embedding, moderation, OCR and audio models, which cannot write an insight. The selector leaves them out.",
      },
      ...SHARED_FACTS,
    ],
  },

  nvidia: {
    /**
     * NVIDIA green, #76B900, and shades of it. The brand green is about 2.3:1
     * on white — a mark, not an ink — so a darkened version carries the text
     * and the button, and the bright one leads the mark's sweep.
     */
    accent: "#4A7700",
    tint: "#F2FBE0",
    gradient: ["#A6E000", "#76B900", "#4A7700"],
    mark: { bg: "#EAF7CF", ink: "#4A7700" },
    card: { border: "#76B900", bg: "#F0FADC" },
    button: { bg: "#4A7700", ink: "#FFFFFF", hover: "#3A5D00" },
    blurb: "Free credits across a large catalogue",
    tagline: "Free credits · no card",
    placeholder: "Paste your NVIDIA key…",
    steps: [
      {
        title: "Join the NVIDIA Developer Programme",
        body: "Sign up on build.nvidia.com. It is free and asks for no card.",
        link: { label: "build.nvidia.com", href: "https://build.nvidia.com" },
      },
      {
        title: "Open a model and get an API key",
        body: "Pick any model on the site and choose “Get API Key”. The key works for every model, not just that one.",
      },
      {
        title: "Copy the key",
        body: "It is one long line beginning with this prefix. Copy the whole thing; NVIDIA will not show it again.",
        code: ["nvapi-"],
      },
      {
        title: "Paste it here and save",
        body: "Paste it into the field above, then save. Your key is checked with NVIDIA before it is stored.",
      },
    ],
    facts: [
      {
        icon: "wallet",
        title: "Free inference credits",
        body: "Joining the developer programme grants credits to spend across their hosted models, with no card. Insights are generated once a day and kept, so a day's eight sections spend very little.",
      },
      {
        icon: "zap",
        title: "Only some of its models are offered",
        body: "NVIDIA hosts embedding, vision, safety, translation and parsing models beside the chat ones, and only some can answer in the fixed format insights need. The selector shows just those.",
      },
      ...SHARED_FACTS,
    ],
  },
};

/** Used for a provider the service knows about and this screen does not. */
export const FALLBACK_META: ProviderMeta = {
  accent: "#334155",
  tint: "#F1F5F9",
  button: { bg: "#334155", ink: "#FFFFFF", hover: "#1E293B" },
  blurb: "Powers AI features across your dashboard",
  tagline: "Bring your own key",
  placeholder: "Paste your API key…",
  steps: [
    {
      title: "Create an API key with this provider",
      body: "Open their dashboard, create a key, and copy the whole thing.",
    },
    {
      title: "Paste it here and save",
      body: "The key is checked with the provider before it is stored.",
    },
  ],
  facts: SHARED_FACTS,
};

export const metaFor = (providerId: string): ProviderMeta =>
  PROVIDER_META[providerId] ?? FALLBACK_META;

/** The id ProviderMarkDefs gives this provider's gradient. */
export const markGradientId = (providerId: string) =>
  `provider-mark-${providerId}`;

/**
 * What to paint a provider's mark with: its gradient when it has one, its
 * flat mark colour otherwise. Works as a `fill` or a `stroke`, so callers do
 * not care which kind of mark they are drawing.
 */
export function markPaint(providerId: string): string {
  const meta = metaFor(providerId);
  return meta.gradient
    ? `url(#${markGradientId(providerId)})`
    : (meta.mark?.ink ?? meta.accent);
}
