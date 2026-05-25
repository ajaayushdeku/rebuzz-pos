// components/onboarding/ProgressBar.tsx
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { STEPS } from "@/lib/config/onboardingConstants";

interface ProgressBarProps {
  current: number;
}

const ProgressBar = ({ current }: ProgressBarProps) => {
  return (
    <div className="mb-10">
      <div className="flex items-center gap-2">
        {STEPS.map((step, i) => (
          <div
            key={step.id}
            className={cn(
              "flex items-center gap-2",
              i < STEPS.length - 1 && "flex-1",
            )}
          >
            <div
              className={cn(
                "w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 transition-all duration-300",
                step.id <= current
                  ? "bg-indigo-500 text-white"
                  : "bg-slate-200 text-slate-400",
                step.id === current && "ring-4 ring-indigo-100",
              )}
            >
              {step.id < current ? <Check className="h-3.5 w-3.5" /> : step.id}
            </div>

            <span
              className={cn(
                "text-xs font-medium transition-all duration-300",
                step.id === current
                  ? "font-bold text-indigo-500"
                  : step.id < current
                    ? "text-slate-600"
                    : "text-slate-400",
              )}
            >
              {step.label}
            </span>

            {i < STEPS.length - 1 && (
              <div
                className={cn(
                  "flex-1 h-0.5 rounded-sm transition-all duration-300",
                  step.id < current ? "bg-indigo-500" : "bg-slate-200",
                )}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default ProgressBar;
