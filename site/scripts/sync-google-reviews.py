#!/usr/bin/env python3
"""Fetch a public Place rating and recent reviews; API key comes from the runner secret."""
from datetime import datetime, timezone
from pathlib import Path
from urllib.request import Request, urlopen
import json
import os

PLACE_ID = "ChIJse65GnDjuEcRK3YW08H_CLM"
DESTINATION = Path(__file__).resolve().parents[1] / "google-reviews.json"


def main():
    key = os.environ.get("GOOGLE_PLACES_API_KEY")
    if not key:
        raise SystemExit("Set GOOGLE_PLACES_API_KEY in repository Actions secrets to enable the Places refresh.")
    url = f"https://places.googleapis.com/v1/places/{PLACE_ID}?languageCode=de"
    request = Request(url, headers={
        "X-Goog-Api-Key": key,
        "X-Goog-FieldMask": "displayName,rating,userRatingCount,reviews",
    })
    with urlopen(request, timeout=35) as response:
        place = json.load(response)
    reviews = []
    for review in place.get("reviews", []):
        text = review.get("text", {}).get("text", "")
        author = review.get("authorAttribution", {}).get("displayName", "Google Nutzer")
        if text:
            reviews.append({"author": author, "text": text, "rating": review.get("rating", 0), "date": review.get("relativePublishTimeDescription", "")})
    payload = {
        "configured": True,
        "placeId": PLACE_ID,
        "name": place.get("displayName", {}).get("text", "Automobile Rosenkranz"),
        "rating": place.get("rating"),
        "reviewCount": place.get("userRatingCount"),
        "updated": datetime.now(timezone.utc).isoformat(),
        "reviews": reviews,
    }
    DESTINATION.write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"Updated Google rating data and {len(reviews)} review excerpts.")


if __name__ == "__main__":
    main()
