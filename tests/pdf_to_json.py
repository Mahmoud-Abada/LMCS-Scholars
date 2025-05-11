#!/usr/bin/env python3
import os
import json
import camelot

INPUT_DIR = "./pdfs"            # where your PDFs live
OUTPUT_DIR = "json_out"    # where JSONs will go

def process_pdf(pdf_path: str, flavor="stream", pages="all"):
    print(f"📄 Processing {pdf_path} …")
    tables = camelot.read_pdf(pdf_path, pages=pages, flavor=flavor)
    all_rows = []
    for table in tables:
        # table.df is a pandas DataFrame
        # convert it row by row
        for idx, row in table.df.iterrows():
            # turn each row into a list of strings
            cells = [str(cell).strip() for cell in row.tolist()]
            # skip empty rows
            if any(cells):
                all_rows.append(cells)
    return all_rows

def main():
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    for fname in os.listdir(INPUT_DIR):
        if not fname.lower().endswith(".pdf"):
            continue
        pdf_path = os.path.join(INPUT_DIR, fname)
        # extract
        rows = process_pdf(pdf_path)
        # write JSON
        out_name = os.path.splitext(fname)[0] + ".json"
        out_path = os.path.join(OUTPUT_DIR, out_name)
        with open(out_path, "w", encoding="utf-8") as f:
            json.dump(rows, f, ensure_ascii=False, indent=2)
        print(f"✅ Wrote {len(rows)} rows to {out_path}\n")

if __name__ == "__main__":
    main()
