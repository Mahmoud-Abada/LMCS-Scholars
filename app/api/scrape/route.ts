import { ResearchDataScraper } from "@/scripts/scraper";
import { NextResponse } from "next/server";
//import { fetchFromCrossRef, fetchFromSemanticScholar } from '../../../scripts/apis';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const researcherName = searchParams.get("name");
  const scholarId= searchParams.get("scholar_id");
  const scholarUrl =`https://scholar.google.com/citations?user=${scholarId}=en` ;
  

  console.log("Researcher name:", researcherName);
  console.log("Scholar URL:", scholarUrl);

  if (!researcherName) {
    return NextResponse.json(
      { error: "Researcher name parameter is required" },
      { status: 400 }
    );
  }

  const scraper = new ResearchDataScraper();
  try {
    const publications = await scraper.scrapeResearcherPublications(
      researcherName, 
      scholarUrl ?? undefined
    );

    return NextResponse.json(publications);
  } catch (error) {
    console.error("Scraping failed:", error);
    return NextResponse.json(
      {
        error: "Scraping failed",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  } finally {
    await scraper.close();
  }
}
