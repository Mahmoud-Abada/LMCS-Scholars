"use client";

import { useState } from "react";
import { SubmitButton } from "@/components/submit-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Eye, EyeOff } from "lucide-react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    toast.dismiss(); // Clear previous toasts

    if (newPassword.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          newPassword,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to reset password");
      }

      toast.success("Password reset successfully!");
      setEmail("");
      setNewPassword("");
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };


  return (
    <div className="min-h-screen flex items-center justify-center bg-[#d2e8ff] px-4">
      <form
        onSubmit={handleSubmit}
        className="space-y-6 w-full max-w-md p-8 bg-white shadow-lg rounded-xl border border-gray-200"
      >
        <h1 className="text-2xl font-bold text-center text-gray-800">
          Reset Password
        </h1>
        <p className="text-gray-600 text-center mb-4">
          Enter your email and new password
        </p>

        <div className="space-y-4">
          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="Enter your email"
            />
          </div>

          <div className="relative">
            <Label htmlFor="newPassword">New Password</Label>
            <Input
              id="newPassword"
              type={showPassword ? "text" : "password"}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              placeholder="Enter your new password (min 8 characters)"
              className="pr-10"
            />
            <button
              type="button"
              className="absolute right-3 top-8 text-gray-500 hover:text-gray-700"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? (
                <EyeOff className="h-5 w-5" />
              ) : (
                <Eye className="h-5 w-5" />
              )}
            </button>
          </div>
        </div>

        <SubmitButton className="w-full bg-blue-600 text-white p-3 rounded-lg hover:bg-blue-700 transition-colors font-medium" disabled={loading}>
          {loading ? "Resetting..." : "Reset Password"}
        </SubmitButton>

        <p className="text-sm text-center text-gray-600">
          <a href="/login" className="text-blue-600 hover:underline font-medium">
            Back to login
          </a>
        </p>
      </form>
    </div>
  );
}