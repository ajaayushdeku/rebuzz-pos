"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import {
  Building2,
  User,
  MapPin,
  Phone,
  Receipt,
  Loader2,
  Pencil,
  X,
  Check,
  Camera,
  AlertTriangle,
} from "lucide-react";

import { useBusiness, useUpdateBusiness } from "@/hooks/useBusiness";
import { AddressSearch } from "@/components/onboardingComponents/AddressSearch";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import businessLogo from "@/public/rebuzz.png";

// ── Shared input style ──────────────────────────────────────────────────────
const inputClass =
  "w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition";

// ── Field helper component ───────────────────────────────────────────────────
function FieldCard({
  icon: Icon,
  title,
  description,
  children,
}: {
  icon: React.ElementType;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 flex flex-col sm:flex-row sm:items-start gap-4">
      <div className="shrink-0 w-9 h-9 bg-blue-50 rounded-lg flex items-center justify-center">
        <Icon className="h-4 w-4 text-blue-600" />
      </div>
      <div className="flex-1 space-y-3">
        <div>
          <p className="text-sm font-semibold text-gray-900">{title}</p>
          <p className="text-xs text-gray-400 mt-0.5">{description}</p>
        </div>
        {children}
      </div>
    </div>
  );
}

export default function BusinessSettingsPage() {
  // ── Data ───────────────────────────────────────────────────────────────────
  const { data: business, isLoading } = useBusiness();

  const { mutate: saveBusiness, isPending: saving } = useUpdateBusiness();

  const [editOpen, setEditOpen] = useState(false);

  // ── Logo state ─────────────────────────────────────────────────────────────
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoError, setLogoError] = useState<string | null>(null);

  // ── Form state ─────────────────────────────────────────────────────────────
  const [form, setForm] = useState({
    businessName: "",
    owner: "",
    address: "",
    accurateLocation: "",
    phoneNumber: "",
    panNumber: "",
  });

  const [errors, setErrors] = useState<
    Partial<Record<keyof typeof form, string>>
  >({});

  // ── Load business data into form when it becomes available ──────────────────
  const [initialized, setInitialized] = useState(false);
  if (business && !initialized) {
    setForm({
      businessName: business.businessName ?? "",
      owner: business.owner ?? "",
      address: business.address ?? "",
      accurateLocation: business.accurateLocation ?? "",
      phoneNumber: business.phoneNumber ?? "",
      panNumber: business.panNumber ? String(business.panNumber) : "",
    });
    setInitialized(true);
  }

  const set = (key: keyof typeof form, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: "" }));
  };

  const validate = (): boolean => {
    const e: Partial<Record<keyof typeof form, string>> = {};
    if (!form.businessName.trim()) e.businessName = "Business name is required";
    if (!form.owner.trim()) e.owner = "Owner name is required";
    if (!form.address.trim()) e.address = "Address is required";
    if (!form.phoneNumber.trim()) e.phoneNumber = "Contact number is required";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  // ── Logo change handler ────────────────────────────────────────────────────
  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLogoError(null);

    // Validate type
    if (!file.type.startsWith("image/")) {
      setLogoError("Please select a valid image file (PNG, JPG, or WEBP).");
      return;
    }

    // Validate size — warn if over 1 MB, reject if over 5 MB
    const MB = file.size / (1024 * 1024);
    if (MB > 5) {
      setLogoError(
        `Image is too large (${MB.toFixed(1)} MB). Maximum allowed size is 5 MB. Please compress and try again.`,
      );
      return;
    }

    if (MB > 1) {
      setLogoError(
        `Warning: Image size is ${MB.toFixed(1)} MB. Large images may slow down your business profile loading time. Consider compressing the image to under 1 MB for optimal performance.`,
      );
      // Allow upload but show warning — don't return
    }

    setLogoFile(file);
    // Show local preview immediately
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

    setEditOpen(false);
  };

  const handleCancel = () => {
    // Reset form to current business data
    if (business) {
      setForm({
        businessName: business.businessName ?? "",
        owner: business.owner ?? "",
        address: business.address ?? "",
        accurateLocation: business.accurateLocation ?? "",
        phoneNumber: business.phoneNumber ?? "",
        panNumber: business.panNumber ? String(business.panNumber) : "",
      });
    }
    // Reset logo state
    setLogoPreview(null);
    setLogoFile(null);
    setLogoError(null);
    setErrors({});
    setEditOpen(false);
  };

  // Determine which logo to display: preview > saved > default
  const displayLogo = logoPreview ?? business?.logo ?? null;

  return (
    <div className="min-h-screen bg-50 px-6 py-8 md:px-10">
      <div className="w-full mx-auto">
        {/* ── Header ─────────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 pb-4 border-b border-gray-200">
          <div>
            <h1 className="font-bold text-xl md:text-2xl truncate">
              Business Settings
            </h1>
            <p className="text-xs text-gray-400 mt-0.5">
              Manage your business profile information
            </p>
          </div>

          {!editOpen && !isLoading && (
            <Button
              onClick={() => setEditOpen(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white text-sm px-5 py-2.5 rounded-lg flex items-center gap-2"
            >
              <Pencil className="h-4 w-4" />
              Edit Business
            </Button>
          )}
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-24">
            <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
          </div>
        ) : (
          <div className="space-y-6">
            {/* ── Business Profile Card ─────────────────── */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
              {/* Card header with logo + business name */}
              <div className="p-6 pb-4 flex items-center gap-5">
                <div className="w-20 h-20 rounded-xl bg-gray-100 overflow-hidden flex items-center justify-center shrink-0 border border-gray-200">
                  {displayLogo ? (
                    <Image
                      src={displayLogo}
                      alt="Business Logo"
                      width={80}
                      height={80}
                      className="w-full h-full object-cover"
                      unoptimized={!!logoPreview}
                      priority
                    />
                  ) : (
                    <Image
                      src={businessLogo}
                      alt="Business Logo"
                      width={80}
                      height={80}
                      className="object-contain"
                      priority
                    />
                  )}
                </div>

                <div className="min-w-0">
                  <h2 className="text-xl font-bold text-gray-900 truncate">
                    {business?.businessName || "My Business"}
                  </h2>
                  <p className="text-sm text-gray-500 mt-0.5">
                    {business?.businessType || "Business"}
                  </p>
                </div>
              </div>

              <div className="border-t border-gray-100" />

              {/* Info rows */}
              <div className="px-6 py-4 space-y-4">
                {/* Owner */}
                <div className="flex items-center gap-3 text-sm">
                  <User className="h-4 w-4 text-gray-400 shrink-0" />
                  <span className="text-gray-500 w-24 shrink-0">Owner</span>
                  <span className="text-gray-900 font-medium">
                    {business?.owner || "—"}
                  </span>
                </div>

                {/* Address */}
                <div className="flex items-center gap-3 text-sm">
                  <MapPin className="h-4 w-4 text-gray-400 shrink-0" />
                  <span className="text-gray-500 w-24 shrink-0">Address</span>
                  <span className="text-gray-900 font-medium">
                    {business?.address || "—"}
                  </span>
                </div>

                {/* Phone */}
                <div className="flex items-center gap-3 text-sm">
                  <Phone className="h-4 w-4 text-gray-400 shrink-0" />
                  <span className="text-gray-500 w-24 shrink-0">Phone</span>
                  <span className="text-gray-900 font-medium">
                    {business?.phoneNumber || "—"}
                  </span>
                </div>

                {/* PAN / VAT */}
                <div className="flex items-center gap-3 text-sm">
                  <Receipt className="h-4 w-4 text-gray-400 shrink-0" />
                  <span className="text-gray-500 w-24 shrink-0">PAN / VAT</span>
                  <span className="text-gray-900 font-medium">
                    {business?.panNumber
                      ? String(business.panNumber)
                      : "Not available"}
                  </span>
                </div>
              </div>
            </div>

            {/* ── Edit Section (expandable) ─────────────── */}
            {editOpen && (
              <div className="bg-white rounded-2xl border border-blue-200 shadow-sm overflow-hidden">
                <div className="px-6 py-4 bg-blue-50 border-b border-blue-100">
                  <h3 className="text-base font-semibold text-blue-800 flex items-center gap-2">
                    <Pencil className="h-4 w-4" />
                    Edit Business Information
                  </h3>
                  <p className="text-xs text-blue-600 mt-0.5">
                    Update your business profile details below
                  </p>
                </div>

                <div className="p-6 space-y-5">
                  {/* ── Logo Upload ─────────────────────── */}
                  <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 flex flex-col sm:flex-row sm:items-start gap-4">
                    <div className="shrink-0 w-9 h-9 bg-blue-50 rounded-lg flex items-center justify-center">
                      <Camera className="h-4 w-4 text-blue-600" />
                    </div>
                    <div className="flex-1 space-y-3">
                      <div>
                        <p className="text-sm font-semibold text-gray-900">
                          Business Logo
                        </p>
                        <p className="text-xs text-gray-400 mt-0.5">
                          Upload your business logo. PNG, JPG, WEBP accepted.
                        </p>
                      </div>

                      <div className="flex items-center gap-5">
                        <div className="relative group">
                          {displayLogo ? (
                            <div className="w-20 h-20 rounded-2xl border border-gray-200 overflow-hidden">
                              <Image
                                src={displayLogo}
                                alt="Business logo"
                                width={80}
                                height={80}
                                className="w-full h-full object-cover"
                                unoptimized={!!logoPreview}
                              />
                            </div>
                          ) : (
                            <div className="w-20 h-20 rounded-2xl border-2 border-dashed border-gray-200 flex items-center justify-center bg-gray-50">
                              <Camera size={22} className="text-gray-300" />
                            </div>
                          )}

                          {/* Overlay click target */}
                          <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className="absolute inset-0 rounded-2xl bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                          >
                            <Camera size={18} className="text-white" />
                          </button>
                        </div>

                        <div>
                          <p className="text-sm font-medium text-gray-700">
                            {displayLogo ? "Current Logo" : "No Logo"}
                          </p>
                          <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className="mt-2 text-xs font-semibold text-blue-600 hover:text-blue-700 transition-colors"
                          >
                            {displayLogo ? "Change logo" : "Upload logo"}
                          </button>
                        </div>

                        {/* Hidden file input */}
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/png,image/jpeg,image/webp"
                          className="hidden"
                          onChange={handleLogoChange}
                        />
                      </div>

                      {/* ── Size warning message ──────────── */}
                      {logoError && (
                        <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-50 border border-amber-200">
                          <AlertTriangle
                            size={16}
                            className="text-amber-500 shrink-0 mt-0.5"
                          />
                          <p className="text-xs text-amber-700 leading-relaxed">
                            {logoError}
                          </p>
                        </div>
                      )}

                      {!logoError && (
                        <p className="text-xs text-gray-400 flex items-center gap-1.5">
                          <AlertTriangle size={12} className="text-gray-400" />
                          Recommended: keep image under <strong>
                            1 MB
                          </strong>{" "}
                          for faster loading. Maximum allowed:{" "}
                          <strong>5 MB</strong>.
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Business Name */}
                  <FieldCard
                    icon={Building2}
                    title="Business Name"
                    description="The official name of your business"
                  >
                    <div>
                      <Input
                        type="text"
                        value={form.businessName}
                        onChange={(e) => set("businessName", e.target.value)}
                        className={`${inputClass} ${errors.businessName ? "border-red-300 focus:ring-red-400" : ""}`}
                        placeholder="e.g. Rebuzz POS"
                      />
                      {errors.businessName && (
                        <p className="text-xs text-red-500 mt-1">
                          {errors.businessName}
                        </p>
                      )}
                    </div>
                  </FieldCard>

                  {/* Owner Name */}
                  <FieldCard
                    icon={User}
                    title="Owner Name"
                    description="Full name of the business owner"
                  >
                    <div>
                      <Input
                        type="text"
                        value={form.owner}
                        onChange={(e) => set("owner", e.target.value)}
                        className={`${inputClass} ${errors.owner ? "border-red-300 focus:ring-red-400" : ""}`}
                        placeholder="e.g. John Doe"
                      />
                      {errors.owner && (
                        <p className="text-xs text-red-500 mt-1">
                          {errors.owner}
                        </p>
                      )}
                    </div>
                  </FieldCard>

                  {/* Address */}
                  <FieldCard
                    icon={MapPin}
                    title="Business Address"
                    description="Physical address of your business"
                  >
                    <div>
                      <Input
                        type="text"
                        value={form.address}
                        onChange={(e) => set("address", e.target.value)}
                        className={`${inputClass} ${errors.address ? "border-red-300 focus:ring-red-400" : ""}`}
                        placeholder="e.g. Kathmandu, Nepal"
                      />
                      {errors.address && (
                        <p className="text-xs text-red-500 mt-1">
                          {errors.address}
                        </p>
                      )}
                    </div>
                  </FieldCard>

                  {/* Search Address (accurateLocation) */}
                  <FieldCard
                    icon={MapPin}
                    title="Search Address"
                    description="Search and select a precise location for your business"
                  >
                    <AddressSearch
                      value={form.accurateLocation}
                      onChange={(val) => set("accurateLocation", val)}
                    />
                  </FieldCard>

                  {/* Contact Number */}
                  <FieldCard
                    icon={Phone}
                    title="Contact Number"
                    description="Primary phone number for customer inquiries"
                  >
                    <div>
                      <Input
                        type="text"
                        value={form.phoneNumber}
                        onChange={(e) => set("phoneNumber", e.target.value)}
                        className={`${inputClass} ${errors.phoneNumber ? "border-red-300 focus:ring-red-400" : ""}`}
                        placeholder="e.g. +977-9841234567"
                      />
                      {errors.phoneNumber && (
                        <p className="text-xs text-red-500 mt-1">
                          {errors.phoneNumber}
                        </p>
                      )}
                    </div>
                  </FieldCard>

                  {/* PAN / VAT Number */}
                  <FieldCard
                    icon={Receipt}
                    title="PAN / VAT Number"
                    description="Tax registration number (if applicable)"
                  >
                    <Input
                      type="text"
                      value={form.panNumber}
                      onChange={(e) => set("panNumber", e.target.value)}
                      className={inputClass}
                      placeholder="e.g. 609699393"
                    />
                    <p className="text-xs text-gray-400 mt-1">
                      Used on tax invoices
                    </p>
                  </FieldCard>
                </div>

                {/* ── Action Buttons ────────────────────── */}
                <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex items-center justify-end gap-3">
                  <Button
                    onClick={handleCancel}
                    variant="outline"
                    className="rounded-lg flex items-center gap-2 border-gray-300 text-gray-700 hover:bg-gray-100"
                  >
                    <X className="h-4 w-4" />
                    Cancel
                  </Button>

                  <Button
                    onClick={handleSave}
                    disabled={saving}
                    className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center gap-2"
                  >
                    {saving ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Check className="h-4 w-4" />
                        Save Changes
                      </>
                    )}
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
