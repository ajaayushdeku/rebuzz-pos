"use client";

import { useState, type FormEvent } from "react";
import { LoaderCircle, Send } from "lucide-react";

type SubmitState = "idle" | "sending" | "sent" | "error";

export default function FinalSignupContactForm() {
  const [state, setState] = useState<SubmitState>("idle");
  const [errorMessage, setErrorMessage] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setState("sending");
    setErrorMessage("");

    const form = event.currentTarget;
    const formData = new FormData(form);

    try {
      const response = await fetch("/api/home-contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.get("name"),
          email: formData.get("email"),
          message: formData.get("message"),
          website: formData.get("website"),
        }),
      });
      const result = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(result.error || "Your message could not be sent.");
      }

      form.reset();
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

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <label className="grid gap-1.5 text-xs font-medium text-gray-600 dark:text-gray-300">
          Your name
          <input
            name="name"
            required
            maxLength={100}
            autoComplete="name"
            placeholder="Name"
            className="h-10 rounded-lg border border-gray-200 bg-gray-50 px-3 text-sm text-[#1b2537] outline-none transition placeholder:text-gray-400 focus:border-[#E26924] focus:bg-white focus:ring-2 focus:ring-[#E26924]/15 dark:border-white/10 dark:bg-[#0f1420] dark:text-[#e8ecf4] dark:placeholder:text-gray-500 dark:focus:bg-[#111827]"
          />
        </label>
        <label className="grid gap-1.5 text-xs font-medium text-gray-600 dark:text-gray-300">
          Email address
          <input
            name="email"
            type="email"
            required
            maxLength={254}
            autoComplete="email"
            placeholder="you@business.com"
            className="h-10 rounded-lg border border-gray-200 bg-gray-50 px-3 text-sm text-[#1b2537] outline-none transition placeholder:text-gray-400 focus:border-[#E26924] focus:bg-white focus:ring-2 focus:ring-[#E26924]/15 dark:border-white/10 dark:bg-[#0f1420] dark:text-[#e8ecf4] dark:placeholder:text-gray-500 dark:focus:bg-[#111827]"
          />
        </label>
      </div>

      <label className="mt-4 grid gap-1.5 text-xs font-medium text-gray-600 dark:text-gray-300">
        How can we help?
        <textarea
          name="message"
          required
          minLength={10}
          maxLength={3000}
          rows={4}
          placeholder="Tell us a little about what you need…"
          className="resize-y rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm text-[#1b2537] outline-none transition placeholder:text-gray-400 focus:border-[#E26924] focus:bg-white focus:ring-2 focus:ring-[#E26924]/15 dark:border-white/10 dark:bg-[#0f1420] dark:text-[#e8ecf4] dark:placeholder:text-gray-500 dark:focus:bg-[#111827]"
        />
      </label>

      <input
        aria-hidden="true"
        autoComplete="off"
        className="hidden"
        name="website"
        tabIndex={-1}
        type="text"
      />

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
          disabled={state === "sending"}
          className="inline-flex h-11 w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-[#E26924] px-5 text-sm font-semibold text-white shadow-sm transition duration-200 hover:bg-[#cf5d1d] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#244074] focus-visible:ring-offset-2 disabled:cursor-wait disabled:opacity-60 sm:w-auto"
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
