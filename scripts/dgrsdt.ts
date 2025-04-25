import { chromium } from 'playwright';

const CATEGORY_B_SUBCATEGORIES = [
  "ABDC", "De_Gruyter", "Erih_plus", "Journal_quality",
  "AERES", "CNRS", "SCOPUS", "Finacial_Times"
];

async function getJournalInfo(journalName: string) {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  // === CATEGORY A ===
  console.log(`🔎 Searching Category A ➜ ${journalName}`);
  try {
    await page.goto("https://www.dgrsdt.dz/fr/revues_A", { timeout: 60000 });
    await page.waitForSelector("input.input-search-job", { timeout: 30000 });

    const searchInput = await page.$("input.input-search-job");
    if (searchInput) {
      await searchInput.fill(journalName);
      await page.waitForTimeout(2000); // Let DOM update

      const rows = await page.$$("li.table-row");
      for (const row of rows) {
        const text = await row.innerText();
        if (text.toLowerCase().includes(journalName.toLowerCase())) {
          const cols = await row.$$("div.col");
          await printJournal(cols);
          await browser.close();
          return;
        }
      }
    }
  } catch {
    console.log("⚠️ Failed to process Category A");
  }

  // === CATEGORY B ===
  console.log(`🔎 Searching Category B ➜ ${journalName}`);
  await page.goto("https://www.dgrsdt.dz/fr/revues_B", { timeout: 60000 });

  for (const subcat of CATEGORY_B_SUBCATEGORIES) {
    console.log(`🔄 Trying subcategory ➜ ${subcat}`);
    try {
      const button = await page.$(`button#${subcat}`);
      if (!button) continue;

      await button.click();
      await page.waitForSelector("input.input-search-job", { timeout: 5000 });

      const searchInput = await page.$("input.input-search-job");
      if (searchInput) {
        await searchInput.fill(journalName);
        await page.waitForTimeout(2000);

        const rows = await page.$$("li.table-row");
        for (const row of rows) {
          const text = await row.innerText();
          if (text.toLowerCase().includes(journalName.toLowerCase())) {
            const cols = await row.$$("div.col");
            await printJournal(cols, subcat);
            await browser.close();
            return;
          }
        }
      }
    } catch (e) {
      console.log(`⚠️ Failed to search in subcategory ${subcat} ➜ ${e}`);
    }
  }

  console.log(`❌ Journal not found in Category A or B`);
  await browser.close();
}

async function printJournal(cols: any[], subcat?: string) {
  console.log("\n📘 Journal:", await cols[0].innerText());
  console.log("🏢 Publisher:", await cols[1].innerText());
  console.log("📚 ISSN:", await cols[2].innerText());
  console.log("🌐 EISSN:", await cols[3].innerText());
  if (subcat) {
    console.log("🏷️ Subcategory:", subcat);
  }
}

// test
const journal = "3D Printing and Additive Manufacturing";
getJournalInfo(journal);
