import { chromium, Page } from 'playwright';

async function getJournalSJR(journalName: string): Promise<string | null> {
  const browser = await chromium.launch({ headless: false });
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
