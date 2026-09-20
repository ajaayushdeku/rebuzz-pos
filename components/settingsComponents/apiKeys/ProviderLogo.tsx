import { Sparkles } from "lucide-react";

import { logoFor } from "./providerLogos";
import { markPaint } from "./providerMeta";

/**
 * A provider's own mark, in its own colours.
 *
 * Filled with the provider's gradient where it has one, so Gemini's spark
 * carries its blue → violet → rose and OpenRouter's arrow its near-black →
 * lime. A provider the app has no mark for — one the service added later —
 * falls back to a neutral sparkle rather than a blank square.
 */
export default function ProviderLogo({
  provider,
  size = 20,
  className,
  /**
   * Overrides the provider's own colours. For a mark sitting on the
   * provider's button, where the gradient would fight the background it is
   * drawn on and the button's own ink is the only colour guaranteed to read.
   */
  paint: override,
}: {
  provider: string;
  size?: number;
  className?: string;
  paint?: string;
}) {
  const logo = logoFor(provider);
  const paint = override ?? markPaint(provider);

  if (!logo) {
    return (
      <Sparkles
        size={size}
        strokeWidth={1.75}
        stroke={paint}
        aria-hidden
        className={className}
      />
    );
  }

  return (
    <svg
      width={size}
      height={size}
      viewBox={logo.viewBox}
      fill={paint}
      aria-hidden
      focusable="false"
      className={className}
    >
      {logo.paths.map((d) => (
        <path key={d.slice(0, 24)} d={d} fillRule={logo.fillRule} />
      ))}
    </svg>
  );
}
