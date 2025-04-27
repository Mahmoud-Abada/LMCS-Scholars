import axios from "axios";
import * as cheerio from "cheerio";
import Fuse from "fuse.js";
import { Browser, chromium, type Page } from "playwright";
import { publicationTypeEnum, venueTypeEnum } from "../db/schema";

type ScrapedPublication = {
  citationGraphData: { year: string; count: number }[];
  referenceCount: number;
  citationGraphUrl: string;
  title: string;
  abstract?: string;
  publicationType: (typeof publicationTypeEnum.enumValues)[number];
  publicationDate?: Date;
  doi?: string;
  arxivId?: string;
  isbn?: string;
  issn?: string;
  url?: string;
  pdfUrl?: string;
  citationCount?: number;
  pageCount?: number;
  volume?: string;
  issue?: string;
  publisher?: string;
  keywords: string[];
  language: string;
  relatedArticlesLink?: string;
  allVersionsLink?: string;
  venue: {
    name: string;
    type: (typeof venueTypeEnum.enumValues)[number];
    publisher?: string;
    issn?: string;
    eissn?: string;
    website?: string;
    impactFactor?: number;
    sjrIndicator?: number;
    isOpenAccess?: boolean;
    location?: string;
  };
  authors: {
    scholarId: unknown;
    name: string;
    isCorresponding?: boolean;
    position: number;
    affiliationDuringWork?: string;
  }[];
};

export class ResearchDataScraper {
  private browser: Browser | null = null;
  private page: Page | null = null;
  private isInitialized = false;

  constructor() {
    this.init().catch((err) => {
      console.error("Failed to initialize scraper:", err);
    });
  }

  private async init(): Promise<void> {
    try {
      this.browser = await chromium.launch({
        headless: false,
        timeout: 30000,
      });
      this.isInitialized = true;
    } catch (error) {
      console.warn(
        "Standard browser launch failed, trying with alternate options..."
      );
      console.error("Error launching browser:", error);
      try {
        this.browser = await chromium.launch({
          headless: false,
          executablePath: "/usr/bin/chromium",
          timeout: 30000,
        });
        this.isInitialized = true;
      } catch (fallbackError) {
        console.error("Both browser launch attempts failed:", fallbackError);
        throw new Error(
          "Failed to launch browser. Please ensure Playwright is properly installed.\n" +
            "Run: npx playwright install\n" +
            "Or install chromium manually: sudo apt-get install chromium"
        );
      }
    }
  }

  public async ensureReady(): Promise<void> {
    if (!this.isInitialized) {
      await this.init();
    }
    if (!this.browser) {
      throw new Error("Browser not initialized");
    }
  }

  public async close(): Promise<void> {
    try {
      if (this.page) await this.page.close();
      if (this.browser) await this.browser.close();
      this.isInitialized = false;
    } catch (error) {
      console.error("Error closing browser:", error);
    }
  }

  public async scrapeResearcherPublications(
    researcherName: string
  ): Promise<ScrapedPublication[]> {
    await this.ensureReady();
    if (!this.browser) throw new Error("Browser not available");

    try {
      this.page = await this.browser.newPage();
      const results: ScrapedPublication[] = [];

      // Try Google Scholar first
      const googleScholarResults = await this.scrapeGoogleScholar(
        researcherName
      );
      results.push(...googleScholarResults);

      // Fallback to DBLP if needed
      /* if (results.length < 5) {
        const dblpResults = await this.scrapeDBLP(researcherName);
        results.push(...dblpResults.filter(pub => 
          !results.some(existing => this.isSimilar(existing.title, pub.title))
        ));
      }*/

      return results;
    } finally {
      if (this.page) await this.page.close();
    }
  }

  private async scrapeGoogleScholar(
    researcherName: string
  ): Promise<ScrapedPublication[]> {
    const publications: ScrapedPublication[] = [];
    if (!this.page) {
      throw new Error("Puppeteer page is not initialized");
    }

    try {
      // Configure request interception to block unnecessary resources
      await this.page.route("**/*", async (route, request) => {
        const resourceType = request.resourceType();
        if (["image", "stylesheet", "font", "media"].includes(resourceType)) {
          await route.abort();
        } else {
          await route.continue();
        }
      });

      // Navigate to search page
      const searchUrl = `https://scholar.google.com/scholar?q=${encodeURIComponent(
        researcherName
      )}`;
      await this.page.goto(searchUrl, {
        waitUntil: "domcontentloaded",
        timeout: 30000,
      });
      
      // Check if we got blocked
      const isBlocked = await this.page.evaluate(() => {
        return (
          document.body.innerText.includes(
            "Sorry, we can't verify that you're not a robot"
          ) ||
          document.body.innerText.includes(
            "Our systems have detected unusual traffic"
          )
        );
      });
      if (isBlocked) throw new Error("Google Scholar has blocked the scraper");
      
      const htmlContent = await this.page.content();
      const $ = cheerio.load(htmlContent);
      const profileLink = $("h4.gs_rt2 a").attr("href");
    

      if (profileLink) {
        const profileUrl = `https://scholar.google.com/${profileLink}`;
        await this.page.goto(profileUrl, {
          waitUntil: "domcontentloaded",
          timeout: 30000,
        });

        // Load all publications
        const hasMore = true;
        while (hasMore) {
          const loadMoreButton = await this.page.$("#gsc_bpf_more");
          if (!loadMoreButton) break;

          const isDisabled = await this.page.evaluate(
            (button) => (button as HTMLButtonElement).disabled,
            loadMoreButton
          );
          if (isDisabled) break;

          await loadMoreButton.click();
          await this.page.waitForResponse(
            (response) =>
              response.url().includes("citations") && response.status() === 200
          );
          await this.page.waitForTimeout(1000);
        }

        // Process publications
        const htmlScholar = await this.page.content();
        const $$ = cheerio.load(htmlScholar);
        const publicationElements = $$(".gsc_a_tr").toArray();

        for (const element of publicationElements) {
          try {
            const titleElement = $$(element).find(".gsc_a_at");
            const title = titleElement.text().trim();
            const authors = $$(element).find(".gs_gray").first().text().trim();
            const venue = $$(element).find(".gs_gray").last().text().trim();
            const citedByText = $$(element).find(".gsc_a_c a").text().trim();
            const citedBy = citedByText
              ? parseInt(citedByText.replace(/,/g, "")) || 0
              : 0;
            const yearText = $$(element).find(".gsc_a_y").text().trim();
            const year = yearText ? parseInt(yearText) || 0 : 0;
            const relativeLink = titleElement.attr("href");
            const link = relativeLink
              ? `https://scholar.google.com${relativeLink}`
              : undefined;
            const pdfLink = $$(element).find(".gsc_a_ac a").attr("href");

            // Extract cluster ID for related articles and versions
            const clusterId = $$(element).find(".gsc_a_c a").attr("data-cid");
            const relatedArticlesLink = clusterId
              ? `https://scholar.google.com/scholar?q=related:${clusterId}:scholar.google.com/`
              : undefined;
            const allVersionsLink = clusterId
              ? `https://scholar.google.com/scholar?cluster=${clusterId}`
              : undefined;

            // Extract citation graph URL
            const citationGraphUrl = clusterId
              ? `https://scholar.google.com/scholar?cites=${clusterId}`
              : undefined;

            // Extract DOI if available
            let doi = "";
            const doiMatch = venue.match(/DOI:\s*([^\s]+)/i);
            if (doiMatch) doi = doiMatch[1];

            const publication: ScrapedPublication = {
              title,
              abstract: "",
              publicationType: this.determinePublicationType(title, venue),
              publicationDate: year ? new Date(year, 0, 1) : undefined,
              doi: doi || undefined,
              url: link,
              pdfUrl: pdfLink || undefined,
              citationCount: citedBy,
              pageCount: undefined,
              volume: undefined,
              publisher: undefined,
              keywords: [],
              language: "English",
              venue: {
                name: venue.split(",")[0]?.trim() || "Unknown",
                type: this.determineVenueType(venue),
                isOpenAccess: venue.toLowerCase().includes("open access"),
              },
              authors: authors.split(",").map((name, index) => ({
                scholarId: null,
                name: name.trim(),
                position: index + 1,
              })),
              referenceCount: 0,
              citationGraphUrl: citationGraphUrl || "",
              relatedArticlesLink,
              allVersionsLink,
              citationGraphData: [],
            };
            console.log(`Scraped publication: ${publication.title}`);

            publications.push(publication);
          } catch (err) {
            console.error(`Error processing publication:`, err);
          }
        }
      }
    } catch (error) {
      console.error("Error in scrapeGoogleScholar:", error);
      throw error;
    } finally {
      await this.page.unroute("**/*");
    }

    return publications;
  }
  private async scrapeDBLP(
    researcherName: string
  ): Promise<ScrapedPublication[]> {
    const publications: ScrapedPublication[] = [];
    if (!this.page) return publications;

    const searchUrl = `https://dblp.org/search?q=${encodeURIComponent(
      researcherName
    )}`;
    const dblpHtml = (await axios.get(searchUrl)).data;
    const $ = cheerio.load(dblpHtml);
    const dblpPublications = $("div.hideable cite.data");

    for (let i = 0; i < dblpPublications.length; i++) {
      const pub = $(dblpPublications[i]);
      const titleTag = pub.find("span.title");
      const title = titleTag.text().trim();
      const venueInfoTag = titleTag.next();

      const jOrC = pub.prevAll("div.nr").text().trim().toLowerCase();
      let location = "";

      if (jOrC[1] === "c") {
        const confLink = venueInfoTag.attr("href");
        if (confLink) {
          try {
            const confPage = await axios.get(confLink);
            const confPageContent = cheerio.load(confPage.data);
            location = confPageContent("h1").text().split(":")[1]?.trim() || "";
          } catch (error) {
            console.warn(
              `Failed to fetch conference location from ${confLink}:`,
              error
            );
          }
        }
      }

      const publication: ScrapedPublication = {
        title: title,
        publicationType:
          jOrC[1] === "c" ? "conference_paper" : "journal_article",
        //status: 'published',
        pageCount: this.parsePageCount(
          pub.find('span[itemprop="pagination"]').text()
        ),
        volume:
          venueInfoTag
            .find('span[itemprop="isPartOf"] span[itemprop="volumeNumber"]')
            .text() || undefined,
        issue:
          venueInfoTag.find('span[itemprop="issueNumber"]').text() || undefined,
        url: pub.prevAll("nav.publ").find("a").attr("href") || undefined,
        doi: pub.find('span[itemprop="sameAs"]').text().trim() || undefined,
        publicationDate: pub.find('span[itemprop="datePublished"]').text()
          ? new Date(
              parseInt(pub.find('span[itemprop="datePublished"]').text()),
              0,
              1
            )
          : undefined,
        publisher:
          venueInfoTag.find('span[itemprop="publisher"]').text().trim() ||
          undefined,
        language: "English",
        venue: {
          name:
            venueInfoTag
              .find('span[itemprop="isPartOf"] span[itemprop="name"]')
              .text() || "Unknown",
          type: jOrC[1] === "c" ? "conference" : "journal",
          issn: this.extractISSN(venueInfoTag.text()),
          eissn: this.extractISSN(venueInfoTag.text()),
          website:
            venueInfoTag.find('a[itemprop="url"]').attr("href") || undefined,
          location: location,
          isOpenAccess: pub.find('img[alt="Open Access"]').length > 0,
        },
        authors: venueInfoTag
          .prevAll('span[itemprop="author"]')
          .map((i, el) => ({
            scholarId: null,
            name: $(el).text().trim(),
            position: i + 1,
            isCorresponding: i === 0,
            affiliationDuringWork: $(el).attr("title") || undefined,
          }))
          .get(),
        referenceCount: 0,
        citationCount: parseInt(
          pub.find('span[itemprop="citationCount"]').text().trim() || "0"
        ),
        citationGraphUrl: "",
        citationGraphData: [],
        keywords: [],
      };

      // Get Scimago metrics if journal
      if (publication.venue.type === "journal" && publication.venue.name) {
        publication.venue.sjrIndicator =
          (await this.getJournalSJR(publication.venue.name)) ?? undefined;
        publication.venue.impactFactor = await this.getJournalImpactFactor(
          publication.venue.name
        );
      }

      publications.push(publication);
    }

    return publications;
  }

  private async getJournalImpactFactor(
    journalName: string
  ): Promise<number | undefined> {
    //if (!this.page) return undefined;

    /*try {
      await this.page.goto('https://www.scimagojr.com/', { waitUntil: 'networkidle' });
      await this.page.fill('input[name="q"]', journalName);
      await this.page.keyboard.press('Enter');
      await this.page.waitForSelector('.search_results a:first-child', { timeout: 5000 });
      await this.page.click('.search_results a:first-child');
      await this.page.waitForSelector('.journalgrid', { timeout: 5000 });
      
      const impactFactorText = await this.page.$eval('.journalgrid tr:nth-child(2) td:nth-child(2)', el => el.textContent);
      return parseFloat(impactFactorText?.trim() || '0');
    } catch (error) {
      console.error(`Failed to get impact factor for ${journalName}:`, error);
      return undefined;
    }*/
    return undefined; // Placeholder for impact factor retrieval
  }

  //  similarity check
  private isSimilar(a: string, b: string, threshold = 0.85): boolean {
    const fuse = new Fuse([b], { includeScore: true, threshold: 1, keys: [] });
    const result = fuse.search(a);
    return result.length > 0 && (result[0].score ?? 1) <= 1 - threshold;
  }

  //  journal SJR lookup
  private async getJournalSJR(journalName: string): Promise<number | null> {
    if (!this.page) return null;

    try {
      await this.page.goto("https://www.scimagojr.com/", { timeout: 30000 });
      await this.page.fill('#searchbox input[name="q"]', journalName);
      await this.page.keyboard.press("Enter");

      await this.page.waitForSelector(".search_results > a", {
        timeout: 10000,
      });
      const firstResult = await this.page.$(".search_results > a");
      if (!firstResult) return null;

      await firstResult.click();
      await this.page.waitForSelector("p.hindexnumber", { timeout: 15000 });
      const element = await this.page.$("p.hindexnumber");
      if (!element) return null;

      const text = await element.innerText();
      return parseFloat(text.split(" ")[0]) || null;
    } catch (error) {
      console.error("Journal SJR lookup failed:", error);
      return null;
    }
  }

  // Helper methods from
  private determinePublicationType(
    title: string,
    venue: string
  ): (typeof publicationTypeEnum.enumValues)[number] {
    const lowerVenue = venue.toLowerCase();
    if (
      lowerVenue.includes("conf") ||
      lowerVenue.includes("symposium") ||
      lowerVenue.includes("workshop")
    ) {
      return "conference_paper";
    }
    if (lowerVenue.includes("book") || lowerVenue.includes("chapter")) {
      return "book_chapter";
    }
    if (lowerVenue.includes("thesis") || lowerVenue.includes("dissertation")) {
      return "thesis";
    }
    if (title.toLowerCase().includes("patent")) {
      return "patent";
    }
    if (lowerVenue.includes("arxiv") || lowerVenue.includes("preprint")) {
      return "preprint";
    }
    return "journal_article";
  }

  private determineVenueType(
    venue: string
  ): (typeof venueTypeEnum.enumValues)[number] {
    const lowerVenue = venue.toLowerCase();
    if (lowerVenue.includes("conf") || lowerVenue.includes("proceedings")) {
      return "conference";
    }
    if (lowerVenue.includes("workshop")) {
      return "workshop";
    }
    if (lowerVenue.includes("symposium")) {
      return "symposium";
    }
    if (lowerVenue.includes("book") || lowerVenue.includes("chapter")) {
      return "book";
    }
    return "journal";
  }

  private parsePageCount(pages: string): number | undefined {
    const match = pages.match(/(\d+)\s*-\s*(\d+)/);
    return match ? parseInt(match[2]) - parseInt(match[1]) + 1 : undefined;
  }

  private extractISSN(text: string): string | undefined {
    const issnMatch = text.match(
      /(ISSN|eISSN)\s*[:=]?\s*([0-9]{4}-[0-9]{3}[0-9X])/i
    );
    return issnMatch?.[2];
  }
}
