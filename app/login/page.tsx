"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { SubmitButton } from "@/components/submit-button";
import Image from "next/image";

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState("");

  async function handleLogin(formData: FormData) {
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Login failed');
      }

      // On successful login, redirect to dashboard
      router.push("/dashboard");
      router.refresh(); // Refresh to update auth state
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
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
            alt="LMCS Logo"
            width={120}
            height={120}
            className="mb-4 rounded-lg"
          />
          <h1 className="text-2xl font-bold text-center text-gray-800">
            Portail de Recherche LMCS
          </h1>
          <p className="text-gray-600 mt-1">Connectez-vous à votre compte</p>
        </div>

        {error && (
          <div className="bg-red-50 p-3 rounded-md">
            <p className="text-red-600 text-sm text-center">{error}</p>
          </div>
        )}

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

          <div>
            <label className="block mb-2 text-sm font-medium text-gray-700">
              Mot de passe
            </label>
            <input
              name="password"
              type="password"
              required
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Entrez votre mot de passe"
            />
          </div>
        </div>

        <SubmitButton className="w-full bg-blue-600 text-white p-3 rounded-lg hover:bg-blue-700 transition-colors font-medium">
          Se connecter
        </SubmitButton>

        <p className="text-sm text-center text-gray-600">
          Vous n'avez pas de compte ?{" "}
          <a 
            href="/register" 
            className="text-blue-600 hover:underline font-medium"
          >
            Inscrivez-vous ici
          </a>
        </p>
      </form>
    </div>
  );
}