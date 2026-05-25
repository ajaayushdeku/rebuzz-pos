"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import checkCustomerExist from "@/services/apiCheckCustomerExist";
import createCustomer from "@/services/apiCreateCustomer";

type Step = 1 | 2;

type CustomerForm = {
  name: string;
  email: string;
  phone: string;
  countryCode: string;
  customerPan: string;
  role: string;
  note: string;
};

const INITIAL_FORM: CustomerForm = {
  name: "",
  email: "",
  phone: "",
  countryCode: "",
  customerPan: "",
  role: "user",
  note: "",
};

const inputClass =
  "w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition";

const readonlyClass =
  "w-full border border-gray-100 bg-gray-50 rounded-lg px-3 py-2.5 text-sm text-gray-400 cursor-not-allowed";

function Label({
  children,
  required,
}: {
  children: React.ReactNode;
  required?: boolean;
}) {
  return (
    <label className="block text-sm font-medium text-gray-700 mb-1.5">
      {children}
      {required && <span className="text-red-500 ml-0.5">*</span>}
    </label>
  );
}

function Alert({
  message,
  type,
}: {
  message: string;
  type: "error" | "success";
}) {
  return (
    <p
      className={`text-sm rounded-lg px-4 py-2.5 border ${
        type === "error"
          ? "text-red-600 bg-red-50 border-red-200"
          : "text-green-700 bg-green-50 border-green-200"
      }`}
    >
      {message}
    </p>
  );
}

export default function AddCustomerPage() {
  const [step, setStep] = useState<Step>(1);

  // Step 1
  const [phone, setPhone] = useState("");
  const [countryCode, setCountryCode] = useState("+977");
  const [countryPrefix] = useState("NP");
  const [checkLoading, setCheckLoading] = useState(false);
  const [checkError, setCheckError] = useState("");

  // Step 2
  const [form, setForm] = useState<CustomerForm>(INITIAL_FORM);
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState("");
  const [createSuccess, setCreateSuccess] = useState(false);

  const handleCheckPhone = async () => {
    if (!phone.trim() || !countryCode.trim()) {
      setCheckError("Please enter both country code and phone number.");
      return;
    }
    setCheckLoading(true);
    setCheckError("");

    const result = await checkCustomerExist({
      phone,
      countryCode: `${countryPrefix} ${countryCode}`,
    });

    if (!result.success) {
      setForm((prev) => ({
        ...prev,
        phone,
        countryCode: `${countryPrefix} ${countryCode}`,
      }));
      setStep(2);
    } else {
      setCheckError(
        result.error || "A customer with this phone number already exists.",
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
      setCreateError(result.error);
    } else {
      setCreateSuccess(true);
      setForm(INITIAL_FORM);
    }

    setCreateLoading(false);
  };

  const goBack = () => {
    setStep(1);
    setCreateError("");
    setCreateSuccess(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 px-6 py-8 md:px-10">
      <div className="max-w-lg mx-auto">
        {/* ── Page header ── */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">
              Add customer
            </h1>
            <p className="text-sm text-gray-500 mt-0.5">
              {step === 1
                ? "First, verify the phone number to avoid duplicates."
                : "Fill in the customer's details below."}
            </p>
          </div>
        </div>

        {/* ── Progress bar ── */}
        <div className="flex gap-2 mb-2">
          <div className="h-1 flex-1 rounded-full bg-blue-600" />
          <div
            className={`h-1 flex-1 rounded-full transition-colors duration-300 ${
              step === 2 ? "bg-blue-600" : "bg-gray-200"
            }`}
          />
        </div>

        {/* ── Step label ── */}
        <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-6">
          Step {step} of 2 —{" "}
          {step === 1 ? "Phone verification" : "Customer details"}
        </p>

        {/* ── Card ── */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm px-6 py-7">
          {/* Step 1 */}
          {step === 1 && (
            <div className="space-y-5">
              <div className="flex gap-3">
                <div className="w-28">
                  <Label>Country code</Label>
                  <input
                    type="text"
                    value={countryCode}
                    onChange={(e) => setCountryCode(e.target.value)}
                    placeholder="+977"
                    className={inputClass}
                  />
                </div>
                <div className="flex-1">
                  <Label>Phone number</Label>
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

              {checkError && <Alert message={checkError} type="error" />}

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

          {/* Step 2 */}
          {step === 2 && (
            <div className="space-y-5">
              <div>
                <Label required>Name</Label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="John Doe"
                  className={inputClass}
                />
              </div>

              <div>
                <Label required>Email</Label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="john@example.com"
                  className={inputClass}
                />
              </div>

              {/* Phone — read only, pre-filled from step 1 */}
              <div className="flex gap-3">
                <div className="w-28">
                  <Label>Country code</Label>
                  <input
                    value={form.countryCode}
                    readOnly
                    className={readonlyClass}
                  />
                </div>
                <div className="flex-1">
                  <Label>Phone</Label>
                  <input
                    value={form.phone}
                    readOnly
                    className={readonlyClass}
                  />
                </div>
              </div>

              <div>
                <Label>Tax ID</Label>
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
                <Label>Note</Label>
                <textarea
                  value={form.note}
                  onChange={(e) => setForm({ ...form, note: e.target.value })}
                  placeholder="Additional info... (optional)"
                  rows={3}
                  className={`${inputClass} resize-none`}
                />
              </div>

              {createError && <Alert message={createError} type="error" />}
              {createSuccess && (
                <Alert
                  message="Customer created successfully!"
                  type="success"
                />
              )}

              <div className="flex justify-between pt-1">
                <Button
                  variant="outline"
                  onClick={goBack}
                  disabled={createLoading}
                  className="text-sm px-4 py-2.5 rounded-lg border-gray-200 text-gray-600 hover:bg-gray-50"
                >
                  ← Back
                </Button>
                <Button
                  className="bg-blue-600 hover:bg-blue-700 text-white text-sm px-5 py-2.5 rounded-lg"
                  onClick={handleCreate}
                  disabled={createLoading || createSuccess}
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
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
