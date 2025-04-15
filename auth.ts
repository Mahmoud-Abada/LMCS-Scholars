// src/auth.ts
import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials";
import { z } from "zod";
import { db } from "./db/client";
import { users } from "./db/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import type { DefaultSession, User } from "next-auth";

// Type extensions
declare module "next-auth" {
  interface Session extends DefaultSession {
    user: {
      id: string;
      role: string;
      researcherId?: string | null;
    } & DefaultSession["user"];
  }

  interface User {
    role: string;
    researcherId?: string | null;
  }
}

declare module "@auth/core/jwt" {
  interface JWT {
    id: string;
    role: string;
    researcherId?: string | null;
  }
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Credentials({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email", placeholder: "user@esi.dz" },
        password: { label: "Password", type: "password" }
      },
      authorize: async (credentials) => {
        try {
          const parsedCredentials = z
            .object({
              email: z.string().email("Invalid email format"),
              password: z.string().min(8, "Password must be at least 8 characters")
            })
            .safeParse(credentials);

          if (!parsedCredentials.success) {
            console.error("Validation error:", parsedCredentials.error.flatten());
            return null;
          }

          const { email, password } = parsedCredentials.data;

          const user = await db.query.users.findFirst({
            where: eq(users.email, email),
            columns: {
              id: true,
              email: true,
              password: true,
              name: true,
              role: true,
              researcherId: true
            }
          });

          if (!user) {
            console.error("No user found with email:", email);
            return null;
          }

          if (!user.password) {
            console.error("User has no password set");
            return null;
          }

          const isValid = await bcrypt.compare(password, user.password);
          if (!isValid) {
            console.error("Invalid password for user:", email);
            return null;
          }

          return {
            id: user.id,
            email: user.email,
            name: user.name || "",
            role: user.role,
            researcherId: user.researcherId || null
          } satisfies User;

        } catch (error) {
          console.error("Authentication error:", error);
          return null;
        }
      }
    }),
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
      authorization: {
        params: {
          prompt: "consent",
          access_type: "offline",
          response_type: "code"
        }
      },
      profile(profile) {
        return {
          id: profile.sub,
          email: profile.email,
          name: profile.name,
          role: "user",
          researcherId: null
        } satisfies User;
      }
    })
  ],
  callbacks: {
    jwt: ({ token, user }) => {
      if (user && user.id) {
        token.id = user.id;
        token.role = user.role;
        token.researcherId = user.researcherId;
      }
      return token;
    },
    session: ({ session, token }) => {
      if (token && session.user) {
        session.user.id = token.id;
        session.user.role = token.role;
        session.user.researcherId = token.researcherId;
      }
      return session;
    }
  },
  pages: {
    signIn: "/login",
    error: "/auth-error",
    signOut: "/logout"
  },
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  secret: process.env.AUTH_SECRET,
  debug: process.env.NODE_ENV === "development"
});