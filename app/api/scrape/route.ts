import { scrapeGoogleScholarPublications } from "@/scripts/pubs";
import { NextResponse } from "next/server";
import 

export async function GET() {
  try {
    const data = await scrapeGoogleScholarPublications("MOULOUD KOUDIL");
    return NextResponse.json({ message: "Publications fetched", data });
  } catch (error) {
    console.error("Scraping error:", error);
    return NextResponse.json(
      { message: "Scraping failed", error },
      { status: 500 }
    );
  }
}
