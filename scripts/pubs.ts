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

  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();
  const allResults: { chercheur: string; publications: PublicationData[] }[] = [];
  const publications: PublicationData[] = [];

  let hasGoogleScholar = false;
  let hasDBLP = false;

  try {
    // ---------- GOOGLE SCHOLAR ----------
    await page.goto(urlGoogleScholar, { waitUntil: 'networkidle2' });
    const htmlContent = await page.content();
    const $ = cheerio.load(htmlContent);
    const accLink = $('h4.gs_rt2 a').attr('href');

    if (accLink) {
      hasGoogleScholar = true;
      const profileUrl = `https://scholar.google.com/${accLink}`;
      await page.goto(profileUrl);

      // Load all results
      while (true) {
        try {
          await page.evaluate(() => window.scrollBy(0, window.innerHeight));
          const loadMore = await page.$('#gsc_bpf_more');
          if (!loadMore) break;
          const isDisabled = await page.$eval('#gsc_bpf_more', el => el.hasAttribute('disabled'));
          if (isDisabled) break;
          await loadMore.click();
          await new Promise(resolve => setTimeout(resolve, 2000));
        } catch (err) {
          break;
        }
      }

      const htmlScholar = await page.content();
      const $$ = cheerio.load(htmlScholar);
      var allGoogleScholarTitles = $$('.gsc_a_at');
    }

    // ---------- DBLP ----------
    const dblpHtml = (await axios.get(searchUrl)).data;
    const $$$ = cheerio.load(dblpHtml);
    const dblpPublishes = $$$('div.hideable cite.data');

    if (dblpPublishes.length > 0) {
      hasDBLP = true;

      for (let i = 0; i < dblpPublishes.length; i++) {
        const pub = $$$.load(dblpPublishes[i]);
        const titleTag = pub('span.title');
        const title = titleTag.text().trim();
        const volume_nom_a_tag = titleTag.next();

        let matchIndex = -1;
        let pubUrl = '';

        if (hasGoogleScholar) {
          matchIndex = allGoogleScholarTitles.toArray().findIndex(el =>
            isSimilar($$(el).text(), title)
          );
          if (matchIndex !== -1) {
            const scholarLink = $$(allGoogleScholarTitles[matchIndex]).attr('href');
            pubUrl = scholarLink ? `https://scholar.google.com${scholarLink}` : '';
            if (pubUrl) await page.goto(pubUrl);
          }
        }

        const pubDetails = pubUrl ? cheerio.load(await page.content()) : null;
        const fields = pubDetails ? pubDetails('div.gsc_oci_field') : null;

        const jOrC = pub.root().prevAll('div.nr')?.text().trim().toLowerCase();
        let lieu = '';

        if (jOrC?.[1] === 'c') {
          const confLink = volume_nom_a_tag.attr('href');
          if (confLink) {
            try {
              const confPage = await axios.get(confLink);
              const confSoup = cheerio.load(confPage.data);
              lieu = confSoup('h1').text().split(':')[1]?.trim() || '';
            } catch (error) {
              console.warn(`Failed to fetch conference location from ${confLink}:`);
            }
          }
        }

        const myData: PublicationData = {
          titre_publication: title,
          nombre_pages: pub('span[itemprop="pagination"]').text() || '',
          volumes: volume_nom_a_tag.find('span[itemprop="isPartOf"] span[itemprop="volumeNumber"]').text() || '',
          lien: pub.root().prevAll('nav.publ').find('a').attr('href') || '',
          annee: pub('span[itemprop="datePublished"]').text() || '',
          nom: volume_nom_a_tag.find('span[itemprop="isPartOf"] span[itemprop="name"]').text() || '',
          type: fields?.eq(2).text() || '',
          lieu: lieu || '',
        };

        publications.push(myData);
      }
    }

    if (!hasGoogleScholar && !hasDBLP) {
      console.warn(`❌ No Google Scholar or DBLP profile found for "${chercheurName}"`);
      await browser.close();
      return [];
    }

    allResults.push({ chercheur: chercheurName, publications });
  } catch (err) {
    console.error(`Error scraping ${chercheurName}:`, err);
  }

  await browser.close();
  return allResults;
}

