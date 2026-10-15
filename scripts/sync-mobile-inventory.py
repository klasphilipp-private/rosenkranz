#!/usr/bin/env python3
"""Refresh a static preview snapshot from Automobile Rosenkranz's public mobile.de page."""
from html import unescape
from html.parser import HTMLParser
from datetime import datetime, timezone
from pathlib import Path
from urllib.request import Request, urlopen
import json
import re

SOURCE = "https://home.mobile.de/AUTOMOBILE-ROSENKRANZ"
DESTINATION = Path(__file__).resolve().parents[1] / "inventory.json"


class Attributes(HTMLParser):
    def __init__(self):
        super().__init__()
        self.tags = []

    def handle_starttag(self, tag, attrs):
        self.tags.append((tag, dict(attrs)))


def plain(value):
    return unescape(re.sub(r"<[^>]+>", " ", value)).replace("\xa0", " ").strip()


def attr(tag, key):
    parser = Attributes()
    parser.feed(tag)
    return parser.tags[0][1].get(key, "") if parser.tags else ""


def main():
    request = Request(SOURCE, headers={"User-Agent": "Mozilla/5.0 (compatible; RosenkranzPreview/1.0)"})
    with urlopen(request, timeout=40) as response:
        document = response.read().decode("utf-8", "replace")

    vehicles = []
    for card in re.findall(r"<article\b.*?</article>", document, re.S | re.I):
        title_match = re.search(r"<h3\b[^>]*>(.*?)</h3>", card, re.S | re.I)
        price_match = re.search(r'data-testid="price-label"[^>]*>(.*?)</span>', card, re.S | re.I)
        image_matches = re.findall(r"<img\b[^>]*data-testid=\"listing-\d+-image(?:-[^\"]+)?\"[^>]*>", card, re.S | re.I)
        if not title_match or not image_matches:
            continue
        # Some listings use a large main image plus thumbnail images. Prefer the main image.
        image_tag = next((tag for tag in image_matches if re.search(r'data-testid=\"listing-\d+-image-large\"', tag, re.I)), image_matches[0])
        title = plain(title_match.group(1))
        image = attr(image_tag, "src")
        price = plain(price_match.group(1)) if price_match else "Preis auf Anfrage"
        if not image or not title or "placeholder" in image.lower() or "no-image" in image.lower():
            continue
        if not image.startswith("https://img.classistatic.de/api/v1/mo-prod/images/"):
            continue
        vehicles.append({"title": title, "price": price, "image": image})

    if not vehicles:
        raise RuntimeError("No vehicle cards found; keeping the last known snapshot.")
    payload = {"source": SOURCE, "updated": datetime.now(timezone.utc).isoformat(), "vehicles": vehicles}
    DESTINATION.write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"Wrote {len(vehicles)} vehicles to {DESTINATION}")


if __name__ == "__main__":
    main()
