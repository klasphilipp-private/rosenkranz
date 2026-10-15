#!/usr/bin/env python3
"""Reinsert the canonical header fragment into pages after shared navigation edits."""
from pathlib import Path
import re
root=Path(__file__).resolve().parents[1]
template=(root/'header.html').read_text(encoding='utf-8').strip()
marker=re.compile(r'<!-- SITE HEADER START -->.*?<!-- SITE HEADER END -->|<div id="shared-header"></div>',re.S)
for page in [*root.glob('*.html'),*root.glob('impressum/**/*.html'),*root.glob('datenschutz/**/*.html')]:
    if page.name=='header.html': continue
    source=page.read_text(encoding='utf-8')
    updated=marker.sub(lambda _: template,source)
    if updated != source: page.write_text(updated,encoding='utf-8')
