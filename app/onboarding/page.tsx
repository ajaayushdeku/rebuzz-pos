"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, Loader2, Rocket } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import Link from "next/link";
import {
  StepOne,
  StepThree,
  StepTwo,
} from "@/components/onboardingComponents/Steps";
import ProgressBar from "@/components/onboardingComponents/ProgressBar";
import PanelIllustration from "@/components/onboardingComponents/PanelIllustration";

interface FormState {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  businessName: string;
  industry: string;
  businessType: string;
  teamSize: string;
  goals: string[];
  address: string;
  accurateLocation: string;
  lat: number;
  long: number;
  panNo: string;
  phoneNumber: string;
}
const TOTAL_STEPS = 3;

const OnBoarding = () => {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [animating, setAnimating] = useState(false);
  const [direction, setDirection] = useState<1 | -1>(1);
  const [submitting, setSubmitting] = useState(false);
  const [redirecting, setRedirecting] = useState(false);

  const [form, setForm] = useState<FormState>({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    businessName: "",
    industry: "",
    businessType: "",
    teamSize: "",
    goals: [],
    address: "",
    accurateLocation: "",
    lat: 0,
    long: 0,
    panNo: "",
    phoneNumber: "",
  });

  // Update the state of the form with key:value pair data
  const update = (key: keyof FormState) => (val: string) => {
    setForm((f) => ({ ...f, [key]: val }));
  };

  //  Add/remove the goals from the array
  const toggleGoal = (goal: string) =>
    setForm((f) => ({
      ...f,
      goals: f.goals.includes(goal)
        ? f.goals.filter((g) => g !== goal)
        : [...f.goals, goal],
    }));

  // Navigate to next step/form
  const navigate = (newStep: number) => {
    setDirection(newStep > step ? 1 : -1);
    setAnimating(true);
    setTimeout(() => {
      setStep(newStep);
      setAnimating(false);
    }, 220);
  };

  // Submit the form data to create/update business
  const handleSubmit = async () => {
    setSubmitting(true);

    try {
      const payload = {
        businessName: form.businessName,
        businessType: form.businessType,
        address: form.address,
        accurateLocation: form.accurateLocation,
        lat: form.lat,
        long: form.long,
        panNo: form.panNo,
        owner: `${form.firstName} ${form.lastName}`,
        showInOrdering: true,
        phoneNumber: form.phoneNumber,
      };

      const res = await fetch("/api/business", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error("Failed to create business");

      // Keep the loading screen visible while the dashboard loads.
      setRedirecting(true);
      window.location.href = "/dashboard";
    } catch (err) {
      console.error(err);
      alert("Something went wrong. Please try again.");
      setSubmitting(false);
    }
  };

  // Array of condition checking for fields, if they are fully filled or not.
  const canProceed = [
    !!(form.firstName && form.lastName && form.businessName),
    !!(form.industry && form.address && form.phoneNumber),
    form.goals.length > 0,
  ][step - 1];

  const isLastStep = step === TOTAL_STEPS;

  return (
    <div className="min-h-screen flex flex-col lg:flex-row font-sans bg-slate-100 dark:bg-[#0f1420]">
      {/* Left: Form Panel */}
      <div className="relative z-10 flex min-h-screen w-full flex-col justify-center bg-white px-5 py-8 shadow-[4px_0_40px_rgba(0,0,0,0.06)] dark:bg-[#161d2e] sm:px-8 sm:py-10 md:px-12 lg:min-h-screen lg:w-[55%] lg:max-w-[760px] lg:px-12 xl:px-16">
        <ProgressBar current={step} />

        {/* Animated Step Content */}
        <div
          style={
            {
              "--dir": `${direction * 40}px`,
            } as React.CSSProperties
          }
          className={cn(
            "w-full min-w-0",
            animating
              ? "animate-[slideOut_0.22s_ease_forwards]"
              : "animate-[slideIn_0.3s_ease_forwards]",
          )}
        >
          {step === 1 && <StepOne form={form} update={update} />}
          {step === 2 && <StepTwo form={form} update={update} />}
          {step === 3 && <StepThree form={form} toggleGoal={toggleGoal} />}
        </div>

        {/* Navigation */}
        <div className="mt-5 flex w-full items-center gap-2 sm:gap-3">
          {step > 1 && (
            <Button
              variant="outline"
              disabled={submitting}
              onClick={() => navigate(step - 1)}
              className="h-8 shrink-0 gap-2 rounded-xl border-slate-200 bg-white px-5 text-sm font-semibold shadow-sm transition-all hover:bg-slate-50 dark:border-white/15 dark:bg-white/5 dark:hover:bg-white/10 sm:h-13 sm:px-6"
            >
              <ArrowLeft className="h-[18px] w-[18px]" />
              Back
            </Button>
          )}

          <Button
            onClick={() => (isLastStep ? handleSubmit() : navigate(step + 1))}
            disabled={!canProceed || submitting}
            className="h-8 min-w-0 flex-1 gap-2 rounded-xl bg-gradient-to-r from-indigo-500 to-indigo-600 px-6 text-sm font-semibold text-white shadow-lg shadow-indigo-500/25 transition-all hover:-translate-y-0.5 hover:from-indigo-600 hover:to-indigo-700 hover:shadow-xl hover:shadow-indigo-500/30 disabled:translate-y-0 disabled:opacity-50 disabled:shadow-none sm:h-13 sm:text-[15px]"
          >
            {isLastStep ? (
              <>
                {submitting ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    Let&lsquo;s get to it
                    <Rocket className="h-5 w-5" />
                  </>
                )}
              </>
            ) : (
              <>
                Continue
                <ArrowRight className="h-5 w-5" />
              </>
            )}
          </Button>
        </div>

        {step === 1 && (
          <>
            <p className="text-center text-slate-400 text-xs mt-5 dark:text-[#7b869b]">
              Already have an account?{" "}
              <a
                href="#"
                className="text-indigo-500 font-semibold no-underline hover:underline dark:text-indigo-400"
              >
                Sign in
              </a>
            </p>
            <Link href="/">
              <p className="text-center text-blue-400 text-xs mt-5">
                Return to homepage
              </p>
            </Link>
          </>
        )}
      </div>

      {/* Right: Illustration Panel */}
      <div className="hidden min-h-screen flex-1 lg:flex">
        <PanelIllustration step={step} />
      </div>
      <style>{`
        @keyframes slideIn {
          from { opacity: 0; transform: translateX(var(--dir)); }
          to   { opacity: 1; transform: translateX(0); }
        }
        @keyframes slideOut {
          from { opacity: 1; transform: translateX(0); }
          to   { opacity: 0; transform: translateX(calc(var(--dir) * -1)); }
        }
        @keyframes panelFade {
          from { opacity: 0; transform: scale(0.97); }
          to   { opacity: 1; transform: scale(1); }
        }
      `}</style>

      {redirecting && (
        <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-white dark:bg-[#0f1420]">
          <div className="flex flex-col items-center gap-5">
            <div className="relative flex h-16 w-16 items-center justify-center">
              <div className="absolute inset-0 animate-spin rounded-full border-[3px] border-indigo-100 border-t-indigo-600 dark:border-white/10 dark:border-t-indigo-400" />

              <Rocket className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
            </div>

            <div className="text-center">
              <h2 className="text-lg font-semibold text-slate-800 dark:text-white">
                Setting up your workspace
              </h2>

              <p className="mt-2 text-sm text-slate-500 dark:text-[#8995aa]">
                Your business is ready. Taking you to your dashboard...
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OnBoarding;
