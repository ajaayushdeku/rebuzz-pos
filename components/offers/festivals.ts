/**
 * The occasions a Nepali business plans an offer around.
 *
 * Shared by step 3, which picks one, and step 4, which builds a promo code
 * from it — one list, so a festival added here shows up in both.
 */
export interface Festival {
  id: string;
  icon: string;
  label: string;
  /**
   * The stem of a generated promo code.
   *
   * Written out rather than derived from the label: "New Year's Eve" would
   * machine-reduce to NEWYEARSEVE and "Maha Shivaratri" to MAHASHIVARATRI,
   * both too long to type at a till. These are the short forms a customer
   * would actually be read down a phone.
   */
  code: string;
}

export const FESTIVALS: Festival[] = [
  { id: "dashain", icon: "🌺", label: "Dashain", code: "DASHAIN" },
  { id: "tihar", icon: "🪔", label: "Tihar", code: "TIHAR" },
  { id: "chhath", icon: "🌅", label: "Chhath", code: "CHHATH" },
  {
    id: "nepali-new-year",
    icon: "🎊",
    label: "Nepali New Year",
    code: "NEWYEAR",
  },
  { id: "holi", icon: "🎨", label: "Holi", code: "HOLI" },
  { id: "teej", icon: "💃", label: "Teej", code: "TEEJ" },
  {
    id: "maghe-sankranti",
    icon: "🍠",
    label: "Maghe Sankranti",
    code: "MAGHE",
  },
  { id: "losar", icon: "🏔️", label: "Losar", code: "LOSAR" },
  {
    id: "buddha-jayanti",
    icon: "🪷",
    label: "Buddha Jayanti",
    code: "BUDDHA",
  },
  {
    id: "maha-shivaratri",
    icon: "🔱",
    label: "Maha Shivaratri",
    code: "SHIVARATRI",
  },
  { id: "christmas", icon: "🎄", label: "Christmas", code: "XMAS" },
  {
    id: "new-years-eve",
    icon: "🎆",
    label: "New Year's Eve",
    code: "NEWYEARS",
  },
  { id: "valentine", icon: "❤️", label: "Valentine", code: "VALENTINE" },
];

export function festivalById(id: string): Festival | undefined {
  return FESTIVALS.find((f) => f.id === id);
}
