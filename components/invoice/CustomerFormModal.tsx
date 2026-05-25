"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
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

const inputClass =
  "w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition";

const inputErrorClass =
  "w-full border border-red-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-400 focus:border-transparent transition";

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

  const resetAll = () => {
    setStep(1);
    setPhone("");
    setCountryCode("+977");
    setCheckLoading(false);
    setCheckError("");
    setForm(INITIAL_FORM);
    setCreateLoading(false);
    setCreateError("");
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

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o) {
          resetAll();
          onClose();
        }
      }}
    >
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-blue-600">
            {step === 1 ? "Add Customer" : "Customer Details"}
          </DialogTitle>
          <p id="customer-form-desc" className="sr-only">
            {step === 1
              ? "Enter the customer phone number to check for duplicates."
              : "Fill in the customer details to create a new account."}
          </p>
        </DialogHeader>

        {/* ── Progress bar ── */}
        <div className="flex gap-2 mb-1">
          <div className="h-1 flex-1 rounded-full bg-blue-600" />
          <div
            className={`h-1 flex-1 rounded-full transition-colors duration-300 ${
              step === 2 ? "bg-blue-600" : "bg-gray-200"
            }`}
          />
        </div>
        <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-4">
          Step {step} of 2 —{" "}
          {step === 1 ? "Phone verification" : "Customer details"}
        </p>

        {step === 1 && (
          <div className="space-y-5">
            <div className="flex gap-3">
              <div className="w-28">
                <Label className="text-xs text-gray-500 mb-1.5 block">
                  Country code
                </Label>
                <input
                  type="text"
                  value={countryCode}
                  onChange={(e) => setCountryCode(e.target.value)}
                  placeholder="+977"
                  className={inputClass}
                />
              </div>
              <div className="flex-1">
                <Label className="text-xs text-gray-500 mb-1.5 block">
                  Phone number
                </Label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleCheckPhone()}
                  placeholder="98XXXXXXXX"
                  className={inputClass}
                />
              </div>
            </div>

            {checkError && (
              <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-2.5">
                {checkError}
              </p>
            )}

            <div className="flex justify-end pt-1">
              <Button
                className="bg-blue-600 hover:bg-blue-700 text-white text-sm px-5 py-2.5 rounded-lg"
                onClick={handleCheckPhone}
                disabled={checkLoading}
              >
                {checkLoading ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Checking...
                  </span>
                ) : (
                  "Check & continue →"
                )}
              </Button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-5">
            <div>
              <Label className="text-xs text-gray-500 mb-1.5 block">
                Name <span className="text-red-500">*</span>
              </Label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="John Doe"
                className={
                  createError?.includes("Name") ? inputErrorClass : inputClass
                }
              />
            </div>

            <div>
              <Label className="text-xs text-gray-500 mb-1.5 block">
                Email <span className="text-red-500">*</span>
              </Label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="john@example.com"
                className={
                  createError?.includes("email") ? inputErrorClass : inputClass
                }
              />
            </div>

            {/* Phone — read only, pre-filled from step 1 */}
            <div className="flex gap-3">
              <div className="w-28">
                <Label className="text-xs text-gray-500 mb-1.5 block">
                  Country code
                </Label>
                <input
                  value={form.countryCode}
                  readOnly
                  className="w-full border border-gray-100 bg-gray-50 rounded-lg px-3 py-2 text-sm text-gray-400 cursor-not-allowed"
                />
              </div>
              <div className="flex-1">
                <Label className="text-xs text-gray-500 mb-1.5 block">
                  Phone
                </Label>
                <input
                  value={form.phone}
                  readOnly
                  className="w-full border border-gray-100 bg-gray-50 rounded-lg px-3 py-2 text-sm text-gray-400 cursor-not-allowed"
                />
              </div>
            </div>

            <div>
              <Label className="text-xs text-gray-500 mb-1.5 block">
                Tax ID
              </Label>
              <input
                type="text"
                value={form.customerPan}
                onChange={(e) =>
                  setForm({ ...form, customerPan: e.target.value })
                }
                placeholder="PAN number (optional)"
                className={inputClass}
              />
            </div>

            <div>
              <Label className="text-xs text-gray-500 mb-1.5 block">Note</Label>
              <textarea
                value={form.note}
                onChange={(e) => setForm({ ...form, note: e.target.value })}
                placeholder="Additional info... (optional)"
                rows={3}
                className={`${inputClass} resize-none`}
              />
            </div>

            {createError && (
              <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-2.5">
                {createError}
              </p>
            )}
          </div>
        )}

        <DialogFooter className="gap-2 pt-2">
          {step === 2 && (
            <Button
              variant="outline"
              onClick={() => {
                setStep(1);
                setCreateError("");
              }}
              disabled={createLoading}
              className="rounded-lg"
            >
              ← Back
            </Button>
          )}

          {step === 2 && (
            <Button
              onClick={handleCreate}
              disabled={createLoading}
              className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
            >
              {createLoading ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Creating...
                </span>
              ) : (
                "Create customer"
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
