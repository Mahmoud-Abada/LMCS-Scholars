import { Browser, chromium, type Page } from 'playwright';
import axios from 'axios';
import * as cheerio from 'cheerio';
import Fuse from 'fuse.js';
import { publicationTypeEnum, venueTypeEnum } from '@/db/schema';

type ScrapedPublication = {
  citationGraphData: { year: string; count: number; }[];
  referenceCount: number;
  citationGraphUrl: string;
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
  relatedArticlesLink?: string;
  allVersionsLink?: string;
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
    scholarId: any;
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

      // Try Google Scholar first 
      const googleScholarResults = await this.scrapeGoogleScholar(researcherName);
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

  private async scrapeGoogleScholar(researcherName: string): Promise<ScrapedPublication[]> {
    const publications: ScrapedPublication[] = [];
    if (!this.page) {
        throw new Error("Puppeteer page is not initialized");
    }

    try {
        // Configure request interception to block unnecessary resources
        await this.page.route('**/*', async (route, request) => {
            const resourceType = request.resourceType();
            if (['image', 'stylesheet', 'font', 'media'].includes(resourceType)) {
                await route.abort();
            } else {
                await route.continue();
            }
        });

        // Navigate to search page with retry mechanism
        const searchUrl = `https://scholar.google.com/scholar?q=${encodeURIComponent(researcherName)}`;
        await this.retryNavigation(searchUrl, { waitUntil: "domcontentloaded", timeout: 30000 });

        // Check if we got blocked
        if (await this.isBlocked()) {
            throw new Error("Google Scholar has blocked the scraper");
        }

        const htmlContent = await this.page.content();
        const $ = cheerio.load(htmlContent);
        const profileLink = $("h4.gs_rt2 a").attr("href");

        if (profileLink) {
            const profileUrl = `https://scholar.google.com/${profileLink}`;
            await this.retryNavigation(profileUrl, { waitUntil: "domcontentloaded", timeout: 30000 });

            // Load all publications with improved reliability
            await this.loadAllPublications();

            // Process publications in batches to avoid memory issues
            const batchSize = 10;
            const htmlScholar = await this.page.content();
            const $$ = cheerio.load(htmlScholar);
            const publicationElements = $$(".gsc_a_tr");

            for (let i = 0; i < publicationElements.length; i += batchSize) {
                const batch = publicationElements.slice(i, i + batchSize);
                for (const element of batch) {
                    try {
                        const publication = await this.extractPublicationData($$, element);
                        publications.push(publication);
                    } catch (err) {
                        console.error(`Error processing publication at index ${i}:`, err);
                    }
                }
            }
            
            // Process detailed information with rate limiting
           /* for (let i = 0; i < publications.length; i++) {
                const pub = publications[i];
                if (pub.url) {
                    try {
                        await this.processPublicationDetails(pub);
                        // Random delay between requests (2-5 seconds)
                        await this.page.waitForTimeout(2000 + Math.random() * 3000);
                    } catch (error) {
                        console.error(`Error processing details for ${pub.title}:`, error);
                    }
                }
            }*/
                const pub = publications[0];
                if (pub.url) {
                    try {
                        await this.processPublicationDetails(pub);
                        // Random delay between requests (2-5 seconds)
                        await this.page.waitForTimeout(2000 + Math.random() * 3000);
                    } catch (error) {
                        console.error(`Error processing details for ${pub.title}:`, error);
                    }
                }
                console.log("Processed publication details:", pub);
        }
    } catch (error) {
        console.error("Error in scrapeGoogleScholar:", error);
        throw error;
    } finally {
        // Reset request interception
        await this.page.unroute('**/*');
    }

    return publications;
}

// Helper methods:

private async retryNavigation(url: string, options: any, retries = 3): Promise<void> {
    for (let i = 0; i < retries; i++) {
        try {
            await this.page.goto(url, options);
            return;
        } catch (err) {
            if (i === retries - 1) throw err;
            await this.page.waitForTimeout(5000);
        }
    }
}

private async isBlocked(): Promise<boolean> {
    return await this.page.evaluate(() => {
        return document.body.innerText.includes("Sorry, we can't verify that you're not a robot") || 
               document.body.innerText.includes("Our systems have detected unusual traffic");
    });
}

private async loadAllPublications(): Promise<void> {
    let attempts = 0;
    const maxAttempts = 5;
    const maxScrolls = 50; // Safety limit
    
    for (let scrolls = 0; scrolls < maxScrolls; scrolls++) {
        try {
            await this.page.evaluate(() => window.scrollBy(0, window.innerHeight));
            const loadMore = await this.page.$("#gsc_bpf_more");
            
            if (!loadMore) break;
            
            const isDisabled = await this.page.$eval("#gsc_bpf_more", (el) => 
                el.hasAttribute("disabled")
            );
            
            if (isDisabled) break;
            
            await loadMore.click();
            await this.page.waitForResponse(response => 
                response.url().includes('citations') && response.status() === 200
            );
            attempts = 0; // Reset attempts on success
        } catch (err) {
            attempts++;
            console.error(`Attempt ${attempts} failed to load more results:`, err);
            if (attempts >= maxAttempts) break;
            await this.page.waitForTimeout(5000);
        }
    }
}

private extractPublicationData($$: cheerio.Root, element: cheerio.Element): ScrapedPublication {
    const titleElement = $$(element).find(".gsc_a_at");
    const title = titleElement.text().trim();
    const authors = $$(element).find(".gs_gray").first().text().trim();
    const venue = $$(element).find(".gs_gray").last().text().trim();
    const citedByText = $$(element).find(".gsc_a_c a").text().trim();
    const citedBy = citedByText ? parseInt(citedByText) || 0 : 0;
    const yearText = $$(element).find(".gsc_a_y").text().trim();
    const year = yearText ? parseInt(yearText) || 0 : 0;
    const relativeLink = titleElement.attr("href");
    const link = relativeLink ? `https://scholar.google.com${relativeLink}` : undefined;
    const pdfLink = $$(element).find(".gsc_a_ac a").attr("href");
    
    // Extract DOI if available
    let doi = '';
    const doiMatch = venue.match(/DOI:\s*([^\s]+)/i);
    if (doiMatch) doi = doiMatch[1];

    // Extract author scholar IDs
    const authorsWithIds = authors.split(',').map((name, i) => {
        const scholarLink = $$(element).find(".gs_gray a").eq(i).attr("href");
        const scholarId = scholarLink?.split('user=')[1]?.split('&')[0];
        return {
            name: name.trim(),
            position: i + 1,
            isCorresponding: i === 0,
            scholarId: scholarId || undefined
        };
    });

    // Extract citation cluster ID
    const clusterId = $$(element).find(".gsc_a_c a").attr("data-cid");

    return {
        title,
        abstract: '', // Will be populated from detailed page
        publicationType: this.determinePublicationType(title, venue),
        publicationDate: year ? new Date(year, 0, 1) : undefined,
        doi: doi || undefined,
        url: link,
        pdfUrl: pdfLink || undefined,
        citationCount: citedBy,
        pageCount: undefined,
        volume: undefined,
        issue: undefined,
        publisher: venue.split(',')[1]?.trim() || undefined,
        keywords: [],
        language: 'English',
        venue: {
            name: venue.split(',')[0]?.trim() || 'Unknown',
            type: this.determineVenueType(venue),
            issn: undefined,
            eissn: undefined,
            website: undefined,
            impactFactor: undefined,
            sjrIndicator: undefined,
            isOpenAccess: venue.toLowerCase().includes('open access')
        },
        authors: authorsWithIds,
        relatedArticlesLink: link ? `https://scholar.google.com/scholar?q=related:${titleElement.attr("id")}:scholar.google.com/` : undefined,
        allVersionsLink: clusterId ? `https://scholar.google.com/scholar?cluster=${clusterId}` : undefined,
        referenceCount: 0,
        citationGraphUrl: '',
        citationGraphData: []
    };
}

private async processPublicationDetails(pub: ScrapedPublication): Promise<void> {
    if (!pub.url || !this.page) return;

    try {
        await this.retryNavigation(pub.url, { waitUntil: 'domcontentloaded', timeout: 30000 });
        
        // Check if we got blocked
        if (await this.isBlocked()) {
            throw new Error("Google Scholar has blocked the scraper");
        }

        const detailHtml = await this.page.content();
        const $$$ = cheerio.load(detailHtml);

        // Extract abstract with multiple fallbacks
        pub.abstract = $$$('.gsh_csp').text().trim() 
            || $$$('.gs_rs').text().trim() 
            || $$$('.gsh_small .gsh_csp').text().trim() 
            || pub.abstract; // Keep existing if no new one found

        // Extract keywords from multiple possible locations
        const keywordsText = $$$('.gs_rs').text().trim() 
            || $$$('.gsh_kw').text().trim();
        
        if (keywordsText && pub.keywords.length === 0) {
            pub.keywords = keywordsText.split(/[,;]/).map(k => k.trim()).filter(k => k);
        }

        // Extract all metadata fields
        const metadata: Record<string, string> = {};
        $$$('.gs_scl').each((i, el) => {
            const field = $$$(el).find('.gsc_oci_field').text().trim().toLowerCase();
            const value = $$$(el).find('.gsc_oci_value').text().trim();
            if (field && value) {
                metadata[field] = value;
            }
        });

        // Update publication with metadata
        if (metadata.publisher && !pub.publisher) pub.publisher = metadata.publisher;
        if (metadata['published in'] && !pub.venue.name) pub.venue.name = metadata['published in'];
        if (metadata.issn) pub.venue.issn = metadata.issn;
        if (metadata['e-issn']) pub.venue.eissn = metadata['e-issn'];
        if (metadata.website) pub.venue.website = metadata.website;
        if (metadata.volume) pub.volume = metadata.volume;
        if (metadata.issue) pub.issue = metadata.issue;
        if (metadata.pages && !pub.pageCount) pub.pageCount = this.parsePageCount(metadata.pages);
        if (metadata['total citations']) {
            pub.citationCount = parseInt(metadata['total citations'].replace(/,/g, '')) || pub.citationCount;
        }

        // Extract PDF link if available
        const detailPdfLink = $$$('a[href*="pdf"]').attr('href');
        if (detailPdfLink && !pub.pdfUrl) {
            pub.pdfUrl = detailPdfLink;
        }

        // Extract references count if available
        const referencesText = $$$('a:contains("References")').text();
        if (referencesText) {
            const refMatch = referencesText.match(/(\d+)\s*References/);
            if (refMatch) {
                pub.referenceCount = parseInt(refMatch[1]);
            }
        }

        // Extract citation graph data if available
        const citationGraph = $$$('img[src*="citations?view"]').attr('src');
        if (citationGraph) {
            pub.citationGraphUrl = `https://scholar.google.com${citationGraph}`;
        }

        // Extract yearly citation data
        const citationYears: {year: string; count: number}[] = [];
        $$$('.gsc_oci_g_a').each((i, el) => {
            const year = $$$(el).find('.gsc_oci_g_t').text().trim();
            const count = parseInt($$$(el).find('.gsc_oci_g_al').text().trim()) || 0;
            if (year && !isNaN(count)) {
                citationYears.push({year, count});
            }
        });
        if (citationYears.length > 0) {
            pub.citationGraphData = citationYears;
        }

        // Extract any missing author scholar IDs
        $$$('.gs_scl:contains("Auteurs") .gsc_oci_value a').each((i, el) => {
            if (i < pub.authors.length) {
                const scholarId = $$$(el).attr('href')?.split('user=')[1]?.split('&')[0];
                if (scholarId && !pub.authors[i].scholarId) {
                    pub.authors[i].scholarId = scholarId;
                }
            }
        });
    } catch (error) {
        console.error(`Error processing details for ${pub.title}:`, error);
        throw error;
    }
}

  private async scrapeDBLP(researcherName: string): Promise<ScrapedPublication[]> {
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

      const publication: ScrapedPublication = {
          title: title,
          publicationType: jOrC[1] === "c" ? 'conference_paper' : 'journal_article',
          //status: 'published',
          pageCount: this.parsePageCount(pub.find('span[itemprop="pagination"]').text()),
          volume: venueInfoTag.find('span[itemprop="isPartOf"] span[itemprop="volumeNumber"]').text() || undefined,
          issue: venueInfoTag.find('span[itemprop="issueNumber"]').text() || undefined,
          url: pub.prevAll("nav.publ").find("a").attr("href") || undefined,
          doi: pub.find('span[itemprop="sameAs"]').text().trim() || undefined,
          publicationDate: pub.find('span[itemprop="datePublished"]').text() ?
              new Date(parseInt(pub.find('span[itemprop="datePublished"]').text()), 0, 1) : undefined,
          publisher: venueInfoTag.find('span[itemprop="publisher"]').text().trim() || undefined,
          language: 'English',
          venue: {
              name: venueInfoTag.find('span[itemprop="isPartOf"] span[itemprop="name"]').text() || 'Unknown',
              type: jOrC[1] === "c" ? 'conference' : 'journal',
              issn: this.extractISSN(venueInfoTag.text()),
              eissn: this.extractISSN(venueInfoTag.text()),
              website: venueInfoTag.find('a[itemprop="url"]').attr('href') || undefined,
              location: location,
              isOpenAccess: pub.find('img[alt="Open Access"]').length > 0
          },
          authors: venueInfoTag.prevAll('span[itemprop="author"]').map((i, el) => ({
              name: $(el).text().trim(),
              position: i + 1,
              isCorresponding: i === 0,
              affiliationDuringWork: $(el).attr('title') || undefined
          })).get(),
          referenceCount: 0,
          citationCount: parseInt(pub.find('span[itemprop="citationCount"]').text().trim() || "0"),
          citationGraphUrl: ''
      };

      // Get Scimago metrics if journal
      if (publication.venue.type === 'journal' && publication.venue.name) {
        publication.venue.sjrIndicator = (await this.getJournalSJR(publication.venue.name)) ?? undefined;
        publication.venue.impactFactor = await this.getJournalImpactFactor(publication.venue.name);
      }

      publications.push(publication);
    }

    return publications;
}

private async getJournalImpactFactor(journalName: string): Promise<number | undefined> {
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

  // Helper methods from 
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