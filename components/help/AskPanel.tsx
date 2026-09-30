"use client";

import { useState } from "react";
import toast from "react-hot-toast";
import { Loader2, Star } from "lucide-react";

import {
  submitFeedback,
  submitSupportQuestion,
} from "@/services/apiSupport.client";
import { SUPPORT_SUBJECTS } from "@/lib/help/content";
import { FilterSelect } from "@/components/ui/FilterSelect";

/**
 * Writing to us: a question that needs an answer, or feedback that does not.
 *
 * Two forms rather than one. A question is about something that went wrong
 * and needs a reply address; feedback is unprompted and anonymous. Mixing
 * them would mean asking for an email to say "the app is fine", and the
 * asking is what stops people saying anything at all.
 */

type Tab = "question" | "feedback";

const TABS: { id: Tab; label: string }[] = [
  { id: "question", label: "Ask a question" },
  { id: "feedback", label: "Share feedback" },
];

export default function AskPanel() {
  const [tab, setTab] = useState<Tab>("question");

  return (
    <div>
      {/* The same pill switch the dashboards use for their tabs. */}
      <div
        role="tablist"
        aria-label="How to get in touch"
        className="inline-flex items-center gap-1 rounded-full bg-[#e4f2fe] p-1 dark:bg-white/10"
      >
        {TABS.map((t) => {
          const selected = tab === t.id;
          return (
            <button
              key={t.id}
              type="button"
              role="tab"
              aria-selected={selected}
              onClick={() => setTab(t.id)}
              className={`cursor-pointer rounded-full px-4 py-2 text-[13px] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-[#e4f2fe] dark:focus-visible:ring-offset-[#242a38] ${
                selected
                  ? "bg-white font-semibold text-blue-950 dark:bg-white/15 dark:text-[#e8ecf4]"
                  : "font-medium text-blue-800 hover:text-blue-950 dark:text-[#a8c4ee] dark:hover:text-white"
              }`}
            >
              {t.label}
            </button>
          );
        })}
      </div>

      <div className="mt-5">
        {tab === "question" ? <QuestionForm /> : <FeedbackForm />}
      </div>
    </div>
  );
}

// ── The question ──────────────────────────────────────────────────────────

function QuestionForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [contact, setContact] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [rating, setRating] = useState(0);
  const [sending, setSending] = useState(false);

  const ready =
    email.trim() !== "" &&
    subject !== "" &&
    message.trim() !== "" &&
    rating > 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ready || sending) return;

    setSending(true);
    try {
      await submitSupportQuestion({
        name: name.trim(),
        email: email.trim(),
        contact: contact.trim(),
        subject,
        message: message.trim(),
        rating,
      });
      toast.success("Sent. We'll reply to the address you gave.");
      setName("");
      setEmail("");
      setContact("");
      setSubject("");
      setMessage("");
      setRating(0);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Your question couldn't be sent.",
      );
    } finally {
      setSending(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <Field label="Your email" required htmlFor="help-email">
          <input
            id="help-email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className={inputClass}
          />
        </Field>

        <Field label="What is it about?" required>
          {/* `[&>button]:h-11` so the trigger lines up with the inputs
              beside it: FilterSelect sizes itself from its own padding. */}
          <FilterSelect
            ariaLabel="What is it about?"
            className="[&>button]:h-11"
            value={subject}
            onChange={setSubject}
            placeholder="Choose one"
            options={SUPPORT_SUBJECTS.map((s) => ({ value: s, label: s }))}
          />
        </Field>

        <Field label="Your name" hint="optional" htmlFor="help-name">
          <input
            id="help-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="So we know who we're writing to"
            className={inputClass}
          />
        </Field>

        <Field label="Phone" hint="optional" htmlFor="help-contact">
          <input
            id="help-contact"
            type="tel"
            value={contact}
            onChange={(e) => setContact(e.target.value)}
            placeholder="If you'd rather be called"
            className={inputClass}
          />
        </Field>
      </div>

      <Field label="Your question" required htmlFor="help-message">
        <textarea
          id="help-message"
          required
          rows={5}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="What were you doing, and what happened? If an error appeared, its code helps."
          className={`${inputClass} h-auto resize-y py-3 leading-relaxed`}
        />
      </Field>

      <Stars
        label="How has support been so far?"
        value={rating}
        onChange={setRating}
        required
      />

      <Submit busy={sending} disabled={!ready}>
        Send question
      </Submit>
    </form>
  );
}

// ── The feedback ──────────────────────────────────────────────────────────

function FeedbackForm() {
  const [rating, setRating] = useState(0);
  const [likeMost, setLikeMost] = useState("");
  const [improvement, setImprovement] = useState("");
  const [featureRequest, setFeatureRequest] = useState("");
  const [sending, setSending] = useState(false);

  // Two of the three answers are asked for, as the form's own design has
  // it: a rating with nothing said about it is a number nobody can act on.
  const ready =
    rating > 0 && likeMost.trim() !== "" && improvement.trim() !== "";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ready || sending) return;

    setSending(true);
    try {
      await submitFeedback({
        rating,
        likeMost: likeMost.trim(),
        improvement: improvement.trim(),
        featureRequest: featureRequest.trim() || undefined,
      });
      toast.success("Thank you — this is read.");
      setRating(0);
      setLikeMost("");
      setImprovement("");
      setFeatureRequest("");
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Your feedback couldn't be sent.",
      );
    } finally {
      setSending(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      <Stars
        label="How would you rate the overall experience of Rebuzz POS?"
        value={rating}
        onChange={setRating}
        required
      />

      <Field label="What do you like the most?" required htmlFor="fb-like">
        <textarea
          id="fb-like"
          required
          rows={3}
          value={likeMost}
          onChange={(e) => setLikeMost(e.target.value)}
          placeholder="Tell us what's working great"
          className={`${inputClass} h-auto resize-y py-3 leading-relaxed`}
        />
      </Field>

      <Field label="What can we improve?" required htmlFor="fb-improve">
        <textarea
          id="fb-improve"
          required
          rows={3}
          value={improvement}
          onChange={(e) => setImprovement(e.target.value)}
          placeholder="Share any pain points or suggestions"
          className={`${inputClass} h-auto resize-y py-3 leading-relaxed`}
        />
      </Field>

      <Field label="Feature request" hint="optional" htmlFor="fb-feature">
        <textarea
          id="fb-feature"
          rows={3}
          value={featureRequest}
          onChange={(e) => setFeatureRequest(e.target.value)}
          placeholder="What feature would help your business most?"
          className={`${inputClass} h-auto resize-y py-3 leading-relaxed`}
        />
      </Field>

      <Submit busy={sending} disabled={!ready}>
        Send feedback
      </Submit>
    </form>
  );
}

// ── Shared parts ──────────────────────────────────────────────────────────

const inputClass =
  "h-11 w-full rounded-xl border border-[#dadce0] bg-white dark:bg-white/5 px-3.5 text-[13px] text-[#3c4043] outline-none transition placeholder:text-[#9aa0a6] focus:border-transparent focus:ring-2 focus:ring-blue-500 dark:placeholder:text-[#7b869b] dark:border-white/15 dark:text-[#e8ecf4]";

function Field({
  label,
  hint,
  required,
  htmlFor,
  children,
}: {
  label: string;
  /** "optional", shown quietly beside the label. */
  hint?: string;
  required?: boolean;
  /**
   * The control this caption names. Left out for a control that is not a
   * form element — `htmlFor` cannot point at a button — in which case the
   * caption is plain text and the control carries its own `aria-label`.
   */
  htmlFor?: string;
  children: React.ReactNode;
}) {
  const caption = (
    <>
      {label}
      {required && (
        <span className="text-[#d93025] dark:text-[#f87171]" aria-hidden>
          *
        </span>
      )}
      {hint && (
        <span className="font-normal text-[#9aa0a6] dark:text-[#9aa6bd]">
          {hint}
        </span>
      )}
    </>
  );
  const captionClass =
    "flex items-baseline gap-1.5 text-[12px] font-medium text-[#3c4043] dark:text-[#e8ecf4]";

  return (
    <div className="flex flex-col gap-1.5">
      {htmlFor ? (
        <label htmlFor={htmlFor} className={captionClass}>
          {caption}
        </label>
      ) : (
        <span className={captionClass}>{caption}</span>
      )}
      {children}
    </div>
  );
}

/**
 * Five stars, as radios.
 *
 * A radio group rather than buttons, so it can be reached and set from the
 * keyboard like any other single choice, and so the whole group carries one
 * label.
 */
function Stars({
  label,
  hint,
  value,
  onChange,
  required,
}: {
  label: string;
  hint?: string;
  value: number;
  onChange: (v: number) => void;
  required?: boolean;
}) {
  return (
    <fieldset className="flex flex-col gap-2">
      <legend className="flex items-baseline gap-1.5 text-[12px] font-medium text-[#3c4043] dark:text-[#e8ecf4]">
        {label}
        {required && (
          <span className="text-[#d93025] dark:text-[#f87171]" aria-hidden>
            *
          </span>
        )}
        {hint && (
          <span className="font-normal text-[#9aa0a6] dark:text-[#9aa6bd]">
            {hint}
          </span>
        )}
      </legend>

      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((n) => {
          const filled = n <= value;
          return (
            <label
              key={n}
              className="relative cursor-pointer rounded p-0.5 focus-within:ring-2 focus-within:ring-blue-500"
            >
              <input
                type="radio"
                name={label}
                value={n}
                checked={value === n}
                onChange={() => onChange(n)}
                className="sr-only"
              />
              <Star
                size={22}
                aria-hidden
                className={`transition-colors ${
                  filled
                    ? "fill-amber-400 text-amber-400"
                    : "text-[#dadce0] hover:text-[#9aa0a6] dark:hover:text-[#c3ccdc] dark:text-[#3d4657]"
                }`}
              />
              <span className="sr-only">
                {n} {n === 1 ? "star" : "stars"}
              </span>
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}

function Submit({
  busy,
  disabled,
  children,
}: {
  busy: boolean;
  disabled: boolean;
  children: React.ReactNode;
}) {
  return (
    <div>
      <button
        type="submit"
        disabled={disabled || busy}
        className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-full bg-[#1a73e8] px-6 py-2.5 text-[13px] font-medium text-white transition-colors hover:bg-[#1765cc] disabled:cursor-not-allowed disabled:bg-[#dadce0] disabled:text-[#9aa0a6] dark:disabled:text-[#7b869b] dark:disabled:bg-white/10"
      >
        {busy && <Loader2 size={14} className="animate-spin" aria-hidden />}
        {busy ? "Sending…" : children}
      </button>
    </div>
  );
}
