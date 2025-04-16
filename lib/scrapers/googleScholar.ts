// pages/api/add-publications.ts

import { NextApiRequest, NextApiResponse } from 'next';
import puppeteer from 'puppeteer';
import axios from 'axios';
import * as cheerio from 'cheerio';
import Fuse from 'fuse.js';



// Placeholder types (replace with your actual Prisma or DB models)
type Searcher = {
  id: number;
  nom_complet: string;
};

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

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  // Simulate fetching all researchers
  const chercheurs: Searcher[] = await getAllSearchers();

  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();

  for (const cher of chercheurs) {
    const cherName = cher.nom_complet.replace(/\s+/g, '+');
    const searchUrl = `https://dblp.org/sea
    rch/author?q=${cherName}`;
    const urlGoogleScholar = `https://scholar.google.com/scholar?q=${cherName}`;

    try {
      await page.goto(urlGoogleScholar, { waitUntil: 'networkidle2' });
      const htmlContent = await page.content();
      const $ = cheerio.load(htmlContent);

      const accLink = $('h4.gs_rt2 a').attr('href');
      if (!accLink) continue;
      const profileUrl = `https://scholar.google.com/${accLink}`;

      await page.goto(profileUrl);

      // Load more publications
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

      // Fetch DBLP data
      const dblpHtml = (await axios.get(searchUrl)).data;
      const $$$ = cheerio.load(dblpHtml);
      const dblpPublishes = $$$('div.hideable cite.data');

      for (let i = 0; i < dblpPublishes.length; i++) {
        const pub = $$$$(dblpPublishes[i]);
        const titleTag = pub.find('span.title');
        const title = titleTag.text().trim();
        const year = pub.closest('li.year').text();

        const matchIndex = allGoogleScholarTitles.toArray().findIndex(el =>
          isSimilar($$(el).text(), title)
        );

        if (matchIndex === -1) continue;

        const scholarRow = allGoogleScholarRows[matchIndex];
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
          lieu: '', // Optional, scrape if needed
        };

        // Save to DB (replace this with actual DB logic)
        await savePublication(myData);
      }

    } catch (err) {
      console.error(`Error scraping ${cher.nom_complet}:`, err);
      continue;
    }
  }

  await browser.close();

  return res.json({ message: 'All publications have been saved to the database.' });
}

// Dummy functions to simulate DB logic
async function getAllSearchers(): Promise<Searcher[]> {
  return [
    { id: 1, nom_complet: 'John Doe' },
    { id: 2, nom_complet: 'Jane Smith' }
  ];
}

async function savePublication(data: PublicationData) {
  console.log('Saving publication:', data.titre_publication);
}
