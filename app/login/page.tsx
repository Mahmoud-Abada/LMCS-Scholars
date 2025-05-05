"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { SubmitButton } from "@/components/submit-button";
import Image from "next/image";
import { Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";

export default function LoginPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isGuestLoading, setIsGuestLoading] = useState(false);

  // Your existing login function remains unchanged
  async function handleLogin(formData: FormData) {
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    setIsLoading(true);
    toast.dismiss();

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ email, password })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Login failed");
      }

      toast.success("Connexion réussie ! Redirection…");
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      router.push("/");
      router.refresh();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "La connexion a échoué";
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleGuestLogin() {
    setIsGuestLoading(true);
    toast.dismiss();

    try {
      // Generate unique guest credentials
      const timestamp = Date.now();
      const guestEmail = `guest_${timestamp}@esi.com`;
      const guestPassword = `guest_${timestamp}`;
      const guestName = `Guest User ${timestamp.toString().slice(-4)}`;

      // Register the guest user
      const registerResponse = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          email: guestEmail,
          password: guestPassword,
          name: guestName,
          role: "guest" // This matches your schema
        })
      });

      if (!registerResponse.ok) {
        throw new Error("Failed to create guest account");
      }

      // Login with the new guest credentials
      const loginResponse = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          email: guestEmail,
          password: guestPassword
        })
      });

      if (!loginResponse.ok) {
        throw new Error("Failed to authenticate guest account");
      }

      toast.success("Session invité démarrée ! Redirection…");
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      router.push("/");
      router.refresh();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Guest login failed";
      toast.error(errorMessage);
    } finally {
      setIsGuestLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#d2e8ff] px-4">
      <form
        className="space-y-6 w-full max-w-md p-8 bg-white shadow-lg rounded-xl border border-gray-200"
        action={handleLogin}
      >
        <div className="flex flex-col items-center">
          <Image
            src="/images/lmcs.jpg"
            alt="Logo LMCS"
            width={120}
            height={120}
            className="mb-4 rounded-lg"
          />
          <h1 className="text-2xl font-bold text-center text-gray-800">
            Portail de Recherche LMCS
          </h1>
          <p className="text-gray-600 mt-1">Connectez-vous à votre compte</p>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block mb-2 text-sm font-medium text-gray-700">
              Email
            </label>
            <input
              name="email"
              type="email"
              required
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Entrez votre email"
            />
          </div>

          <div className="relative">
            <label className="block mb-2 text-sm font-medium text-gray-700">
              Mot de passe
            </label>
            <input
              name="password"
              type={showPassword ? "text" : "password"}
              required
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-10"
              placeholder="Entrez votre mot de passe"
            />
            <button
              type="button"
              className="absolute right-3 top-9 text-gray-500 hover:text-gray-700"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
            </button>
          </div>
        </div>

        <SubmitButton 
          className="w-full bg-blue-600 text-white p-3 rounded-lg hover:bg-blue-700 transition-colors font-medium"
          disabled={isLoading}
        >
          {isLoading ? "Connexion en cours..." : "Se connecter"}
        </SubmitButton>

        <div className="relative flex items-center">
          <div className="flex-grow border-t border-gray-300"></div>
          <span className="flex-shrink mx-4 text-gray-500">ou</span>
          <div className="flex-grow border-t border-gray-300"></div>
        </div>

        <button
          type="button"
          onClick={handleGuestLogin}
          disabled={isGuestLoading}
          className="w-full bg-gray-600 text-white p-3 rounded-lg hover:bg-gray-700 transition-colors font-medium disabled:opacity-50"
        >
          {isGuestLoading ? "Création de session invité..." : "Continuer en tant qu'invité"}
        </button>

        <p className="text-sm text-center text-gray-600">
          Mot de passe oublié ?{" "}
          <a
            href="/forgot-password"
            className="text-blue-600 hover:underline font-medium"
          >
            Réinitialisez-le ici
          </a>
        </p>
      </form>
    </div>
  );
}