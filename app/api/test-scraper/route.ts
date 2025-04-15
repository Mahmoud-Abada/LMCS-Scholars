// app/api/test-scraper/route.ts
import { scrapeDBLP } from "@/lib/scrapers/dblp";
import { scrapeGoogleScholar } from "@/lib/scrapers/googleScholar";
import { NextResponse } from "next/server";
export async function GET() {
  // Test with a known researcher name
  const scholarData = await scrapeGoogleScholar("Artabaz Saliha");
  const dblpData = await scrapeDBLP("Artabaz Saliha");

  return NextResponse.json({
    googleScholar: scholarData,
    dblp: dblpData,
  });
}
