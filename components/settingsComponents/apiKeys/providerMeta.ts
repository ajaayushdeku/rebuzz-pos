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
  darkAccent?: string;
  /** When the accent is too dark to read as a link. Defaults to `accent`. */
  link?: string;
  /** A pale wash, behind provider marks. */
  tint: string;
  /** Step-number chip. Defaults to `tint` behind `accent`. */
  stepBg?: string;
  stepInk?: string;
  /** The square the provider's mark sits in. Defaults to `tint`/`accent`. */
  mark?: { bg: string; ink: string };
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
  /**
   * The same sweep for a dark tile: each brand's own ramp shifted one step
   * brighter. Defaults to `gradient`.
   *
   * Needed because the tile behind the mark goes dark too, and the dark END of
   * a brand ramp then disappears into it — Groq's `#A32B0C` measures 6.37:1 on
   * its pale tile and 1.75:1 on the dark one. Shifting the ramp keeps the hue
   * sweep that identifies the provider while bringing every stop back above
   * 3:1.
   */
  darkGradient?: string[];
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
    // Google blue provides a strong, readable accent. The Gemini gradient
    // remains exclusive to the product identity rather than Google's full
    // corporate palette.
    accent: "#1967D2",
    darkAccent: "#8AB4F8",
    tint: "#EEF4FF",
    gradient: GEMINI_COLORS,
    darkGradient: ["#8AB4F8", "#B49BE0", "#E88A96"],
    button: { bg: "#1967D2", ink: "#FFFFFF", hover: "#1557B0" },

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
    // OpenRouter's signature lime works best as a bright surface with dark
    // ink. A deeper green handles readable text and supporting UI accents.
    accent: "#4A7700",
    darkAccent: "#B7D957",
    link: "#4A7700",
    tint: "#F2F9DF",
    stepBg: "#C8FF00",
    stepInk: "#03080A",
    mark: { bg: "#F0F8D8", ink: "#4A7700" },
    gradient: ["#C8FF00", "#A4D62A", "#4A7700"],
    darkGradient: ["#D9FF4D", "#B7D957", "#8CA728"],
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
    // Deep orange-red carries text and buttons. The brighter coral shades
    // provide the brand energy in the logo and decorative gradients.
    accent: "#C2340F",
    darkAccent: "#FF9478",
    tint: "#FFF0EB",
    gradient: ["#FF9478", "#F55036", "#A32B0C"],
    darkGradient: ["#FFB09B", "#FF9478", "#F76B4F"],
    mark: { bg: "#FFF0EB", ink: "#C2340F" },
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

  mistral: {
    // Mistral's yellow-orange-red identity stays vivid in the gradient.
    // Deep burnt orange provides readable text and button contrast.
    accent: "#933800",
    darkAccent: "#FFB84D",
    tint: "#FFF5E2",
    gradient: ["#FEC63A", "#FF8204", "#FA500F"],
    darkGradient: ["#FFD978", "#FFB84D", "#FF8204"],
    mark: { bg: "#FFF3D9", ink: "#933800" },
    card: { border: "#E9A83B", bg: "#FFF9EC" },
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
    // NVIDIA green leads the logo gradient. The deeper green is used for
    // readable accents, while the pale surface keeps the card restrained.
    accent: "#4A7700",
    darkAccent: "#A6D957",
    tint: "#F0F8E4",
    gradient: ["#A6E000", "#76B900", "#4A7700"],
    darkGradient: ["#C6F24A", "#A6D957", "#76B900"],
    mark: { bg: "#EAF5D8", ink: "#4A7700" },
    card: { border: "#76B900", bg: "#F3FBE8" },
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

  zai: {
    // Z.AI-inspired blue identity. These are UI colours chosen for
    // contrast and consistency, not a claim about an official brand palette.
    accent: "#3156A3",
    darkAccent: "#91AEF5",
    link: "#3156A3",
    tint: "#EEF3FF",
    mark: { bg: "#EAF0FF", ink: "#3156A3" },
    gradient: ["#91AEF5", "#5279D5", "#3156A3"],
    darkGradient: ["#C0D3FF", "#91AEF5", "#6E91E8"],
    button: {
      bg: "#3156A3",
      ink: "#FFFFFF",
      hover: "#264785",
    },

    blurb: "GLM models for business insights",
    tagline: "GLM models · BYOK",
    placeholder: "Paste your Z.AI API key…",

    steps: [
      {
        title: "Create a Z.AI account",
        body: "Sign up or log in to the Z.AI platform.",
        link: {
          label: "z.ai",
          href: "https://z.ai",
        },
      },
      {
        title: "Open the API Keys page",
        body: "Go to your API key management page. You may need to sign in again before accessing it.",
        link: {
          label: "Manage API keys",
          href: "https://z.ai/manage-apikey/apikey-list",
        },
      },
      {
        title: "Create and copy an API key",
        body: "Generate a new API key and copy the complete value. Keep it private; Z.AI advises against exposing API keys in client-side code.",
      },
      {
        title: "Paste it here and save",
        body: "Paste the key into the field above, then save. Your key is checked with Z.AI before it is stored.",
      },
    ],

    facts: [
      {
        icon: "zap",
        title: "Powered by GLM",
        body: "Z.AI provides the GLM model family. The model selector only offers compatible text models that can generate the structured responses AI Insights requires.",
      },
      {
        icon: "wallet",
        title: "Uses your Z.AI quota",
        body: "API usage depends on your account's available resources, model access and applicable pricing. Check your Z.AI account for current usage and billing details before generating insights.",
      },
      {
        icon: "shield",
        title: "Check your model access",
        body: "Available models and quotas can vary by account. If a model is unavailable or your quota is exhausted, check your Z.AI platform settings.",
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

/** The same, for the sweep drawn on a dark tile. */
export const markGradientIdDark = (providerId: string) =>
  `provider-mark-${providerId}-dark`;

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

/**
 * The same, for a dark tile: the brighter sweep where there is one, and
 * `darkAccent` in place of a flat mark ink that was chosen to read on white.
 */
export function markPaintDark(providerId: string): string {
  const meta = metaFor(providerId);
  if (meta.gradient) {
    return `url(#${
      meta.darkGradient
        ? markGradientIdDark(providerId)
        : markGradientId(providerId)
    })`;
  }
  return meta.darkAccent ?? meta.mark?.ink ?? meta.accent;
}

/**
 * The tile behind a mark, as a pair of custom properties.
 *
 * An inline style cannot carry a `dark:` variant, and the light tiles are pale
 * brand washes — `#effdc4`, `#FFEDE7` — which would be bright patches on a dark
 * card. The dark half is the provider's own `darkAccent` at low opacity, so the
 * tile still belongs to the provider.
 */
export function markTileVars(providerId: string): React.CSSProperties {
  const meta = metaFor(providerId);
  const signal = meta.darkAccent ?? meta.accent;
  return {
    "--mark-tile-light": meta.mark?.bg ?? meta.tint,
    "--mark-tile-dark": `color-mix(in srgb, ${signal} 18%, transparent)`,
  } as React.CSSProperties;
}

/** Classes that pick between the two tile fills above. */
export const MARK_TILE_CLASS =
  "bg-[var(--mark-tile-light)] dark:bg-[var(--mark-tile-dark)]";
