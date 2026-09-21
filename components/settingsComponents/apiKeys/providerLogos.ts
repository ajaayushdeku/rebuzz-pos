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
  /** One or more paths, for marks drawn in several shapes. */
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
  nvidia: {
    viewBox: "0 0 24 24",
    paths: [
      "M10.212 8.976V7.62c.127-.01.256-.017.388-.021 3.596-.117 5.957 3.184 5.957 3.184s-2.548 3.647-5.282 3.647a3.227 3.227 0 01-1.063-.175v-4.109c1.4.174 1.681.812 2.523 2.258l1.873-1.627a4.905 4.905 0 00-3.67-1.846 6.594 6.594 0 00-.729.044m0-4.476v2.025c.13-.01.259-.019.388-.024 5.002-.174 8.261 4.226 8.261 4.226s-3.743 4.69-7.643 4.69c-.338 0-.675-.031-1.007-.092v1.25c.278.038.558.057.838.057 3.629 0 6.253-1.91 8.794-4.169.421.347 2.146 1.193 2.501 1.564-2.416 2.083-8.048 3.763-11.24 3.763-.308 0-.603-.02-.894-.048V19.5H24v-15H10.21zm0 9.756v1.068c-3.356-.616-4.287-4.21-4.287-4.21a7.173 7.173 0 014.287-2.138v1.172h-.005a3.182 3.182 0 00-2.502 1.178s.615 2.276 2.507 2.931m-5.961-3.3c1.436-1.935 3.604-3.148 5.961-3.336V6.523C5.81 6.887 2 10.723 2 10.723s2.158 6.427 8.21 7.015v-1.166C5.77 16 4.25 10.958 4.25 10.958h-.002z",
    ],
    fillRule: "evenodd",
  },
  mistral: {
    viewBox: "0 0 24 24",
    paths: [
      "M3.428 3.4h3.429v3.428h3.429v3.429h-.002 3.431V6.828h3.427V3.4h3.43v13.714H24v3.429H13.714v-3.428h-3.428v-3.429h-3.43v3.428h3.43v3.429H0v-3.429h3.428V3.4zm10.286 13.715h3.428v-3.429h-3.427v3.429z",
    ],
    fillRule: "evenodd",
  },
};

export const logoFor = (providerId: string): ProviderLogo | null =>
  PROVIDER_LOGOS[providerId] ?? null;
