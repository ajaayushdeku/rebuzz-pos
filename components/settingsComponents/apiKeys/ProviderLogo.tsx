import { Sparkles } from "lucide-react";

import { logoFor } from "./providerLogos";
import { markPaint, markPaintDark } from "./providerMeta";

/**
 * A provider's own mark, in its own colours.
 *
 * Filled with the provider's gradient where it has one, so Gemini's spark
 * carries its blue → violet → rose and OpenRouter's arrow its near-black →
 * lime. A provider the app has no mark for — one the service added later —
 * falls back to a neutral sparkle rather than a blank square.
 *
 * Drawn twice, once per theme, with the classes showing one. A gradient fill is
 * a reference to an SVG id and a `dark:` class cannot rewrite that id, so there
 * is no way to swap the sweep on a single element. The second copy is
 * `aria-hidden` either way and carries no text, so it costs nothing but a node.
 */
export default function ProviderLogo({
  provider,
  size = 20,
  className,
  /**
   * Overrides the provider's own colours. For a mark sitting on the
   * provider's button, where the gradient would fight the background it is
   * drawn on and the button's own ink is the only colour guaranteed to read.
   * Applies to both themes: a caller that names a colour has already decided.
   */
  paint: override,
}: {
  provider: string;
  size?: number;
  className?: string;
  paint?: string;
}) {
  const logo = logoFor(provider);

  if (!logo) {
    const paint = override ?? markPaint(provider);
    const paintDark = override ?? markPaintDark(provider);
    return (
      <>
        <Sparkles
          size={size}
          strokeWidth={1.75}
          stroke={paint}
          aria-hidden
          className={`dark:hidden ${className ?? ""}`}
        />
        <Sparkles
          size={size}
          strokeWidth={1.75}
          stroke={paintDark}
          aria-hidden
          className={`hidden dark:block ${className ?? ""}`}
        />
      </>
    );
  }

  const mark = (paint: string, themeClass: string) => (
    <svg
      width={size}
      height={size}
      viewBox={logo.viewBox}
      fill={paint}
      aria-hidden
      focusable="false"
      className={`${themeClass} ${className ?? ""}`}
    >
      {logo.paths.map((d) => (
        <path key={d.slice(0, 24)} d={d} fillRule={logo.fillRule} />
      ))}
    </svg>
  );

  return (
    <>
      {mark(override ?? markPaint(provider), "dark:hidden")}
      {mark(override ?? markPaintDark(provider), "hidden dark:block")}
    </>
  );
}
