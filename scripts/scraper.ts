import axios from "axios";
import * as cheerio from "cheerio";
import { AnyNode } from "domhandler";
import { readdirSync, readFileSync } from "fs";
import { join } from "path";
import {
  chromium,
  type BrowserContext,
  type BrowserContextOptions,
  type LaunchOptions,
  type Page,
} from "playwright";
import { compareTwoStrings } from "string-similarity";

import { publicationTypeEnum, venueTypeEnum } from "../db/schema";

interface ScraperConfig {
  maxRetries: number;
  timeout: number;
  headless: boolean;
  executablePath?: string;
  proxy?: {
    server: string;
    username?: string;
    password?: string;
  };
  userDataDir?: string; // For persistent sessions
  delayBetweenRequests: number; // Randomized delay between requests
}

interface DGRSDTJournalInfo {
  name: string;
  publisher: string;
  issn: string;
  eissn: string;
  category: "A" | "B";
  subcategory?: string;
}

export type ScrapedPublication = {
  authors?: string[];
  journal?: string;
  title: string;
  abstract?: string;
  publicationType: (typeof publicationTypeEnum.enumValues)[number];
  publicationDate?: Date;
  doi?: string;
  url?: string;
  pdfUrl?: string;
  citationCount?: number;
  pages?: string;
  volume?: string;
  scholarLink?: string;
  dblpLink?: string;
  issue?: string;
  publisher?: string;
  language?: string;
  googleScholarArticles?: { title: string; link: string }[];
  citationGraph?: { year: number; count: number }[];
  dgrsdtInfo?: DGRSDTJournalInfo;
  sjr?: string;
  venue: {
    publisher: string;
    name: string;
    type: (typeof venueTypeEnum.enumValues)[number];
    issn?: string;
    eissn?: string;
    sjrIndicator?: string;
    isOpenAccess?: boolean;
  };
};

export class ResearchDataScraper {
  private browser: BrowserContext | null = null;
  private page: Page | null = null;
  private isInitialized = false;
  private config: ScraperConfig;
  private logger: Logger;

  private readonly CATEGORY_B_SUBCATEGORIES = [
    "ABDC",
    "De_Gruyter",
    "Erih_plus",
    "Journal_quality",
    "AERES",
    "CNRS",
    "SCOPUS",
    "Finacial_Times",
  ];

  constructor(config: Partial<ScraperConfig> = {}) {
    this.config = {
      maxRetries: 5, // Increased retries
      timeout: 60000, // Increased timeout
      headless: true, // Default to headless
      delayBetweenRequests: 5000, // Base delay between requests
      ...config,
    };
    this.logger = new Logger("GoogleScholarScraper");
  }

  private async init(): Promise<void> {
    if (this.isInitialized) return;

    try {
      const launchOptions: LaunchOptions & BrowserContextOptions = {
        headless: this.config.headless,
        timeout: this.config.timeout,
        executablePath: this.config.executablePath,
        args: [
          "--disable-blink-features=AutomationControlled",
          "--disable-infobars",
          "--disable-web-security",
          "--disable-features=IsolateOrigins,site-per-process",
          "--disable-dev-shm-usage",
          "--no-sandbox",
          "--disable-setuid-sandbox",
          "--disable-gpu",
          "--disable-extensions",
          "--disable-software-rasterizer",
          "--disable-notifications",
          "--disable-popup-blocking",
          "--mute-audio",
          "--no-zygote",
          "--window-size=1280,720",
          "--start-maximized",
          "--lang=en-US,en",
          `--user-agent=${this.getRandomUserAgent()}`,
        ],
        ignoreDefaultArgs: [
          "--enable-automation",
          "--disable-component-extensions-with-background-pages",
        ],
      };

      if (this.config.proxy) {
        launchOptions.proxy = this.config.proxy;
      }

      // Use launchPersistentContext if userDataDir is provided
      if (this.config.userDataDir) {
        this.browser = await chromium.launchPersistentContext(
          this.config.userDataDir,
          launchOptions
        );
      } else {
        const browser = await chromium.launch(launchOptions);
        this.browser = await browser.newContext();
      }

      this.isInitialized = true;
      this.logger.info("Browser successfully initialized");
    } catch (error) {
      this.logger.error("Failed to initialize browser", error);
      throw error;
    }
  }

  private getRandomUserAgent(): string {
    const userAgents = [
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:109.0) Gecko/20100101 Firefox/120.0",
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Safari/605.1.15",
      "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    ];
    return userAgents[Math.floor(Math.random() * userAgents.length)];
  }
  /* public async scrapeResearcherPublications(
    researcherName: string,
    scholarProfileLink?: string,
    timeoutMs = 120000 // 2 minute timeout
  ): Promise<ScrapedPublication[]> {
    const timeout = new Promise<ScrapedPublication[]>((_, reject) =>
      setTimeout(
        () => reject(new Error("Scraping timeout exceeded")),
        timeoutMs
      )
    );

    return Promise.race([
      this._scrapeResearcherPublications(researcherName, scholarProfileLink),
      timeout,
    ]);
  }*/
  public async scrapeResearcherPublications(
    researcherName: string,
    scholarProfileLink?: string
  ): Promise<ScrapedPublication[]> {
    await this.ensureReady();
    const scrapedPublications: ScrapedPublication[] = [];
    const journalClassificationMap = new Map<
      string,
      { dgrsdt?: DGRSDTJournalInfo; sjr?: string }
    >();

    try {
      this.page = await this.browser!.newPage();
      await this.configurePage();

      // Scrape Google Scholar and DBLP in parallel
      const [scholarRes, dblpRes] = await Promise.allSettled([
        this.scrapeGoogleScholar(scholarProfileLink, researcherName),
        this.scrapeDBLP(researcherName),
      ]);

      if (scholarRes.status === "fulfilled") {
        scrapedPublications.push(...scholarRes.value);
      } else {
        this.logger.warn("Google Scholar scraping failed", scholarRes.reason);
      }

      if (dblpRes.status === "fulfilled") {
        scrapedPublications.push(...dblpRes.value);
      } else {
        this.logger.warn("DBLP scraping failed", dblpRes.reason);
      }

      // Merge and deduplicate
      const publications = await this.mergeAndDeduplicatePublications(
        scrapedPublications
      );

      // Extract unique venue names
      const uniqueVenues = Array.from(
        new Set(
          publications
            .map((pub) => pub.venue?.name)
            .filter((name): name is string => !!name)
        )
      );

      // Scrape DGRSDT and SJR info in parallel per venue
      for (const venueName of uniqueVenues) {
        const [dgrsdt, sjr] = await Promise.all([
          this.scrapeDGRSDT(venueName),
          this.scrapeSJR(venueName),
        ]);
        journalClassificationMap.set(venueName, {
          dgrsdt: dgrsdt || undefined,
          sjr: sjr ? `${sjr[0]} - ${sjr[1]}` : undefined,
        });
      }

      // Attach classification data to publications
      for (const pub of publications) {
        const venueName = pub.venue?.name;
        if (venueName && journalClassificationMap.has(venueName)) {
          const info = journalClassificationMap.get(venueName)!;
          pub.dgrsdtInfo = info.dgrsdt || undefined;
          pub.sjr = info.sjr || undefined;
        }
      }

      return publications;
    } finally {
      if (this.page) await this.page.close();
    }
  }

  private async scrapeDGRSDT(
    journalName: string
  ): Promise<DGRSDTJournalInfo | null> {
    this.logger.info(`🔎 Searching for journal ➜ ${journalName}`);

    try {
      const JSON_DIR = "./data/dgrsdt"; // Path to your JSON directory
      const THRESHOLD = 0.85; // Similarity threshold

      // Helper function to check string similarity
      const isSimilar = (
        a: string,
        b: string,
        threshold = THRESHOLD
      ): boolean => {
        return compareTwoStrings(a.toLowerCase(), b.toLowerCase()) >= threshold;
      };

      // Load all journals from JSON files
      const allJournals: Array<[string, string[]]> = [];
      this.logger.info("Loading journal data from JSON files");

      try {
        for (const fname of readdirSync(JSON_DIR)) {
          if (!fname.endsWith(".json")) continue;
          const fullPath = join(JSON_DIR, fname);

          try {
            const rows = JSON.parse(readFileSync(fullPath, "utf8"));

            if (!Array.isArray(rows)) continue;

            for (const row of rows) {
              if (!Array.isArray(row) || row.length < 2) continue;
              const flat = row.join(" ").toLowerCase();
              if (flat.includes("journal") || flat.includes("revue")) continue;
              allJournals.push([
                fname.toLowerCase(),
                row.map((cell) => String(cell).trim()),
              ]);
            }
          } catch (err) {
            this.logger.warn(`⚠️ Could not parse ${fname}: ${err}`);
            continue;
          }
        }
      } catch (err) {
        this.logger.error(`Failed to read JSON directory: ${err}`);
        return null;
      }

      // Search for the journal
      this.logger.info(
        `Searching through ${allJournals.length} journal entries`
      );

      for (const [sourceFile, row] of allJournals) {
        for (const cell of row) {
          if (isSimilar(journalName, cell)) {
            const category: "A" | "B" = sourceFile === "a.json" ? "A" : "B";

            // Determine subcategory for Category B journals
            let subcategory: string | undefined;
            if (category === "B") {
              // Extract subcategory from filename (e.g., "b_physics.json" -> "physics")
              const match = sourceFile.match(/b_(.+)\.json/);
              subcategory = match ? match[1] : undefined;
            }

            const journalInfo: DGRSDTJournalInfo = {
              name: row[1] ?? "",
              publisher: row[2] ?? "",
              issn: row[3] ?? "",
              eissn: row[4] ?? "",
              category: category,
              ...(subcategory && { subcategory }),
            };

            this.logger.info(
              `✅ Found journal "${journalInfo.name}" in Category ${category}`
            );
            return journalInfo;
          }
        }
      }

      this.logger.info(`❌ Journal not found in Category A or B`);
      return null;
    } catch (error) {
      this.logger.error(`Error in scrapeDGRSDT: ${error}`);
      return null;
    }
  }

  private async configurePage(): Promise<void> {
    if (!this.page) return;

    // Randomize viewport
    await this.page.setViewportSize({
      width: 1280 + Math.floor(Math.random() * 200),
      height: 720 + Math.floor(Math.random() * 200),
    });

    // Block unnecessary resources
    await this.page.route("**/*", (route) => {
      const type = route.request().resourceType();
      return ["image", "stylesheet", "font", "media", "script"].includes(type)
        ? route.abort()
        : route.continue();
    });

    // Set extra HTTP headers
    await this.page.setExtraHTTPHeaders({
      "Accept-Language": "en-US,en;q=0.9",
      "Accept-Encoding": "gzip, deflate, br",
      Accept:
        "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
      Referer: "https://www.google.com/",
      DNT: "1",
      Connection: "keep-alive",
    });

    // Remove webdriver property and other automation indicators
    await this.page.addInitScript(() => {
      // Remove navigator.webdriver
      Object.defineProperty(navigator, "webdriver", {
        get: () => undefined,
      });

      // Override the permissions API
      const originalQuery = window.navigator.permissions.query;
      window.navigator.permissions.query = (parameters: PermissionDescriptor) =>
        parameters.name === "notifications"
          ? Promise.resolve({
              name: parameters.name,
              state: Notification.permission,
              onchange: null,
              addEventListener: () => {},
              removeEventListener: () => {},
              dispatchEvent: () => false,
            } as PermissionStatus)
          : originalQuery(parameters);

      // Mock plugins
      Object.defineProperty(navigator, "plugins", {
        get: () => [1, 2, 3],
      });

      // Mock languages
      Object.defineProperty(navigator, "languages", {
        get: () => ["en-US", "en"],
      });
    });

    // Set cookies to mimic human behavior
    await this.page.context().addCookies([
      {
        name: "SOCS",
        value: "CAISHAgCEhJnd3NfMjAyMzA4MDlfMF9SQzEaAmVuIAEaBgiA_LSeBg",
        domain: ".google.com",
        path: "/",
        sameSite: "Lax",
        secure: true,
        httpOnly: false,
      },
      {
        name: "NID",
        value: "511=some_random_value",
        domain: ".google.com",
        path: "/",
        sameSite: "Lax",
        secure: true,
        httpOnly: true,
      },
      {
        name: "1P_JAR",
        value: "some_random_value",
        domain: ".google.com",
        path: "/",
        sameSite: "None",
        secure: true,
        httpOnly: false,
      },
    ]);

    this.page.setDefaultTimeout(this.config.timeout);
  }
  private async configureNewPage(page: Page): Promise<void> {
    // Block unnecessary resources
    await page.route("**/*", (route) => {
      const type = route.request().resourceType();
      return ["image", "stylesheet", "font", "media"].includes(type)
        ? route.abort()
        : route.continue();
    });

    // Set user agent and headers
    const userAgents = [
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      // ... other user agents ...
    ];

    await page.setExtraHTTPHeaders({
      "Accept-Language": "en-US,en;q=0.9",
      "User-Agent": userAgents[Math.floor(Math.random() * userAgents.length)],
    });

    page.setDefaultTimeout(this.config.timeout);
  }

  private async ensureReady(): Promise<void> {
    if (!this.isInitialized) {
      await this.init();
    }
    if (!this.browser) {
      throw new Error("Browser not initialized");
    }
  }

  private async humanLikeDelay(min = 1000, max = 5000): Promise<void> {
    const delay = Math.floor(Math.random() * (max - min + 1)) + min;
    await this.page?.waitForTimeout(delay);
  }

  private async simulateHumanInteraction(): Promise<void> {
    if (!this.page) return;

    // Random mouse movements
    const width = this.page.viewportSize()?.width || 1280;
    const height = this.page.viewportSize()?.height || 720;

    await this.page.mouse.move(
      Math.floor(Math.random() * width),
      Math.floor(Math.random() * height),
      { steps: 5 }
    );

    // Random scrolling
    await this.page.mouse.wheel(0, Math.floor(Math.random() * 500) + 100);
    await this.humanLikeDelay(500, 1500);
  }

  public async close(): Promise<void> {
    try {
      if (this.page) await this.page.close();
      if (this.browser) await this.browser.close();
      this.isInitialized = false;
      this.logger.info("Browser successfully closed");
    } catch (error) {
      this.logger.error("Error closing browser", error);
    }
  }

  private async scrapeGoogleScholar(
    profileLink?: string,
    researcherName?: string
  ): Promise<ScrapedPublication[]> {
    if (!this.page) return [];

    try {
      // If no profileLink provided but we have a name, try to find profile
      if (!profileLink && researcherName) {
        profileLink = await this.getScholarProfileLink(researcherName);
        if (!profileLink) {
          throw new Error("Could not find Google Scholar profile");
        }
      }

      if (!profileLink) {
        throw new Error("No Google Scholar profile link provided");
      }

      // Validate the profile link format
      if (!profileLink.includes("scholar.google.com/citations")) {
        throw new Error("Invalid Google Scholar profile link format");
      }

      const userId = this.extractUserId(profileLink);
      if (!userId) throw new Error("Could not extract user ID from profile");

      // Navigate directly to profile with human-like behavior
      await retry(async () => {
        await this.page!.waitForTimeout(2000 + Math.random() * 3000);
        await this.page!.goto(profileLink!, {
          waitUntil: "domcontentloaded",
          referer: "https://www.google.com/",
        });

        // Simulate human interaction
        await this.page!.mouse.move(Math.random() * 800, Math.random() * 600);
        await this.page!.mouse.wheel(0, 300 + Math.random() * 400);
        await this.page!.waitForTimeout(1000 + Math.random() * 4000);
      }, this.config.maxRetries);

      if (await this.isBlocked()) {
        throw new Error("Google Scholar has blocked the scraper");
      }

      const bodyHTML = await this.page.content();
      if (bodyHTML.toLowerCase().includes("i'm not a robot")) {
        throw new Error("Blocked by CAPTCHA");
      }

      const publicationLinks = await this.collectPublicationLinks(userId);
      const publications: ScrapedPublication[] = [];

      for (const link of publicationLinks) {
        try {
          await this.page.goto(link, { waitUntil: "domcontentloaded" });
          await this.page.waitForSelector("#gs_bdy", { timeout: 10000 });
          const html = await this.page.content();

          const publication = await this.scrapeGoogleScholarPublication(html);
          if (publication) {
            publication.scholarLink = link;
            publications.push(publication);
          }
        } catch (error) {
          this.logger.warn(`Failed to scrape publication at ${link}`, error);
        }
      }

      return publications;
    } catch (error) {
      this.logger.error("Google Scholar scraping failed", error);
      return [];
    }
  }

  private async getScholarProfileLink(
    researcherName: string
  ): Promise<string | undefined> {
    if (!this.page) return undefined;

    try {
      const searchUrl = `https://scholar.google.com/scholar?q=${encodeURIComponent(
        researcherName
      )}`;

      await this.humanLikeDelay(3000, 8000);
      await this.page.goto(searchUrl, {
        waitUntil: "networkidle",
        referer: "https://www.google.com/",
      });

      await this.simulateHumanInteraction();

      if (await this.isBlocked()) {
        throw new Error("Google Scholar has blocked the scraper");
      }

      const bodyHTML = await this.page.content();
      if (bodyHTML.toLowerCase().includes("i'm not a robot")) {
        throw new Error("Blocked by CAPTCHA");
      }

      // Try multiple selectors as Google Scholar changes their layout
      const profileHandle = await this.page.$(
        "h4.gs_rt2 a, h3.gs_rt a, a.gs_ai_name"
      );
      if (!profileHandle) {
        throw new Error("Researcher profile link not found");
      }

      const profileLink = await profileHandle.getAttribute("href");
      return profileLink ?? undefined;
    } catch (error) {
      this.logger.error("Failed to find Google Scholar profile", error);
      return undefined;
    }
  }
  private async scrapeSJR(
    journalName: string
  ): Promise<[string, string] | null> {
    const page = await this.browser!.newPage();
    try {
      const searchUrl = `https://www.scimagojr.com/journalsearch.php?q=${encodeURIComponent(
        journalName
      )}`;
      await page.goto(searchUrl, { timeout: 30000 });

      await page.waitForSelector(".search_results > a, .nores", {
        timeout: 10000,
      });

      const noResults = await page.$(".nores");
      if (noResults) return null;

      const firstResult = await page.$(".search_results > a");
      if (!firstResult) return null;

      await firstResult.click();
      await page.waitForLoadState("domcontentloaded");

      const sjrBlock = await page
        .locator('h2:has-text("SJR 2024") + p.hindexnumber')
        .first();
      if (!(await sjrBlock.isVisible())) return null;

      const sjr = (await sjrBlock.innerText()).split(" ")[0].trim();
      const qx = (await sjrBlock.locator("span").innerText()).trim();

      return [sjr, qx];
    } catch (error) {
      console.warn(`⚠️ Error scraping "${journalName}":`, error);
      return null;
    } finally {
      await page.close();
    }
  }
  private async scrapeGoogleScholarPublication(
    html: string
  ): Promise<ScrapedPublication | null> {
    const $ = cheerio.load(html);
    const publication: Partial<ScrapedPublication> = {};

    try {
      // Extract title and link
      publication.title = $("#gsc_oci_title a.gsc_oci_title_link")
        .text()
        .trim();
      publication.url =
        $("#gsc_oci_title a.gsc_oci_title_link").attr("href") || "";

      // Extract PDF link if available
      const pdfLinkElement = $("#gsc_oci_title_gg a");
      if (pdfLinkElement.length) {
        publication.pdfUrl = pdfLinkElement.attr("href") || "";
      }

      // Process each field in the publication table
      $("#gsc_oci_table .gs_scl").each((_, element) => {
        const field = $(element).find(".gsc_oci_field").text().trim();
        const valueElement = $(element).find(".gsc_oci_value");
        const value = valueElement.text().trim();

        switch (this.normalizeField(field)) {
          case "authors":
          case "auteurs":
            publication.authors = value.split(",").map((a) => a.trim());
            break;

          case "publicationdate":
          case "datedepublication":
            publication.publicationDate = new Date(value);

          case "journal":
          case "book":
          case "revue":
            publication.venue = {
              ...publication.venue,
              name: value,
              type: this.determineVenueType(
                publication.title,
                publication.venue?.name || ""
              ),
              publisher: "",
            };
            break;

          case "conference":
            publication.venue = {
              ...publication.venue,
              name: value,
              type: this.determineVenueType(publication?.title || "", value),
              publisher: "",
            };
            break;

          case "issue":
            publication.issue = value;
            break;

          case "volume":
            publication.volume = value;
            break;

          case "pages":
            publication.pages = value;
            break;

          case "publisher":
          case "editeur":
          case "editor":
            publication.publisher = value;
            if (!publication.venue) {
              publication.venue = {
                name: "",
                type: this.determineVenueType(publication.title, ""),
                publisher: value,
              };
            } else {
              publication.venue.publisher = value;
            }
            break;

          case "description":
          case "abstract":
            const descriptionElement = valueElement.find(
              "#gsc_oci_descr .gsh_small .gsh_csp"
            );
            publication.abstract = descriptionElement.length
              ? descriptionElement.text().trim()
              : valueElement.text().trim();
            break;

          case "totalcitations":
          case "nombretotaldecitations":
            // Extract total citation count
            const citationMatch = valueElement
              .find("a")
              .first()
              .text()
              .match(/\d+/);
            if (citationMatch) {
              publication.citationCount = parseInt(citationMatch[0], 10);
            }

            // Extract citation graph data
            publication.citationGraph = [];
            const graphBars = valueElement.find("#gsc_oci_graph_bars");
            const years = graphBars
              .find(".gsc_oci_g_t")
              .map((_, el) => {
                return parseInt($(el).text(), 10);
              })
              .get();

            const citations = graphBars
              .find(".gsc_oci_g_a")
              .map((_, el) => {
                const $el = $(el);
                return {
                  year: parseInt(
                    $el.attr("href")?.match(/as_ylo=(\d+)/)?.[1] || "0",
                    10
                  ),
                  count: parseInt($el.find(".gsc_oci_g_al").text(), 10),
                };
              })
              .get();

            citations.forEach((citation) => {
              if (!isNaN(citation.year) && !isNaN(citation.count)) {
                publication.citationGraph!.push(citation);
              }
            });

            // Fill in years with 0 citations
            years.forEach((year) => {
              if (
                !isNaN(year) &&
                !publication.citationGraph!.some((c) => c.year === year)
              ) {
                publication.citationGraph!.push({ year, count: 0 });
              }
            });

            // Sort by year
            publication.citationGraph.sort((a, b) => a.year - b.year);
            break;

          case "scholararticles":
          case "articlesgooglescholar":
            publication.googleScholarArticles = [];

            valueElement.find(".gsc_oci_merged_snippet div").each((_, div) => {
              const $div = $(div);
              const firstLink = $div.find("a").first();

              // Skip empty divs
              if (!firstLink.length) return;

              const href = firstLink.attr("href");
              if (!href) return;

              // If publication title/url not defined, get from first link
              if (!publication.title || !publication.url) {
                publication.title = firstLink.text().trim();
                publication.url = `https://scholar.google.com${href}`;
              }

              // Process citation link, related articles and all versions
              if ($div.find(".gsc_oms_link").length > 0) {
                const citationLink = $div
                  .find("a[href*='cites=']")
                  .attr("href");
                if (citationLink) {
                  publication.googleScholarArticles!.push({
                    title: "All Citations",
                    link: citationLink,
                  });
                }

                const relatedLink = $div
                  .find("a[href*='related:']")
                  .attr("href");
                if (relatedLink) {
                  publication.googleScholarArticles!.push({
                    title: "Related Articles",
                    link: relatedLink,
                  });
                }

                const versionsLink = $div
                  .find("a[href*='cluster=']")
                  .attr("href");
                if (versionsLink) {
                  publication.googleScholarArticles!.push({
                    title: "All Versions",
                    link: versionsLink,
                  });
                }
                return;
              }
            });
            break;
          default:
            break;
        }
      });

      return publication as ScrapedPublication;
    } catch (error) {
      this.logger.error("Failed to extract publication info", error);
      return null;
    }
  }

  private async rotateFingerprint(): Promise<void> {
    this.logger.info("Rotating fingerprint due to detection...");

    // Close current page and context
    if (this.page) {
      await this.page.close();
      this.page = null;
    }

    // Create new browser instance and context with fresh fingerprint
    const browser = await chromium.launch({
      headless: this.config.headless,
      timeout: this.config.timeout,
    });
    const context = await browser.newContext({
      userAgent: this.getRandomUserAgent(),
      viewport: {
        width: 1280 + Math.floor(Math.random() * 200),
        height: 720 + Math.floor(Math.random() * 200),
      },
    });

    this.page = await context.newPage();
    await this.configurePage();

    // Add delay before continuing
    await this.humanLikeDelay(5000, 10000);
  }

  private normalizeField(field: string): string {
    return field
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/\s+/g, "")
      .replace(/[^a-z0-9]/g, "");
  }

  private async collectPublicationLinks(userId: string): Promise<string[]> {
    if (!this.page) return [];

    await this.page.goto(
      `https://scholar.google.com/citations?user=${userId}&hl=en`,
      {
        waitUntil: "networkidle",
      }
    );

    const publicationLinks: string[] = [];
    let hasMore = true;

    while (hasMore) {
      await this.page.waitForSelector("#gsc_a_b", { timeout: 10000 });

      const currentLinks = await this.page.$$eval(
        "#gsc_a_b .gsc_a_t a",
        (links) => links.map((link) => (link as HTMLAnchorElement).href)
      );
      publicationLinks.push(...currentLinks);

      const nextButton = await this.page.$("#gsc_bpf_next");
      if (nextButton && !(await nextButton.getAttribute("disabled"))) {
        await nextButton.click();
        await this.page.waitForTimeout(2000);
      } else {
        hasMore = false;
      }
    }

    return publicationLinks;
  }

  private determineVenueType(
    title: string = "",
    venue: string = ""
  ): (typeof venueTypeEnum.enumValues)[number] {
    const lowerTitle = title.toLowerCase();
    const lowerVenue = venue.toLowerCase();

    if (
      lowerVenue.includes("conf") ||
      lowerVenue.includes("symposium") ||
      lowerVenue.includes("workshop")
    ) {
      return "conference";
    }
    if (lowerTitle.includes("book") || lowerVenue.includes("book")) {
      return "book";
    }
    if (lowerVenue.includes("workshop")) {
      return "workshop";
    }
    if (lowerVenue.includes("symposium")) {
      return "symposium";
    }
    return "journal";
  }

  private async scrapeDBLP(
    researcherName: string
  ): Promise<ScrapedPublication[]> {
    try {
      const searchUrl = `https://dblp.org/search?q=${encodeURIComponent(
        researcherName
      )}`;
      const response = await axios.get(searchUrl, {
        timeout: this.config.timeout,
      });
      const $ = cheerio.load(response.data);
      const publications: ScrapedPublication[] = [];

      const publicationElements = $("div.hideable cite.data").toArray();

      for (const pubElement of publicationElements) {
        try {
          const pub = $(pubElement);
          const publication = await this.parseDBLPPublication(pub);
          if (publication) publications.push(publication);
        } catch (error) {
          this.logger.warn("Failed to parse DBLP publication", error);
        }
      }

      return publications;
    } catch (error) {
      this.logger.error("DBLP scraping failed", error);
      return [];
    }
  }

  private async parseDBLPPublication(
    pub: cheerio.Cheerio
  ): Promise<ScrapedPublication | null> {
    const title = pub.find("span.title").text().trim().replace(".", "");
    if (!title) return null;

    const venueInfoTag = pub.find("span.title").next();
    const publicationType = this.determinePublicationTypeFromDBLP(pub);

    // Extract DBLP link from the publication's nav element
    // Extract DBLP link - look for the "details & citations" link
    const dblpLink = pub
      .prevAll("nav.publ")
      .find('a:contains("details & citations")')
      .attr("href");

    const publication: ScrapedPublication = {
      title,
      publicationType,
      doi: pub
        .prevAll("nav.publ")
        .find("a")
        .attr("href")
        ?.includes("https://doi.org")
        ? pub
            .prevAll("nav.publ")
            .find("a")
            .attr("href")
            ?.replace("https://doi.org/", "")
        : undefined,
      dblpLink: dblpLink,
      venue: {
        name:
          venueInfoTag
            .find('span[itemprop="isPartOf"] span[itemprop="name"]')
            .text() || "Unknown",
        type: publicationType.includes("conference") ? "conference" : "journal",
        issn: this.extractISSN(venueInfoTag.text()),
        publisher: "",
      },
      authors: venueInfoTag
        .prevAll('span[itemprop="author"]')
        .map(
          (
            _i: number,
            el: string | AnyNode | AnyNode[] | Buffer<ArrayBufferLike>
          ) => ({
            name: cheerio.load(el).text().trim(),
          })
        )
        .get(),
      language: "",
    };

    const pages = pub.find('span[itemprop="pagination"]').text();
    if (pages) publication.pages = pages;

    const volume = venueInfoTag
      .find('span[itemprop="isPartOf"] span[itemprop="volumeNumber"]')
      .text();
    if (volume) publication.volume = volume;

    const dateText = pub.find('span[itemprop="datePublished"]').text();
    if (dateText)
      publication.publicationDate = new Date(parseInt(dateText), 0, 1);

    return publication;
  }

  private async mergeAndDeduplicatePublications(
    publications: ScrapedPublication[]
  ): Promise<ScrapedPublication[]> {
    const mergedPublications: Map<string, ScrapedPublication> = new Map();

    for (const pub of publications) {
      try {
        const normalizedTitle = pub?.title.trim().toLowerCase();

        if (!mergedPublications.has(normalizedTitle)) {
          mergedPublications.set(normalizedTitle, pub);
        } else {
          const existing = mergedPublications.get(normalizedTitle)!;

          const merged: ScrapedPublication = {
            // Prefer Google Scholar (assume first one is Scholar when available)
            title: existing?.title, // title is the same (normalized match)
            abstract: existing?.abstract ?? pub?.abstract,
            authors: existing?.authors ?? pub?.authors,
            journal: existing?.journal ?? pub?.journal,
            publicationType: existing?.publicationType ?? pub?.publicationType,
            publicationDate: existing?.publicationDate ?? pub?.publicationDate,
            doi: existing?.doi ?? pub?.doi,
            url: existing?.url ?? pub?.url,
            pdfUrl: existing?.pdfUrl ?? pub?.pdfUrl,
            citationCount: existing?.citationCount ?? pub?.citationCount,
            pages: existing?.pages ?? pub?.pages,
            volume: existing?.volume ?? pub?.volume,
            scholarLink: existing?.scholarLink ?? pub?.scholarLink,
            dblpLink: existing?.dblpLink ?? pub?.dblpLink,
            issue: existing?.issue ?? pub?.issue,
            publisher: existing?.publisher ?? pub?.publisher,
            language: existing?.language ?? pub?.language,
            googleScholarArticles:
              existing?.googleScholarArticles ?? pub?.googleScholarArticles,
            citationGraph: existing?.citationGraph ?? pub?.citationGraph,

            venue: {
              publisher: existing?.venue?.publisher || pub?.venue?.publisher,
              name: existing?.venue?.name || pub?.venue?.name,
              type: existing?.venue?.type || pub?.venue?.type,
              issn: existing?.venue?.issn ?? pub?.venue?.issn,
              eissn: existing?.venue?.eissn ?? pub?.venue?.eissn,
              sjrIndicator:
                existing?.venue?.sjrIndicator ?? pub?.venue?.sjrIndicator,
              isOpenAccess:
                existing?.venue?.isOpenAccess ?? pub?.venue?.isOpenAccess,
            },
          };

          mergedPublications.set(normalizedTitle, merged);
        }
      } catch (error) {
        this.logger.warn(`Error processing publication ${pub.title}`, error);
      }
    }

    return Array.from(mergedPublications.values());
  }
  private async isBlocked(): Promise<boolean> {
    if (!this.page) return false;
    const content = await this.page.content();
    return (
      content.includes("Sorry, we can't verify that you're not a robot") ||
      content.includes("Our systems have detected unusual traffic")
    );
  }

  private extractUserId(profileLink: string): string | null {
    const match = profileLink.match(/user=([^&]+)/);
    return match ? match[1] : null;
  }

  private determinePublicationTypeFromDBLP(
    pub: cheerio.Cheerio
  ): (typeof publicationTypeEnum.enumValues)[number] {
    const jOrC = pub.prevAll("div.nr").text().trim().toLowerCase();
    return jOrC[1] === "c" ? "conference_paper" : "journal_article";
  }

  private extractISSN(text: string): string | undefined {
    const issnMatch = text.match(
      /(ISSN|eISSN)\s*[:=]?\s*([0-9]{4}-[0-9]{3}[0-9X])/i
    );
    return issnMatch?.[2];
  }
}

// Logger utility (logger.ts)
export class Logger {
  constructor(private context: string) {}

  log(message: string, data?: unknown) {
    console.log(`[${this.context}] ${message}`, data);
  }

  info(message: string, data?: unknown) {
    console.info(`[${this.context}] ${message}`, data);
  }

  warn(message: string, data?: unknown) {
    console.warn(`[${this.context}] ${message}`, data);
  }

  error(message: string, error?: unknown) {
    console.error(`[${this.context}] ${message}`, error);
  }
}

// Utility functions (utils.ts)
export async function retry<T>(
  fn: () => Promise<T>,
  maxRetries: number,
  delay = 5000
): Promise<T> {
  let lastError: unknown;

  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      if (i < maxRetries - 1) {
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }

  throw lastError;
}
