"use client";

import { Moon, Sun } from "lucide-react";

/** Where the choice is kept, and what the pre-paint script in the layout reads. */
export const THEME_KEY = "rebuzz-theme";

/**
 * The stars, placed rather than generated: three, at sizes that differ.
 *
 * They sit to the left, which is the half of the track the knob has left
 * behind by the time it is dark.
 */
const STARS = [
  { top: "4px", left: "6px", size: "2px", delay: "0ms" },
  { top: "10px", left: "11px", size: "1.5px", delay: "120ms" },
  { top: "6px", left: "16px", size: "1.5px", delay: "60ms" },
];

/**
 * The clouds, on the right, where the sun is not.
 *
 * Each is one rounded bar with two box-shadow copies of itself for the
 * bumps — a cloud shape without three elements to position, and the
 * negative spread is what makes the copies smaller than the bar.
 */
const CLOUDS = [
  {
    top: "5px",
    left: "20px",
    width: "9px",
    height: "3px",
    puffs: "2px -2px 0 -1px #fff, 6px -2px 0 -1px #fff",
    delay: "60ms",
  },
  {
    top: "12px",
    left: "25px",
    width: "6px",
    height: "2.5px",
    puffs: "2px -1px 0 -1px #fff",
    delay: "0ms",
  },
];

/**
 * The light/dark switch.
 *
 * It sets a class on `<html>` rather than holding the theme in React state:
 * `globals.css` already defines every token twice, under `:root` and under
 * `.dark`, so the whole page follows one class.
 *
 * Every moving part here is driven by that class through the `dark:`
 * variant — the knob slides, the sky changes, the sun sets and the stars
 * come out — so the switch is showing the right thing from the first paint
 * rather than after React has worked out which theme is on. That is also
 * why it holds no state: a render where the component does not yet know the
 * theme is exactly the flash the layout's script exists to prevent.
 */
export default function ThemeToggle() {
  const toggle = () => {
    const dark = document.documentElement.classList.toggle("dark");
    try {
      localStorage.setItem(THEME_KEY, dark ? "dark" : "light");
    } catch {
      // Private browsing, or storage turned off: the theme still changes,
      // it just will not be remembered.
    }
  };

  return (
    <button
      type="button"
      onClick={toggle}
      // A plain button rather than `role="switch"`: a switch must say which
      // way it is set, and this deliberately holds no state to say it with.
      // The label names the action instead, which is true either way.
      aria-label="Switch between light and dark theme"
      title="Switch theme"
      className="relative h-5 w-[38px] shrink-0 cursor-pointer overflow-hidden rounded-full border border-[#bcd4ef] bg-gradient-to-b from-[#cfe6fb] to-[#a9cdf2] transition-colors duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#244074]/40 dark:border-white/10 dark:from-[#16203a] dark:to-[#0d1424]"
    >
      {/* Daytime sky, behind the knob and only while it is light. */}
      {CLOUDS.map((cloud, i) => (
        <span
          key={i}
          aria-hidden
          className="absolute rounded-full bg-white opacity-80 transition-opacity duration-500 dark:opacity-0"
          style={{
            top: cloud.top,
            left: cloud.left,
            width: cloud.width,
            height: cloud.height,
            boxShadow: cloud.puffs,
            transitionDelay: cloud.delay,
          }}
        />
      ))}

      {/* Night sky, behind the knob and only after dark. */}
      {STARS.map((star, i) => (
        <span
          key={i}
          aria-hidden
          className="absolute rounded-full bg-white opacity-0 transition-opacity duration-500 dark:opacity-90"
          style={{
            top: star.top,
            left: star.left,
            width: star.size,
            height: star.size,
            transitionDelay: star.delay,
          }}
        />
      ))}

      {/* The knob. `translate` rather than `transform`: in Tailwind v4
          `translate-x-*` sets the standalone property, and the transition
          has to name it or nothing moves. */}
      <span
        aria-hidden
        className="absolute left-[3px] top-1/2 flex h-[14px] w-[14px] -translate-y-1/2 translate-x-0 items-center justify-center rounded-full bg-white shadow-sm transition-[translate,background-color] duration-300 ease-out motion-reduce:transition-none dark:translate-x-[18px] dark:bg-[#e8ecf4]"
      >
        {/* Both marks sit in the knob; the theme decides which is lit, so
            they cross over as it slides rather than popping. */}
        <Sun
          size={9}
          className="absolute text-[#E26924] opacity-100 transition-opacity duration-300 dark:opacity-0"
        />
        <Moon
          size={8}
          className="absolute text-[#244074] opacity-0 transition-opacity duration-300 dark:opacity-100"
        />
      </span>
    </button>
  );
}
