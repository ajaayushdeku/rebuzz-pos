export type OfferCreationDraft =
  | {
      source: "slow-item";
      move: "discount" | "freebie";
      productId: string;
      productName: string;
      suggestedCode: string;
    }
  | {
      source: "festival";
      festivalId?: string;
      label: string;
      startDate: string;
      endDate: string;
      suggestedCode: string;
      offerIdea?: string;
    };

const STORAGE_KEY = "offer-creation-draft";

export function saveOfferCreationDraft(draft: OfferCreationDraft) {
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(draft));
}

export function consumeOfferCreationDraft(): OfferCreationDraft | null {
  const stored = sessionStorage.getItem(STORAGE_KEY);

  if (!stored) return null;

  sessionStorage.removeItem(STORAGE_KEY);

  try {
    return JSON.parse(stored) as OfferCreationDraft;
  } catch {
    return null;
  } finally {
    sessionStorage.removeItem(STORAGE_KEY);
  }
}

export function createSuggestedPromoCode(
  value: string,
  suffix: string,
): string {
  const normalized = value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "")
    .slice(0, 16);

  return `${normalized || "SPECIAL"}${suffix}`;
}
