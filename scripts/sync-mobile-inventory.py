#!/usr/bin/env python3
"""Fetch the dealer's current offers from the official mobile.de Search API."""
from datetime import datetime, timezone
from decimal import Decimal, InvalidOperation
from pathlib import Path
from urllib.error import HTTPError, URLError
from urllib.parse import urlencode
from urllib.request import Request, urlopen
import base64
import json
import os
import tempfile


ENDPOINT = "https://services.mobile.de/search-api/search"
DESTINATION = Path(__file__).resolve().parents[1] / "inventory.json"
PAGE_SIZE = 100


def price_text(ad):
    price = ad.get("price") or {}
    raw = price.get("consumerPriceGross") or price.get("consumerPriceNet")
    try:
        amount = Decimal(str(raw)).quantize(Decimal("1"))
    except (InvalidOperation, TypeError):
        return "Preis auf Anfrage"
    return f"{amount:,.0f} €".replace(",", ".")


def first_image(ad):
    images = ad.get("images") or []
    if isinstance(images, dict):
        images = [images]
    for image in images:
        if not isinstance(image, dict):
            continue
        url = image.get("xxl") or image.get("xxxl") or image.get("xl") or image.get("l")
        if isinstance(url, str) and url.startswith("https://img.classistatic.de/"):
            return url
    return None


def fetch_page(username, password, page):
    query = urlencode({"country": "DE", "page.size": PAGE_SIZE, "page.number": page, "imageCount.min": 1})
    token = base64.b64encode(f"{username}:{password}".encode()).decode()
    request = Request(f"{ENDPOINT}?{query}", headers={
        "Authorization": f"Basic {token}",
        "Accept": "application/vnd.de.mobile.api+json",
        "User-Agent": "Automobile-Rosenkranz-Preview/1.0",
    })
    try:
        with urlopen(request, timeout=45) as response:
            payload = json.load(response)
    except HTTPError as error:
        if error.code in (401, 403):
            raise RuntimeError(f"mobile.de API authentication/permission failed (HTTP {error.code}).") from None
        raise RuntimeError(f"mobile.de API request failed (HTTP {error.code}).") from None
    except (URLError, TimeoutError, json.JSONDecodeError) as error:
        raise RuntimeError(f"mobile.de API request failed: {type(error).__name__}.") from None
    if not isinstance(payload, dict) or not isinstance(payload.get("ads"), list):
        raise RuntimeError("Unexpected response from mobile.de Search API; existing snapshot was preserved.")
    return payload


def main():
    username = os.environ.get("MOBILE_API_USERNAME", "").strip()
    password = os.environ.get("MOBILE_API_PASSWORD", "")
    if not username or not password:
        raise SystemExit("Set MOBILE_API_USERNAME and MOBILE_API_PASSWORD as GitHub Actions secrets.")

    first = fetch_page(username, password, 1)
    page_count = int(first.get("maxPages") or 1)
    api_total = int(first.get("total") or 0)
    ads = list(first["ads"])
    for page in range(2, page_count + 1):
        result = fetch_page(username, password, page)
        if int(result.get("currentPage") or page) != page:
            raise RuntimeError(f"mobile.de returned unexpected page {result.get('currentPage')}; snapshot preserved.")
        ads.extend(result["ads"])

    vehicles = []
    for ad in ads:
        image = first_image(ad)
        detail_url = ad.get("detailPageUrl")
        if not image or not isinstance(detail_url, str) or not detail_url.startswith("https://suchen.mobile.de/"):
            continue
        make = str(ad.get("make") or "").strip()
        description = str(ad.get("modelDescription") or "").strip()
        model = str(ad.get("model") or "").strip()
        title = " ".join(part for part in (make, description or model) if part)
        if not title:
            continue
        vehicles.append({
            "id": str(ad.get("mobileAdId") or ""),
            "title": title,
            "price": price_text(ad),
            "image": image,
            "url": detail_url,
            "vehicleClass": str(ad.get("vehicleClass") or ""),
            "make": str(ad.get("make") or ""),
            "model": str(ad.get("model") or ""),
        })

    if not vehicles:
        raise RuntimeError("mobile.de returned no offers with images; existing snapshot was preserved.")
    if len(ads) < api_total:
        raise RuntimeError(f"Only {len(ads)} of {api_total} API records were received; existing snapshot was preserved.")

    payload = {
        "source": ENDPOINT,
        "dealerProfile": "https://home.mobile.de/AUTOMOBILE-ROSENKRANZ",
        "updated": datetime.now(timezone.utc).isoformat(),
        "apiTotal": api_total,
        "vehiclesWithImages": len(vehicles),
        "vehicles": vehicles,
    }
    DESTINATION.parent.mkdir(parents=True, exist_ok=True)
    with tempfile.NamedTemporaryFile("w", encoding="utf-8", dir=DESTINATION.parent, delete=False) as temporary:
        json.dump(payload, temporary, ensure_ascii=False, indent=2)
        temporary.write("\n")
        temp_path = Path(temporary.name)
    temp_path.replace(DESTINATION)
    print(f"Updated inventory with {len(vehicles)} vehicles with photos (API reports {api_total} total).")


if __name__ == "__main__":
    main()
