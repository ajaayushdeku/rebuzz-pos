import type {
  CustomerAudience,
  DiscountType,
} from "@/providers/OfferFormContext";

/**
 * The deals a business can build, in the order they are offered.
 *
 * `discountType` is what the API is told; everything else is what the merchant
 * sees. Keeping the two beside each other means a new deal cannot be added to
 * the grid without deciding how it is saved.
 */
export interface DealKind {
  id: string;
  icon: string;
  title: string;
  subtitle: string;
  discountType: DiscountType;
  /** The numeric field this deal needs, if any. */
  value?: {
    label: string;
    prefix?: string;
    suffix?: string;
    placeholder: string;
  };
}

export const DEAL_KINDS: DealKind[] = [
  {
    id: "percentage",
    icon: "🏷️",
    title: "Percentage off",
    subtitle: "Discount by %",
    discountType: "percent",
    value: {
      label: "Discount percentage",
      suffix: "%",
      placeholder: "15",
    },
  },
  {
    id: "rupee",
    icon: "💵",
    title: "Rupee discount",
    subtitle: "Flat Rs savings",
    discountType: "amount",
    value: {
      label: "Discount amount in Rs",
      prefix: "Rs",
      placeholder: "100",
    },
  },
  {
    id: "bogo",
    icon: "🎁",
    title: "Buy 1, get 1 free",
    subtitle: "BOGO special",
    discountType: "bogo",
  },
  {
    id: "free-item",
    icon: "🍰",
    title: "Free item",
    subtitle: "Free side/drink",
    discountType: "freeItem",
  },
];

/**
 * Who the offer is for.
 *
 * `hint` is shown under the chosen option, so the rule is stated in full
 * before the offer is saved rather than inferred from a two-word label.
 */
export const AUDIENCES: {
  id: CustomerAudience;
  label: string;
  hint: string;
}[] = [
  { id: "all", label: "Everyone", hint: "Any customer, new or returning." },
  {
    id: "first-time",
    label: "First-time customers",
    hint: "Only on a customer's very first order.",
  },
  {
    id: "loyalty-tier",
    label: "A loyalty tier",
    hint: "Only customers who have reached the tier you choose.",
  },
  {
    id: "birthday",
    label: "Birthday",
    hint: "Around the customer's birthday.",
  },
];

export function audienceById(id: CustomerAudience) {
  return AUDIENCES.find((a) => a.id === id);
}

/**
 * The audience as the customer would read it, for the preview's fine print.
 *
 * Returns null for "everyone" — an offer open to all needs no qualifier, and
 * printing "for all customers" on every card is noise.
 */
export function audiencePhrase(args: {
  audience: CustomerAudience;
  tierName?: string;
}): string | null {
  switch (args.audience) {
    case "first-time":
      return "First-time customers only";
    case "loyalty-tier":
      return args.tierName?.trim()
        ? `${args.tierName.trim()} members only`
        : "Loyalty members only";
    case "birthday":
      return "Birthday treat";
    default:
      return null;
  }
}

export function dealById(id: string): DealKind | undefined {
  return DEAL_KINDS.find((d) => d.id === id);
}

/**
 * The badge and headline the customer sees.
 *
 * One function rather than a branch inside each preview channel: the app feed,
 * the Viber message and the printed receipt all say the same thing, and three
 * copies of this would drift the first time a deal was reworded.
 *
 * `title` wins when it is set, because step 1 shows the merchant that exact
 * sentence in an editable box: once they have reworded it, the preview printing
 * something else would make the box look like it did nothing. The badge is
 * still the deal's, since it is a label rather than a sentence.
 *
 * The audience is deliberately not folded in here. "Get 15% off, first-time
 * customers only" reads as one clause and buries the qualifier; the preview
 * prints it on its own line instead, where it can be seen before redeeming.
 */
export function offerCopy(args: {
  dealId: string;
  amount: number;
  freeItemName?: string;
  /** What the merchant called this offer, if they have named it yet. */
  title?: string;
  /** The business's currency symbol — the copy is not Rs-only. */
  currency: string;
}): { badge: string; headline: string } {
  const deal = autoCopy(args);
  const title = args.title?.trim();

  return title ? { badge: deal.badge, headline: title } : deal;
}

/**
 * The copy a deal writes for itself, before the merchant has edited it.
 *
 * Split out so step 1 can offer it as the title's starting text and still tell
 * whether what is in the box is still its own suggestion — if it is, a changed
 * amount may rewrite it; if not, it is the merchant's words and stays put.
 */
export function autoCopy(args: {
  dealId: string;
  amount: number;
  freeItemName?: string;
  currency: string;
}): { badge: string; headline: string } {
  switch (args.dealId) {
    case "percentage":
      return {
        badge: `${args.amount || 0}% OFF`,
        headline: `Get ${args.amount || 0}% off your order`,
      };
    case "rupee":
      return {
        badge: `${args.currency} ${args.amount || 0} OFF`,
        headline: `Get ${args.currency} ${args.amount || 0} off your order`,
      };
    case "bogo":
      return {
        badge: "BUY 1 GET 1",
        headline: "Buy one, get one free",
      };
    case "free-item":
      return {
        badge: "FREE ITEM",
        headline: args.freeItemName
          ? `Get a free ${args.freeItemName} with your order`
          : "Get a free item with your order",
      };
    default:
      return {
        badge: "OFFER",
        headline: "Pick a deal to see how it looks",
      };
  }
}

/**
 * The deal as one short phrase — "23% off, for first-time customers".
 *
 * The preview headline sells the offer to a customer; this describes it back
 * to the person building it, so it stays terse, drops the "Get", and names the
 * audience — the merchant needs to see who it targets at a glance.
 */
export function dealSummary(args: {
  dealId: string;
  amount: number;
  audience: CustomerAudience;
  tierName?: string;
  freeItemName?: string;
  currency: string;
}): string | null {
  if (!args.dealId) return null;

  const who = audiencePhrase({
    audience: args.audience,
    tierName: args.tierName,
  });
  const suffix = who ? `, ${who.toLowerCase()}` : "";

  const base = ((): string | null => {
    switch (args.dealId) {
      case "percentage":
        return `${args.amount || 0}% off`;
      case "rupee":
        return `${args.currency} ${args.amount || 0} off`;
      case "bogo":
        return "Buy one get one free";
      case "free-item":
        return args.freeItemName ? `Free ${args.freeItemName}` : "A free item";
      default:
        return null;
    }
  })();

  return base ? `${base}${suffix}` : null;
}

/**
 * MOCK: stands in for the short-link service, which does not exist yet.
 *
 * Deliberately a constant rather than a real origin — a link that looks live
 * but 404s is worse than one that plainly reads as a placeholder.
 */
export const MOCK_LINK_BASE = "https://offers.rebuzzpos.com";

/**
 * The offer's shareable link, or "" when there is no code to link to.
 *
 * Lives here so step 4 and the phone preview cannot show different addresses —
 * the QR the merchant downloads and the QR the customer sees have to be the
 * same code, and two copies of this would drift the first time the base
 * changed.
 */
export function offerLink(promoCode: string): string {
  const code = promoCode.trim().toLowerCase();
  return code ? `${MOCK_LINK_BASE}/${code}` : "";
}
