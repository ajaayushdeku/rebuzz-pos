"use client";

import { X } from "lucide-react";
import {
  useOfferForm,
  type OfferFormState,
} from "@/providers/OfferFormContext";

// Full preset applied to the form when a ready-made offer is picked. Only the
// fields it controls are set; the payload contract is unchanged.
type Preset = Pick<
  OfferFormState,
  | "cardName"
  | "discountKind"
  | "discountType"
  | "discount"
  | "hasKey"
  | "promoMode"
  | "usesPerCustomer"
  | "itemScope"
  | "category"
  | "segment"
  | "sendTriggers"
  | "festival"
  | "festivalTab"
  | "activeHours"
  | "channels"
  | "note"
>;

// Reset values for everything a preset can touch (used to unselect).
const CLEARED: Partial<OfferFormState> = {
  template: "",
  cardName: "",
  discountKind: "",
  discountType: "percentage",
  discount: 0,
  hasKey: "",
  promoMode: "auto",
  usesPerCustomer: "unlimited",
  itemScope: "all",
  category: "",
  segment: "",
  sendTriggers: [],
  festival: "",
  festivalTab: "all",
  activeHours: "all-day",
  channels: [],
  note: "",
  startDate: "",
  endDate: "",
};

const TEMPLATES: {
  id: string;
  icon: string;
  title: string;
  subtitle: string;
  preset: Preset;
}[] = [
  {
    id: "signup",
    icon: "👋",
    title: "Sign up offer",
    subtitle: "For new customers",
    preset: {
      cardName: "Welcome 10% Off",
      discountKind: "percentage",
      discountType: "percentage",
      discount: 10,
      hasKey: "WELCOME10",
      promoMode: "custom",
      usesPerCustomer: "once",
      itemScope: "all",
      category: "",
      segment: "new",
      sendTriggers: ["first-order"],
      festival: "",
      festivalTab: "all",
      activeHours: "all-day",
      channels: ["whatsapp", "sms"],
      note: "New customer welcome discount",
    },
  },
  {
    id: "reward",
    icon: "⭐",
    title: "Reward loyalty",
    subtitle: "Bonus points",
    preset: {
      cardName: "Loyalty Bonus Points",
      discountKind: "bonus",
      discountType: "fixed",
      discount: 50,
      hasKey: "LOYAL50",
      promoMode: "custom",
      usesPerCustomer: "unlimited",
      itemScope: "all",
      category: "",
      segment: "loyal",
      sendTriggers: ["every-nth"],
      festival: "",
      festivalTab: "all",
      activeHours: "all-day",
      channels: ["app-push", "whatsapp"],
      note: "Reward repeat customers",
    },
  },
  {
    id: "festival",
    icon: "🎉",
    title: "Festival offer",
    subtitle: "Calendar special",
    preset: {
      cardName: "Dashain 20% Off",
      discountKind: "percentage",
      discountType: "percentage",
      discount: 20,
      hasKey: "DASHAIN20",
      promoMode: "custom",
      usesPerCustomer: "unlimited",
      itemScope: "all",
      category: "",
      segment: "all",
      sendTriggers: [],
      festival: "dashain",
      festivalTab: "hindu",
      activeHours: "all-day",
      channels: ["whatsapp", "viber", "in-store-qr"],
      note: "Festival special",
    },
  },
  {
    id: "combo",
    icon: "🍔",
    title: "Combo discount",
    subtitle: "Menu bundle",
    preset: {
      cardName: "Combo Meal Deal",
      discountKind: "combo",
      discountType: "fixed",
      discount: 100,
      hasKey: "COMBO100",
      promoMode: "custom",
      usesPerCustomer: "unlimited",
      itemScope: "category",
      category: "Fast Food",
      segment: "all",
      sendTriggers: [],
      festival: "",
      festivalTab: "all",
      activeHours: "lunch",
      channels: ["in-store-qr"],
      note: "Menu bundle deal",
    },
  },
  {
    id: "bogo",
    icon: "🛍️",
    title: "Buy 1 Get 1",
    subtitle: "B1G1F deal",
    preset: {
      cardName: "Buy One Get One",
      discountKind: "bogo",
      discountType: "bogo",
      discount: 1,
      hasKey: "B1G1",
      promoMode: "custom",
      usesPerCustomer: "once",
      itemScope: "all",
      category: "",
      segment: "all",
      sendTriggers: [],
      festival: "",
      festivalTab: "all",
      activeHours: "happy",
      channels: ["whatsapp", "in-store-qr"],
      note: "Buy one get one free",
    },
  },
  {
    id: "birthday",
    icon: "🎂",
    title: "Birthday offer",
    subtitle: "Free treat",
    preset: {
      cardName: "Birthday Free Treat",
      discountKind: "free-item",
      discountType: "fixed",
      discount: 100,
      hasKey: "BDAY",
      promoMode: "custom",
      usesPerCustomer: "once",
      itemScope: "all",
      category: "",
      segment: "birthdays",
      sendTriggers: ["birthday"],
      festival: "",
      festivalTab: "all",
      activeHours: "all-day",
      channels: ["sms", "app-push"],
      note: "Birthday treat",
    },
  },
];

/** Local YYYY-MM-DD (avoids UTC drift). */
function toDateStr(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export default function OfferTemplates() {
  const { form, patchForm } = useOfferForm();

  const applyTemplate = (t: (typeof TEMPLATES)[number]) => {
    const today = new Date();
    const end = new Date(today);
    end.setDate(today.getDate() + 13);
    patchForm({
      template: t.id,
      ...t.preset,
      startDate: toDateStr(today),
      endDate: toDateStr(end),
    });
  };

  const clearTemplate = () => patchForm(CLEARED);

  return (
    <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="text-base">✨</span>
          <h3 className="text-sm font-semibold text-gray-900">
            Start from a ready-made offer
          </h3>
        </div>

        {form.template && (
          <button
            type="button"
            onClick={clearTemplate}
            className="inline-flex items-center gap-1 text-xs font-medium text-gray-500 hover:text-gray-800 transition"
          >
            <X size={13} />
            Clear selection
          </button>
        )}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {TEMPLATES.map((t) => {
          const active = form.template === t.id;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => (active ? clearTemplate() : applyTemplate(t))}
              className={`relative text-center rounded-xl border p-3 transition-all ${
                active
                  ? "border-blue-500 ring-2 ring-blue-500/20 bg-blue-50/40"
                  : "border-gray-200 hover:border-gray-300 hover:shadow-sm"
              }`}
            >
              {active && (
                <span className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-blue-600 text-white flex items-center justify-center">
                  <X size={10} />
                </span>
              )}
              <div className="text-xl mb-1.5">{t.icon}</div>
              <p className="text-xs font-semibold text-gray-800 leading-tight">
                {t.title}
              </p>
              <p className="text-[10px] text-gray-400 mt-0.5">{t.subtitle}</p>
            </button>
          );
        })}
      </div>
    </div>
  );
}
