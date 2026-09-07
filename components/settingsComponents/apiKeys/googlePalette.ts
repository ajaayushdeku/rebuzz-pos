/**
 * Google's four brand colours, for the API Keys screen.
 *
 * Each colour carries three values because one is never enough:
 *
 * - `hex`   the brand colour itself, for gradients and solid marks
 * - `tint`  a pale wash for chip backgrounds
 * - `ink`   a darkened variant for text and icons
 *
 * The split exists because the brand colours are not text colours. Google
 * yellow (#FBBC05) sits at roughly 1.9:1 against white — invisible as type,
 * and it fails contrast at any size. `ink` uses Google's own dark variants so
 * the palette still reads as Google while staying legible.
 */
export interface GoogleColor {
  name: string;
  hex: string;
  tint: string;
  ink: string;
}

export const GOOGLE_COLORS: GoogleColor[] = [
  { name: "blue", hex: "#4285F4", tint: "#E8F0FE", ink: "#1967D2" },
  { name: "red", hex: "#EA4335", tint: "#FCE8E6", ink: "#C5221F" },
  { name: "yellow", hex: "#FBBC05", tint: "#FEF7E0", ink: "#A16207" },
  { name: "green", hex: "#34A853", tint: "#E6F4EA", ink: "#137333" },
];

/** Blue → red → yellow → green, cycling, so any-length list stays on brand. */
export function googleColorAt(index: number): GoogleColor {
  return GOOGLE_COLORS[index % GOOGLE_COLORS.length];
}

/**
 * The four-stop sweep used for rules and accent bars.
 *
 * Written once here rather than repeated per component: four hex values
 * inlined in three places would drift the first time one was adjusted.
 */
export const GOOGLE_GRADIENT =
  "linear-gradient(90deg, #4285F4 0%, #EA4335 33%, #FBBC05 66%, #34A853 100%)";

/**
 * Gemini's own blue → violet → rose sweep, for the provider mark.
 *
 * Separate from the four Google brand colours above, which stay on the guide's
 * step numbers and fact icons. The product has its own identity and the icon
 * names the product, not the company.
 */
export const GEMINI_COLORS = ["#4796E3", "#9177C7", "#CA6673"];

/**
 * The id of the SVG gradient the provider icon strokes itself with.
 *
 * An icon cannot take a CSS gradient: `color` and `stroke` accept a solid
 * value only, so `color: linear-gradient(...)` is discarded and the icon falls
 * back to whatever it inherited. The colours have to exist as a real
 * `<linearGradient>` in the document, which the stroke then points at by id —
 * see GeminiGradientDefs.
 */
export const GEMINI_GRADIENT_ID = "gemini-brand-sweep";

/** `stroke`/`fill` value that paints with the gradient above. */
export const GEMINI_STROKE = `url(#${GEMINI_GRADIENT_ID})`;

/** The same sweep as CSS, for any flat fill that needs to match the icon. */
export const GEMINI_GRADIENT = `linear-gradient(135deg, ${GEMINI_COLORS.join(", ")})`;
