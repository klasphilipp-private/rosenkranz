#!/usr/bin/env python3
"""Replace duplicated page headers with the shared header mount point."""
from pathlib import Path
import re

ROOT = Path(__file__).resolve().parents[1]
HEADER_COPY = re.compile(r'<!-- SITE HEADER START -->.*?<!-- SITE HEADER END -->', re.S)
MOUNT = '<div id="shared-header"></div>'

for page in [*ROOT.glob('*.html'), *ROOT.glob('impressum/**/*.html'), *ROOT.glob('datenschutz/**/*.html')]:
    if page.name == 'header.html':
        continue
    source = page.read_text(encoding='utf-8')
    updated = HEADER_COPY.sub(MOUNT, source)
    if updated != source:
        page.write_text(updated, encoding='utf-8')
