// src/lib/scrapers/googleScholar.ts
/*import { chromium } from 'playwright';
import { rateLimiter } from '../utils/rateLimiter';

interface ScholarPublication {
  title: string;
  authors: string[];
  year: number;
  citations: number;
  venue?: string;
}

export async function scrapeGoogleScholar(researcherName: string, maxResults = 50): Promise<ScholarPublication[]> {
  const limiter = rateLimiter(3000); // 3s delay between requests
  const browser = await chromium.launch({
    headless: true,
    executablePath: '/usr/bin/chromium' // or '/usr/bin/firefox' for Firefox
  });
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) ...'
  });
  const page = await context.newPage();

  try {
    await page.goto(`https://scholar.google.com/scholar?q=${encodeURIComponent(researcherName)}`, {
      waitUntil: 'networkidle',
      timeout: 60000
    });

    // Handle CAPTCHAs (if detected)
    if (await page.$('text="Please show you\'re not a robot"')) {
      throw new Error('CAPTCHA triggered - manual intervention needed');
    }

    const publications: ScholarPublication[] = await page.evaluate(() => {
      return Array.from(document.querySelectorAll('.gs_r.gs_or.gs_scl')).map((item) => ({
        title: item.querySelector('.gs_rt')?.textContent?.replace(/\[PDF\]|\[HTML\]/gi, '').trim() || '',
        authors: Array.from(item.querySelectorAll('.gs_a a')).map(a => a.textContent?.trim()).filter(Boolean) as string[],
        year: parseInt(item.querySelector('.gs_a')?.textContent?.match(/(\d{4})/)?.[0] || '0'),
        citations: parseInt(item.querySelector('.gs_fl a:nth-child(3)')?.textContent?.match(/\d+/)?.pop() || '0'),
        venue: item.querySelector('.gs_a')?.textContent?.split('-').pop()?.trim() || ''
      }));
    });

    await limiter(); // Respect rate limits
    return publications.slice(0, maxResults);
  } finally {
    await browser.close();
  }
}*/
/*
// src/lib/scrapers/googleScholar.ts
import { chromium } from 'playwright';
import { rateLimiter } from '../utils/rateLimiter';
//import { normalizeAuthorName } from '../utils/normalizeData';

interface ScholarPublication {
  title: string;
  authors: string[];
  year: number;
  citations: number;
  venue?: string;
  url: string;
  scholarId?: string;
}

export async function scrapeGoogleScholar(researcherName: string, maxResults = 100): Promise<ScholarPublication[]> {
  //const browser = await chromium.launch({ headless: true });
  const browser = await chromium.launch({
    headless: true,
    executablePath: '/usr/bin/chromium' // or '/usr/bin/firefox' for Firefox
  });
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
    viewport: { width: 1920, height: 1080 }
  });
  const page = await context.newPage();
  const limiter = rateLimiter(3000); // 3s delay

  try {
    // Step 1: Find researcher's profile
    await page.goto(`https://scholar.google.com/scholar?q=${encodeURIComponent(researcherName)}`, {
      waitUntil: 'networkidle',
      timeout: 60000
    });

    // Check for CAPTCHA
    if (await page.$('text="Please show you\'re not a robot"')) {
      throw new Error('CAPTCHA detected - manual intervention required');
    }

    // Step 2: Extract profile link if exists
    const profileLink = await page.$eval('h3.gs_rt a[href^="/citations"]', (el: HTMLAnchorElement) => el.href)
      .catch(() => null);

    if (!profileLink) {
      // Fallback to direct search results
      return await scrapeFromSearchResults(page, researcherName, maxResults);
    }

    // Step 3: Scrape profile page
    await page.goto(`${profileLink}&view_op=list_works&sortby=pubdate`, {
      waitUntil: 'domcontentloaded'
    });

    // Load all publications (click "Show More" until it disappears)
    await autoScroll(page);

    // Step 4: Parse publications
    const publications = await page.$$eval('tr.gsc_a_tr', (rows, targetName) => {
      return rows.map(row => {
        const titleElem = row.querySelector('.gsc_a_at');
        const authorsElem = row.querySelector('.gsc_a_t div.gs_gray');
        const venueElem = row.querySelector('.gsc_a_t div.gs_gray:nth-of-type(2)');
        const citationsElem = row.querySelector('.gsc_a_c a');
        const yearElem = row.querySelector('.gsc_a_y');

        // Normalize author names for matching
        const authorsText = authorsElem?.textContent || '';
        const authors = authorsText.split(',').map(a => a.trim());

        return {
          title: titleElem?.textContent?.trim() || '',
          authors,
          year: parseInt(yearElem?.textContent?.trim() || '0'),
          citations: parseInt(citationsElem?.textContent?.trim() || '0'),
          venue: venueElem?.textContent?.trim(),
          url: `https://scholar.google.com${titleElem?.getAttribute('href') || ''}`,
          scholarId: profileLink.match(/user=([^&]+)/)?.[1]
        };
      });
    }, researcherName);

    await limiter();
    return publications
      .filter(pub => pub.title)
      .slice(0, maxResults);

  } finally {
    await browser.close();
  }
}

async function autoScroll(page: any) {
  let showMoreExists = true;
  let safetyCounter = 0;

  while (showMoreExists && safetyCounter < 10) {
    showMoreExists = await page.evaluate(async () => {
      const button = document.getElementById('gsc_bpf_more');
      if (button) {
        button.click();
        await new Promise(resolve => setTimeout(resolve, 1000));
        return true;
      }
      return false;
    });
    safetyCounter++;
    await page.waitForTimeout(1000);
  }
}

async function scrapeFromSearchResults(page: any, researcherName: string, maxResults: number) {
  const publications: ScholarPublication[] = [];

  const items = await page.$$('div.gs_ri');
  for (const item of items.slice(0, maxResults)) {
    const title = await item.$eval('h3.gs_rt', (el: HTMLElement) => el.textContent?.replace(/\[PDF\]|\[HTML\]/gi, '').trim() || '');
    const authorsText = await item.$eval('.gs_a', (el: HTMLElement) => el.textContent);
    const [authors, venueYear] = authorsText.split('-').map((s: string) => s.trim());
    
    publications.push({
      title,
      authors: authors.split(',').map((a: string) => a.trim()),
      year: parseInt(venueYear.match(/\d{4}/)?.[0] || 0),
      citations: parseInt(await item.$eval('.gs_fl a:nth-child(3)', (el: HTMLElement) => el.textContent?.match(/\d+/)?.[0] || '0')),
      venue: venueYear.replace(/\d{4}/, '').trim(),
      url: await item.$eval('h3.gs_rt a', (el: HTMLAnchorElement) => el.href)
    });
  }

  return publications;
}*/

import { chromium } from "playwright";
import { rateLimiter } from "../utils/rateLimiter";

export interface ScholarPublication {
  title: string;
  authors: string[];
  year: number;
  citations: number;
  venue?: string;
  url: string;
  scholarId?: string;
}

export async function scrapeGoogleScholar(
  researcherName: string,
  maxResults = 100
): Promise<ScholarPublication[]> {
  const browser = await chromium.launch({
    headless: true,
    executablePath: "/usr/bin/chromium",
  });
  const context = await browser.newContext({
    userAgent:
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
    viewport: { width: 1920, height: 1080 },
  });
  const page = await context.newPage();
  const limiter = rateLimiter(3000);

  try {
    // Attempt profile-based scraping first
    const profileResults = await scrapeProfile(
      page,
      researcherName,
      maxResults
    );
    if (profileResults.length > 0) return profileResults;

    // Fallback to search-based scraping
    return await scrapeSearchResults(page, researcherName, maxResults);
  } finally {
    await browser.close();
  }
}

async function scrapeProfile(
  page: any,
  researcherName: string,
  maxResults: number
): Promise<ScholarPublication[]> {
  try {
    await page.goto(
      `https://scholar.google.com/citations?hl=en&view_op=search_authors&mauthors=${encodeURIComponent(
        researcherName
      )}`,
      {
        waitUntil: "networkidle",
        timeout: 15000,
      }
    );

    // Check for CAPTCHA
    if (await page.$('text="Please show you\'re not a robot"')) {
      throw new Error("CAPTCHA detected");
    }

    // Click on the first matching profile
    const profileLink = await page
      .$eval("a.gs_ai_name", (el: { href: any }) => el.href)
      .catch(() => null);
    if (!profileLink) return [];

    await page.goto(`${profileLink}&view_op=list_works&sortby=pubdate`, {
      waitUntil: "domcontentloaded",
      timeout: 15000,
    });

    // Load all publications
    await autoScroll(page);

    // Extract publications
    return await page
      .$$eval(
        "tr.gsc_a_tr",
        (rows: any[], targetName: any) => {
          return rows
            .map(
              (row: { querySelector: (arg0: string) => HTMLAnchorElement }) => {
                const titleElem = row.querySelector(
                  ".gsc_a_at"
                ) as HTMLAnchorElement;
                const authorsElem = row.querySelector(".gsc_a_t div.gs_gray");
                const venueElem = row.querySelector(
                  ".gsc_a_t div.gs_gray:nth-of-type(2)"
                );
                const citationsElem = row.querySelector(".gsc_a_c a");
                const yearElem = row.querySelector(".gsc_a_y");

                return {
                  title: titleElem?.textContent?.trim() || "",
                  authors:
                    authorsElem?.textContent
                      ?.split(",")
                      .map((a: string) => a.trim()) || [],
                  year: parseInt(yearElem?.textContent?.trim() || "0"),
                  citations: parseInt(
                    citationsElem?.textContent?.trim() || "0"
                  ),
                  venue: venueElem?.textContent?.trim(),
                  url: titleElem?.href
                    ? `https://scholar.google.com${titleElem.href}`
                    : "",
                  scholarId: new URLSearchParams(window.location.search).get(
                    "user"
                  ),
                };
              }
            )
            .filter((pub: { title: any }) => pub.title);
        },
        researcherName
      )
      .then((pubs: string | any[]) => pubs.slice(0, maxResults));
  } catch (error) {
    console.log(`Profile scrape failed, falling back to search: ${error}`);
    return [];
  }
}

async function scrapeSearchResults(
  page: any,
  researcherName: string,
  maxResults: number
): Promise<ScholarPublication[]> {
  try {
    await page.goto(
      `https://scholar.google.com/scholar?q=${encodeURIComponent(
        researcherName
      )}`,
      {
        waitUntil: "networkidle",
        timeout: 15000,
      }
    );

    return await page
      .$$eval(
        ".gs_ri",
        (items: any[], targetName: any) => {
          return items
            .map(
              (item: {
                querySelector: (arg0: string) => HTMLAnchorElement;
              }) => {
                const titleElem = item.querySelector(
                  "h3 a"
                ) as HTMLAnchorElement;
                const authorsElem = item.querySelector(".gs_a");
                const citationsElem = item.querySelector(
                  ".gs_fl a:nth-child(3)"
                );

                const authorText = authorsElem?.textContent || "";
                const [authors, venueAndYear] = authorText.split(" - ");
                const yearMatch = venueAndYear?.match(/\d{4}/);

                return {
                  title:
                    titleElem?.textContent
                      ?.replace(/\[PDF\]|\[HTML\]/gi, "")
                      .trim() || "",
                  authors:
                    authors?.split(",").map((a: string) => a.trim()) || [],
                  year: yearMatch ? parseInt(yearMatch[0]) : 0,
                  citations: parseInt(
                    citationsElem?.textContent?.match(/\d+/)?.[0] || "0"
                  ),
                  venue: venueAndYear?.replace(/\d{4}/, "").trim(),
                  url: titleElem?.href || "",
                };
              }
            )
            .filter((pub: { title: any }) => pub.title);
        },
        researcherName
      )
      .then((pubs: string | any[]) => pubs.slice(0, maxResults));
  } catch (error) {
    console.error("Search results scrape failed:", error);
    return [];
  }
}

async function autoScroll(page: any) {
  try {
    for (let i = 0; i < 10; i++) {
      const moreButton = await page.$("#gsc_bpf_more");
      if (!moreButton || (await moreButton.isHidden())) break;

      await moreButton.click();
      await page.waitForTimeout(2000);
    }
  } catch (error) {
    console.log("Auto-scroll complete or failed:", error);
  }
}
