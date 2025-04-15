// src/actions/auth.ts
"use server";

import { auth } from "@/auth";

export async function checkAdmin() {
  const session = await auth();
  if (session?.user?.role !== "admin") {
    throw new Error("Unauthorized");
  }
  return true;
}