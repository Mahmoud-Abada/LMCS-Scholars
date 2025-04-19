"use client";
import Link from "next/link";
import { BookOpen } from "lucide-react";
import Image from "next/image";

export function Footer() {
  return (
    <footer className="border-t bg-[#212529]">
    <div className="max-w-md mx-auto flex flex-col items-center gap-2 py-2 text-center">

        <BookOpen className="h-6 w-6 stroke-[#bbbcbd]" />
        <p className="text-sm text-[#bbbcbd] leading-relaxed">
          © {new Date().getFullYear()} All rights reserved.
          <br />
          <Link
            href="/privacy"
            className="underline underline-offset-4 text-[#bbbcbd] hover:text-white"
          >
            Privacy Policy
          </Link>{" "}
          ·{" "}
          <Link
            href="/terms"
            className="underline underline-offset-4 text-[#bbbcbd] hover:text-white"
          >
            Terms of Service
          </Link>
        </p>
        <Link href="https://esi.dz" target="_blank" rel="noreferrer">
          <Image
            src="/images/esi.jpg"
            alt="esi Logo"
            width={80}
            height={20}
            className="mt-2"
          />
        </Link>
      </div>
    </footer>
  );
}
