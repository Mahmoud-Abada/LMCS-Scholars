"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { SubmitButton } from "@/components/submit-button";
import Image from "next/image";

export default function RegisterPage() {
  const router = useRouter();
  const [error, setError] = useState("");

  async function handleRegister(formData: FormData) {
    const payload = {
      name: formData.get("name") as string,
      email: formData.get("email") as string,
      password: formData.get("password") as string,
    };

    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const text = await res.text();
      const data = text ? JSON.parse(text) : {};

      if (res.ok) {
        router.push("/login");
      } else {
        setError(data.message || "Registration failed");
      }
    } catch (err) {
      setError("Something went wrong. Please try again.");
      console.error("Registration error:", err);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#d2e8ff] px-4 py-8 overflow-y-auto">
      <form
        className="space-y-4 w-full max-w-md p-6 bg-white shadow-lg rounded-xl border border-gray-200"
        action={handleRegister}
      >
        <div className="flex flex-col items-center">
          <Image
            src="/images/lmcs.jpg"
            alt="LMCS Logo"
            width={100}
            height={100}
            className="mb-3 rounded-lg"
          />
          <h1 className="text-xl font-bold text-center text-gray-800">
            Créer un Compte
          </h1>
          <p className="text-gray-600 text-sm mt-1">Rejoignez le Portail de Recherche LMCS</p>
        </div>

        {error && (
          <div className="bg-red-50 p-2 rounded-md">
            <p className="text-red-600 text-xs text-center">{error}</p>
          </div>
        )}

        <div className="space-y-3">
          <div>
            <label className="block mb-1 text-sm font-medium text-gray-700">
              Nom Complet
            </label>
            <input
              name="name"
              type="text"
              required
              className="w-full p-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Entrez votre nom complet"
            />
          </div>

          <div>
            <label className="block mb-1 text-sm font-medium text-gray-700">
              Email
            </label>
            <input
              name="email"
              type="email"
              required
              className="w-full p-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Entrez votre email"
            />
          </div>

          <div>
            <label className="block mb-1 text-sm font-medium text-gray-700">
              Mot de Passe
            </label>
            <input
              name="password"
              type="password"
              required
              className="w-full p-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Créez un mot de passe"
            />
          </div>
        </div>

        <SubmitButton className="w-full bg-blue-600 text-white p-2 text-sm rounded-lg hover:bg-blue-700 transition-colors font-medium">
          S'inscrire
        </SubmitButton>

        <p className="text-xs text-center text-gray-600">
          Vous avez déjà un compte ?{" "}
          <a 
            href="/login" 
            className="text-blue-600 hover:underline font-medium"
          >
            Connectez-vous
          </a>
        </p>
      </form>
    </div>
  );
}