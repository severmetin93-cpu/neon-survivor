#!/usr/bin/env python3
"""Inject Day1 CSS + Day2 JS links into www/index.html if missing."""
from pathlib import Path

INDEX = Path("www/index.html")
if not INDEX.exists():
    raise SystemExit("www/index.html missing")

html = INDEX.read_text(encoding="utf-8", errors="replace")
changed = False

CSS = '<link href="css/nvx2-menu-polish.css" rel="stylesheet"/>'
JS = '<script src="js/ms7-day2-fixes.js" defer></script>'

if "nvx2-menu-polish.css" not in html:
    if 'rel="manifest"' in html:
        html = html.replace(
            '<link href="manifest.json" rel="manifest"/>',
            '<link href="manifest.json" rel="manifest"/>\n' + CSS,
            1,
        )
        if "nvx2-menu-polish.css" not in html:
            html = html.replace("</head>", CSS + "\n</head>", 1)
    else:
        html = html.replace("</head>", CSS + "\n</head>", 1)
    changed = True
    print("injected CSS link")
else:
    print("CSS already present")

if "ms7-day2-fixes.js" not in html:
    if "</body>" in html:
        html = html.replace("</body>", JS + "\n</body>", 1)
    else:
        html += "\n" + JS + "\n"
    changed = True
    print("injected JS link")
else:
    print("JS already present")

if changed:
    INDEX.write_text(html, encoding="utf-8")
    print("wrote", INDEX, "size", INDEX.stat().st_size)
else:
    print("no changes")
