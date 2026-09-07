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
  /**
   * Words that should surface this occasion in the step 3 search, beyond its
   * own name.
   *
   * Typing "festival" is how a merchant browses rather than looks something
   * up, so every occasion carries the broad words as well as the specific
   * ones — "hindu", "lights", "harvest". Lowercase, because the search
   * lowercases the query and compares directly.
   */
  tags: string[];
}

export const FESTIVALS: Festival[] = [
  {
    id: "dashain",
    icon: "🌺",
    label: "Dashain",
    code: "DASHAIN",
    tags: ["festival", "hindu", "national", "family", "autumn", "biggest"],
  },
  {
    id: "tihar",
    icon: "🪔",
    label: "Tihar",
    code: "TIHAR",
    tags: ["festival", "hindu", "national", "lights", "deepawali", "autumn"],
  },
  {
    id: "chhath",
    icon: "🌅",
    label: "Chhath",
    code: "CHHATH",
    tags: ["festival", "hindu", "sun", "terai", "autumn"],
  },
  {
    id: "nepali-new-year",
    icon: "🎊",
    label: "Nepali New Year",
    code: "NEWYEAR",
    tags: ["festival", "new year", "national", "bikram sambat", "spring"],
  },
  {
    id: "holi",
    icon: "🎨",
    label: "Holi",
    code: "HOLI",
    tags: ["festival", "hindu", "colors", "colours", "spring"],
  },
  {
    id: "teej",
    icon: "💃",
    label: "Teej",
    code: "TEEJ",
    tags: ["festival", "hindu", "women", "fasting", "monsoon"],
  },
  {
    id: "maghe-sankranti",
    icon: "🍠",
    label: "Maghe Sankranti",
    code: "MAGHE",
    tags: ["festival", "hindu", "harvest", "winter"],
  },
  {
    id: "losar",
    icon: "🏔️",
    label: "Losar",
    code: "LOSAR",
    tags: ["festival", "new year", "tibetan", "sherpa", "tamang", "winter"],
  },
  {
    id: "buddha-jayanti",
    icon: "🪷",
    label: "Buddha Jayanti",
    code: "BUDDHA",
    tags: ["festival", "buddhist", "national", "spring"],
  },
  {
    id: "maha-shivaratri",
    icon: "🔱",
    label: "Maha Shivaratri",
    code: "SHIVARATRI",
    tags: ["festival", "hindu", "shiva", "pashupatinath", "winter"],
  },
  {
    id: "christmas",
    icon: "🎄",
    label: "Christmas",
    code: "XMAS",
    tags: ["festival", "christian", "international", "winter", "holiday"],
  },
  {
    id: "new-years-eve",
    icon: "🎆",
    label: "New Year's Eve",
    code: "NEWYEARS",
    tags: ["new year", "international", "party", "winter", "countdown"],
  },
  {
    id: "valentine",
    icon: "❤️",
    label: "Valentine",
    code: "VALENTINE",
    tags: ["international", "romance", "couples", "date night", "winter"],
  },
];

export function festivalById(id: string): Festival | undefined {
  return FESTIVALS.find((f) => f.id === id);
}
