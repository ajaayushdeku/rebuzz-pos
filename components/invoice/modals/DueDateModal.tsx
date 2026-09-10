"use client";

import { useMemo, useState } from "react";
import { CalendarClock, Plus, X } from "lucide-react";

import ModalShell, {
  SectionLabel,
  modalGhostButton,
} from "@/components/ui/ModalShell";
import { nepalToday } from "@/lib/nepalDate";

/**
 * Furthest a reminder may sit from the due date.
 *
 * A year is well past any sensible chase, and without a ceiling a stray keypress
 * turns into a reminder scheduled decades out that nobody would notice.
 */
const MAX_OFFSET_DAYS = 365;

/** What the business is told a given offset means. */
export function reminderLabel(offset: number): string {
  if (offset === 0) return "On the due date";
  const days = Math.abs(offset);
  const unit = days === 1 ? "day" : "days";
  return offset < 0 ? `${days} ${unit} before` : `${days} ${unit} after`;
}

interface DueDateModalProps {
  onClose: () => void;
  invoiceNo: number | undefined;
  /** Current due date, YYYY-MM-DD, or null when none is set. */
  dueDate: string | null;
  /** Current schedule, as day offsets. */
  reminderSchedule: number[];
  isSaving: boolean;
  onSubmit: (settings: { dueDate: string; reminderSchedule: number[] }) => void;
}

/**
 * Mounted only while open, unlike its siblings which take an `open` prop.
 *
 * The form has to start from whatever is currently saved, and a component that
 * stays mounted would have to copy props into state from an effect — which
 * this codebase's lint rules forbid, and rightly: the copy goes stale the
 * moment the query refetches. Mounting on demand lets the initialisers read
 * the props once, and unmounting throws a cancelled edit away for free.
 *
 * That is why the shell below is handed a bare `open`: this component does not
 * exist when it is shut.
 */
export default function DueDateModal({
  onClose,
  invoiceNo,
  dueDate,
  reminderSchedule,
  isSaving,
  onSubmit,
}: DueDateModalProps) {
  const [date, setDate] = useState(() => dueDate ?? "");
  const [selected, setSelected] = useState<number[]>(() => reminderSchedule);
  const [error, setError] = useState<string | null>(null);

  // One draft per field. Kept as strings so a half-typed "1" on the way to
  // "14" is not coerced into a reminder.
  const [beforeDraft, setBeforeDraft] = useState("");
  const [afterDraft, setAfterDraft] = useState("");
  const [addError, setAddError] = useState<string | null>(null);

  // Sent in the order the reminders will fire, which is also how the summary
  // below reads. The API takes an array, and an unordered one would make two
  // identical schedules look different.
  const ordered = useMemo(
    () => [...selected].sort((a, b) => a - b),
    [selected],
  );

  const before = ordered.filter((o) => o < 0);
  const after = ordered.filter((o) => o > 0);
  const onDueDate = selected.includes(0);

  const remove = (offset: number) =>
    setSelected((prev) => prev.filter((o) => o !== offset));

  /**
   * Turn a typed day count into an offset.
   *
   * `direction` is the sign, so the before field can accept a plain "7" and
   * store −7 — the user is told which side of the due date they are filling
   * in, and should not have to type the sign as well.
   */
  const addOffset = (
    raw: string,
    direction: 1 | -1,
    clear: (value: string) => void,
  ) => {
    const days = Number(raw);

    if (!raw.trim() || !Number.isFinite(days)) {
      setAddError("Enter a number of days.");
      return;
    }
    if (!Number.isInteger(days) || days < 1) {
      setAddError("Use a whole number of days, 1 or more.");
      return;
    }
    if (days > MAX_OFFSET_DAYS) {
      setAddError(`Keep it within ${MAX_OFFSET_DAYS} days of the due date.`);
      return;
    }

    const offset = days * direction;
    if (selected.includes(offset)) {
      setAddError(`${reminderLabel(offset)} is already scheduled.`);
      return;
    }

    setSelected((prev) => [...prev, offset]);
    setAddError(null);
    clear("");
  };

  const handleSubmit = () => {
    if (!date) {
      setError("Pick a due date first.");
      return;
    }
    setError(null);
    onSubmit({ dueDate: date, reminderSchedule: ordered });
  };

  /** The chips for one side, each removable. */
  const chips = (offsets: number[], emptyText: string) =>
    offsets.length === 0 ? (
      <p className="text-[12px] text-gray-400">{emptyText}</p>
    ) : (
      <div className="flex flex-wrap gap-2">
        {offsets.map((offset) => (
          <span
            key={offset}
            className="inline-flex items-center gap-1.5 rounded-lg border border-blue-200 bg-blue-50/60 px-2.5 py-1.5 text-[12px] font-medium text-blue-700"
          >
            {reminderLabel(offset)}
            <button
              type="button"
              onClick={() => remove(offset)}
              aria-label={`Remove ${reminderLabel(offset)}`}
              className="text-blue-400 transition hover:text-blue-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
            >
              <X size={12} strokeWidth={2.4} />
            </button>
          </span>
        ))}
      </div>
    );

  /** A day-count field with its sign shown, and the button that commits it. */
  const dayField = (
    id: string,
    value: string,
    setValue: (v: string) => void,
    direction: 1 | -1,
  ) => (
    <div className="flex items-center gap-2">
      {/* Built from ModalShell's input metrics rather than using `modalInput`
          directly — the sign and the unit sit inside the same box, so the
          border and focus ring belong to the wrapper. */}
      <div className="flex h-11 flex-1 items-center rounded-xl border border-gray-200 bg-white px-3.5 transition focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/20">
        {/* The sign is shown, not typed. It tells the reader what the number
            will mean without making them get it right themselves. */}
        <span
          aria-hidden="true"
          className="select-none pr-1.5 font-mono text-[13px] text-gray-400"
        >
          {direction === -1 ? "−" : "+"}
        </span>
        <input
          id={id}
          type="number"
          min={1}
          max={MAX_OFFSET_DAYS}
          inputMode="numeric"
          placeholder="7"
          value={value}
          onChange={(e) => {
            setValue(e.target.value);
            setAddError(null);
          }}
          onKeyDown={(e) => {
            if (e.key !== "Enter") return;
            // Otherwise Enter reaches the footer's Save and stores a schedule
            // missing the number just typed.
            e.preventDefault();
            addOffset(value, direction, setValue);
          }}
          className="w-full bg-transparent text-[13px] text-gray-800 outline-none"
        />
        <span className="select-none pl-2 text-[12px] text-gray-400">days</span>
      </div>
      <button
        type="button"
        onClick={() => addOffset(value, direction, setValue)}
        className="flex h-11 shrink-0 items-center gap-1.5 rounded-xl border border-gray-200 px-3.5 text-[12px] font-semibold text-gray-700 transition hover:border-gray-300 hover:bg-gray-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
      >
        <Plus size={13} />
        Add
      </button>
    </div>
  );

  return (
    <ModalShell
      open
      onClose={onClose}
      busy={isSaving}
      title="Due date & reminders"
      subtitle={
        invoiceNo != null
          ? `Invoice #${invoiceNo} · when payment is expected`
          : "When payment is expected"
      }
      icon={CalendarClock}
      footer={
        <div className="flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            disabled={isSaving}
            className={modalGhostButton}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSaving}
            className="flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-6 py-2.5 text-[13px] font-semibold text-white tracking-wide transition hover:bg-blue-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isSaving ? "Saving..." : "Save"}
          </button>
        </div>
      }
    >
      <div className="space-y-5">
        <div>
          <label htmlFor="invoice-due-date" className="mb-2 block">
            <SectionLabel>Due date</SectionLabel>
          </label>
          {/* `min` is Nepal's today, not the browser's — what is typed here is
              read back as a Nepal calendar day, and the two have to agree
              about which day "today" is. */}
          <input
            id="invoice-due-date"
            type="date"
            value={date}
            min={nepalToday()}
            onChange={(e) => {
              setDate(e.target.value);
              setError(null);
            }}
            className={`h-11 w-full rounded-xl border bg-white px-3.5 text-[13px] text-gray-800 outline-none transition focus:ring-2 ${
              error
                ? "border-red-300 focus:border-red-400 focus:ring-red-500/20"
                : "border-gray-200 focus:border-blue-500 focus:ring-blue-500/20"
            }`}
          />
          {error && <p className="mt-1.5 text-[12px] text-red-600">{error}</p>}
        </div>

        <div>
          <label htmlFor="reminder-before" className="mb-2 block">
            <SectionLabel>Scheduled reminders before due date</SectionLabel>
          </label>
          {dayField("reminder-before", beforeDraft, setBeforeDraft, -1)}
          <div className="mt-2">
            {chips(before, "None yet — add one above.")}
          </div>
        </div>

        <div>
          <label htmlFor="reminder-after" className="mb-2 block">
            <SectionLabel>Scheduled reminders after due date</SectionLabel>
          </label>
          {dayField("reminder-after", afterDraft, setAfterDraft, 1)}
          <div className="mt-2">
            {chips(after, "None yet — add one above.")}
          </div>
        </div>

        {/* Neither before nor after, so it gets a tick rather than a field —
            there is only one day it can mean. */}
        <label className="flex items-center gap-2 text-[13px] font-medium text-gray-700">
          <input
            type="checkbox"
            checked={onDueDate}
            onChange={() =>
              setSelected((prev) =>
                prev.includes(0) ? prev.filter((o) => o !== 0) : [...prev, 0],
              )
            }
            className="rounded border-gray-300"
          />
          Also remind on the due date itself
        </label>

        {addError && <p className="text-[12px] text-red-600">{addError}</p>}

        {/* Said back in plain words, because a set of chips is easy to misread
            and this is what the customer will actually receive. */}
        <p className="rounded-xl bg-gray-50 px-3.5 py-3 text-[12px] leading-relaxed text-gray-600">
          {ordered.length === 0 ? (
            "No reminders will be sent. The due date is still recorded and shown on the invoice."
          ) : (
            <div className="flex flex-wrap items-center justify-start gap-1.5">
              <p className=" text-[12px] font-semibold text-gray-700">
                {ordered.length} reminder{ordered.length === 1 ? "" : "s"}:
              </p>{" "}
              {ordered.map((o) => reminderLabel(o).toLowerCase()).join(", ")}.
            </div>
          )}
        </p>
      </div>
    </ModalShell>
  );
}
