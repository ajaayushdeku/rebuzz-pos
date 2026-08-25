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
  "w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-900 placeholder:text-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition";
const inputErrorClass =
  "w-full border border-red-300 rounded-lg px-3 py-2.5 text-sm text-gray-900 placeholder:text-gray-300 focus:outline-none focus:ring-2 focus:ring-red-400 focus:border-transparent transition";

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
        <Icon className="h-3.5 w-3.5 shrink-0 text-gray-400" />
        <span className="text-[10px] font-semibold uppercase tracking-[0.08em] text-gray-400">
          {label}
        </span>
      </div>

      {editing ? (
        <>
          {children}
          {error ? (
            <p className="mt-1 text-[11px] text-red-500">{error}</p>
          ) : hint ? (
            <p className="mt-1 text-[11px] text-gray-400">{hint}</p>
          ) : null}
        </>
      ) : (
        <p
          className={`truncate text-sm font-medium ${
            value ? "text-gray-900" : "text-gray-300"
          }`}
          title={value ?? undefined}
        >
          {value || "Not set"}
        </p>
      )}
    </div>
  );
}

function ProfileSkeleton() {
  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
      <div className="flex items-center gap-5 p-6">
        <div className="h-20 w-20 shrink-0 animate-pulse rounded-xl bg-gray-100" />
        <div className="space-y-2">
          <div className="h-5 w-48 animate-pulse rounded bg-gray-100" />
          <div className="h-3 w-24 animate-pulse rounded bg-gray-100" />
        </div>
      </div>
      <div className="border-t border-gray-100 p-6">
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

  return (
    <div className="min-h-screen bg-50 px-6 py-8 md:px-10">
      <div className="mx-auto w-full">
        {/* ── Header ── */}
        <div className="mb-5 flex flex-col gap-4 border-b border-gray-200 pb-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <h1 className="truncate text-xl font-bold md:text-2xl">
              Business Settings
            </h1>
            <p className="mt-0.5 text-xs text-gray-400">
              {editing
                ? "Changes are saved only when you press Save."
                : "Your business profile as it appears on invoices and receipts."}
            </p>
          </div>

          {!editing && !isLoading && (
            <Button
              onClick={startEdit}
              className="flex shrink-0 items-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm text-white hover:bg-blue-700"
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
          <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
            {/* Identity */}
            <div className="flex flex-col gap-5 p-6 sm:flex-row sm:items-center">
              <div className="group relative h-20 w-20 shrink-0">
                <div className="h-20 w-20 overflow-hidden rounded-xl border border-gray-200 bg-gray-50">
                  <Image
                    src={displayLogo || businessLogo}
                    alt=""
                    width={80}
                    height={80}
                    className={
                      displayLogo
                        ? "h-full w-full object-cover"
                        : "h-full w-full object-contain p-2"
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
                    className="absolute inset-0 flex items-center justify-center rounded-xl bg-black/45 text-white opacity-0 transition-opacity group-hover:opacity-100 focus:opacity-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                  >
                    <Camera size={18} />
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

              <div className="min-w-0 flex-1">
                {editing ? (
                  <>
                    <label className="mb-1.5 flex items-center gap-1.5">
                      <Building2 className="h-3.5 w-3.5 text-gray-400" />
                      <span className="text-[10px] font-semibold uppercase tracking-[0.08em] text-gray-400">
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
                    <h2 className="truncate text-xl font-bold text-gray-900">
                      {business?.businessName || "My Business"}
                    </h2>
                    <span className="mt-1.5 inline-flex items-center rounded-full bg-blue-50 px-2.5 py-0.5 text-[11px] font-semibold text-blue-700">
                      {business?.businessType || "Business"}
                    </span>
                  </>
                )}

                {editing && (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="mt-2 text-xs font-semibold text-blue-600 transition-colors hover:text-blue-700"
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
                  <p className="text-[11px] text-gray-400">
                    PNG, JPG or WEBP. Keep it under {LOGO_WARN_MB} MB for faster
                    loading — {LOGO_MAX_MB} MB is the limit.
                  </p>
                )}
              </div>
            )}

            <div className="border-t border-gray-100" />

            {/* Details */}
            <div className="grid gap-5 p-6 sm:grid-cols-2">
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
            </div>

            {/* Actions */}
            {editing && (
              <div className="flex items-center justify-end gap-3 border-t border-gray-100 bg-gray-50 px-6 py-4">
                <Button
                  onClick={cancelEdit}
                  variant="outline"
                  disabled={saving}
                  className="flex items-center gap-2 rounded-lg border-gray-300 text-gray-700 hover:bg-gray-100"
                >
                  <X className="h-4 w-4" />
                  Cancel
                </Button>

                <Button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex items-center gap-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700"
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
