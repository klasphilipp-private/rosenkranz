#!/usr/bin/env python3
"""Generate one static, crawlable detail page per vehicle model."""
from html import escape
from pathlib import Path
import json
import re

ROOT = Path(__file__).resolve().parents[1]
MODELS_PATH = ROOT / "models.json"
TEMPLATE_PATH = ROOT / "modell.html"


def page_filename(model):
    brand = "subaru" if model["brand"] == "Subaru" else "citroen"
    name = re.sub(r"^Citroën\s+|^Subaru\s+", "", model["name"], flags=re.I)
    name = name.casefold().replace("ë", "e").replace("ä", "ae").replace("ö", "oe").replace("ü", "ue").replace("ß", "ss")
    slug = re.sub(r"[^a-z0-9]+", "-", name).strip("-")
    return f"{brand}-{slug}.html"


def meta_description(model):
    return f"{model['name']} bei Automobile Rosenkranz in Recklinghausen. Erfahren Sie mehr zum Modell und vereinbaren Sie eine Probefahrt."


def main():
    models = json.loads(MODELS_PATH.read_text(encoding="utf-8"))
    template = TEMPLATE_PATH.read_text(encoding="utf-8")
    for model in models:
        model["page"] = page_filename(model)
    MODELS_PATH.write_text(json.dumps(models, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

    for model in models:
        name, page = model["name"], model["page"]
        safe_name = escape(name)
        title = f"{name} | Automobile Rosenkranz Recklinghausen"
        description = escape(meta_description(model), quote=True)
        brand = "Subaru" if model["brand"] == "Subaru" else "Citroën"
        listing = "subaru" if brand == "Subaru" else "gewerbe" if model.get("commercial") else "citroen"
        gallery = model.get("gallery") or [model["image"]]
        slides = []
        dots = []
        gallery_alt = model.get("galleryAlt", [])
        for index, image in enumerate(gallery[:8]):
            active = " active" if index == 0 else ""
            alt = escape(gallery_alt[index] if index < len(gallery_alt) else f"{name} – Ansicht {index + 1}", quote=True)
            slides.append(
                f'<article class="hero-slide{active}"><img src="{escape(image, quote=True)}" '
                f'alt="{alt}" fetchpriority="{"high" if index == 0 else "low"}" '
                f'loading="{"eager" if index == 0 else "lazy"}"><div class="hero-caption">'
                f'<span class="eyebrow">{escape(brand)} · Modellwelt</span><h2>{safe_name}</h2>'
                f'<p>{escape(model["description"])}</p></div></article>'
            )
            dots.append(
                f'<button class="hero-dot{active}" type="button" aria-label="Bild {index + 1} anzeigen"></button>'
            )
        page_html = template
        page_html = page_html.replace('<meta name="description" content="Modelle und persönliche Beratung bei Automobile Rosenkranz in Recklinghausen.">', f'<meta name="description" content="{description}">\n  <meta property="og:type" content="website">\n  <meta property="og:title" content="{escape(title, quote=True)}">\n  <meta property="og:description" content="{description}">')
        page_html = page_html.replace("<title>Modell · Automobile Rosenkranz</title>", f"<title>{escape(title)}</title>")
        hero = (
            '<section class="hero model-page-hero" aria-label="Fahrzeuggalerie"><div class="hero-slides">'
            + "".join(slides)
            + '</div><div class="hero-controls">'
            + f'<div class="hero-dots" aria-label="Bilder auswählen">{"".join(dots)}</div>'
            + '<button class="hero-arrow previous" type="button" aria-label="Vorheriges Bild">‹</button>'
            + '<button class="hero-arrow next" type="button" aria-label="Nächstes Bild">›</button>'
            + '</div></section>'
        )
        page_html = re.sub(r'<section class="hero model-page-hero".*?</section>', hero, page_html, count=1, flags=re.S)
        page_html = page_html.replace('id="back-link" href="modelle.html"', f'href="modelle.html?marke={listing}"')
        page_html = page_html.replace('← Zur Modellübersicht</a>', f'← Zur {escape(brand)}-Modellübersicht</a>')
        page_html = page_html.replace('<img id="model-image" alt="" fetchpriority="high">', f'<img src="{escape(model["image"], quote=True)}" alt="{safe_name}" fetchpriority="high">')
        page_html = page_html.replace('<span class="eyebrow" id="model-brand"></span><h1 id="model-title">Modell wird geladen …</h1><p class="detail-intro" id="model-description"></p><div id="model-features"></div><a class="btn btn-red" id="drive-link" href="index.html#probefahrt">Probefahrt anfragen ↗</a>', f'<span class="eyebrow">{escape(brand)}{ " · Nutzfahrzeuge" if model.get("commercial") else " · Neuwagen"}</span><h1>{escape(model["title"])}</h1><p class="detail-intro">{escape(model["description"])}</p><div><p>{escape(model["details"])}</p></div><a class="btn btn-red" href="index.html?modell={escape(model["slug"], quote=True)}#probefahrt">Probefahrt anfragen ↗</a>')
        page_html = re.sub(r'\n  <script>\s*const slug=.*?</script>', "", page_html, count=1, flags=re.S)
        page_html = re.sub(r'<script src="model-hero\.js[^"]*"></script>', '<script src="model-page.js?v=20261019-1"></script>', page_html, count=1)
        (ROOT / page).write_text(page_html, encoding="utf-8")


if __name__ == "__main__":
    main()
