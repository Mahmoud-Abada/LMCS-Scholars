// src/lib/auth.ts
import { auth } from "@/auth";
import { db } from "@/db/client";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { UserRole } from "@/types/auth";

export async function currentUser() {
  const session = await auth();
  return session?.user;
}

export async function currentRole() {
  const user = await currentUser();
  return user?.role as UserRole | undefined;
}

export async function requireAdmin() {
  const role = await currentRole();
  if (role !== "admin") {
    throw new Error("Unauthorized: Admin access required");
  }
}

export async function requireRole(requiredRole: UserRole) {
  const role = await currentRole();
  if (role !== requiredRole) {
    throw new Error(`Unauthorized: ${requiredRole} access required`);
  }
}

export async function getUserById(id: string) {
  return await db.query.users.findFirst({
    where: eq(users.id, id),
  });
}