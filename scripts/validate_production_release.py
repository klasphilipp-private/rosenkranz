"""Fail if the production package contains preview SEO or unpublished files."""

import json
import re
import sys
from pathlib import Path


root = Path(sys.argv[1]).resolve()
if (root / "wartung").exists():
    raise SystemExit("Unapproved maintenance website in production package")
for forbidden in ("workers", "scripts", "tests", "deploy", ".git", ".github"):
    if (root / forbidden).exists():
        raise SystemExit(f"Non-public directory in production package: {forbidden}")
if "https://automobile-rosenkranz.de/sitemap.xml" not in (root / "robots.txt").read_text():
    raise SystemExit("Production robots.txt points to another sitemap")
if "https://www.automobile-rosenkranz.de/" in (root / "sitemap.xml").read_text():
    raise SystemExit("Production sitemap still points to www rather than the approved apex domain")
config = json.loads((root / "forms-config.json").read_text())
for origin in ("https://automobile-rosenkranz.de", "https://www.automobile-rosenkranz.de", "https://prd-prev.automobile-rosenkranz.de"):
    if "rosenkranz-forms-production" not in config["endpoints"].get(origin, ""):
        raise SystemExit(f"Production form endpoint missing for {origin}")
    if not config.get("turnstileSiteKeys", {}).get(origin):
        raise SystemExit(f"Production Turnstile site key missing for {origin}")

checked = 0
for page in root.rglob("*.html"):
    relative = page.relative_to(root).as_posix()
    if relative in {"header.html", "footer.html"}:
        continue
    html = page.read_text(encoding="utf-8")
    head = html.split("</head>", 1)[0]
    if "klasphilipp-private.github.io/rosenkranz" in html:
        raise SystemExit(f"Preview URL remains in {relative}")
    if relative in {"modell.html", "fahrzeug.html"}:
        if 'content="noindex,follow"' not in head:
            raise SystemExit(f"Template unexpectedly indexable: {relative}")
        continue
    if len(re.findall(r'<link rel="canonical"', head)) != 1:
        raise SystemExit(f"Canonical missing or duplicated: {relative}")
    if '<link rel="canonical" href="https://automobile-rosenkranz.de/' not in head:
        raise SystemExit(f"Canonical does not use the approved apex domain: {relative}")
    if 'name="robots" content="index,follow"' not in head:
        raise SystemExit(f"Production page not indexable: {relative}")
    checked += 1
print(f"Production package validated: {checked} indexable HTML pages, no maintenance site")
