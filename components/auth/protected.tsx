// src/components/auth/protected.tsx
"use client";

import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";

export default function ProtectedComponent({ children, roles }: {
  children: React.ReactNode;
  roles?: string[];
}) {
  const { data: session, status } = useSession();

  if (status === "loading") return <div>Loading...</div>;
  if (!session) redirect("/login");
  if (roles && !roles.includes(session?.user?.role)) redirect("/unauthorized");

  return <>{children}</>;
}