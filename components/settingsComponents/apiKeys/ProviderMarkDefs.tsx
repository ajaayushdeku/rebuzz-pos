import {
  PROVIDER_META,
  markGradientId,
  markGradientIdDark,
} from "./providerMeta";

/**
 * The SVG gradients the provider marks stroke themselves with.
 *
 * Rendered once, zero-sized and hidden from assistive tech — it draws nothing
 * itself and exists only so `stroke="url(#…)"` has something to resolve
 * against. Kept out of the icons so several marks can share one definition
 * rather than each carrying a duplicate with a colliding id.
 *
 * Every provider that declares stops gets one, so a new provider's sweep is an
 * entry in providerMeta rather than a component of its own — which is what the
 * Gemini-only version of this file had become.
 */
export default function ProviderMarkDefs() {
  const withGradients = Object.entries(PROVIDER_META).filter(
    ([, meta]) => meta.gradient && meta.gradient.length > 1,
  );

  /**
   * Both sweeps are defined, always. An SVG `<linearGradient>` is referenced by
   * id, and a `dark:` class cannot rewrite that id — so the mark draws itself
   * twice, once per theme, and the classes show one. Defining both here means
   * each id exists whichever copy is visible.
   */
  const sweeps = withGradients.flatMap(([id, meta]) => [
    { key: id, id: markGradientId(id), stops: meta.gradient! },
    ...(meta.darkGradient && meta.darkGradient.length > 1
      ? [
          {
            key: `${id}-dark`,
            id: markGradientIdDark(id),
            stops: meta.darkGradient,
          },
        ]
      : []),
  ]);

  return (
    <svg
      width="0"
      height="0"
      aria-hidden
      focusable="false"
      className="absolute"
    >
      <defs>
        {sweeps.map(({ key, id, stops }) => (
          <linearGradient key={key} id={id} x1="0%" y1="0%" x2="100%" y2="100%">
            {stops.map((hex, index) => (
              <stop
                key={hex}
                offset={`${(index / (stops.length - 1)) * 100}%`}
                stopColor={hex}
              />
            ))}
          </linearGradient>
        ))}
      </defs>
    </svg>
  );
}
