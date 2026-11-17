"use client";

import { useState, type FormEvent } from "react";
import { LoaderCircle, Send, Star } from "lucide-react";

import { submitSupportQuestion } from "@/services/apiSupport.client";
import { SUPPORT_SUBJECTS } from "@/lib/help/content";
import { FilterSelect } from "@/components/ui/FilterSelect";

type SubmitState = "idle" | "sending" | "sent" | "error";

export default function FinalSignupContactForm() {
  const [state, setState] = useState<SubmitState>("idle");
  const [errorMessage, setErrorMessage] = useState("");

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [contact, setContact] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [rating, setRating] = useState(0);

  const ready =
    email.trim() !== "" &&
    subject !== "" &&
    message.trim().length >= 10 &&
    rating > 0;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!ready || state === "sending") return;

    setState("sending");
    setErrorMessage("");

    try {
      await submitSupportQuestion({
        name: name.trim(),
        email: email.trim(),
        contact: contact.trim(),
        subject,
        message: message.trim(),
        rating,
      });

      setName("");
      setEmail("");
      setContact("");
      setSubject("");
      setMessage("");
      setRating(0);

      setState("sent");
    } catch (error) {
      setState("error");
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Your message could not be sent. Please try again.",
      );
    }
  }

  const inputClass =
    "h-10 w-full rounded-lg border border-gray-200 bg-gray-50 px-3 text-sm text-[#1b2537] outline-none transition placeholder:text-gray-400 focus:border-[#E26924] focus:bg-white focus:ring-2 focus:ring-[#E26924]/15 dark:border-white/10 dark:bg-[#0f1420] dark:text-[#e8ecf4] dark:placeholder:text-gray-500 dark:focus:bg-[#111827]";

  return (
    <form onSubmit={handleSubmit} className="text-left">
      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#E26924]">
        Have a question?
      </p>

      <h3 className="mt-2 text-2xl font-semibold tracking-tight text-[#1b2537] dark:text-[#e8ecf4]">
        Send us a message
      </h3>

      <p className="mt-2 text-sm leading-relaxed text-gray-500 dark:text-[#9aa6bd]">
        Share what you need help with. We’ll reply to the email you provide.
      </p>

      <div className="mt-6 grid gap-8 sm:grid-cols-2">
        <Field label="Email address" required>
          <input
            type="email"
            required
            maxLength={254}
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@business.com"
            className={inputClass}
          />
        </Field>

        <Field label="What is it about?" required>
          <FilterSelect
            ariaLabel="What is it about?"
            className="[&>button]:h-10"
            value={subject}
            onChange={setSubject}
            placeholder="Choose a subject"
            options={SUPPORT_SUBJECTS.map((s) => ({
              value: s,
              label: s,
            }))}
          />
        </Field>

        <Field label="Your name" hint="optional">
          <input
            type="text"
            maxLength={100}
            autoComplete="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your name"
            className={inputClass}
          />
        </Field>

        <Field label="Phone" hint="optional">
          <input
            type="tel"
            autoComplete="tel"
            value={contact}
            onChange={(e) => setContact(e.target.value)}
            placeholder="Your phone number"
            className={inputClass}
          />
        </Field>
      </div>

      <div className="mt-8">
        <Field label="How can we help?" required>
          <textarea
            required
            minLength={10}
            maxLength={3000}
            rows={4}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Tell us a little about what you need…"
            className={`${inputClass} h-auto resize-y py-2.5 leading-relaxed`}
          />
        </Field>
      </div>

      <div className="mt-5">
        <fieldset className="flex flex-col gap-2">
          <legend className="text-xs font-medium text-gray-600 dark:text-gray-300">
            How helpful has your experience with Rebuzz POS been?
            <span className="ml-1 text-red-500" aria-hidden="true">
              *
            </span>
          </legend>

          <div className="flex items-center gap-1">
            {[1, 2, 3, 4, 5].map((n) => (
              <label
                key={n}
                className="relative cursor-pointer rounded p-0.5 focus-within:ring-2 focus-within:ring-[#E26924]"
              >
                <input
                  type="radio"
                  name="homepage-rating"
                  value={n}
                  checked={rating === n}
                  onChange={() => setRating(n)}
                  className="sr-only"
                />

                <Star
                  size={23}
                  aria-hidden="true"
                  className={`transition-colors ${
                    n <= rating
                      ? "fill-amber-400 text-amber-400"
                      : "text-gray-300 hover:text-amber-400 dark:text-gray-600"
                  }`}
                />

                <span className="sr-only">
                  {n} {n === 1 ? "star" : "stars"}
                </span>
              </label>
            ))}
          </div>
        </fieldset>
      </div>

      <div className="mt-5 flex flex-col-reverse items-start justify-between gap-4 sm:flex-row sm:items-center">
        <p
          aria-live="polite"
          className={`text-xs ${
            state === "sent"
              ? "text-emerald-700 dark:text-emerald-300"
              : state === "error"
                ? "text-red-600 dark:text-red-400"
                : "text-gray-500 dark:text-[#9aa6bd]"
          }`}
        >
          {state === "sent"
            ? "Message sent. Our team will be in touch."
            : state === "error"
              ? errorMessage
              : "Your message goes directly to our support team."}
        </p>

        <button
          type="submit"
          disabled={!ready || state === "sending"}
          className="inline-flex h-11 w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-[#E26924] px-5 text-sm font-semibold text-white shadow-sm transition duration-200 hover:bg-[#cf5d1d] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#244074] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
        >
          {state === "sending" ? (
            <LoaderCircle size={16} className="animate-spin" aria-hidden />
          ) : (
            <Send size={15} aria-hidden />
          )}
          {state === "sending" ? "Sending…" : "Send message"}
        </button>
      </div>
    </form>
  );
}

function Field({
  label,
  hint,
  required,
  children,
}: {
  label: string;
  hint?: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="grid gap-1.5 text-xs font-medium text-gray-600 dark:text-gray-300">
      <span className="flex items-baseline gap-1.5">
        {label}
        {required && (
          <span className="text-red-500" aria-hidden="true">
            *
          </span>
        )}
        {hint && <span className="font-normal text-gray-400">{hint}</span>}
      </span>
      {children}
    </label>
  );
}
