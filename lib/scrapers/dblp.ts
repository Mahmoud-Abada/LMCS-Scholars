// src/lib/scrapers/dblp.ts/*
/*import axios from "axios";
import * as cheerio from "cheerio";
import { rateLimiter } from "../utils/rateLimiter";

interface DBLPPublication {
  title: string;
  authors: string[];
  year: number;
  venue: string;
  key: string; // DBLP unique ID
}

export async function scrapeDBLP(
  researcherName: string
): Promise<DBLPPublication[]> {
  const limiter = rateLimiter(2000); // 2s delay
  const url = `https://dblp.org/search?q=${encodeURIComponent(researcherName)}`;

  try {
    const { data } = await axios.get(url, {
      headers: { "Accept-Language": "en-US" },
    });
    await limiter();

    const $ = cheerio.load(data);
    const publications: DBLPPublication[] = [];

    $(".result").each((_, el) => {
      const title = $(el).find(".title a").text().trim();
      const authors = $(el)
        .find(".authors a")
        .map((_, a) => $(a).text().trim())
        .get();
      const year = parseInt($(el).find(".year").text().trim()) || 0;
      const venue = $(el).find(".venue").text().trim();
      const key = $(el).find(".title a").attr("href")?.split("/").pop() || "";

      if (title) {
        publications.push({ title, authors, year, venue, key });
      }
    });

    return publications;
  } catch (error) {
    console.error(`DBLP scrape failed: ${error}`);
    return [];
  }
}
*/
// src/lib/scrapers/dblp.ts
import axios from "axios";
import * as cheerio from "cheerio";
import { rateLimiter } from "../utils/rateLimiter";
import { isSimilar } from "../utils/stringMatch";

export interface DBLPPublication {
  title: string;
  authors: string[];
  year: number;
  venue: string;
  type: "conference" | "journal" | "other";
  pages?: string;
  volume?: string;
  url: string;
  dblpId: string;
}

export async function scrapeDBLP(
  researcherName: string,
  maxResults = 50
): Promise<DBLPPublication[]> {
  const limiter = rateLimiter(2000); // 2s delay
  const searchUrl = `https://dblp.org/search?q=${encodeURIComponent(
    researcherName
  )}`;

  try {
    const { data } = await axios.get(searchUrl, {
      headers: {
        "Accept-Language": "en-US",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
      },
    });
    await limiter();

    const $ = cheerio.load(data);
    const publications: DBLPPublication[] = [];

    // Step 1: Find author's profile page
    const authorLink = $(".result .author a")
      .filter((_, el) => {
        return isSimilar($(el).text(), researcherName, 0.8);
      })
      .first()
      .attr("href");

    if (!authorLink) return [];

    // Step 2: Scrape author's publications
    const authorUrl = `https://dblp.org${authorLink.replace("/dblp.org", "")}`;
    const { data: authorData } = await axios.get(authorUrl);
    await limiter();

    const $$ = cheerio.load(authorData);
    $$(".publ-list .entry").each((_, entry) => {
      const title = $$(entry).find(".title").text().trim();
      if (!title) return;

      const authors = $$(entry)
        .find(".author a")
        .map((_, a) => $$(a).text().trim())
        .get();
      const venue = $$(entry).find(".venue").text().trim();
      const year = parseInt($$(entry).find(".year").text().trim()) || 0;
      const type = venue.includes("Conf.")
        ? "conference"
        : venue.includes("J.")
        ? "journal"
        : "other";
      const url = $$(entry).find(".title a").attr("href") || "";
      const dblpId = url.split("/").pop()?.split(".")[0] || "";

      publications.push({
        title,
        authors,
        year,
        venue,
        type,
        url,
        dblpId,
      });
    });

    return publications.slice(0, maxResults);
  } catch (error) {
    console.error(`DBLP scrape failed for ${researcherName}:`, error);
    return [];
  }
}
