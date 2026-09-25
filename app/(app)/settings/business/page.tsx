"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import {
  AlertTriangle,
  Building2,
  Camera,
  Check,
  Loader2,
  MapPin,
  Navigation,
  Pencil,
  Phone,
  Receipt,
  User,
  X,
} from "lucide-react";

import { useBusiness, useUpdateBusiness } from "@/hooks/useBusiness";
import { AddressSearch } from "@/components/onboardingComponents/AddressSearch";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import businessLogo from "@/public/rebuzz.png";

const inputClass =
  "w-full rounded-lg border border-[#dadce0] px-3 py-2.5 text-sm text-[#3c4043] transition placeholder:text-[#9aa0a6] focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500";
const inputErrorClass =
  "w-full rounded-lg border border-red-300 px-3 py-2.5 text-sm text-[#3c4043] transition placeholder:text-[#9aa0a6] focus:border-transparent focus:outline-none focus:ring-2 focus:ring-red-400";

/** Logo guidance, stated once and reused by the validator and the hint. */
const LOGO_WARN_MB = 1;
const LOGO_MAX_MB = 5;

type FormKey =
  | "businessName"
  | "owner"
  | "address"
  | "accurateLocation"
  | "phoneNumber"
  | "panNumber";

const EMPTY_FORM: Record<FormKey, string> = {
  businessName: "",
  owner: "",
  address: "",
  accurateLocation: "",
  phoneNumber: "",
  panNumber: "",
};

/**
 * One detail, in whichever mode the card is in.
 *
 * View and edit share the same cell so the layout does not shift when the mode
 * changes — only the control inside it does.
 */
function Field({
  icon: Icon,
  label,
  hint,
  error,
  editing,
  value,
  children,
}: {
  icon: React.ElementType;
  label: string;
  hint?: string;
  error?: string;
  editing: boolean;
  /** Shown when not editing. */
  value?: string | null;
  /** The control, shown when editing. */
  children?: React.ReactNode;
}) {
  return (
    <div className="min-w-0">
      <div className="mb-1.5 flex items-center gap-1.5">
        <Icon className="h-3.5 w-3.5 shrink-0 text-[#9aa0a6]" />
        <span className="text-[10px] font-semibold uppercase tracking-[0.08em] text-[#9aa0a6]">
          {label}
        </span>
      </div>

      {editing ? (
        <>
          {children}
          {error ? (
            <p className="mt-1 text-[11px] text-red-500">{error}</p>
          ) : hint ? (
            <p className="mt-1 text-[11px] text-[#9aa0a6]">{hint}</p>
          ) : null}
        </>
      ) : (
        <p
          className={`truncate text-sm font-medium ${
            value ? "text-[#3c4043]" : "text-[#9aa0a6]"
          }`}
          title={value ?? undefined}
        >
          {value || "Not set"}
        </p>
      )}
    </div>
  );
}

/**
 * A titled group of details.
 *
 * The five fields were one undifferentiated grid, which reads as a form to be
 * filled rather than a profile to be understood. Grouping them by what they
 * are for — who to contact, where the business is, what the taxman needs —
 * gives the eye somewhere to land.
 */
function Section({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <div className="border-t border-[#e8eaed] px-6 py-5">
      <div className="mb-4">
        <h3 className="text-[13px] font-semibold text-[#3c4043]">{title}</h3>
        <p className="mt-0.5 text-[11px] text-[#9aa0a6]">{description}</p>
      </div>
      <div className="grid gap-5 sm:grid-cols-2">{children}</div>
    </div>
  );
}

function ProfileSkeleton() {
  return (
    <div className="overflow-hidden rounded-2xl border border-[#e3e3e3] bg-white">
      <div className="flex items-center gap-5 p-6">
        <div className="h-20 w-20 shrink-0 animate-pulse rounded-xl bg-gray-100" />
        <div className="space-y-2">
          <div className="h-5 w-48 animate-pulse rounded bg-gray-100" />
          <div className="h-3 w-24 animate-pulse rounded bg-gray-100" />
        </div>
      </div>
      <div className="border-t border-[#e8eaed] p-6">
        <div className="grid gap-6 sm:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <div className="h-2.5 w-16 animate-pulse rounded bg-gray-100" />
              <div className="h-4 w-32 animate-pulse rounded bg-gray-100" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function BusinessSettingsPage() {
  const { data: business, isLoading } = useBusiness();
  const { mutate: saveBusiness, isPending: saving } = useUpdateBusiness();

  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState<Partial<Record<FormKey, string>>>({});

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoError, setLogoError] = useState<string | null>(null);

  const set = (key: FormKey, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: "" }));
  };

  /**
   * The form is seeded when editing starts rather than as the data arrives, so
   * the view mode always reads the saved business and there is no snapshot to
   * keep in step with it.
   */
  const startEdit = () => {
    setForm({
      businessName: business?.businessName ?? "",
      owner: business?.owner ?? "",
      address: business?.address ?? "",
      accurateLocation: business?.accurateLocation ?? "",
      phoneNumber: business?.phoneNumber ?? "",
      panNumber: business?.panNumber ? String(business.panNumber) : "",
    });
    setErrors({});
    setLogoPreview(null);
    setLogoFile(null);
    setLogoError(null);
    setEditing(true);
  };

  const cancelEdit = () => {
    setForm(EMPTY_FORM);
    setErrors({});
    setLogoPreview(null);
    setLogoFile(null);
    setLogoError(null);
    setEditing(false);
  };

  const validate = (): boolean => {
    const e: Partial<Record<FormKey, string>> = {};
    if (!form.businessName.trim()) e.businessName = "Business name is required";
    if (!form.owner.trim()) e.owner = "Owner name is required";
    if (!form.address.trim()) e.address = "Address is required";
    if (!form.phoneNumber.trim()) e.phoneNumber = "Contact number is required";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLogoError(null);

    if (!file.type.startsWith("image/")) {
      setLogoError("Please select a valid image file (PNG, JPG, or WEBP).");
      return;
    }

    const mb = file.size / (1024 * 1024);
    if (mb > LOGO_MAX_MB) {
      setLogoError(
        `Image is too large (${mb.toFixed(1)} MB). Maximum allowed size is ${LOGO_MAX_MB} MB. Please compress and try again.`,
      );
      return;
    }

    // Over the recommendation but under the cap — accepted, with a warning.
    if (mb > LOGO_WARN_MB) {
      setLogoError(
        `Image size is ${mb.toFixed(1)} MB. Large images slow the business profile down — consider compressing to under ${LOGO_WARN_MB} MB.`,
      );
    }

    setLogoFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => setLogoPreview(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  const handleSave = () => {
    if (!validate()) return;

    saveBusiness({
      businessName: form.businessName.trim(),
      owner: form.owner.trim(),
      address: form.address.trim(),
      phoneNumber: form.phoneNumber.trim(),
      panNo: form.panNumber ? Number(form.panNumber) : 0,
      businessType: business?.businessType ?? "",
      accurateLocation: form.accurateLocation.trim(),
      logo: logoFile ?? undefined,
    });

    setEditing(false);
  };

  // Preview beats the saved logo while a new file is staged.
  const displayLogo = logoPreview ?? business?.logo ?? null;

  /**
   * How much of the profile is filled in.
   *
   * These details are printed on invoices and receipts, so a missing one is
   * not cosmetic — a bill without a PAN number is a bill a customer cannot
   * claim against. Counting them turns "Not set" from a grey word into
   * something the page is visibly asking for.
   */
  const filledCount = business
    ? (
        [
          business.businessName,
          business.owner,
          business.phoneNumber,
          business.address,
          business.accurateLocation,
          business.panNumber,
        ] as (string | number | null | undefined)[]
      ).filter((v) => v !== null && v !== undefined && String(v).trim() !== "")
        .length
    : 0;
  const totalFields = 6;
  const isComplete = filledCount === totalFields;

  return (
    <div className="min-h-screen bg-surface-page px-6 py-8 md:px-10">
      <div className="mx-auto w-full">
        {/* ── Header ── */}
        <div className="mb-5 flex flex-col gap-4 border-b border-[#e8eaed] pb-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <h1 className="truncate text-xl font-bold md:text-2xl">
              Business Settings
            </h1>
            <p className="mt-0.5 text-xs text-[#9aa0a6]">
              {editing
                ? "Changes are saved only when you press Save."
                : "Your business profile as it appears on invoices and receipts."}
            </p>
          </div>

          {!editing && !isLoading && (
            <Button
              onClick={startEdit}
              className="flex shrink-0 cursor-pointer items-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm text-white hover:bg-blue-700"
            >
              <Pencil className="h-4 w-4" />
              Edit business
            </Button>
          )}
        </div>

        {isLoading ? (
          <ProfileSkeleton />
        ) : (
          /* ── One card, two modes — so nothing is shown twice ── */
          <div className="overflow-hidden rounded-2xl border border-[#e3e3e3] bg-white">
            {/* Identity.
                This is the business's own page and the profile it describes is
                what customers see on every receipt, so it leads the card —
                centred, with the mark first. */}
            <div className="relative flex flex-col items-center gap-4 overflow-hidden px-6 pb-6 pt-10 text-center">
              {/* Something for the mark to sit on.
                  Not the coloured band again — that competed with the logo and
                  turned the top of the card into a header bar. This is ambient
                  instead: a blurred wash of the app's own blues behind the
                  circle, and two faint rings spreading from it, so the eye is
                  drawn to the centre without anything hard-edged arriving. */}
              <div
                aria-hidden
                className="pointer-events-none absolute left-1/2 top-2 h-44 w-44 -translate-x-1/2 rounded-full bg-gradient-to-br from-blue-400/30 via-indigo-400/20 to-violet-400/30 blur-3xl"
              />
              <div
                aria-hidden
                className="pointer-events-none absolute left-1/2 top-6 h-44 w-44 -translate-x-1/2 rounded-full border border-[#dadce0]/70"
              />
              <div
                aria-hidden
                className="pointer-events-none absolute left-1/2 top-1 h-54 w-54 -translate-x-1/2 rounded-full border border-[#e8eaed]"
              />

              <div className="group relative z-10 h-36 w-36 shrink-0">
                <div className="h-36 w-36 overflow-hidden rounded-full border-4 border-white bg-white shadow-md ring-1 ring-[#dadce0]/80">
                  <Image
                    src={displayLogo || businessLogo}
                    alt=""
                    width={144}
                    height={144}
                    className={
                      displayLogo
                        ? "h-full w-full object-cover"
                        : "h-full w-full object-contain p-6"
                    }
                    unoptimized={!!logoPreview}
                    priority
                  />
                </div>

                {/* The logo is only replaceable while editing, so the overlay
                    exists only then rather than teasing a disabled control. */}
                {editing && (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    aria-label="Change business logo"
                    className="absolute inset-0 flex items-center justify-center rounded-full bg-black/45 text-white opacity-0 transition-opacity group-hover:opacity-100 focus:opacity-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 cursor-pointer"
                  >
                    <Camera size={22} />
                  </button>
                )}

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  className="hidden"
                  onChange={handleLogoChange}
                />
              </div>

              <div className="relative z-10 w-full min-w-0 max-w-md">
                {editing ? (
                  <>
                    <label className="mb-1.5 flex items-center justify-center gap-1.5">
                      <Building2 className="h-3.5 w-3.5 text-[#9aa0a6]" />
                      <span className="text-[10px] font-semibold uppercase tracking-[0.08em] text-[#9aa0a6]">
                        Business name
                      </span>
                    </label>
                    <Input
                      type="text"
                      value={form.businessName}
                      onChange={(e) => set("businessName", e.target.value)}
                      className={
                        errors.businessName ? inputErrorClass : inputClass
                      }
                      placeholder="e.g. Rebuzz POS"
                    />
                    {errors.businessName && (
                      <p className="mt-1 text-[11px] text-red-500">
                        {errors.businessName}
                      </p>
                    )}
                  </>
                ) : (
                  <>
                    <h2 className="truncate text-[22px] font-semibold leading-tight tracking-tight text-[#3c4043]">
                      {business?.businessName || "My Business"}
                    </h2>
                    <div className="mt-2 flex flex-wrap items-center justify-center gap-2">
                      <span className="inline-flex items-center rounded-full border border-blue-200 bg-blue-50 px-2.5 py-0.5 text-[11px] font-semibold text-blue-700">
                        {business?.businessType || "Business"}
                      </span>

                      {/* Green only when there is nothing left to add, so the
                          colour means something rather than always being on. */}
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${
                          isComplete
                            ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                            : "border-amber-200 bg-amber-50 text-amber-700"
                        }`}
                      >
                        {isComplete ? (
                          <Check className="h-3 w-3" />
                        ) : (
                          <AlertTriangle className="h-3 w-3" />
                        )}
                        {isComplete
                          ? "Profile complete"
                          : `${filledCount} of ${totalFields} details added`}
                      </span>
                    </div>
                  </>
                )}

                {editing && (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="mt-2 cursor-pointer text-xs font-semibold text-blue-600 transition-colors hover:text-blue-700"
                  >
                    {displayLogo ? "Change logo" : "Upload logo"}
                  </button>
                )}
              </div>
            </div>

            {/* Logo feedback — an error blocks the upload, a warning does not */}
            {editing && (
              <div className="px-6 pb-2">
                {logoError ? (
                  <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3">
                    <AlertTriangle
                      size={15}
                      className="mt-0.5 shrink-0 text-amber-500"
                    />
                    <p className="text-[11px] leading-relaxed text-amber-700">
                      {logoError}
                    </p>
                  </div>
                ) : (
                  <p className="text-[11px] text-[#9aa0a6]">
                    PNG, JPG or WEBP. Keep it under {LOGO_WARN_MB} MB for faster
                    loading — {LOGO_MAX_MB} MB is the limit.
                  </p>
                )}
              </div>
            )}

            <Section
              title="Owner & contact"
              description="Who runs the business, and how customers reach you."
            >
              <Field
                icon={User}
                label="Owner"
                editing={editing}
                value={business?.owner}
                error={errors.owner}
              >
                <Input
                  type="text"
                  value={form.owner}
                  onChange={(e) => set("owner", e.target.value)}
                  className={errors.owner ? inputErrorClass : inputClass}
                  placeholder="e.g. John Doe"
                />
              </Field>

              <Field
                icon={Phone}
                label="Contact number"
                editing={editing}
                value={business?.phoneNumber}
                error={errors.phoneNumber}
              >
                <Input
                  type="text"
                  value={form.phoneNumber}
                  onChange={(e) => set("phoneNumber", e.target.value)}
                  className={errors.phoneNumber ? inputErrorClass : inputClass}
                  placeholder="e.g. +977-9841234567"
                />
              </Field>
            </Section>

            <Section
              title="Location"
              description="Printed on receipts, and used to place you on a map."
            >
              <Field
                icon={MapPin}
                label="Address"
                editing={editing}
                value={business?.address}
                error={errors.address}
              >
                <Input
                  type="text"
                  value={form.address}
                  onChange={(e) => set("address", e.target.value)}
                  className={errors.address ? inputErrorClass : inputClass}
                  placeholder="e.g. Kathmandu, Nepal"
                />
              </Field>

              {/* The map search needs the room, so it spans both columns. */}
              <div className="sm:col-span-2">
                <Field
                  icon={Navigation}
                  label="Precise location"
                  hint="Search and pick the exact spot for your business"
                  editing={editing}
                  value={business?.accurateLocation}
                >
                  <AddressSearch
                    value={form.accurateLocation}
                    onChange={(val) => set("accurateLocation", val)}
                  />
                </Field>
              </div>
            </Section>

            <Section
              title="Tax details"
              description="Shown on tax invoices so customers can claim against them."
            >
              <Field
                icon={Receipt}
                label="PAN / VAT"
                hint="Printed on tax invoices"
                editing={editing}
                value={
                  business?.panNumber ? String(business.panNumber) : undefined
                }
              >
                <Input
                  type="text"
                  value={form.panNumber}
                  onChange={(e) => set("panNumber", e.target.value)}
                  className={inputClass}
                  placeholder="e.g. 609699393"
                />
              </Field>
            </Section>

            {/* Actions */}
            {editing && (
              <div className="flex items-center justify-end gap-3 border-t border-[#e8eaed] bg-[#f8f9fa] px-6 py-4">
                <Button
                  onClick={cancelEdit}
                  variant="outline"
                  disabled={saving}
                  className="flex cursor-pointer items-center gap-2 rounded-lg border-[#dadce0] text-[#3c4043] hover:bg-[#f1f3f4]"
                >
                  <X className="h-4 w-4" />
                  Cancel
                </Button>

                <Button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex cursor-pointer items-center gap-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700"
                >
                  {saving ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Check className="h-4 w-4" />
                      Save changes
                    </>
                  )}
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
