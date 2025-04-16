"use client";
import Link from "next/link";
import { BookOpen } from "lucide-react";
import Image from "next/image";

export function Footer() {
  return (
    <footer className="border-t bg-[#212529] pt-0 pb-0">
      <div className="container flex flex-col items-center justify-between gap-4 py-10 md:h-24 md:flex-row md:py-0">
        <div className="flex flex-col items-center gap-4 px-8 md:flex-row md:gap-2 md:px-0">
          <BookOpen className="h-6 w-6 stroke-[#bbbcbd] " />
          <p className="text-center text-sm leading-loose md:text-left text-[#bbbcbd]">
            Copyright <br className="sm:hidden" />
            <Link
              href="/privacy"
              className="font-medium underline underline-offset-4 text-[#bbbcbd]"
            >
              Privacy Policy
            </Link>
            {" · "}
            <Link
              href="/terms"
              className="font-medium underline underline-offset-4 text-[#bbbcbd]"
            >
              Terms of Service
            </Link>
          </p>
        </div>
        <div className="text-[#bbbcbd] pt-0">
          <Link href="https://esi.dz" target="_blank" rel="noreferrer">
            <Image
              src="/images/esi.jpg"
              alt="esi Logo"
              width={100}
              height={20}
            />
          </Link>
        </div>
      </div>
    </footer>
  );
}
