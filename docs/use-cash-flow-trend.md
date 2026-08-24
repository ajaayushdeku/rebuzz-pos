# `useCashFlowTrend` — how it works

Plain-language notes on `hooks/useCashFlowTrend.ts`, the hook behind the Cash
Flow Trend chart on the Expense Analytics page.

---

## In one sentence

It fetches the last six months of income and expenses — **one request per
month** — and hands the chart six ready-to-plot points, ignoring whatever month
the page's filter is set to.

---

## Why it exists

The chart used to read its data from `ExpenseContext`:

```ts
const { transactions } = useTracker();
```

That context only ever holds **one month** — whichever the page's month/year
filter is set to:

```ts
// providers/ExpenseContext.tsx
queryKey: ["expense-transactions", month, year],
queryFn: () => fetchTransactions(month, year),
```

So the chart drew six bars but only ever had data for one of them. The other
five were zero, not because nothing happened in those months, but because
nothing had been *asked for*. And every time you changed the filter, the single
non-zero bar slid to a different position — which looked like a trend but
wasn't one.

The fix is for the chart to ask for its own six months.

---

## What it does, step by step

### 1. Work out which six months

```ts
const months = useMemo(() => trailingMonths(new Date()), []);
```

`trailingMonths` walks back from today and returns six entries, oldest first:

| | month | year | label | key |
| --- | --- | --- | --- | --- |
| 0 | 3 | 2026 | Mar | 2026-03 |
| 1 | 4 | 2026 | Apr | 2026-04 |
| … | | | | |
| 5 | 8 | 2026 | Aug | 2026-08 |

`useMemo` with an empty dependency list means this is computed **once per
mount**, so the window doesn't shift underneath you while the page is open.

### 2. Fetch all six at once

```ts
const results = useQueries({
  queries: months.map(({ month, year }) => ({
    queryKey: ["expense-transactions", month, year],
    queryFn: () => fetchTransactions(month, year),
    staleTime: 2 * 60 * 1000,
  })),
});
```

`useQueries` is React Query's "run this list of queries in parallel" hook. Six
queries go out together; `results` comes back as an array in the **same order**
as `months`, so `results[0]` is always the oldest month.

`staleTime: 2 minutes` means React Query won't re-fetch a month it already has
within that window.

### 3. Turn each month's rows into one point

```ts
const data = months.map((m, i) => {
  const rows = results[i]?.data?.transactions ?? [];

  let inflow = 0;
  let outflow = 0;
  for (const t of rows) {
    if (t.kind === "income") inflow += t.amount ?? 0;
    else outflow += t.amount ?? 0;
  }

  return { month: m.label, key: m.key, inflow, outflow };
});
```

Income adds to `inflow`, everything else to `outflow`. The `?? []` matters: a
month that hasn't loaded yet, or failed, contributes an empty list rather than
crashing — so the chart can render partial data.

### 4. Report state

```ts
isLoading: results.some((r) => r.isLoading),
isError:   results.every((r) => r.isError),
failedMonths: /* how many of the six failed */
```

- **`isLoading`** — true while *any* month is still in flight. The chart shows
  a skeleton rather than a half-drawn line.
- **`isError`** — only when **every** month failed. One flaky month shouldn't
  blank a chart that has five good ones.
- **`failedMonths`** — lets the chart say "2 of 6 months could not be loaded"
  instead of quietly drawing those months as zero, which would read as "no
  money moved" rather than "we don't know".

---

## The one clever bit: shared cache keys

The query keys are **deliberately identical** to the ones `ExpenseContext`
already uses:

```ts
["expense-transactions", month, year]
```

React Query caches by key, so matching them buys three things for free:

1. **Fewer requests.** The context has already fetched the current month (the
   filter) and the previous month (for its trend comparisons). Those two come
   straight from cache — only the older four are new requests.
2. **Automatic refresh.** Adding, editing or deleting an expense invalidates
   `["expense-transactions"]` in the context's mutations. That invalidation
   matches these keys too, so the chart updates on its own.
3. **No duplicate state.** There is one cached copy of "March 2026's
   transactions", not one per component.

This is why the hook uses `useQueries` rather than the existing
`fetchTransactionsRange` helper. That helper does the same six fetches, but
under a single key — `["expense-transactions", "range", monthRange]` — which
can't share anything with the per-month entries, so all six re-fetch every
time. `MonthlyExpenseTrend` still uses it; converging it on this approach would
be a reasonable follow-up.

---

## Two deliberate choices worth knowing

**Rows are summed as returned, not re-filtered by date.**

The old code bucketed transactions with `t.date.slice(0, 7)` — take the
`"YYYY-MM"` off the front of the date and match it to a month. That was
necessary when one big list covered several months. Here each request *is* one
month, so re-checking the date adds nothing — and would be actively dangerous:
if the API ever returned `"08/2026"` or an ISO timestamp instead, every match
would fail and the chart would silently flatten to zero.

**The window is fixed at mount, not recomputed each render.**

If someone leaves the page open across midnight on the 1st of a month, the
chart keeps the window it started with until the next navigation. That's a
deliberate trade: re-anchoring would change the query keys and re-fetch
everything mid-session for no real benefit.

---

## Using it

```tsx
const { data, isLoading, isError, failedMonths } = useCashFlowTrend();
```

`data` is a `CashFlowPoint[]` of exactly six entries, oldest first:

```ts
interface CashFlowPoint {
  month: string;   // "Aug" — the X-axis label
  key: string;     // "2026-08"
  inflow: number;
  outflow: number;
}
```

It is always six long, even before anything loads, so the chart's axis doesn't
jump as data arrives.

---

## If you need to change something

| Change | Where |
| --- | --- |
| Different window length (e.g. 12 months) | `WINDOW_MONTHS` in the hook |
| Month labels (locale, long names) | `MONTHS` array in the hook |
| Cache lifetime | `staleTime` in the `useQueries` call |
| Make it follow the page filter again | pass the filter's `month`/`year` into `trailingMonths` — but then remove the "Last 6 months" tag in the component, or it will lie |

The component also renders a **"Last 6 months"** tag in its header. That is not
decoration: on a page with a prominent month/year filter, a card that ignores
the filter looks broken unless it says so.
