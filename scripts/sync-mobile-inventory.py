#!/usr/bin/env python3
"""Fetch the dealer's current offers from the official mobile.de Search API."""
from datetime import datetime, timezone
from decimal import Decimal, InvalidOperation
from pathlib import Path
from urllib.error import HTTPError, URLError
from urllib.parse import urlencode, quote
from urllib.request import Request, urlopen
import base64
import html
import json
import os
import re
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


def image_list(ad):
    result = []
    images = ad.get("images") or []
    if isinstance(images, dict):
        images = [images] if any(key in images for key in ("xxl", "xxxl", "xl", "l")) else list(images.values())
    for image in images:
        if not isinstance(image, dict):
            continue
        url = image.get("xxl") or image.get("xxxl") or image.get("xl") or image.get("l")
        if isinstance(url, str) and url.startswith("https://img.classistatic.de/") and url not in result:
            result.append(url)
    return result


def numeric_price(ad):
    try:
        return float(Decimal(str((ad.get("price") or {}).get("consumerPriceGross"))))
    except (InvalidOperation, TypeError, ValueError):
        return None


def detail_page(vehicle):
    esc = lambda value: html.escape(str(value or ""), quote=True)
    images = vehicle["images"]
    gallery = "".join(
        f'<figure class="vehicle-gallery-slide"><span class="media-consent-placeholder">Fahrzeugfoto nach Freigabe externer Medien</span><img data-external-src="{esc(url)}" alt="{esc(vehicle["title"])} – Bild {i + 1}" loading="lazy"></figure>'
        for i, url in enumerate(images)
    )
    specs = vehicle.get("details", [])
    spec_html = "".join(f'<div><dt>{esc(item["label"])}</dt><dd>{esc(item["value"])}</dd></div>' for item in specs)
    description = esc(vehicle.get("description") or "")
    detail_json = json.dumps({
        "@context": "https://schema.org", "@type": "Vehicle", "name": vehicle["title"],
        "image": images, "brand": vehicle.get("make"), "model": vehicle.get("model"),
        "mileageFromOdometer": {"@type": "QuantitativeValue", "value": vehicle.get("mileage"), "unitCode": "KMT"} if vehicle.get("mileage") else None,
        "offers": {"@type": "Offer", "price": vehicle.get("priceAmount"), "priceCurrency": "EUR", "url": f"fahrzeug-{vehicle['id']}.html"},
    }, ensure_ascii=False).replace("</", "<\\/")
    return f'''<!doctype html>
<html lang="de"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>{esc(vehicle['title'])} | Automobile Rosenkranz</title><meta name="description" content="{esc(vehicle['title'])} bei Automobile Rosenkranz in Recklinghausen. Fahrzeugdetails, Bilder und Beratung anfragen."><link rel="canonical" href="https://www.automobile-rosenkranz.de/fahrzeug-{esc(vehicle['id'])}.html"><link rel="stylesheet" href="styles.css?v=20261023"><script type="application/ld+json">{detail_json}</script></head>
<body><div id="shared-header">{Path(__file__).resolve().parents[1].joinpath('header.html').read_text(encoding='utf-8')}</div>
<main><section class="vehicle-detail"><div class="wrap"><a class="vehicle-back" href="angebote.html">← Zur Angebotsübersicht</a><div class="vehicle-detail-layout"><div><div class="vehicle-gallery"><div class="vehicle-gallery-track" aria-label="Fahrzeugbilder">{gallery}</div><div class="vehicle-gallery-controls"><button type="button" class="vehicle-gallery-prev" aria-label="Vorheriges Bild">←</button><span class="vehicle-gallery-count">1 / {len(images)}</span><button type="button" class="vehicle-gallery-next" aria-label="Nächstes Bild">→</button></div></div><p class="vehicle-gallery-hint">Bilder nach rechts oder links wischen</p></div><div class="vehicle-summary"><span class="eyebrow">{esc(vehicle.get('make'))} · Fahrzeugangebot</span><h1>{esc(vehicle['title'])}</h1><p class="vehicle-price">{esc(vehicle['price'])}</p><p class="vehicle-location">Automobile Rosenkranz · Recklinghausen</p><a class="btn btn-red" href="index.html#kontakt">Beratung zu diesem Fahrzeug anfragen</a><a class="vehicle-phone" href="tel:+49236191490">Oder direkt anrufen: 02361 / 9149-0</a></div></div>
<section class="vehicle-facts"><h2>Fahrzeugdetails</h2><dl>{spec_html}</dl></section>{f'<section class="vehicle-description"><h2>Beschreibung</h2><p>{description}</p></section>' if description else ''}<p class="notice">Angaben ohne Gewähr. Verfügbarkeit, Ausstattung und Preis können sich ändern. Bitte lassen Sie sich die Details von unserem Verkaufsteam bestätigen.</p></div></section></main><div id="shared-footer"></div>
<script src="consent.js?v=20261023"></script><script src="site-shell.js?v=20261019-1"></script><script src="footer.js?v=20261019-1"></script><script>const track=document.querySelector('.vehicle-gallery-track'),count=document.querySelector('.vehicle-gallery-count'),slides=[...document.querySelectorAll('.vehicle-gallery-slide')];let pos=0;function go(n){{pos=(n+slides.length)%slides.length;track.scrollTo({{left:slides[pos].offsetLeft-track.offsetLeft,behavior:'smooth'}});count.textContent=`${{pos+1}} / ${{slides.length}}`}}document.querySelector('.vehicle-gallery-prev').onclick=()=>go(pos-1);document.querySelector('.vehicle-gallery-next').onclick=()=>go(pos+1);track.addEventListener('scroll',()=>{{const i=Math.round(track.scrollLeft/track.clientWidth);if(i!==pos){{pos=i;count.textContent=`${{pos+1}} / ${{slides.length}}`}}}});</script></body></html>'''


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


def fetch_ad_detail(username, password, ad_id):
    token = base64.b64encode(f"{username}:{password}".encode()).decode()
    request = Request(f"{ENDPOINT}/ad/{quote(str(ad_id), safe='')}", headers={
        "Authorization": f"Basic {token}",
        "Accept": "application/vnd.de.mobile.api+json",
        "User-Agent": "Automobile-Rosenkranz-Preview/1.0",
    })
    try:
        with urlopen(request, timeout=45) as response:
            data = json.load(response)
    except HTTPError as error:
        if error.code == 404:
            return None
        if error.code in (401, 403):
            raise RuntimeError(f"mobile.de ad detail access denied (HTTP {error.code}).") from None
        raise RuntimeError(f"mobile.de ad detail request failed (HTTP {error.code}).") from None
    except (URLError, TimeoutError, json.JSONDecodeError) as error:
        raise RuntimeError(f"mobile.de ad detail request failed: {type(error).__name__}.") from None
    return data if isinstance(data, dict) else None


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
    detail_responses = 0
    for ad in ads:
        ad_id = str(ad.get("mobileAdId") or "")
        if ad_id:
            detail = fetch_ad_detail(username, password, ad_id)
            if detail:
                ad = {**ad, **detail}
                detail_responses += 1
        images = image_list(ad)
        image = images[0] if images else first_image(ad)
        detail_url = ad.get("detailPageUrl")
        if not image or not isinstance(detail_url, str) or not detail_url.startswith("https://suchen.mobile.de/"):
            continue
        make = str(ad.get("make") or "").strip()
        description = str(ad.get("modelDescription") or "").strip()
        model = str(ad.get("model") or "").strip()
        title = " ".join(part for part in (make, description or model) if part)
        if not title:
            continue
        if not ad_id:
            continue
        raw_price = numeric_price(ad)
        field_labels = {
            "firstRegistration": "Erstzulassung", "mileage": "Kilometerstand", "power": "Leistung",
            "gearbox": "Getriebe", "fuel": "Kraftstoff", "driveType": "Antrieb", "category": "Fahrzeugklasse",
            "condition": "Zustand", "cubicCapacity": "Hubraum", "doors": "Türen", "seats": "Sitzplätze",
            "exteriorColor": "Außenfarbe", "emissionClass": "Schadstoffklasse", "previousOwners": "Vorbesitzer",
        }
        details = []
        for key, label in field_labels.items():
            value = ad.get(key)
            if value not in (None, "", [], {}):
                if key == "firstRegistration" and len(str(value)) == 6:
                    value = f"{str(value)[4:6]}/{str(value)[:4]}"
                elif key == "mileage":
                    value = f"{int(value):,}".replace(",", ".") + " km"
                elif key == "power":
                    value = f"{value} kW"
                details.append({"label": label, "value": value})
        title = " ".join(part for part in (make, description or model) if part)
        vehicles.append({
            "id": ad_id,
            "title": title,
            "price": price_text(ad),
            "priceAmount": raw_price,
            "image": image,
            "images": images or [image],
            "url": detail_url,
            "vehicleClass": str(ad.get("vehicleClass") or ""),
            "make": make,
            "model": model,
            "modelDescription": description,
            "mileage": ad.get("mileage"),
            "fuel": str(ad.get("fuel") or ""),
            "gearbox": str(ad.get("gearbox") or ""),
            "driveType": str(ad.get("driveType") or ""),
            "firstRegistration": str(ad.get("firstRegistration") or ""),
            "category": str(ad.get("category") or ""),
            "condition": str(ad.get("condition") or ""),
            "power": ad.get("power"),
            "description": str(ad.get("plainTextDescription") or ""),
            "details": details,
            "detailPath": f"fahrzeug-{ad_id}.html",
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
    for old_page in DESTINATION.parent.glob("fahrzeug-*.html"):
        old_page.unlink()
    for vehicle in vehicles:
        (DESTINATION.parent / f"fahrzeug-{vehicle['id']}.html").write_text(detail_page(vehicle), encoding="utf-8")
    image_counts = {}
    for vehicle in vehicles:
        count = len(vehicle["images"])
        image_counts[count] = image_counts.get(count, 0) + 1
    print(f"Updated inventory with {len(vehicles)} vehicles with photos (API reports {api_total} total); fetched {detail_responses} full ads; gallery image counts: {image_counts}.")


if __name__ == "__main__":
    main()
