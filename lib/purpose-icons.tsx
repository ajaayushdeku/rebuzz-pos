"use client";

import {
  Utensils,
  ShoppingCart,
  Gift,
  Lightbulb,
  Bus,
  Film,
  User,
  Shirt,
  HeartPulse,
  Home,
  GraduationCap,
  Globe,
  Briefcase,
  Monitor,
  Coffee,
  Camera,
  Car,
  Bike,
  Plane,
  Music,
  Smartphone,
  Book,
  Heart,
  Gamepad2,
  PieChart,
  type LucideIcon,
} from "lucide-react";

// Icon values come from the default purposes returned by GET /api/expense/purpose.
// These are Material Design icon names; we map each to a lucide equivalent.
export const PURPOSE_ICON_MAP: Record<string, LucideIcon> = {
  restaurant: Utensils,
  shopping_cart: ShoppingCart,
  card_giftcard: Gift,
  lightbulb: Lightbulb,
  directions_bus: Bus,
  movie: Film,
  person: User,
  checkroom: Shirt,
  monitor_heart: HeartPulse,
  home: Home,
  school: GraduationCap,
  public: Globe,
  work: Briefcase,
  desktop: Monitor,
  local_cafe: Coffee,
  camera: Camera,
  directions_car: Car,
  pedal_bike: Bike,
  flight: Plane,
  music: Music,
  smartphone: Smartphone,
  book: Book,
  favorite: Heart,
  sports_esports: Gamepad2,
  pie_chart: PieChart,
};

// Fallback by purpose `key` (also returned by the API) → icon value
const PURPOSE_KEY_TO_ICON: Record<string, string> = {
  food: "restaurant",
  grocery: "shopping_cart",
  gifts: "card_giftcard",
  utilities: "lightbulb",
  transportation: "directions_bus",
  entertainment: "movie",
  personal: "person",
  clothing: "checkroom",
  health: "monitor_heart",
  housing: "home",
  education: "school",
  others: "public",
  salary: "work",
  freelance: "desktop",
  gift_received: "card_giftcard",
};

// Fallback by purpose name (case-insensitive) → icon value
const PURPOSE_NAME_TO_ICON: Record<string, string> = {
  "food and drinks": "restaurant",
  food: "restaurant",
  grocery: "shopping_cart",
  "gifts/donations": "card_giftcard",
  gifts: "card_giftcard",
  utilities: "lightbulb",
  transportation: "directions_bus",
  entertainment: "movie",
  "personal care": "person",
  clothing: "checkroom",
  health: "monitor_heart",
  housing: "home",
  education: "school",
  others: "public",
  salary: "work",
  freelance: "desktop",
  "gift received": "card_giftcard",
};

// Ordered list of icon values available for the picker (from default purposes only)
export const ICON_PICKER_OPTIONS: { key: string; Icon: LucideIcon }[] = [
  { key: "restaurant", Icon: Utensils },
  { key: "shopping_cart", Icon: ShoppingCart },
  { key: "card_giftcard", Icon: Gift },
  { key: "lightbulb", Icon: Lightbulb },
  { key: "directions_bus", Icon: Bus },
  { key: "movie", Icon: Film },
  { key: "person", Icon: User },
  { key: "checkroom", Icon: Shirt },
  { key: "monitor_heart", Icon: HeartPulse },
  { key: "home", Icon: Home },
  { key: "school", Icon: GraduationCap },
  { key: "public", Icon: Globe },
  { key: "work", Icon: Briefcase },
  { key: "desktop", Icon: Monitor },
  { key: "local_cafe", Icon: Coffee },
  { key: "camera", Icon: Camera },
  { key: "directions_car", Icon: Car },
  { key: "pedal_bike", Icon: Bike },
  { key: "flight", Icon: Plane },
  { key: "music", Icon: Music },
  { key: "smartphone", Icon: Smartphone },
  { key: "book", Icon: Book },
  { key: "favorite", Icon: Heart },
  { key: "sports_esports", Icon: Gamepad2 },
  { key: "pie_chart", Icon: PieChart },
];

const DEFAULT_ICON = "public";

export function getPurposeIcon(icon: string, name: string): LucideIcon {
  const key = (icon || "").toLowerCase();
  if (PURPOSE_ICON_MAP[key]) return PURPOSE_ICON_MAP[key];
  // Try resolving via name → icon value → component
  const nameKey = (name || "").toLowerCase();
  const byName = PURPOSE_NAME_TO_ICON[nameKey];
  if (byName && PURPOSE_ICON_MAP[byName]) return PURPOSE_ICON_MAP[byName];
  return PURPOSE_ICON_MAP[DEFAULT_ICON];
}

// Resolve the canonical icon value to store for a purpose, given its name/key.
// Useful when creating a purpose without an explicit icon selection.
export function resolveIconValue(
  icon: string,
  name: string,
  key?: string | null,
): string {
  const iconKey = (icon || "").toLowerCase();
  if (PURPOSE_ICON_MAP[iconKey]) return iconKey;
  if (key) {
    const k = key.toLowerCase();
    if (PURPOSE_KEY_TO_ICON[k]) return PURPOSE_KEY_TO_ICON[k];
  }
  const nameKey = (name || "").toLowerCase();
  if (PURPOSE_NAME_TO_ICON[nameKey]) return PURPOSE_NAME_TO_ICON[nameKey];
  return DEFAULT_ICON;
}
