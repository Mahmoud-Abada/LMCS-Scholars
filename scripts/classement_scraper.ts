import { chromium, type Page } from 'playwright';

async function getJournalSJR(journalName: string): Promise<string | null> {
  const browser = await chromium.launch({
    headless: false,
    executablePath: '/usr/bin/chromium', // replace with actual path
  });
  
  const page: Page = await browser.newPage();

  try {
    await page.goto('https://www.scimagojr.com/', { timeout: 30000 });

    // Fill the search box and press Enter
    await page.fill('#searchbox input[name="q"]', journalName);
    await page.keyboard.press('Enter');

    // Wait for and click the first result
    await page.waitForSelector('.search_results > a', { timeout: 10000 });
    const firstResult = await page.$('.search_results > a');
    if (!firstResult) {
      console.log("No results found.");
      await browser.close();
      return null;
    }

    await firstResult.click();

    // Wait for SJR value to load
    await page.waitForSelector('p.hindexnumber', { timeout: 15000 });
    const element = await page.$('p.hindexnumber');

    if (!element) {
      console.log("SJR element not found.");
      await browser.close();
      return null;
    }

    const text = await element.innerText();
    const sjrValue = text.split(' ')[0]; // Just the numeric value

    await browser.close();
    return sjrValue;
  } catch (error) {
    console.error("Error occurred:", error);
    await browser.close();
    return null;
  }
}

// test
(async () => {
  const journal = "Journal of Machine Learning Research";
  const sjr = await getJournalSJR(journal);
  console.log(`SJR Value: ${sjr}`);
})();

/*

// Combined and Enhanced Scholar + SJR Scraper

import puppeteer from 'puppeteer';
import { chromium, type Page } from 'playwright';
import axios from 'axios';
import * as cheerio from 'cheerio';
import Fuse from 'fuse.js';

interface Publication {
  title: string;
  pageCount: string;
  volume: string;
  url: string;
  year: string;
  journalOrConference: string;
  type: string;
  location: string;
  sjr?: string | null;
}

function isSimilarTitle(titleA: string, titleB: string, threshold = 0.85): boolean {
  const fuse = new Fuse([titleB], { includeScore: true, threshold: 1 });
  const result = fuse.search(titleA);
  return result.length > 0 && (result[0].score ?? 1) <= (1 - threshold);
}

async function getSJRValue(journalName: string): Promise<string | null> {
  const browser = await chromium.launch({
    headless: true,
    executablePath: '/usr/bin/chromium',
  });
  const page: Page = await browser.newPage();

  try {
    await page.goto('https://www.scimagojr.com/', { timeout: 30000 });
    await page.fill('#searchbox input[name="q"]', journalName);
    await page.keyboard.press('Enter');
    await page.waitForSelector('.search_results > a', { timeout: 10000 });

    const firstResult = await page.$('.search_results > a');
    if (!firstResult) return null;
    await firstResult.click();

    await page.waitForSelector('p.hindexnumber', { timeout: 15000 });
    const element = await page.$('p.hindexnumber');
    if (!element) return null;

    const text = await element.innerText();
    return text.split(' ')[0];
  } catch (error) {
    console.error(`SJR scraping error:`, error);
    return null;
  } finally {
    await browser.close();
  }
}

export async function scrapeScholarAndSJR(researcherName: string) {
  const formattedName = researcherName.trim().replace(/\s+/g, '+');
  const scholarSearchUrl = `https://scholar.google.com/scholar?q=${formattedName}`;
  const dblpSearchUrl = `https://dblp.org/search/author?q=${formattedName}`;

  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  const results: { researcher: string; publications: Publication[] } = {
    researcher: researcherName,
    publications: [],
  };

  try {
    await page.goto(scholarSearchUrl, { waitUntil: 'networkidle2' });
    const $ = cheerio.load(await page.content());
    const profilePath = $('h4.gs_rt2 a').attr('href');
    if (!profilePath) return [];

    const profileUrl = `https://scholar.google.com/${profilePath}`;
    await page.goto(profileUrl, { waitUntil: 'networkidle2' });

    while (true) {
      const loadMoreBtn = await page.$('#gsc_bpf_more');
      if (!loadMoreBtn) break;
      const isDisabled = await page.$eval('#gsc_bpf_more', btn => btn.hasAttribute('disabled'));
      if (isDisabled) break;
      await loadMoreBtn.click();
      await new Promise(resolve => setTimeout(resolve, 2000));
    }

    const $scholar = cheerio.load(await page.content());
    const scholarTitles = $scholar('.gsc_a_at');

    const dblpHtml = (await axios.get(dblpSearchUrl)).data;
    const $dblp = cheerio.load(dblpHtml);
    const dblpCitations = $dblp('div.hideable cite.data');

    for (let i = 0; i < dblpCitations.length; i++) {
      const citation = $dblp(dblpCitations[i]);
      const titleTag = citation.find('span.title');
      const title = titleTag.text().trim();

      const matchedIndex = scholarTitles.toArray().findIndex(el =>
        isSimilarTitle($scholar(el).text(), title)
      );
      if (matchedIndex === -1) continue;

      const scholarLink = $scholar(scholarTitles[matchedIndex]).attr('href');
      const publicationUrl = scholarLink ? `https://scholar.google.com${scholarLink}` : '';
      let location = '', sjr: string | null = null;

      if (publicationUrl) {
        await page.goto(publicationUrl, { waitUntil: 'domcontentloaded' });
        const $detail = cheerio.load(await page.content());
        const fields = $detail('div.gsc_oci_field');

        const isConference = citation.prevAll('div.nr')?.text()?.toLowerCase().includes('c');
        if (isConference) {
          const confLink = titleTag.next().attr('href');
          if (confLink) {
            try {
              const confPage = await axios.get(confLink);
              const $conf = cheerio.load(confPage.data);
              location = $conf('h1').text().split(':')[1]?.trim() || '';
            } catch (error) {
              console.warn(`Failed to fetch location from ${confLink}:`, error);
            }
          }
        }

        const journalOrConference = titleTag.next().find('span[itemprop="name"]').text() || '';
        sjr = journalOrConference ? await getSJRValue(journalOrConference) : null;

        const publication: Publication = {
          title,
          pageCount: citation.find('span[itemprop="pagination"]').text() || '',
          volume: titleTag.next().find('span[itemprop="volumeNumber"]').text() || '',
          url: citation.prevAll('nav.publ').find('a').attr('href') || '',
          year: citation.find('span[itemprop="datePublished"]').text() || '',
          journalOrConference,
          type: fields.eq(2).text() || '',
          location,
          sjr,
        };

        results.publications.push(publication);
      }
    }
  } catch (error) {
    console.error(`Scraping error for ${researcherName}:`, error);
  } finally {
    await browser.close();
  }

  return [results];
}

// Example usage
(async () => {
  const data = await scrapeScholarAndSJR('MOULOUD KOUDIL');
  console.log(JSON.stringify(data, null, 2));
})();
*/