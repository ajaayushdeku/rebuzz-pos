"use client";

import { useOfferForm } from "@/providers/OfferFormContext";

const CHANNELS: {
  id: string;
  icon: string;
  label: string;
  popular?: boolean;
  note?: string;
}[] = [
  { id: "whatsapp", icon: "💬", label: "WhatsApp", popular: true },
  { id: "viber", icon: "💜", label: "Viber", popular: true },
  { id: "in-store-qr", icon: "🔳", label: "In-store QR", popular: true },
  { id: "sms", icon: "📱", label: "SMS Text" },
  { id: "app-push", icon: "🔔", label: "App Push" },
  { id: "shareable-link", icon: "🔗", label: "Shareable Link" },
  { id: "email", icon: "✉️", label: "Email", note: "Lower opens for cafes" },
];

export default function OfferChannels() {
  const { form, updateField } = useOfferForm();

  const toggle = (id: string) => {
    const exists = form.channels.includes(id);
    updateField(
      "channels",
      exists ? form.channels.filter((c) => c !== id) : [...form.channels, id],
    );
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {CHANNELS.map((c) => {
          const active = form.channels.includes(c.id);
          return (
            <button
              key={c.id}
              type="button"
              onClick={() => toggle(c.id)}
              className={`relative text-left rounded-xl border p-3.5 transition-all ${
                active
                  ? "border-blue-500 ring-2 ring-blue-500/20 bg-blue-50/40"
                  : "border-gray-200 hover:border-gray-300"
              }`}
            >
              {c.popular && (
                <span className="absolute top-2 right-2 text-[9px] font-semibold text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded-full">
                  Popular
                </span>
              )}
              <div className="text-xl mb-2">{c.icon}</div>
              <p className="text-sm font-semibold text-gray-800">{c.label}</p>
              {c.note && (
                <p className="text-[10px] text-gray-400 mt-0.5">{c.note}</p>
              )}
            </button>
          );
        })}
      </div>

      <div className="rounded-xl bg-gray-50 border border-gray-100 px-4 py-2.5">
        <p className="text-xs text-gray-500">
          <span className="font-semibold text-gray-700">Tip:</span> In Nepal,
          WhatsApp, Viber and in-store QR get the most redemptions.
        </p>
      </div>
    </div>
  );
}
