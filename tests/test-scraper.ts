// test-scraper.ts


import { scrapeGoogleScholar } from '../lib/scrapers/googleScholar';
import { scrapeDBLP } from '../lib/scrapers/dblp';

async function main() {
  console.log("=== Testing Google Scholar Scraper ===");
  const scholarResults = await scrapeGoogleScholar("Mouloud Koudil"); // Replace with a real researcher name
  console.log("First publication:", scholarResults[0]);
  console.log("Total publications:", scholarResults.length);

  console.log("\n=== Testing DBLP Scraper ===");
  const dblpResults = await scrapeDBLP("Mouloud Koudil");
  console.log("First publication:", dblpResults[0]);
  console.log("Total publications:", dblpResults.length);
}

main().catch(console.error);