import type { DiscountType, ItemScope } from "@/providers/OfferFormContext";

/**
 * The seven deals a business can build, in the order they are offered.
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
    discountType: "percentage",
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
    discountType: "fixed",
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
    discountType: "fixed",
  },
  {
    id: "combo",
    icon: "📚",
    title: "Combo deal",
    subtitle: "Bundle offer",
    discountType: "fixed",
  },
  {
    id: "bonus",
    icon: "🌟",
    title: "Bonus points",
    subtitle: "Loyalty bonus",
    discountType: "fixed",
  },
  {
    id: "custom",
    icon: "✨",
    title: "Custom offer",
    subtitle: "Custom deal rule",
    discountType: "fixed",
  },
];

export const SCOPES: { id: ItemScope; label: string }[] = [
  { id: "all", label: "The whole bill" },
  { id: "category", label: "A menu category" },
  { id: "specific", label: "A specific item" },
];

export function dealById(id: string): DealKind | undefined {
  return DEAL_KINDS.find((d) => d.id === id);
}

/**
 * What the deal applies to, as the customer would read it — "your whole bill",
 * "MoMo & Noodles", "Chicken Momo".
 *
 * Falls back to wording that still reads as a sentence while the merchant is
 * mid-typing: a half-filled form should preview as a plausible offer, not as
 * "Get 15% off undefined".
 */
export function scopePhrase(
  scope: ItemScope,
  category: string,
  itemName?: string,
): string {
  if (scope === "category") return category.trim() || "your chosen category";
  if (scope === "specific") return itemName?.trim() || "your chosen item";
  return "your whole bill";
}

/**
 * The badge and headline the customer sees, for any deal and any scope.
 *
 * One function rather than a branch inside each preview channel: the app feed,
 * the Viber message and the printed receipt all say the same thing, and three
 * copies of this would drift the first time a deal was reworded.
 */
export function offerCopy(args: {
  dealId: string;
  amount: number;
  scope: ItemScope;
  category: string;
  itemName?: string;
  freeItemName?: string;
  customDeal: string;
  /** The business's currency symbol — the copy is not Rs-only. */
  currency: string;
}): { badge: string; headline: string } {
  const where = scopePhrase(args.scope, args.category, args.itemName);
  const onWhere = args.scope === "all" ? "your whole bill" : `on ${where}`;

  switch (args.dealId) {
    case "percentage":
      return {
        badge: `${args.amount || 0}% OFF`,
        headline: `Get ${args.amount || 0}% off ${where}`,
      };
    case "rupee":
      return {
        badge: `${args.currency} ${args.amount || 0} OFF`,
        headline: `Get ${args.currency} ${args.amount || 0} off ${where}`,
      };
    case "bogo":
      return {
        badge: "BUY 1 GET 1",
        headline: `Buy one, get one free ${onWhere}`,
      };
    case "free-item":
      return {
        badge: "FREE ITEM",
        headline: args.freeItemName
          ? `Get a free ${args.freeItemName} with ${where}`
          : `Get a free item with ${where}`,
      };
    case "combo":
      return {
        badge: "COMBO DEAL",
        headline: `Grab the combo deal ${onWhere}`,
      };
    case "bonus":
      return {
        badge: "BONUS POINTS",
        headline: `Earn extra reward points on ${where}`,
      };
    case "custom":
      return {
        badge: "SPECIAL OFFER",
        headline: args.customDeal.trim() || "Your custom offer appears here",
      };
    default:
      return {
        badge: "OFFER",
        headline: "Pick a deal to see how it looks",
      };
  }
}

/**
 * The deal as one short phrase — "23% off on the whole bill".
 *
 * The preview headline sells the offer to a customer; this describes it back
 * to the person building it, so it stays terse and drops the "Get".
 */
export function dealSummary(args: {
  dealId: string;
  amount: number;
  scope: ItemScope;
  category: string;
  itemName?: string;
  freeItemName?: string;
  customDeal: string;
  currency: string;
}): string | null {
  if (!args.dealId) return null;

  const where = scopePhrase(args.scope, args.category, args.itemName);
  const on = args.scope === "all" ? "on the whole bill" : `on ${where}`;

  switch (args.dealId) {
    case "percentage":
      return `${args.amount || 0}% off ${on}`;
    case "rupee":
      return `${args.currency} ${args.amount || 0} off ${on}`;
    case "bogo":
      return `Buy one get one free ${on}`;
    case "free-item":
      return args.freeItemName
        ? `Free ${args.freeItemName} ${on}`
        : `A free item ${on}`;
    case "combo":
      return args.customDeal.trim() || `Combo deal ${on}`;
    case "bonus":
      return `Bonus loyalty points ${on}`;
    case "custom":
      return args.customDeal.trim() || "Your custom offer";
    default:
      return null;
  }
}
