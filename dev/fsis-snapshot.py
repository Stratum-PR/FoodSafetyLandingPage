"""Writes data/fsis-recent.json, the USDA FSIS fallback for Alertas PR, from a saved copy of
https://www.fsis.usda.gov/fsis/api/recall/v/1 (FSIS blocks scripts, so a person saves it from a browser).

Accepts the plain JSON or a Safari .webarchive (what an iPhone/Mac saves). Keeps the last 13 months
(the API shows 12) and only the fields /api/recalls reads, English notices plus their Spanish titles.

    python3 dev/fsis-snapshot.py ~/Downloads/fsis.webarchive
"""
import html
import json
import os
import plistlib
import re
import sys
from datetime import date, timedelta

KEEP = ["field_recall_number", "field_recall_date", "field_title", "field_states", "field_product_items",
        "field_recall_reason", "field_recall_classification", "field_recall_type", "field_establishment",
        "field_recall_url", "langcode"]
OUT = os.path.join(os.path.dirname(__file__), "..", "data", "fsis-recent.json")


def read(path):
    raw = open(path, "rb").read()
    if raw[:8] == b"bplist00":  # Safari .webarchive: the page is inside a binary plist
        res = plistlib.loads(raw)["WebMainResource"]
        raw = res["WebResourceData"]
    text = raw.decode("utf-8", errors="replace").strip()
    if text.startswith("<"):  # the browser wraps JSON in <pre>
        m = re.search(r"<pre[^>]*>(.*)</pre>", text, re.S)
        text = html.unescape(m.group(1)) if m else text
    return json.loads(text)


def main(path):
    recs = read(path)
    since = (date.today() - timedelta(days=396)).isoformat()
    keep = [{k: r.get(k) for k in KEEP} for r in recs if (r.get("field_recall_date") or "")[:10] >= since]
    keep.sort(key=lambda r: (r["field_recall_date"] or "", r["field_recall_number"] or "", r["langcode"] or ""), reverse=True)
    newest = max((r.get("field_recall_date") or "")[:10] for r in recs)
    with open(OUT, "w", encoding="utf-8") as f:
        json.dump({"saved": newest, "source": "https://www.fsis.usda.gov/fsis/api/recall/v/1", "records": keep},
                  f, ensure_ascii=False, indent=1)
        f.write("\n")
    en = sum(1 for r in keep if r.get("langcode") == "English")
    print(f"{len(recs)} records read (newest {newest}); kept {len(keep)} ({en} English) since {since} -> data/fsis-recent.json")


if __name__ == "__main__":
    main(sys.argv[1])
