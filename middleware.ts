

import { auth } from "@/auth";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

const protectedRoutes = ["/dashboard"];

export default async function middleware(request: NextRequest) {
  const session = await auth();

  const { pathname } = request.nextUrl;

  const isProtected = protectedRoutes.some((route) =>
    pathname.startsWith(route)
  );
  /*if (pathname.startsWith("/admin") && session?.user.role !== "admin") {
    return NextResponse.redirect(new URL("/unauthorized", request.url));
  }*/

  if (isProtected && !session) {
    return NextResponse.redirect(new URL("/api/auth/signin", request.url));
  }

  return NextResponse.next();
}
