// src/types/auth.d.ts
export type UserRole = "admin" | "director" | "researcher" | "assistant";

declare module "next-auth" {
  interface User {
    role: UserRole;
    researcherId?: string | null;
  }
  
  interface Session {
    user: User & {
      id: string;
    };
  }
}

declare module "@auth/core/jwt" {
  interface JWT {
    id: string;
    role: UserRole;
    researcherId?: string | null;
  }
}