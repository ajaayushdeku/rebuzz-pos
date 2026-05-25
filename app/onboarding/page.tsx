"use client";

import { useState } from "react";
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
  const [step, setStep] = useState(1);
  const [animating, setAnimating] = useState(false);
  const [direction, setDirection] = useState<1 | -1>(1);
  const [submitting, setSubmitting] = useState(false);

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
      alert("Welcome aboard!");
    } catch (err) {
      console.error(err);
      alert("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  // Array of condition checking for fields, if they are fully filled or not.
  const canProceed = [
    !!(form.firstName && form.lastName && form.businessName),
    !!(form.businessName && form.industry && form.businessType),
    form.goals.length > 0,
  ][step - 1];

  const isLastStep = step === TOTAL_STEPS;

  return (
    <div className="min-h-screen flex font-sans bg-slate-100">
      {/* Left: Form Panel */}
      <div className="flex flex-col justify-center px-16 py-12 bg-white w-full max-w-140 shadow-[4px_0_40px_rgba(0,0,0,0.06)]">
        <ProgressBar current={step} />

        {/* Animated Step Content */}
        <div
          style={
            {
              "--dir": `${direction * 40}px`,
            } as React.CSSProperties
          }
          className={cn(
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
        <div className="flex gap-3 mt-2 items-center">
          {step > 1 && (
            <Button
              variant="outline"
              onClick={() => navigate(step - 1)}
              className="rounded-xl"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
          )}
          <Button
            onClick={() => (isLastStep ? handleSubmit() : navigate(step + 1))}
            disabled={!canProceed || submitting}
            className="flex-1 rounded-xl bg-indigo-500 hover:bg-indigo-600 shadow-lg shadow-indigo-200"
          >
            {isLastStep ? (
              <>
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    Let &lsquo s get to it
                    <Rocket className="h-4 w-4" />
                  </>
                )}
              </>
            ) : (
              <>
                Continue
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </Button>
        </div>

        {step === 1 && (
          <>
            <p className="text-center text-slate-400 text-xs mt-5">
              Already have an account?{" "}
              <a
                href="#"
                className="text-indigo-500 font-semibold no-underline hover:underline"
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
      <PanelIllustration step={step} />

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
    </div>
  );
};

export default OnBoarding;
