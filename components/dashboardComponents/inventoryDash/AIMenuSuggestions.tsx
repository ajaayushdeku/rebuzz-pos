"use client";

import { useCurrency } from "@/providers/CurrencyContext";
import { formatCurrencySymbol } from "@/utils/helper";
import { Sparkles } from "lucide-react";
import LockDimFeactureOverlay from "@/components/LockDimFeactureOverlay";
import { ComponentHeader } from "@/components/ComponentHeader";

type MenuSuggestion = {
  emoji: string;
  name: string;
  matchPct: number;
  revenuePerWeek: number;
  difficulty: "Easy" | "Medium" | "Hard";
  description: string;
  ingredients: string[];
  trigger: string;
};

const MOCK_SUGGESTIONS: MenuSuggestion[] = [
  {
    emoji: "🥐",
    name: "Almond Croissant French Toast",
    matchPct: 94,
    revenuePerWeek: 340,
    difficulty: "Easy",
    description:
      "Your Almond Croissants are flying off the shelves! 🔥 Use day-old ones to make a premium French Toast bake — same ingredients, higher margin, and a hot new menu item. Could sell for $9–11 with barely any extra cost.",
    ingredients: [
      "Day-old Almond Croissants",
      "Eggs",
      "Milk",
      "Vanilla extract",
    ],
    trigger: "Almond Croissant demand spike",
  },
  {
    emoji: "🫐",
    name: "Blueberry Muffin Smoothie Bowl",
    matchPct: 87,
    revenuePerWeek: 210,
    difficulty: "Easy",
    description:
      "Blueberry Muffins are a bestseller and smoothie bowls are trending. Crumble a muffin on top of a blueberry-acai base — it's a shareable, Instagram-worthy item that uses the same bake you already do.",
    ingredients: [
      "Blueberry Muffin crumble",
      "Acai base",
      "Fresh blueberries",
      "Honey",
    ],
    trigger: "Blueberry Muffin demand spike",
  },
  {
    emoji: "🥑",
    name: "Smashed Avocado Breakfast Wrap",
    matchPct: 81,
    revenuePerWeek: 180,
    difficulty: "Medium",
    description:
      "Avocado Toast is your top food seller. Wrap that same filling in a warm tortilla with a soft-boiled egg — a handheld version for grab-and-go customers who love the taste but are in a rush.",
    ingredients: [
      "Avocado spread",
      "Tortilla wrap",
      "Egg",
      "Chilli flakes",
      "Lemon",
    ],
    trigger: "Avocado Toast demand spike",
  },
];

const DIFFICULTY_STYLES = {
  Easy: "border border-gray-300 text-gray-600",
  Medium: "border border-gray-300 text-gray-600",
  Hard: "border border-red-200 text-red-500",
};

export default function AIMenuSuggestions() {
  const { currency } = useCurrency();

  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-violet-100 flex items-center justify-center shrink-0">
          <Sparkles size={16} className="text-violet-600" />
        </div>

        <ComponentHeader
          title="AI Menu Suggestions"
          subHeader="    Based on your best-selling items — new ideas using what you already
            have"
        />
      </div>

      {/* Cards */}
      <div className="relative grid grid-cols-1 md:grid-cols-3 gap-4">
        <LockDimFeactureOverlay component_name="AI Menu Suggestions" />

        {MOCK_SUGGESTIONS.map((s) => (
          <div
            key={s.name}
            className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col"
          >
            {/* Purple top accent */}
            <div className="h-1 bg-gradient-to-r from-violet-500 to-purple-400" />

            <div className="p-5 flex flex-col gap-4 flex-1">
              {/* Emoji + match */}
              <div className="flex items-center justify-between">
                <span className="text-3xl">{s.emoji}</span>
                <span className="text-xs font-semibold text-violet-500 bg-violet-50 border border-violet-100 rounded-full px-2.5 py-0.5">
                  {s.matchPct}% match
                </span>
              </div>

              {/* Name */}
              <h3 className="text-sm font-bold text-gray-900 leading-snug">
                {s.name}
              </h3>

              {/* Revenue + difficulty */}
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-green-600 bg-green-50 rounded-full px-2.5 py-0.5">
                  +
                  {formatCurrencySymbol(
                    s.revenuePerWeek,
                    currency.symbol,
                    currency.locale,
                  )}
                  /wk
                </span>
                <span
                  className={`text-xs font-semibold rounded-full px-2.5 py-0.5 ${DIFFICULTY_STYLES[s.difficulty]}`}
                >
                  {s.difficulty}
                </span>
              </div>

              {/* Description */}
              <p className="text-xs text-gray-600 leading-relaxed flex-1">
                {s.description}
              </p>

              {/* Ingredients */}
              <div>
                <div className="flex items-center gap-1.5 mb-2">
                  <span className="text-gray-300">🍽</span>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                    Uses these ingredients
                  </p>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {s.ingredients.map((ing) => (
                    <span
                      key={ing}
                      className="text-[11px] border border-gray-200 rounded-full px-2.5 py-0.5 text-gray-600"
                    >
                      {ing}
                    </span>
                  ))}
                </div>
              </div>

              {/* Trigger */}
              <p className="text-xs font-semibold text-violet-500">
                → Triggered by: {s.trigger}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
