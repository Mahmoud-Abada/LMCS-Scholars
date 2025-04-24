import { Browser, chromium, type Page } from 'playwright';
import axios from 'axios';
import * as cheerio from 'cheerio';
import Fuse from 'fuse.js';
import { publicationTypeEnum, venueTypeEnum } from '@/db/schema';

type ScrapedPublication = {
  title: string;
  abstract?: string;
  publicationType: typeof publicationTypeEnum.enumValues[number];
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
  keywords?: string[];
  language: string;
  venue: {
    name: string;
    type: typeof venueTypeEnum.enumValues[number];
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
    this.init().catch(err => {
      console.error('Failed to initialize scraper:', err);
    });
  }

  private async init(): Promise<void> {
    try {
      this.browser = await chromium.launch({ 
        headless: true,
        timeout: 30000
      });
      this.isInitialized = true;
    } catch (error) {
      console.warn('Standard browser launch failed, trying with alternate options...');
      try {
        this.browser = await chromium.launch({ 
          headless: true,
          executablePath: '/usr/bin/chromium',
          timeout: 30000
        });
        this.isInitialized = true;
      } catch (fallbackError) {
        console.error('Both browser launch attempts failed:', fallbackError);
        throw new Error(
          'Failed to launch browser. Please ensure Playwright is properly installed.\n' +
          'Run: npx playwright install\n' +
          'Or install chromium manually: sudo apt-get install chromium'
        );
      }
    }
  }

  public async ensureReady(): Promise<void> {
    if (!this.isInitialized) {
      await this.init();
    }
    if (!this.browser) {
      throw new Error('Browser not initialized');
    }
  }

  public async close(): Promise<void> {
    try {
      if (this.page) await this.page.close();
      if (this.browser) await this.browser.close();
      this.isInitialized = false;
    } catch (error) {
      console.error('Error closing browser:', error);
    }
  }

  public async scrapeResearcherPublications(researcherName: string): Promise<ScrapedPublication[]> {
    await this.ensureReady();
    if (!this.browser) throw new Error('Browser not available');

    try {
      this.page = await this.browser.newPage();
      const results: ScrapedPublication[] = [];

      // Try Google Scholar first (original logic)
      const googleScholarResults = await this.scrapeGoogleScholarOriginal(researcherName);
      results.push(...googleScholarResults);

      // Fallback to DBLP if needed (original logic)
      if (results.length < 5) {
        const dblpResults = await this.scrapeDBLPOriginal(researcherName);
        results.push(...dblpResults.filter(pub => 
          !results.some(existing => this.isSimilar(existing.title, pub.title))
        ));
      }

      return results;
    } finally {
      if (this.page) await this.page.close();
    }
  }

  private async scrapeGoogleScholarOriginal(researcherName: string): Promise<ScrapedPublication[]> {
    const publications: ScrapedPublication[] = [];
    if (!this.page) return publications;

    const searchUrl = `https://scholar.google.com/scholar?q=${encodeURIComponent(researcherName)}`;
    await this.page.goto(searchUrl, { waitUntil: "networkidle" });
    const htmlContent = await this.page.content();
    const $ = cheerio.load(htmlContent);
    const profileLink = $("h4.gs_rt2 a").attr("href");
    let allGoogleScholarTitles;

    if (profileLink) {
      const profileUrl = `https://scholar.google.com/${profileLink}`;
      await this.page.goto(profileUrl);

      // Original "Show more" click logic
      while (true) {
        try {
          await this.page.evaluate(() => window.scrollBy(0, window.innerHeight));
          const loadMore = await this.page.$("#gsc_bpf_more");
          if (!loadMore) break;
          const isDisabled = await this.page.$eval("#gsc_bpf_more", (el) =>
            el.hasAttribute("disabled")
          );
          if (isDisabled) break;
          await loadMore.click();
          await this.page.waitForTimeout(2000);
        } catch (err) {
          console.error("Error loading more results:", err);
          break;
        }
      }

      const htmlScholar = await this.page.content();
      const $$ = cheerio.load(htmlScholar);
      allGoogleScholarTitles = $$(".gsc_a_at");

      // Process publications (original logic)
      allGoogleScholarTitles.each((index, element) => {
        const title = $$(element).text().trim();
        const authors = $$(element).closest('tr').find('.gs_gray').first().text().trim();
        const venue = $$(element).closest('tr').find('.gs_gray').last().text().trim();
        const citedBy = parseInt($$(element).closest('tr').find('.gsc_a_c a').text().trim() || "0");
        const year = parseInt($$(element).closest('tr').find('.gsc_a_y').text().trim()) || 0;
        const link = `https://scholar.google.com${$$(element).attr('href')}`;

        publications.push({
          title,
          publicationType: this.determinePublicationType(title, venue),
          //status: 'published',
          publicationDate: year ? new Date(year, 0, 1) : undefined,
          citationCount: citedBy,
          url: link,
          language: 'English',
          venue: {
            name: venue.split(',')[0]?.trim() || 'Unknown',
            type: this.determineVenueType(venue),
            isOpenAccess: venue.toLowerCase().includes('open access')
          },
          authors: authors.split(',')
            .map((name, i) => ({
              name: name.trim(),
              position: i + 1,
              isCorresponding: i === 0
            }))
        });
      });
    }

    return publications;
  }

  private async scrapeDBLPOriginal(researcherName: string): Promise<ScrapedPublication[]> {
    const publications: ScrapedPublication[] = [];
    if (!this.page) return publications;

    const searchUrl = `https://dblp.org/search?q=${encodeURIComponent(researcherName)}`;
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
            console.warn(`Failed to fetch conference location from ${confLink}:`, error);
          }
        }
      }

      publications.push({
        title: title,
        publicationType: jOrC[1] === "c" ? 'conference_paper' : 'journal_article',
        //status: 'published',
        pageCount: this.parsePageCount(pub.find('span[itemprop="pagination"]').text()) || undefined,
        volume: venueInfoTag.find('span[itemprop="isPartOf"] span[itemprop="volumeNumber"]').text() || undefined,
        url: pub.prevAll("nav.publ").find("a").attr("href") || undefined,
        publicationDate: pub.find('span[itemprop="datePublished"]').text() ? 
          new Date(parseInt(pub.find('span[itemprop="datePublished"]').text()), 0, 1) : undefined,
        venue: {
          name: venueInfoTag.find('span[itemprop="isPartOf"] span[itemprop="name"]').text() || 'Unknown',
          type: jOrC[1] === "c" ? 'conference' : 'journal',
          issn: this.extractISSN(venueInfoTag.text()),
          location: location
        },
        authors: venueInfoTag.prevAll('span[itemprop="author"]').map((i, el) => ({
          name: $(el).text().trim(),
          position: i + 1,
          isCorresponding: i === 0
        })).get(),
        language: 'English'
      });
    }

    return publications;
  }

  // Original similarity check
  private isSimilar(a: string, b: string, threshold = 0.85): boolean {
    const fuse = new Fuse([b], { includeScore: true, threshold: 1, keys: [] });
    const result = fuse.search(a);
    return result.length > 0 && (result[0].score ?? 1) <= 1 - threshold;
  }

  // Original journal SJR lookup
  private async getJournalSJR(journalName: string): Promise<number | null> {
    if (!this.page) return null;

    try {
      await this.page.goto('https://www.scimagojr.com/', { timeout: 30000 });
      await this.page.fill('#searchbox input[name="q"]', journalName);
      await this.page.keyboard.press('Enter');
      
      await this.page.waitForSelector('.search_results > a', { timeout: 10000 });
      const firstResult = await this.page.$('.search_results > a');
      if (!firstResult) return null;

      await firstResult.click();
      await this.page.waitForSelector('p.hindexnumber', { timeout: 15000 });
      const element = await this.page.$('p.hindexnumber');
      if (!element) return null;

      const text = await element.innerText();
      return parseFloat(text.split(' ')[0]) || null;
    } catch (error) {
      console.error("Journal SJR lookup failed:", error);
      return null;
    }
  }

  // Helper methods from original
  private determinePublicationType(title: string, venue: string): typeof publicationTypeEnum.enumValues[number] {
    const lowerVenue = venue.toLowerCase();
    if (lowerVenue.includes('conf') || lowerVenue.includes('symposium') || lowerVenue.includes('workshop')) {
      return 'conference_paper';
    }
    if (lowerVenue.includes('book') || lowerVenue.includes('chapter')) {
      return 'book_chapter';
    }
    if (lowerVenue.includes('thesis') || lowerVenue.includes('dissertation')) {
      return 'thesis';
    }
    if (title.toLowerCase().includes('patent')) {
      return 'patent';
    }
    if (lowerVenue.includes('arxiv') || lowerVenue.includes('preprint')) {
      return 'preprint';
    }
    return 'journal_article';
  }

  private determineVenueType(venue: string): typeof venueTypeEnum.enumValues[number] {
    const lowerVenue = venue.toLowerCase();
    if (lowerVenue.includes('conf') || lowerVenue.includes('proceedings')) {
      return 'conference';
    }
    if (lowerVenue.includes('workshop')) {
      return 'workshop';
    }
    if (lowerVenue.includes('symposium')) {
      return 'symposium';
    }
    if (lowerVenue.includes('book') || lowerVenue.includes('chapter')) {
      return 'book';
    }
    return 'journal';
  }

  private parsePageCount(pages: string): number | undefined {
    const match = pages.match(/(\d+)\s*-\s*(\d+)/);
    return match ? parseInt(match[2]) - parseInt(match[1]) + 1 : undefined;
  }

  private extractISSN(text: string): string | undefined {
    const issnMatch = text.match(/(ISSN|eISSN)\s*[:=]?\s*([0-9]{4}-[0-9]{3}[0-9X])/i);
    return issnMatch?.[2];
  }
}