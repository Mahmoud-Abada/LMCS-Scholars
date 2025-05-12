import * as cheerio from "cheerio";
import { chromium, type BrowserContext, type Page } from "playwright";
import { Logger, retry } from "./scraper";

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

export type ScrapedPublication = {
  authors?: string[];
  journal?: string;
  title: string;
  abstract?: string;
  publicationType: string;
  publicationDate?: Date;
  doi?: string;
  url?: string;
  pdfUrl?: string;
  citationCount?: number;
  pages?: string;
  volume?: string;
  scholarLink?: string;
  issue?: string;
  publisher?: string;
  language?: string;
  googleScholarArticles?: { title: string; link: string }[];
  citationGraph?: { year: number; count: number }[];
  venue: {
    publisher: string;
    name: string;
    type: string;
    issn?: string;
    eissn?: string;
    isOpenAccess?: boolean;
  };
};

export class GoogleScholarScraper {
  private browser: BrowserContext | null = null;
  private page: Page | null = null;
  private isInitialized = false;
  private config: ScraperConfig;
  private logger: Logger;

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
      const launchOptions: any = {
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

  public async scrapeResearcherPublications(
    researcherName: string,
    profileLink?: string
  ): Promise<ScrapedPublication[]> {
    await this.ensureReady();
    // const scrapedPublications: ScrapedPublication[] = [];

    try {
      this.page = await this.browser!.newPage();
      await this.configurePage();

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

      // Navigate to profile with human-like behavior
      await retry(async () => {
        await this.humanLikeDelay(2000, 5000);
        await this.page!.goto(profileLink!, {
          waitUntil: "networkidle",
          referer: "https://www.google.com/",
          timeout: this.config.timeout,
        });

        await this.simulateHumanInteraction();
      }, this.config.maxRetries);

      if (await this.isBlocked()) {
        throw new Error("Google Scholar has blocked the scraper");
      }

      if (!this.page) throw new Error("Page is not initialized");
      const bodyHTML = await this.page.content();
      if (bodyHTML.toLowerCase().includes("i'm not a robot")) {
        throw new Error("Blocked by CAPTCHA");
      }

      const publicationLinks = await this.collectPublicationLinks(userId);
      const publications: ScrapedPublication[] = [];

      for (const link of publicationLinks) {
        try {
          await this.humanLikeDelay(
            this.config.delayBetweenRequests,
            this.config.delayBetweenRequests * 2
          );

          await this.page.goto(link, { waitUntil: "networkidle" });
          await this.page.waitForSelector("#gs_bdy", { timeout: 10000 });
          await this.simulateHumanInteraction();

          const html = await this.page.content();
          const publication = await this.scrapeGoogleScholarPublication(html);

          if (publication) {
            publication.scholarLink = link;
            publications.push(publication);
          }
        } catch (error) {
          this.logger.warn(`Failed to scrape publication at ${link}`, error);
          // Rotate IP or change fingerprint if we hit a block
          if (await this.isBlocked()) {
            await this.rotateFingerprint();
          }
        }
      }

      return publications;
    } catch (error) {
      this.logger.error("Google Scholar scraping failed", error);
      return [];
    } finally {
      if (this.page) await this.page.close();
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

  private normalizeField(field: string): string {
    return field
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/\s+/g, "")
      .replace(/[^a-z0-9]/g, "");
  }

  private async isBlocked(): Promise<boolean> {
    if (!this.page) return false;
    const content = await this.page.content();
    return (
      content.includes("Sorry, we can't verify that you're not a robot") ||
      content.includes("Our systems have detected unusual traffic") ||
      content.includes("CAPTCHA") ||
      content.includes("automated queries")
    );
  }

  private extractUserId(profileLink: string): string | null {
    const match = profileLink.match(/user=([^&]+)/);
    return match ? match[1] : null;
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

  private determineVenueType(title: string = "", venue: string = ""): string {
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

  private async ensureReady(): Promise<void> {
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
      this.logger.info("Browser successfully closed");
    } catch (error) {
      this.logger.error("Error closing browser", error);
    }
  }
}
