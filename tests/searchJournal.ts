import { readdirSync, readFileSync } from "fs";
import { join } from "path";
import { compareTwoStrings } from "string-similarity";

const JSON_DIR = "./json_out";
const THRESHOLD = 0.85;

interface JournalInfo {
  Journal: string | null;
  Publisher: string | null;
  ISSN: string | null;
  eISSN: string | null;
  Category: "A" | "B";
}

function isSimilar(a: string, b: string, threshold = THRESHOLD): boolean {
  return compareTwoStrings(a.toLowerCase(), b.toLowerCase()) >= threshold;
}

function loadAllJournals(jsonDir: string): Array<[string, string[]]> {
  const all: Array<[string, string[]]> = [];

  for (const fname of readdirSync(jsonDir)) {
    if (!fname.endsWith(".json")) continue;
    const fullPath = join(jsonDir, fname);
    let rows: unknown;
    try {
      rows = JSON.parse(readFileSync(fullPath, "utf8"));
    } catch (err) {
      console.warn(`⚠️ Could not parse ${fname}: ${err}`);
      continue;
    }

    if (!Array.isArray(rows)) continue;

    for (const row of rows) {
      if (!Array.isArray(row) || row.length < 2) continue;
      const flat = row.join(" ").toLowerCase();
      if (flat.includes("journal") || flat.includes("revue")) continue;
      all.push([fname.toLowerCase(), row.map(cell => String(cell).trim())]);
    }
  }

  return all;
}

function findJournalInfo(
  journalName: string,
  allRows: Array<[string, string[]]>
): JournalInfo | null {
  for (const [sourceFile, row] of allRows) {
    for (const cell of row) {
      if (isSimilar(journalName, cell)) {
        const category: "A" | "B" = sourceFile === "a.json" ? "A" : "B";
        return {
          Journal: row[1] ?? null,
          Publisher: row[2] ?? null,
          ISSN: row[3] ?? null,
          eISSN: row[4] ?? null,
          Category: category,
        };
      }
    }
  }
  return null;
}

// ──────────────── Main ────────────────

const allJournals = loadAllJournals(JSON_DIR);

// Example search
const query = process.argv[2] || "AAPG BULLETIN";
const result = findJournalInfo(query, allJournals);

if (result) {
  console.log("✅ Found Journal:\n");
  for (const [key, val] of Object.entries(result)) {
    console.log(`${key}: ${val}`);
  }
} else {
  console.log("❌ Journal not found");
}

