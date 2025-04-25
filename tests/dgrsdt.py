from playwright.sync_api import sync_playwright
import time
from difflib import SequenceMatcher

CATEGORY_B_SUBCATEGORIES = [
    "ABDC", "De_Gruyter", "Erih_plus", "Journal_quality",
    "AERES", "CNRS", "SCOPUS", "Finacial_Times"
]

def is_similar(a, b, threshold=0.85):
    return SequenceMatcher(None, a.lower(), b.lower()).ratio() >= threshold

def get_journal_info(journal_name: str):
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=False)
        page = browser.new_page()

        # === CATEGORY A ===
        print(f"🔎 Searching Category A ➜ {journal_name}")
        page.goto("https://www.dgrsdt.dz/fr/revues_A", timeout=60000)
        try:
            page.wait_for_selector("input.input-search-job", timeout=30000)
            search_input = page.query_selector("input.input-search-job")
            search_input.fill(journal_name)
            time.sleep(2)  # Let DOM update

            rows = page.query_selector_all("ul.responsive-table li.table-row")
            for row in rows:
                title_div = row.query_selector('div[data-label="Journal_Title"]')
                if title_div and is_similar(journal_name, title_div.inner_text()):
                    cols = row.query_selector_all("div.col")
                    print_journal(cols)
                    browser.close()
                    return
        except Exception as e:
            print(f"⚠️ Failed to process Category A ➜ {e}")

        # === CATEGORY B ===
        print(f"🔎 Searching Category B ➜ {journal_name}")
        page.goto("https://www.dgrsdt.dz/fr/revues_B", timeout=60000)

        for subcat in CATEGORY_B_SUBCATEGORIES:
            print(f"🔄 Trying subcategory ➜ {subcat}")
            try:
                button = page.query_selector(f"button#{subcat}")
                if not button:
                    continue
                button.click()
                page.wait_for_selector("input.input-search-job", timeout=5000)
                search_input = page.query_selector("input.input-search-job")
                search_input.fill(journal_name)
                time.sleep(2)

                rows = page.query_selector_all("ul.responsive-table li.table-row")
                for row in rows:
                    title_div = row.query_selector('div[data-label="Journal_Title"]')
                    if title_div and is_similar(journal_name, title_div.inner_text()):
                        cols = row.query_selector_all("div.col")
                        print_journal(cols, subcat)
                        browser.close()
                        return
            except Exception as e:
                print(f"⚠️ Failed to search in subcategory {subcat} ➜ {e}")

        print(f"❌ Journal not found in Category A or B")
        browser.close()

def print_journal(cols, subcat=None):
    print("\n📘 Journal:", cols[0].inner_text())
    print("🏢 Publisher:", cols[1].inner_text())
    print("📚 ISSN:", cols[2].inner_text())
    print("🌐 EISSN:", cols[3].inner_text())
    if subcat:
        print("🏷️ Subcategory:", subcat)

# 
journal = "19th-Century Music"
get_journal_info(journal)
