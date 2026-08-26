# Loading dashboard panels only when they scroll into view

**Short answer: yes, it's possible — but not for the panels as they're written
today.** The overview page's panels are Server Components, and a Server
Component's data fetch happens on the server at request time. There is no
moment at which the browser can say "not yet, it's off screen". Panels you want
to defer have to become Client Components first.

This document explains what's already happening, what changes, and what it
costs.

---

## Three different things, often called the same thing

"Only load what's on screen" bundles together three separate savings. They're
worth separating, because they have different costs and different fixes.

| What is deferred | What it saves           | How                          |
| ---------------- | ----------------------- | ---------------------------- |
| **The data**     | API calls, server load  | Gate the query on visibility |
| **The JS**       | Bundle size, parse time | `next/dynamic`               |
| **The render**   | Layout & paint work     | `content-visibility: css`    |

You can adopt them independently. The third is nearly free and needs no
refactor, so it's the right place to start.

---

## What the overview page already does

[`app/(app)/dashboard/(overview)/page.tsx`](../app/%28app%29/dashboard/%28overview%29/page.tsx)
wraps each panel in `<Suspense>` with its own skeleton:

```tsx
<ChartErrorBoundary>
  <Suspense fallback={<HourlySalesTrendSkeleton />}>
    <HourlySalesTrendWrapper />
  </Suspense>
</ChartErrorBoundary>
```

That's already doing real work. The page **streams**: HTML is sent as each
panel's data resolves, so the stat cards appear while the AI story is still
being fetched. Nothing blocks on the slowest panel.

What it does _not_ do is skip anything. All eleven fetches begin the moment the
request arrives, whether or not you ever scroll to them.

---

## Why the panels can't simply be gated

From the Next.js lazy-loading guide:

> By default, Server Components are automatically code split, and you can use
> streaming to progressively send pieces of UI from the server to the client.
> **Lazy loading applies to Client Components.**

The overview wrappers are `async` Server Components — they `await
getHourlySalesData()` during the render on the server. Viewport visibility is a
fact about a browser that doesn't exist yet at that point.

So deferring a panel means moving its fetch to the client:

```
Server Component            →  Client Component
awaits during SSR              useQuery({ enabled: inView })
streams as HTML                fetches after the browser sees it
```

That's a real trade, covered under **What it costs** below.

---

## The pattern

### 1. A hook that reports visibility

```ts
// hooks/useInView.ts
"use client";

import { useEffect, useRef, useState } from "react";

/**
 * True once the element has been scrolled near the viewport.
 *
 * Latches: once seen, it stays true. A panel that unloaded itself on scroll-past
 * would refetch every time it came back, which is worse than never deferring.
 */
export function useInView<T extends HTMLElement>(rootMargin = "200px") {
  const ref = useRef<T>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el || inView) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          observer.disconnect();
        }
      },
      { rootMargin },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [inView, rootMargin]);

  return { ref, inView };
}
```

### 2. A wrapper that reserves its space

```tsx
// components/ui/LazyPanel.tsx
"use client";

export default function LazyPanel({
  fallback,
  minHeight,
  children,
}: {
  fallback: React.ReactNode;
  /** Must match the loaded panel's height, or the page jumps when it fills. */
  minHeight: number;
  children: React.ReactNode;
}) {
  const { ref, inView } = useInView<HTMLDivElement>();

  return (
    <div ref={ref} style={{ minHeight }}>
      {inView ? children : fallback}
    </div>
  );
}
```

### 3. A panel that fetches when told to

```tsx
"use client";

export default function HourlySalesPanel({ enabled }: { enabled: boolean }) {
  const { data, isLoading } = useQuery({
    queryKey: ["hourly-sales"],
    queryFn: getHourlySales,
    enabled, // ← nothing is requested until this flips true
  });

  if (isLoading) return <HourlySalesTrendSkeleton />;
  return <HourlySalesTrend data={data} />;
}
```

---

## The two settings that decide whether it feels good or broken

### `rootMargin` — start before it's visible

With `rootMargin: "0px"`, loading starts the instant the panel's edge appears,
so you watch a skeleton fill in every time. `"200px"` starts the fetch while
the panel is still one screen below, and on a normal scroll it's ready before
you arrive.

Too large and you've re-created eager loading. 200–400px is the useful range.

### `minHeight` — reserve the space

An unloaded panel that occupies no height means the page grows as each one
fills, and content jumps under the reader's eyes — and under their cursor. The
placeholder must be as tall as the real panel. This is the single most common
way a lazy-loaded page ends up feeling worse than the eager one it replaced.

---

## Deferring the JavaScript too

`next/dynamic` splits a Client Component into its own chunk:

```tsx
const AIBusinessStory = dynamic(
  () => import("@/components/dashboardComponents/overviewDash/AIBusinessStory"),
  { loading: () => <StorySkeleton />, ssr: false },
);
```

This matters most for panels carrying heavy libraries. On the overview page
that's the Recharts panels — the charting library is a large dependency, and a
user who never scrolls to the payment-methods pie has downloaded and parsed it
for nothing.

Note from the Next docs: `ssr: false` only works inside a Client Component.

---

## The cheap win, first

Before any refactor, this costs one line per panel:

```css
.dashboard-panel {
  content-visibility: auto;
  contain-intrinsic-size: auto 320px; /* the height to assume while skipped */
}
```

The browser skips layout, style and paint for off-screen elements entirely.
It does **not** skip fetching — the data still loads — but on a page with
eleven charts, the rendering work is a large share of the cost, and this
requires no change to how anything loads.

`contain-intrinsic-size` is the same reserved-height idea as `minHeight`: without
it, the scrollbar jitters as skipped elements are measured.

---

## What it costs

**No server rendering for deferred panels.** They arrive as skeletons in the
HTML and fill in after hydration. For an authenticated dashboard that isn't
indexed and isn't shared, this matters much less than it would on a marketing
page — but it's a real change.

**Two data paths to maintain.** Above-the-fold panels keep fetching on the
server; deferred ones fetch through React Query on the client. Same figures,
two routes to them.

**The fetch starts later.** Deferring by definition moves work later. Scroll
fast and you'll meet skeletons that eager loading would have filled.

**More client JavaScript.** Every converted panel moves from server-only to a
client bundle. The `next/dynamic` split offsets this, but it isn't free.

---

## Suggested plan for the overview page

Order matters — each step is useful alone, so you can stop at any point.

1. **`content-visibility` on every panel.** No refactor, no behaviour change,
   immediate rendering win. Measure before going further; it may be enough.

2. **`next/dynamic` for the chart-heavy panels** — the two pie charts, weekly
   revenue, hourly sales. Cuts the initial bundle without touching the data
   flow.

3. **Viewport-gate the expensive tail only.** On this page that's
   `AIBusinessStoryWrapper` and `BusinessInsightsAlertsWrapper` — they sit at
   the bottom, they're the most expensive to produce, and plenty of sessions
   never scroll that far.

4. **Leave the top alone.** Stats, winning stats and the first chart row are
   visible on load. Deferring them adds machinery to save nothing, and risks
   making the first paint worse.

The honest summary: the biggest win here is (1) and (2), which need no
architectural change. Step (3) is worth it for a handful of genuinely expensive
panels, not as a blanket policy.

---

## When not to do this

- **Short pages.** If everything fits in two screens, the machinery costs more
  than it saves.
- **Panels feeding a page-level total.** If a figure at the top sums data from
  a panel below, that panel can't be deferred — the total would be wrong until
  you scrolled.
- **Anything printed or exported.** A PDF or print view needs every panel
  rendered whether or not it was ever on screen.
