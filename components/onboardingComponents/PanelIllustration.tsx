// components/onboarding/PanelIllustration.tsx
import { cn } from "@/lib/utils";
import { BadgeCheck } from "lucide-react";
import { Hand, Building2, Rocket } from "lucide-react";

const PANELS = [
  {
    gradient: "from-[#667eea] to-[#764ba2]",
    Icon: Hand,
    heading: "Let's get you set up",
    body: "Join over 2 million small business owners who trust our platform to manage their finances, invoices, and payments.",
    extra: (
      <div className="mt-8 flex flex-wrap gap-3">
        {["Free forever", "No credit card", "5 min setup"].map((t) => (
          <span
            key={t}
            className="bg-white/20 rounded-full px-4 py-1 text-xs font-semibold"
          >
            {t}
          </span>
        ))}
      </div>
    ),
  },
  {
    gradient: "from-[#11998e] to-[#38ef7d]",
    Icon: Building2,
    heading: "Tell us about your business",
    body: "The more we know, the better we can tailor the experience to fit exactly what you need.",
    extra: (
      <div className="mt-8 bg-white/15 rounded-xl p-4">
        <p className="text-xs font-bold mb-1">Did you know?</p>
        <p className="text-xs opacity-90">
          Businesses that set up their profile fully get paid 2x faster.
        </p>
      </div>
    ),
  },
  {
    gradient: "from-[#f093fb] to-[#f5576c]",
    Icon: Rocket,
    heading: "Almost there!",
    body: "Just tell us what you're here to accomplish and we'll set up your dashboard perfectly.",
    extra: (
      <div className="mt-8 space-y-3">
        {[
          "Send invoices in seconds",
          "Track every payment",
          "Know your cash flow",
        ].map((f) => (
          <div key={f} className="flex items-center gap-2 text-sm opacity-90">
            <BadgeCheck className="h-4 w-4 shrink-0" />
            {f}
          </div>
        ))}
      </div>
    ),
  },
];

interface PanelIllustrationProps {
  step: number;
}

const PanelIllustration = ({ step }: PanelIllustrationProps) => {
  const panel = PANELS[step - 1];
  const Icon = panel.Icon;

  return (
    <div
      key={step}
      className={cn(
        "flex-1 flex items-center justify-center p-12 bg-linear-to-br transition-all duration-500 animate-[panelFade_0.5s_ease]",
        panel.gradient,
      )}
    >
      <div className="max-w-sm w-full text-white p-8">
        <Icon className="h-12 w-12 mb-4 opacity-90" />

        <h2 className="text-2xl font-extrabold mb-3 leading-tight">
          {panel.heading}
        </h2>

        <p className="opacity-85 leading-relaxed text-sm">{panel.body}</p>
        {panel.extra}
      </div>
    </div>
  );
};

export default PanelIllustration;
