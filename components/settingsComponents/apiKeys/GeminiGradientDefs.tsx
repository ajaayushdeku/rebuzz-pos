import { GEMINI_COLORS, GEMINI_GRADIENT_ID } from "./googlePalette";

/**
 * The SVG gradient the Gemini mark strokes itself with.
 *
 * Rendered once, zero-sized and hidden from assistive tech — it draws nothing
 * itself and exists only so `stroke="url(#…)"` has something to resolve
 * against. Kept out of the icon so several marks can share one definition
 * rather than each carrying a duplicate with a colliding id.
 */
export default function GeminiGradientDefs() {
  return (
    <svg
      width="0"
      height="0"
      aria-hidden
      focusable="false"
      className="absolute"
    >
      <defs>
        <linearGradient
          id={GEMINI_GRADIENT_ID}
          x1="0%"
          y1="0%"
          x2="100%"
          y2="100%"
        >
          {GEMINI_COLORS.map((hex, index) => (
            <stop
              key={hex}
              offset={`${(index / (GEMINI_COLORS.length - 1)) * 100}%`}
              stopColor={hex}
            />
          ))}
        </linearGradient>
      </defs>
    </svg>
  );
}
