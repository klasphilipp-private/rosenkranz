#!/usr/bin/env python3
"""Prepare an IONOS production copy from the noindex GitHub Pages preview."""
import argparse
import json
import re
import shutil
from pathlib import Path
from urllib.parse import urljoin
import xml.etree.ElementTree as ET

from release_files import public_files

PREVIEW_ORIGIN = "https://klasphilipp-private.github.io/rosenkranz"
OLD_LIVE_ORIGIN = "https://www.automobile-rosenkranz.de"
NOINDEX_TEMPLATES = {"fahrzeug.html", "modell.html"}
SITEMAP_NS = "http://www.sitemaps.org/schemas/sitemap/0.9"


def canonical_path(relative_path):
    path = relative_path.as_posix()
    if path == "index.html":
        return "/"
    if path.endswith("/index.html"):
        return "/" + path[:-len("index.html")]
    return "/" + path


def prepare_page(path, relative_path, base_url):
    html = path.read_text(encoding="utf-8")
    html = html.replace(PREVIEW_ORIGIN, base_url.rstrip("/")).replace(OLD_LIVE_ORIGIN, base_url.rstrip("/"))
    canonical = urljoin(base_url, canonical_path(relative_path))
    head_end = html.lower().find("</head>")
    if head_end < 0:
        raise ValueError(f"Missing </head> in {relative_path}")
    head = html[:head_end]
    body = html[head_end:]

    head = re.sub(r"""<link\s+rel=["']canonical["'][^>]*>\s*""", "", head, flags=re.I)
    if relative_path.as_posix() in NOINDEX_TEMPLATES:
        head = re.sub(r"""<meta\s+name=["']robots["'][^>]*>\s*""", '<meta name="robots" content="noindex,follow">', head, flags=re.I)
        return head + body

    robots = '<meta name="robots" content="index,follow">'
    if re.search(r"""<meta\s+name=["']robots["']""", head, flags=re.I):
        head = re.sub(r"""<meta\s+name=["']robots["'][^>]*>""", robots, head, count=1, flags=re.I)
    else:
        head += robots

    og_url = f'<meta property="og:url" content="{canonical}">'
    if re.search(r"""<meta\s+property=["']og:url["']""", head, flags=re.I):
        head = re.sub(r"""<meta\s+property=["']og:url["'][^>]*>""", og_url, head, count=1, flags=re.I)
    canonical_tag = f'<link rel="canonical" href="{canonical}">'
    head += canonical_tag
    return head + body


def update_sitemap(output_root, base_url):
    sitemap = output_root / "sitemap.xml"
    inventory_path = output_root / "inventory.json"
    if not sitemap.is_file() or not inventory_path.is_file():
        return 0

    tree = ET.parse(sitemap)
    root = tree.getroot()
    loc_tag = f"{{{SITEMAP_NS}}}loc"
    active_paths = {
        vehicle.get("detailPath")
        for vehicle in json.loads(inventory_path.read_text(encoding="utf-8")).get("vehicles", [])
        if vehicle.get("detailPath")
    }
    active_urls = {urljoin(base_url, "/" + path.lstrip("/")) for path in active_paths}

    for item in list(root):
        loc = item.find(loc_tag)
        value = loc.text if loc is not None and loc.text else ""
        if value.startswith(OLD_LIVE_ORIGIN + "/"):
            value = base_url.rstrip("/") + value[len(OLD_LIVE_ORIGIN):]
            loc.text = value
        if value.startswith(base_url.rstrip("/") + "/angebote/") and value not in active_urls:
            root.remove(item)

    existing = {item.find(loc_tag).text for item in root if item.find(loc_tag) is not None}
    for url in sorted(active_urls - existing):
        item = ET.SubElement(root, f"{{{SITEMAP_NS}}}url")
        ET.SubElement(item, loc_tag).text = url
    ET.register_namespace("", SITEMAP_NS)
    tree.write(sitemap, encoding="utf-8", xml_declaration=True)
    return len(active_urls)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--source", type=Path, default=Path(__file__).resolve().parents[1])
    parser.add_argument("--output", type=Path, default=None)
    parser.add_argument("--base-url", default="https://automobile-rosenkranz.de/")
    args = parser.parse_args()

    source = args.source.resolve()
    output = (args.output or source / "dist-production").resolve()
    base_url = args.base_url.rstrip("/") + "/"
    if output.exists():
        raise SystemExit(f"Output already exists: {output}. Choose an empty output directory.")
    if not (source / "index.html").is_file():
        raise SystemExit(f"Source does not look like the Rosenkranz site: {source}")

    files = public_files(source, include_maintenance=False)
    inventory = json.loads((source / "inventory.json").read_text(encoding="utf-8"))
    active_offers = {
        Path(vehicle["detailPath"].strip("/") + "/index.html")
        for vehicle in inventory.get("vehicles", []) if vehicle.get("detailPath")
    }
    for relative in files:
        if relative.parts[0] == "angebote" and relative.suffix == ".html" and relative not in active_offers:
            continue
        destination = output / relative
        destination.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(source / relative, destination)
    changed = 0
    for page in output.rglob("*.html"):
        relative = page.relative_to(output)
        if relative.as_posix() in {"header.html", "footer.html"}:
            continue
        page.write_text(prepare_page(page, relative, base_url), encoding="utf-8")
        changed += 1
    offers = update_sitemap(output, base_url)
    robots = output / "robots.txt"
    robot_rules = re.sub(r"^Sitemap:.*$", f"Sitemap: {base_url}sitemap.xml", robots.read_text(), flags=re.M)
    robots.write_text(robot_rules.rstrip() + "\nDisallow: /__releases/\n")
    print(f"Production copy ready: {output}; processed {changed} HTML pages; {offers} active vehicle URLs in sitemap.")


if __name__ == "__main__":
    main()
