"use client";

import { Fragment, useRef, useState } from "react";
import {
  Loader2,
  ImageIcon,
  X,
  UserPlus,
  ArrowLeft,
  ArrowRight,
  Phone,
  User,
  Lock,
  Check,
  AlertCircle,
} from "lucide-react";
import ModalShell, {
  SectionLabel,
  modalInput,
  modalInputIdle,
  modalInputError,
  modalGhostButton,
  modalPrimaryButton,
} from "@/components/ui/ModalShell";
import checkCustomerExist from "@/services/apiCheckCustomerExist";
import createCustomer from "@/services/apiCreateCustomer";
import { useQueryClient } from "@tanstack/react-query";
import { Customer } from "@/lib/types/customer";
import toast from "react-hot-toast";

type CustomerFormData = {
  name: string;
  email: string;
  phone: string;
  countryCode: string;
  customerPan: string;
  note: string;
};

type CreateResult =
  | { success: true; data: unknown }
  | { success: false; error: string };

const INITIAL_FORM: CustomerFormData = {
  name: "",
  email: "",
  phone: "",
  countryCode: "+977",
  customerPan: "",
  note: "",
};

/** The two-step wizard, driving both the stepper and the header copy. */
const STEPS = [
  { id: 1, label: "Phone", icon: Phone },
  { id: 2, label: "Details", icon: User },
] as const;

/** Shared red callout for a step's error. */
function FormError({ message }: { message: string }) {
  return (
    <p className="flex items-start gap-2 rounded-xl border border-red-100 bg-red-50 px-3.5 py-2.5 text-[12px] font-medium text-red-600">
      <AlertCircle size={14} className="mt-px shrink-0" />
      {message}
    </p>
  );
}

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

interface CustomerFormModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: (customer: Customer) => void;
}

export default function CustomerFormModal({
  open,
  onClose,
  onSuccess,
}: CustomerFormModalProps) {
  const queryClient = useQueryClient();

  // Step 1 — phone check
  const [step, setStep] = useState<1 | 2>(1);
  const [phone, setPhone] = useState("");
  const [countryCode, setCountryCode] = useState("+977");
  const [checkLoading, setCheckLoading] = useState(false);
  const [checkError, setCheckError] = useState("");

  // Step 2 — form
  const [form, setForm] = useState<CustomerFormData>(INITIAL_FORM);
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState("");

  // Profile photo
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const clearImage = () => {
    setImageFile(null);
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setCreateError("Please select an image file.");
      return;
    }
    if (file.size > MAX_IMAGE_BYTES) {
      setCreateError("Image must be under 5MB.");
      return;
    }
    setCreateError("");
    setImageFile(file);
    const reader = new FileReader();
    reader.onloadend = () => setImagePreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const resetAll = () => {
    setStep(1);
    setPhone("");
    setCountryCode("+977");
    setCheckLoading(false);
    setCheckError("");
    setForm(INITIAL_FORM);
    setCreateLoading(false);
    setCreateError("");
    clearImage();
  };

  const handleCheckPhone = async () => {
    if (!phone.trim() || !countryCode.trim()) {
      setCheckError("Please enter both country code and phone number.");
      return;
    }
    setCheckLoading(true);
    setCheckError("");

    const result = await checkCustomerExist({
      phone,
      countryCode: `NP ${countryCode}`,
    });

    if (!result.success) {
      setForm((prev) => ({
        ...prev,
        phone,
        countryCode: `NP ${countryCode}`,
      }));
      setStep(2);
    } else {
      setCheckError(
        (result as unknown as { success: false; error: string }).error ||
          "A customer with this phone number already exists.",
      );
    }

    setCheckLoading(false);
  };

  const handleCreate = async () => {
    if (!form.name.trim() || !form.email.trim()) {
      setCreateError("Name and email are required.");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      setCreateError("Please enter a valid email address.");
      return;
    }
    setCreateLoading(true);
    setCreateError("");

    const result = await createCustomer({
      name: form.name,
      email: form.email,
      phone: form.phone,
      countryCode: form.countryCode,
      ...(form.customerPan && { customerPan: form.customerPan }),
      role: "user",
      ...(form.note && { note: form.note }),
      image: imageFile,
    });

    if (!result.success) {
      setCreateError(
        (result as Extract<CreateResult, { success: false }>).error,
      );
      setCreateLoading(false);
      return;
    }

    // Invalidate customer list
    queryClient.invalidateQueries({ queryKey: ["customers-list"] });

    // Build a Customer object from the API response
    const createdData = (result.data as Record<string, unknown>)?.data as
      | Record<string, unknown>
      | undefined;
    const createdCustomer: Customer = {
      id: (createdData?._id as string) ?? "",
      name: (createdData?.name as string) ?? form.name,
      email: ((createdData?.email as string | null) ?? form.email) || null,
      phone: (createdData?.phone as string) ?? form.phone,
      loyaltyPoint: 0,
      loyaltyStatus: "Bronze",
    };

    toast.success(`Customer "${createdCustomer.name}" created`);
    onSuccess?.(createdCustomer);
    resetAll();
    onClose();
    setCreateLoading(false);
  };

  const handleClose = () => {
    resetAll();
    onClose();
  };

  return (
    <ModalShell
      open={open}
      onClose={handleClose}
      busy={createLoading}
      title={step === 1 ? "Add customer" : "Customer details"}
      subtitle={
        step === 1
          ? "Check the phone number before creating an account"
          : "Fill in the details for this new customer"
      }
      icon={UserPlus}
      iconColor="text-blue-600"
      iconBgColor="bg-blue-50"
      maxWidth="max-w-xl"
      footer={
        /* Both steps put their primary action here — step 1's button used to
           sit inline in the body, so the two halves of the wizard didn't agree
           on where the action lived. */
        step === 1 ? (
          <button
            type="button"
            onClick={handleCheckPhone}
            disabled={checkLoading}
            className={`${modalPrimaryButton} bg-blue-600 hover:bg-blue-700`}
          >
            {checkLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Checking...
              </>
            ) : (
              <>
                Check &amp; continue
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </button>
        ) : (
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => {
                setStep(1);
                setCreateError("");
              }}
              disabled={createLoading}
              className={modalGhostButton}
            >
              <span className="flex items-center gap-1.5">
                <ArrowLeft className="h-3.5 w-3.5" />
                Back
              </span>
            </button>
            <button
              type="button"
              onClick={handleCreate}
              disabled={createLoading}
              className={`${modalPrimaryButton} bg-blue-600 hover:bg-blue-700`}
            >
              {createLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <UserPlus className="h-4 w-4" />
                  Create customer
                </>
              )}
            </button>
          </div>
        )
      }
    >
      {/* ── Stepper ──
          Numbered nodes with a connector, replacing two flat progress bars and
          a line of text. A completed step shows a tick, so the state reads at a
          glance rather than being inferred from a filled bar. */}
      <div className="mb-6 flex items-center">
        {STEPS.map((s, i) => {
          const done = step > s.id;
          const active = step === s.id;
          const Icon = s.icon;

          return (
            <Fragment key={s.id}>
              <div className="flex shrink-0 items-center gap-2.5">
                <span
                  className={`flex h-9 w-9 items-center justify-center rounded-full transition ${
                    done
                      ? "bg-blue-600 text-white"
                      : active
                        ? "bg-blue-50 text-blue-600 ring-2 ring-blue-600"
                        : "bg-gray-100 text-gray-400"
                  }`}
                >
                  {done ? <Check size={16} /> : <Icon size={15} />}
                </span>
                <div className="leading-tight">
                  <p
                    className={`text-[13px] font-semibold ${
                      done || active ? "text-gray-900" : "text-gray-400"
                    }`}
                  >
                    {s.label}
                  </p>
                  <p className="text-[11px] text-gray-400">Step {s.id} of 2</p>
                </div>
              </div>

              {i < STEPS.length - 1 && (
                <div
                  className={`mx-3 h-0.5 flex-1 rounded-full transition-colors duration-300 ${
                    step > s.id ? "bg-blue-600" : "bg-gray-200"
                  }`}
                />
              )}
            </Fragment>
          );
        })}
      </div>

      {step === 1 && (
        <div className="space-y-6">
          <div>
            <SectionLabel>Phone number</SectionLabel>
            {/* Country code and number share one bordered group so they read as
                a single field, rather than two boxes that happen to sit side
                by side. */}
            <div
              className={`mt-2 flex items-center rounded-xl border bg-white transition focus-within:ring-2 ${
                checkError
                  ? "border-red-300 focus-within:border-red-400 focus-within:ring-red-500/20"
                  : "border-gray-200 focus-within:border-blue-500 focus-within:ring-blue-500/20"
              }`}
            >
              <span className="pl-3.5 text-gray-400">
                <Phone size={15} />
              </span>
              <input
                type="text"
                value={countryCode}
                onChange={(e) => setCountryCode(e.target.value)}
                placeholder="+977"
                aria-label="Country code"
                className="h-11 w-16 bg-transparent px-2 text-center text-[13px] tabular-nums outline-none"
              />
              <span className="h-6 w-px shrink-0 bg-gray-200" />
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleCheckPhone()}
                placeholder="98XXXXXXXX"
                aria-label="Phone number"
                className="h-11 flex-1 bg-transparent px-3 text-[13px] tabular-nums outline-none"
              />
            </div>
            <p className="mt-1.5 text-[11px] text-gray-400">
              We&apos;ll check whether this number already belongs to a
              customer.
            </p>
          </div>

          {checkError && <FormError message={checkError} />}
        </div>
      )}

      {step === 2 && (
        <div className="space-y-6">
          {/* Profile photo */}
          <div>
            <SectionLabel>Profile photo</SectionLabel>
            <div className="mt-2 flex items-center gap-4 rounded-xl border border-gray-200 p-3">
              {imagePreview ? (
                <div className="relative shrink-0">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={imagePreview}
                    alt="Profile preview"
                    className="h-16 w-16 rounded-full border border-gray-200 object-cover"
                  />
                  <button
                    type="button"
                    onClick={clearImage}
                    aria-label="Remove photo"
                    className="absolute -right-1.5 -top-1.5 rounded-full bg-red-500 p-0.5 text-white shadow-sm transition hover:bg-red-600"
                  >
                    <X size={12} />
                  </button>
                </div>
              ) : (
                <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full border border-dashed border-gray-300 bg-gray-50">
                  <ImageIcon size={18} className="text-gray-400" />
                </div>
              )}

              <div className="min-w-0 flex-1">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-[12px] font-semibold text-gray-700 transition hover:border-blue-400 hover:text-blue-600"
                >
                  <ImageIcon size={13} />
                  {imageFile ? "Change photo" : "Upload photo"}
                </button>
                <p className="mt-1.5 text-[11px] text-gray-400">
                  PNG or JPG, up to 5 MB.
                </p>
              </div>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageSelect}
              className="hidden"
            />
          </div>

          {/* Name + email */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <SectionLabel>
                Name <span className="text-red-500">*</span>
              </SectionLabel>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="John Doe"
                className={`mt-2 ${modalInput} ${
                  createError?.includes("Name")
                    ? modalInputError
                    : modalInputIdle
                }`}
              />
            </div>

            <div>
              <SectionLabel>
                Email <span className="text-red-500">*</span>
              </SectionLabel>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="john@example.com"
                className={`mt-2 ${modalInput} ${
                  createError?.includes("email")
                    ? modalInputError
                    : modalInputIdle
                }`}
              />
            </div>
          </div>

          {/* Phone — settled in step 1, so shown as a locked summary rather
              than two greyed-out inputs pretending to be editable. */}
          <div>
            <SectionLabel>Phone</SectionLabel>
            <div className="mt-2 flex h-11 items-center gap-2 rounded-xl border border-gray-200 bg-gray-50 px-3.5">
              <Lock size={13} className="shrink-0 text-gray-400" />
              <span className="text-[13px] text-gray-600 tabular-nums">
                {form.countryCode} {form.phone}
              </span>
              <span className="ml-auto inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-600">
                <Check size={10} />
                Checked
              </span>
            </div>
          </div>

          <div>
            <SectionLabel>Tax ID</SectionLabel>
            <input
              type="text"
              value={form.customerPan}
              onChange={(e) =>
                setForm({ ...form, customerPan: e.target.value })
              }
              placeholder="PAN number (optional)"
              className={`mt-2 ${modalInput} ${modalInputIdle}`}
            />
          </div>

          <div>
            <SectionLabel>Note</SectionLabel>
            <textarea
              value={form.note}
              onChange={(e) => setForm({ ...form, note: e.target.value })}
              placeholder="Additional info... (optional)"
              rows={3}
              className="mt-2 w-full resize-none rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-[13px] outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
            />
          </div>

          {createError && <FormError message={createError} />}
        </div>
      )}
    </ModalShell>
  );
}
