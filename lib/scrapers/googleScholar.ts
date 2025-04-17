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

  const browser = await puppeteer.launch({ headless: true });
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
        // Scroll to bottom to ensure the button is visible
        await page.evaluate(() => window.scrollBy(0, window.innerHeight));
    
        // Check if button exists and is enabled
        const loadMore = await page.$('#gsc_bpf_more');
        if (!loadMore) break;
    
        const isDisabled = await page.$eval('#gsc_bpf_more', el => el.hasAttribute('disabled'));
        if (isDisabled) break;
    
        // Click and wait for more items to load
        await loadMore.click();
        await new Promise(resolve => setTimeout(resolve, 2000));
 // Longer wait to ensure items load
      } catch (err) {
        console.error('Error loading more results:', err);
        break;
      }
    }
    
    await page.screenshot({ path: 'scholar-full-page.png', fullPage: true });


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
      const volume_nom_a_tag = titleTag.next();

      const matchIndex = allGoogleScholarTitles.toArray().findIndex(el =>
        isSimilar($$(el).text(), title)
      );

      if (matchIndex === -1) continue;

      const scholarLink = $$(allGoogleScholarTitles[matchIndex]).attr('href');
      const pubUrl = scholarLink ? `https://scholar.google.com${scholarLink}` : '';

      if (pubUrl) await page.goto(pubUrl);
      const pubDetails = cheerio.load(await page.content());
      const fields = pubDetails('div.gsc_oci_field');
      const jOrC = pub.prevAll('div.nr')?.text().trim().toLowerCase();
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
        nombre_pages: pub.find('span[itemprop="pagination"]').text() || '',
        volumes: volume_nom_a_tag.find('span[itemprop="isPartOf"] span[itemprop="volumeNumber"]').text() || '',
        lien: pub.prevAll('nav.publ').find('a').attr('href') || '',
        annee: pub.find('span[itemprop="datePublished"]').text() || '',
        nom: volume_nom_a_tag.find('span[itemprop="isPartOf"] span[itemprop="name"]').text() || '',
        type: fields.eq(2).text() || '',
        lieu: lieu || '',
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
