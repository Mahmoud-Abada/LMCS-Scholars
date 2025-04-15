// src/hooks/use-auth.ts
"use client";

import { useSession } from "next-auth/react";
import { UserRole } from "@/types/auth";

export function useAuth(requiredRole?: UserRole) {
  const { data: session, status } = useSession();

  if (requiredRole && session?.user?.role !== requiredRole) {
    throw new Error(`Unauthorized: ${requiredRole} access required`);
  }

  return {
    user: session?.user,
    status,
    isAdmin: session?.user?.role === "admin",
  };
}