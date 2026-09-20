/**
 * Each provider's own mark, as path data.
 *
 * These are the providers' trademarks, used only to identify the service a
 * merchant is connecting to — the same use as a "Sign in with Google" button.
 * They are not modified beyond being drawn in one colour, and no provider is
 * implied to endorse this app.
 *
 * Where they came from:
 * - Gemini: Simple Icons (simpleicons.org), whose icon data is CC0. 24×24.
 * - OpenRouter: @lobehub/icons-static-svg, which carries their current mark.
 *   Simple Icons still has the older arrow one, which is not what their site
 *   shows any more. 24×24.
 * - Groq: its own site mark (groq.com/favicon.svg), with the orange backing
 *   square dropped so it sits in a tinted square like the others. 33×33.
 *
 * Path data rather than <img>: a remote logo means a request that can fail, a
 * layout that shifts when it does, and a third party told which businesses
 * opened this screen. Inline, it renders instantly and can take the provider's
 * gradient (see ProviderMarkDefs).
 */

export interface ProviderLogo {
  viewBox: string;
  /** One or more paths; Cerebras's mark is its rings plus its letter. */
  paths: string[];
  /**
   * "evenodd" where the mark has a hole punched through it — OpenRouter's
   * circle is part of the same path, and filled the default way it vanishes.
   */
  fillRule?: "evenodd" | "nonzero";
}

export const PROVIDER_LOGOS: Record<string, ProviderLogo> = {
  gemini: {
    viewBox: "0 0 24 24",
    paths: [
      "M11.04 19.32Q12 21.51 12 24q0-2.49.93-4.68.96-2.19 2.58-3.81t3.81-2.55Q21.51 12 24 12q-2.49 0-4.68-.93a12.3 12.3 0 0 1-3.81-2.58 12.3 12.3 0 0 1-2.58-3.81Q12 2.49 12 0q0 2.49-.96 4.68-.93 2.19-2.55 3.81a12.3 12.3 0 0 1-3.81 2.58Q2.49 12 0 12q2.49 0 4.68.96 2.19.93 3.81 2.55t2.55 3.81",
    ],
  },
  openrouter: {
    viewBox: "0 0 24 24",
    paths: [
      "M18.654 3.87a5.087 5.087 0 110 10.174L23.7 19.09c.64.641.187 1.737-.72 1.737H8.48a8.479 8.479 0 010-16.958h10.175zM8.479 7.26a5.087 5.087 0 100 10.176 5.087 5.087 0 000-10.175z",
    ],
    fillRule: "evenodd",
  },
  groq: {
    viewBox: "0 0 33 33",
    paths: [
      "m18.445 4.406-9.468 13.74 7.341.665-1.69 9.578 9.469-13.74-7.342-.664 1.69-9.579Z",
    ],
  },
  mistral: {
    viewBox: "0 0 24 24",
    paths: [
      "M3.428 3.4h3.429v3.428h3.429v3.429h-.002 3.431V6.828h3.427V3.4h3.43v13.714H24v3.429H13.714v-3.428h-3.428v-3.429h-3.43v3.428h3.43v3.429H0v-3.429h3.428V3.4zm10.286 13.715h3.428v-3.429h-3.427v3.429z",
    ],
    fillRule: "evenodd",
  },
  cerebras: {
    viewBox: "0 0 24 24",
    paths: [
      "M14.121 2.701a9.299 9.299 0 000 18.598V22.7c-5.91 0-10.7-4.791-10.7-10.701S8.21 1.299 14.12 1.299V2.7zm4.752 3.677A7.353 7.353 0 109.42 17.643l-.901 1.074a8.754 8.754 0 01-1.08-12.334 8.755 8.755 0 0112.335-1.08l-.901 1.075zm-2.255.844a5.407 5.407 0 00-5.048 9.563l-.656 1.24a6.81 6.81 0 016.358-12.043l-.654 1.24zM14.12 8.539a3.46 3.46 0 100 6.922v1.402a4.863 4.863 0 010-9.726v1.402z",
      "M15.407 10.836a2.24 2.24 0 00-.51-.409 1.084 1.084 0 00-.544-.152c-.255 0-.483.047-.684.14a1.58 1.58 0 00-.84.912c-.074.203-.11.416-.11.631 0 .218.036.43.11.631a1.594 1.594 0 00.84.913c.2.093.43.14.684.14.216 0 .417-.046.602-.135.188-.09.35-.225.475-.392l.928 1.006c-.14.14-.3.261-.482.363a3.367 3.367 0 01-1.083.38c-.17.026-.317.04-.44.04a3.315 3.315 0 01-1.182-.21 2.825 2.825 0 01-.961-.597 2.816 2.816 0 01-.644-.929 2.987 2.987 0 01-.238-1.21c0-.444.08-.847.238-1.21.15-.35.368-.666.643-.929.278-.261.605-.464.962-.596a3.315 3.315 0 011.182-.21c.355 0 .712.068 1.072.204.361.138.685.36.944.649l-.962.97z",
    ],
    fillRule: "evenodd",
  },
};

export const logoFor = (providerId: string): ProviderLogo | null =>
  PROVIDER_LOGOS[providerId] ?? null;
