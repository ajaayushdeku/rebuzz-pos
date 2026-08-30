# Sending a receipt for one payment

**Short answer: moderate — roughly half a day, and about 80% of the machinery
already exists.** The hard parts (rasterising a document to PDF, attaching it
to an email, authenticating the call) are all built and working. What is
missing is smaller than it looks: the button currently doesn't know _which_
payment it belongs to, and there is no document that describes a single
payment.

There is one genuine unknown, and it is on the backend, not here. It is
covered under [The one real unknown](#the-one-real-unknown).

---

## What happens today

Each payment in the credit's history renders its own "Send a receipt" button —
but every one of them calls the same handler, and that handler takes no
arguments:

```tsx
// components/credit/detail/CreditTimeline.tsx:362
<button onClick={onSendReceipt} className="hover:underline">
  Send a receipt
</button>
```

```tsx
// components/credit/detail/CreditTimeline.tsx:84
onSendReceipt: () => void;
```

```tsx
// app/(app)/records/credits/[id]/page.tsx:323
onSendReceipt={() => setIsEmailInvoiceOpen(true)}
```

So clicking the receipt link on the third payment does exactly what clicking it
on the first one does: it opens `CreditEmailModal`, which offers the **three
whole-credit documents** — proforma, credit invoice, tax invoice. None of them
is a receipt, and none of them is scoped to a payment.

The payment object `p` is right there in scope at the click site. It is simply
never passed anywhere.

> The invoice page has the identical problem, at
> `app/(app)/invoices/[id]/page.tsx:1202` — `onClick={() => setIsEmailInvoiceOpen(true)}`,
> with `p` in scope and ignored. Worth deciding up front whether you are fixing
> one page or both.

---

## What already exists

This is why the estimate is half a day and not three.

| Piece                                      | Where                                                                       | Reusable as-is?    |
| ------------------------------------------ | --------------------------------------------------------------------------- | ------------------ |
| Rasterise a DOM node → `jsPDF`             | `buildCreditPdf(ref)` in `creditDocumentActions.tsx`                        | **Yes**            |
| A4 page geometry + clean page breaks       | `buildPaginatedPdf`, `PDF_RENDER_WIDTH_PX/HEIGHT_PX` in `lib/invoicePdf.ts` | **Yes**            |
| Off-screen render layer                    | `CreditDocumentsOffscreen` / `OffscreenLayer`                               | Needs a variant    |
| Email a PDF                                | `emailCreditPdf({ credit, type, pdf, recipientEmail })`                     | Nearly — see below |
| Authenticated proxy                        | `app/api/bills/email/route.ts`                                              | **Yes**, untouched |
| Modal shell, document rows, section labels | `components/ui/ModalShell`                                                  | **Yes**            |
| Recipient resolution                       | `credit?.user?.email \|\| customerProfile?.email`                           | **Yes**            |

The whole pipeline — mount a node off-screen at page width, wait a tick for it
to paint, rasterise it, base64 it, POST it — is already proven by the three
credit documents. A receipt is a fourth thing going down the same pipe.

---

## What's missing

Three things, in increasing order of effort.

### 1. Identity — the button must say which payment (~15 minutes)

Change the prop from a thunk to a function that takes the payment, in three
places:

```diff
- onSendReceipt: () => void;
+ onSendReceipt: (payment: CreditPayment) => void;

- <button onClick={onSendReceipt} …>
+ <button onClick={() => onSendReceipt(p)} …>

- onSendReceipt={() => setIsEmailInvoiceOpen(true)}
+ onSendReceipt={(p) => setReceiptPayment(p)}
```

That is genuinely the whole of it. The page already does exactly this for the
neighbouring buttons — `onEditPayment={(p) => setPaymentToEdit(p)}` — so the
pattern is established one line below.

### 2. A receipt document (~2–3 hours)

This is the bulk of the work, and it is design work more than engineering.
There is no component that describes a single payment; `CreditInvoiceDocument`
describes the credit as a whole across 646 lines.

**The good news is that every figure a receipt needs is already loaded.**
`CreditPayment` carries:

```ts
{
  _id, credit, paymentMethod,
  paymentAmount,        // what this receipt is for
  dueAmount,            // balance remaining AFTER this payment
  paymentDate,
  isGrouped, groupedFrom,
  createdAt, updatedAt,
}
```

`dueAmount` is the balance _after_ the payment — the payment-history table
labels that column "Due after payment"
(`components/credit/CreditPaymentHistory.tsx:86`). So a receipt can state
"Paid: X · Balance remaining: Y" without a single extra fetch.

A receipt is also a much smaller document than an invoice — no line items, no
tax table, no totals ladder:

```
  [logo]  Business name, address, PAN
          RECEIPT · #<credit.invoiceNo>-<n>

  Received from   <customer name>
  Date            <paymentDate>
  Method          <paymentMethod>

  Amount received                     Rs 5,000.00
  ────────────────────────────────────────────────
  Invoice total                      Rs 20,000.00
  Previously paid                     Rs 5,000.00
  This payment                        Rs 5,000.00
  Balance remaining                  Rs 10,000.00

  <thank-you line / signature block>
```

The header block, the business/customer meta and the footer can be lifted
almost verbatim from `CreditInvoiceDocument`, which is where most of the time
saving comes from. Budget ~200 lines.

### 3. Off-screen rendering for a variable list (~1 hour, one wrinkle)

This is the only part with a real design decision in it.

The existing approach pre-mounts **all three** documents off-screen and holds
one ref each, because there are exactly three and the set never changes:

```ts
export function useCreditDocumentRefs(): CreditDocumentRefs {
  const proforma = useRef<HTMLDivElement | null>(null);
  const invoice = useRef<HTMLDivElement | null>(null);
  const tax = useRef<HTMLDivElement | null>(null);
  return { proforma, invoice, tax };
}
```

Payments are a list of unknown length, so that pattern does not extend. Two
options:

- **Render one receipt for the selected payment.** A single ref; the off-screen
  node re-renders whenever `selectedPayment` changes. `buildCreditPdf` already
  waits 200 ms for paint, which covers the swap. **This is the right choice** —
  simple, and only ever one node in the tree.
- Render N receipts with a ref array. Wasteful, and pointless: you can only
  email one at a time anyway.

So: a `CreditReceiptOffscreen` taking a nullable `payment`, plus a single ref.
Maybe 40 lines.

---

## The one real unknown

`emailCreditPdf` sends a `billType`, which the proxy forwards untouched to
`{BASE}/business/bills/email`:

```ts
billType: BILL_TYPE[type],   // "proforma" | "invoice" | "tax_invoice"
```

**There is no `receipt` value in that union**, and nothing in this repo says
what the backend does with `billType` or whether it validates against an enum.

Three possibilities:

1. The backend ignores it beyond logging → send anything, ship today.
2. The backend validates it → a new `"receipt"` value **needs a backend change**
   before this can ship, and no amount of frontend work gets around it.
3. You send `billType: "invoice"` with a receipt filename → works immediately,
   but whatever the backend records or templates off `billType` will be wrong.

**This is the thing to check first.** It costs one curl against the endpoint and
it decides whether this is a half-day frontend task or a cross-team one.

---

## Where it could get bigger

Things that are cheap to skip now but expensive to retrofit:

- **Grouped payments.** `isGrouped` / `groupedFrom` mean a payment can stand for
  several others. Should its receipt list what it covers? If yes, the document
  needs a small table and the effort roughly doubles.
- **Receipt numbering.** `credit.invoiceNo` plus an index is fine for display,
  but if receipts need stable, auditable numbers, that is a backend concern —
  an index shifts if a payment is ever removed, and the page already supports
  removing payments.
- **Print and download.** Right now the ask is email only. The same document
  would slot straight into the existing print and export modals, but that is
  three more wiring points.
- **Doing the invoice page too.** The document component would be shared; the
  threading work doubles.

---

## Suggested order

1. **Check `billType`** against the backend. Ten minutes; it gates everything.
2. **Thread the payment through** (step 1). Fifteen minutes, no visible change
   yet — the modal just gains a payment it does not use.
3. **Build the receipt document**, and eyeball it in the existing preview modal
   before wiring any email.
4. **Add the off-screen renderer and the send path**, reusing `buildCreditPdf`
   and `emailCreditPdf` verbatim.
5. Only then decide about print/download and the invoice page.

Steps 2–4 are the half day. Step 1 is the one that can turn this into a
two-team job, so do it first.
