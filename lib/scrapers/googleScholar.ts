// lib/scrapers/googleScholar.ts

import puppeteer from 'puppeteer';
import axios from 'axios';
import * as cheerio from 'cheerio';
import Fuse from 'fuse.js';

type PublicationData = {
  titre_publication: string;
  nombre_pages: string;
  volumes: string;
  lien: string;
  annee: string;
  nom: string;
  type: string;
  lieu: string;
};

function isSimilar(a: string, b: string, threshold = 0.85): boolean {
  const fuse = new Fuse([b], { includeScore: true, threshold: 1, keys: [] });
  const result = fuse.search(a);
  return result.length > 0 && (result[0].score ?? 1) <= (1 - threshold);
}

export async function scrapeGoogleScholarPublications(chercheurName: string) {
  const cherName = chercheurName.replace(/\s+/g, '+');
  const searchUrl = `https://dblp.org/search/author?q=${cherName}`;
  const urlGoogleScholar = `https://scholar.google.com/scholar?q=${cherName}`;

  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  const allResults: { chercheur: string; publications: PublicationData[] }[] = [];

  try {
    await page.goto(urlGoogleScholar, { waitUntil: 'networkidle2' });
    const htmlContent = await page.content();
    const $ = cheerio.load(htmlContent);

    const accLink = $('h4.gs_rt2 a').attr('href');
    if (!accLink) {
      await browser.close();
      return [];
    }
    const profileUrl = `https://scholar.google.com/${accLink}`;

    await page.goto(profileUrl);

    while (true) {
      try {
        const loadMore = await page.$('#gsc_bpf_more');
        if (!loadMore) break;
        await loadMore.click();
        await page.waitForTimeout(1000);
      } catch {
        break;
      }
    }

    const htmlScholar = await page.content();
    const $$ = cheerio.load(htmlScholar);
    const allGoogleScholarTitles = $$('.gsc_a_at');
    const allGoogleScholarRows = $$('.gsc_a_t');

    const dblpHtml = (await axios.get(searchUrl)).data;
    const $$$ = cheerio.load(dblpHtml);
    const dblpPublishes = $$$('div.hideable cite.data');
    const publications: PublicationData[] = [];

    for (let i = 0; i < dblpPublishes.length; i++) {
      const pub = $$$(dblpPublishes[i]);
      const titleTag = pub.find('span.title');
      const title = titleTag.text().trim();
      const year = pub.closest('li.year').text();

      const matchIndex = allGoogleScholarTitles.toArray().findIndex(el =>
        isSimilar($$(el).text(), title)
      );

      if (matchIndex === -1) continue;

      const scholarLink = $$(allGoogleScholarTitles[matchIndex]).attr('href');
      const pubUrl = scholarLink ? `https://scholar.google.com${scholarLink}` : '';

      if (pubUrl) await page.goto(pubUrl);
      const pubDetails = cheerio.load(await page.content());
      const fields = pubDetails('div.gsc_oci_field');

      const myData: PublicationData = {
        titre_publication: title,
        nombre_pages: pub.find('span[itemprop="pagination"]').text() || '',
        volumes: pub.find('span[itemprop="volumeNumber"]').text() || '',
        lien: pub.closest('nav.publ').find('a').attr('href') || '',
        annee: year,
        nom: pub.find('span[itemprop="isPartOf"] span[itemprop="name"]').text() || '',
        type: fields.eq(2).text() || '',
        lieu: '',
      };

      publications.push(myData);
    }

    allResults.push({ chercheur: chercheurName, publications });
  } catch (err) {
    console.error(`Error scraping ${chercheurName}:`, err);
  }

  await browser.close();
  return allResults;
}
