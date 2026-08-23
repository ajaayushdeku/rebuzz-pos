# Matching currency to the business's location

How to make the app's currency follow where the business actually is, instead
of being a per-browser preference.

---

## 1. Where things stand today

**Currency is a browser preference, not a business property.**

| Piece | File | What it does |
| --- | --- | --- |
| Source of truth | `providers/CurrencyContext.tsx` | Holds the active `CurrencyConfig` in React state |
| Seed value | `app/(app)/layout.tsx` | Reads a `currency` cookie server-side, passes it as `initialCurrencyCode` |
| Fallback | `lib/config/store.ts` | Hard-coded `NPR / Rs / ne-NP` |
| Write path | `CurrencyProvider.setCurrency()` | Writes the `currency` cookie **and** `localStorage`, then the settings page reloads |
| Picker | `app/(app)/settings/currency/page.tsx` | 21 currencies, each already carrying a `countryCode` for its flag |

Two consequences worth being explicit about:

1. **Two staff members on the same business can see different currencies.** The
   choice lives in one person's cookie. Clearing site data resets it to NPR.
2. **Nothing about the business influences it.** A shop that entered a Texas
   address still defaults to Nepalese Rupees.

**The business record has no country.** From `services/apiBusiness.client.ts`:

```ts
interface Business {
  businessName: string;
  address: string;            // free text — "Baneshwor, Kathmandu"
  accurateLocation: string;   // free text — map link / coordinates
  phoneNumber: string;
  panNumber: number;
  owner: string;
  businessType: string;
  logo?: string;
}
```

There is no `country` or `countryCode` field. (Customers have `countryCode`;
businesses do not.) So today there is nothing to derive a currency *from*.

---

## 2. Why "parse the address" is the wrong primary approach

The obvious idea is to read the country out of `address`. It doesn't hold up:

- `address` is free text with no format. `"Kathmandu, Nepal"` is parseable;
  `"Ward 5, Baneshwor"`, `"Near Big Mart"` or `"शहर"` are not.
- Matching country **names** inside a string produces false positives —
  "Chad", "Jordan", "Georgia" and "Turkey" all appear in ordinary addresses.
- Real parsing means geocoding (Google Places, Mapbox, Nominatim): an API key,
  per-request cost, rate limits, a network dependency on a settings save, and
  sending a customer's address to a third party.
- It silently produces a **wrong** answer rather than no answer. Getting the
  currency wrong is worse than asking.

Geocoding is a fine way to *suggest* a country. It is a bad way to *decide* one.

---

## 3. Recommended design

> **Store an explicit country on the business. Derive a suggested currency from
> it. Let the business override. Persist the result on the business record, not
> in a cookie.**

Four properties this gives you:

- Deterministic — a lookup table, not a parser.
- Correct for the exception — a Nepali business that invoices in USD can.
- Shared — everyone signed into the business sees the same currency.
- Cheap — no third-party API required for the core path.

### 3.1 Precedence

```
business.currency          (explicit choice — always wins)
  ↓ if unset
currencyForCountry(business.country)
  ↓ if unset or unmapped
storeConfig.currency       (NPR — today's default)
```

### 3.2 Data model

Add two fields to the business record:

| Field | Type | Notes |
| --- | --- | --- |
| `country` | ISO 3166-1 alpha-2, e.g. `"NP"` | Set from a picker in business settings |
| `currency` | ISO 4217, e.g. `"NPR"` | Optional. Absent means "follow the country" |

Both need adding to `Business`, `BusinessFormValues`, the `FormData` built in
`updateBusinessData`, and the backend's business schema.

**This is the one piece that needs a backend change.** Everything else in this
document is front-end only.

---

## 4. Implementation

### Phase 1 — country → currency map (no backend needed)

A new `lib/config/countryCurrency.ts`:

```ts
/**
 * ISO 3166-1 alpha-2 → ISO 4217, restricted to the currencies the app
 * actually supports (see CURRENCIES in providers/CurrencyContext).
 *
 * Many-to-one on purpose: the eurozone and the dollarised economies all map
 * onto one currency, which is exactly why the reverse lookup on the currency
 * page's `countryCode` cannot be used for this.
 */
export const COUNTRY_TO_CURRENCY: Record<string, string> = {
  NP: "NPR",
  IN: "INR",
  US: "USD",
  GB: "GBP",
  AU: "AUD",
  CA: "CAD",
  JP: "JPY",
  CN: "CNY",
  SG: "SGD",
  AE: "AED",
  SA: "SAR",
  NZ: "NZD",
  KR: "KRW",
  MY: "MYR",
  TH: "THB",
  PH: "PHP",
  CH: "CHF",
  SE: "SEK",
  HK: "HKD",
  BR: "BRL",
  // Eurozone — all one currency
  DE: "EUR", FR: "EUR", IT: "EUR", ES: "EUR", NL: "EUR", BE: "EUR",
  AT: "EUR", IE: "EUR", PT: "EUR", FI: "EUR", GR: "EUR",
};

export function currencyForCountry(country?: string | null): string | null {
  if (!country) return null;
  return COUNTRY_TO_CURRENCY[country.toUpperCase()] ?? null;
}
```

Note the direction. `app/(app)/settings/currency/page.tsx` already has a
`countryCode` per currency, but that is **currency → one representative
country** and cannot be inverted: EUR would map back to a single arbitrary
member state.

### Phase 2 — a country field in business settings

`app/(app)/settings/business/page.tsx` gains a Country select above Address.
Reuse the flag rendering already written on the currency page —
`https://flagcdn.com/{code}.svg` with `object-contain`, which is there
specifically because Nepal's flag is not rectangular.

Nothing about currency changes yet. This phase just starts collecting the data.

### Phase 3 — suggest, don't force

When the country is set (or changed) and it maps to a currency that differs
from the active one, prompt rather than switch:

```
Your business is in Nepal.
Switch currency to NPR (Rs)?              [Not now]  [Switch]
```

The existing `ConfirmDialog` with `tone="primary"` covers this; the currency
settings page already uses it with a flag badge.

**Only ever a suggestion.** A business legitimately invoices in a currency
other than its own country's, and silently changing it would rewrite how every
figure in the app reads.

### Phase 4 — move the source of truth to the business record

This is what makes it a business property rather than a browser one.

```
CurrencyProvider
  initial value ← business.currency ?? currencyForCountry(business.country) ?? storeConfig.currency
  cookie        ← demoted to a first-paint cache, so SSR does not flash the
                  default before the business query resolves
  setCurrency   → PUT /api/business  (and refresh the cookie)
```

`app/(app)/layout.tsx` currently seeds the provider from the cookie. Keep that
as the fast path, then reconcile once `useBusiness()` resolves — if they
disagree, the business record wins and the cookie is rewritten.

### Phase 5 (optional) — pre-fill the country at onboarding

Only to save typing; the field stays editable and confirmable.

- **Cheapest:** `Intl.DateTimeFormat().resolvedOptions().timeZone` →
  `"Asia/Kathmandu"` → `NP`. No network, no key, no personal data. Wrong for
  travellers and VPNs, which is fine for a pre-fill.
- **Better hit rate:** an IP-geolocation lookup at signup.
- **Most accurate:** geocode `address` / `accurateLocation` through Places.

All three feed the *default* of the picker in Phase 2. None of them decide.

---

## 5. Things to get right

**Changing currency does not convert amounts.** It changes the symbol and the
`Intl` locale used to format them. `formatCurrencySymbol(5000, "$", "en-US")`
renders `$5,000` from the same 5000 that rendered `Rs 5,000`. If real
multi-currency accounting is ever wanted, that is a different and much larger
piece of work — every stored amount needs a currency stamped on it and an
exchange rate at time of sale. Worth saying out loud in the UI, because
switching currency *looks* like a conversion.

**Historical bills keep their original currency in reality.** Until amounts are
stamped, switching re-labels past transactions too. Acceptable for a business
that sets this once at setup; not acceptable as something changed casually.
Another reason for Phase 3 to prompt rather than auto-switch.

**`locale` matters as much as `symbol`.** `en-IN` groups as `1,00,000` where
`en-US` gives `100,000`. The `CurrencyConfig` triple already carries it — keep
deriving all three together from the code, never just the symbol.

**Unmapped countries must degrade, not break.** `currencyForCountry()` returns
`null` for anything not in the table, and the chain falls through to the app
default. Adding a country is a one-line change.

**Keep the picker.** The Currency settings page stays exactly as it is; Phase 4
only changes where its choice is written to.

---

## 6. Suggested order of work

| # | Change | Backend? | Value on its own |
| --- | --- | --- | --- |
| 1 | `lib/config/countryCurrency.ts` | no | none yet — enables the rest |
| 2 | Country picker in business settings | **yes** (`country` field) | address data quality |
| 3 | "Switch currency?" prompt on country change | no | the feature as asked |
| 4 | Persist currency on the business record | **yes** (`currency` field) | fixes per-browser drift |
| 5 | Timezone/IP pre-fill of country | no | less typing at setup |

Steps 1–3 deliver "currency matches the business's location". Step 4 is the one
that fixes the deeper problem — that currency is a cookie today — and is worth
doing even if location-matching is dropped.
