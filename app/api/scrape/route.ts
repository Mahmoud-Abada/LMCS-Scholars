import { NextResponse } from "next/server";
import { scrapePublications } from "../../../scripts/scraper";

export  async function GET() {
  try {
    const data = await scrapePublications("MOULOUD KOUDIL");
    return NextResponse.json({ message: "Publications fetched", data });
  } catch (error) {
    console.error("Scraping error:", error);
    return NextResponse.json(
      { message: "Scraping failed", error },
      { status: 500 }
    );
  }
}
