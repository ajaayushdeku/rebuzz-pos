"use client";

import { useState, useEffect } from "react";
// import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { Eye, EyeOff, Loader2, Lock, Shield, Check, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const inputClass =
  "w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition";

// ── Password strength evaluator ─────────────────────────────────────────────
function getPasswordStrength(pw: string): {
  label: string;
  color: string;
  width: string;
  score: number;
} {
  let score = 0;
  if (pw.length >= 8) score += 1;
  if (pw.length >= 12) score += 1;
  if (/[a-z]/.test(pw)) score += 1;
  if (/[A-Z]/.test(pw)) score += 1;
  if (/[0-9]/.test(pw)) score += 1;
  if (/[^a-zA-Z0-9]/.test(pw)) score += 1;

  if (score <= 2)
    return { label: "Weak", color: "bg-red-500", width: "w-1/4", score };
  if (score <= 3)
    return { label: "Fair", color: "bg-orange-500", width: "w-2/4", score };
  if (score <= 4)
    return { label: "Good", color: "bg-yellow-500", width: "w-3/4", score };
  return {
    label: "Strong",
    color: "bg-green-500",
    width: "w-full",
    score,
  };
}

// ── Requirements check ──────────────────────────────────────────────────────
const requirements = [
  { label: "At least 8 characters", test: (pw: string) => pw.length >= 8 },
  {
    label: "Contains uppercase letter",
    test: (pw: string) => /[A-Z]/.test(pw),
  },
  {
    label: "Contains lowercase letter",
    test: (pw: string) => /[a-z]/.test(pw),
  },
  { label: "Contains a number", test: (pw: string) => /[0-9]/.test(pw) },
  {
    label: "Contains a special character",
    test: (pw: string) => /[^a-zA-Z0-9]/.test(pw),
  },
];

export default function ChangePasswordPage() {
  // const router = useRouter();

  const [userId, setUserId] = useState<string | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);

  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const [showOld, setShowOld] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  // ── Derived ───────────────────────────────────────────────────────────────
  const strength = getPasswordStrength(newPassword);
  const passwordsMatch = newPassword === confirmPassword;
  const allFilled = oldPassword && newPassword && confirmPassword;
  const canSubmit =
    allFilled && passwordsMatch && strength.score >= 3 && !loading && !!userId;

  // ── Fetch user ID on mount ────────────────────────────────────────────────
  useEffect(() => {
    const loadUserId = async () => {
      try {
        const res = await fetch("/api/profile");
        const data = await res.json();
        const id = data?.data?.user?._id;
        if (id) setUserId(id);
      } catch {
        console.error("Failed to fetch user profile");
      } finally {
        setProfileLoading(false);
      }
    };
    loadUserId();
  }, []);

  // ── Submit ────────────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    if (!canSubmit || !userId) return;

    setLoading(true);
    try {
      const res = await fetch("/api/auth/change-password", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          old_password: oldPassword,
          password: newPassword,
          confirm_password: confirmPassword,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to change password");
      }

      toast.success("Password changed successfully!");

      // Clear form
      setOldPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-50 px-6 py-8 md:px-10">
      <div className="max-w-7xl mx-auto">
        {/* ── Header ─────────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="font-bold text-xl md:text-2xl truncate">
              Change Password
            </h1>
            <p className="text-sm text-gray-500 mt-0.5">
              Update your account password
            </p>
          </div>
        </div>

        {/* ── Password Card ──────────────────────────────── */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden max-w-lg">
          {/* Lock icon header */}
          <div className="px-6 pt-6 pb-2 flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
              <Lock className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-gray-900">
                Account Security
              </h2>
              <p className="text-xs text-gray-400">
                Choose a strong password you haven&lspos;t used before
              </p>
            </div>
          </div>

          <div className="p-6 space-y-5">
            {/* ── Old Password ──────────────────────────── */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5 tracking-wide">
                Current Password
              </label>
              <div className="relative">
                <Input
                  type={showOld ? "text" : "password"}
                  value={oldPassword}
                  onChange={(e) => setOldPassword(e.target.value)}
                  className={`${inputClass} pr-10`}
                  placeholder="Enter your current password"
                />
                <button
                  type="button"
                  onClick={() => setShowOld(!showOld)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer"
                >
                  {showOld ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* ── New Password ──────────────────────────── */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5 tracking-wide">
                New Password
              </label>
              <div className="relative">
                <Input
                  type={showNew ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className={`${inputClass} pr-10`}
                  placeholder="Enter your new password"
                />
                <button
                  type="button"
                  onClick={() => setShowNew(!showNew)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer"
                >
                  {showNew ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>

              {/* Strength bar */}
              {newPassword && (
                <div className="mt-3 space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-1.5 rounded-full bg-gray-200 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-300 ${strength.color} ${strength.width}`}
                      />
                    </div>
                    <span className="text-xs font-medium text-gray-500 min-w-[40px] text-right">
                      {strength.label}
                    </span>
                  </div>

                  {/* Requirements checklist */}
                  <div className="grid grid-cols-1 gap-1">
                    {requirements.map((req) => {
                      const passed = req.test(newPassword);
                      return (
                        <div
                          key={req.label}
                          className="flex items-center gap-2 text-xs"
                        >
                          {passed ? (
                            <Check className="h-3 w-3 text-green-500 shrink-0" />
                          ) : (
                            <X className="h-3 w-3 text-gray-300 shrink-0" />
                          )}
                          <span
                            className={
                              passed ? "text-green-600" : "text-gray-400"
                            }
                          >
                            {req.label}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* ── Confirm Password ──────────────────────── */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5 tracking-wide">
                Confirm New Password
              </label>
              <div className="relative">
                <Input
                  type={showConfirm ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className={`${inputClass} pr-10 ${
                    confirmPassword && !passwordsMatch
                      ? "border-red-300 focus:ring-red-400"
                      : ""
                  }`}
                  placeholder="Re-enter your new password"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer"
                >
                  {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {confirmPassword && !passwordsMatch && (
                <p className="text-xs text-red-500 mt-1">
                  Passwords do not match
                </p>
              )}
              {confirmPassword && passwordsMatch && (
                <p className="text-xs text-green-500 mt-1 flex items-center gap-1">
                  <Check className="h-3 w-3" />
                  Passwords match
                </p>
              )}
            </div>
          </div>

          {/* ── Submit ──────────────────────────────────── */}
          <div className="px-6 py-4 border-t border-gray-100 bg-gray-50">
            <Button
              onClick={handleSubmit}
              disabled={!canSubmit}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg py-2.5 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Changing password...
                </>
              ) : (
                <>
                  <Shield className="h-4 w-4" />
                  Update Password
                </>
              )}
            </Button>
          </div>
        </div>

        {/* ── Security tip ──────────────────────────────── */}
        <div className="mt-6 p-4 rounded-xl bg-blue-50 border border-blue-100 flex items-start gap-3">
          <Shield className="h-4 w-4 text-blue-600 mt-0.5 shrink-0" />
          <p className="text-xs text-blue-700 leading-relaxed">
            Use a unique password that you don&lsquo;t use on other websites. A
            strong password includes a mix of uppercase and lowercase letters,
            numbers, and special characters.
          </p>
        </div>
      </div>
    </div>
  );
}
