#!/usr/bin/env python3
"""Inject Day1-3 + 1945 runtime CSS/JS links into www/index.html if missing."""
from pathlib import Path

INDEX = Path("www/index.html")
if not INDEX.exists():
    raise SystemExit("www/index.html missing")

html = INDEX.read_text(encoding="utf-8", errors="replace")
changed = False

LINKS = [
    ("nvx2-menu-polish.css", '<link href="css/nvx2-menu-polish.css" rel="stylesheet"/>'),
    ("noryvx-shop-day3.css", '<link href="css/noryvx-shop-day3.css" rel="stylesheet"/>'),
]

SCRIPTS = [
    ("ms7-day2-fixes.js", '<script src="js/ms7-day2-fixes.js" defer></script>'),
    ("noryvx-day3-shop.js", '<script src="js/noryvx-day3-shop.js" defer></script>'),
    ("noryvx-1945-runtime.js", '<script src="js/noryvx-1945-runtime.js" defer></script>'),
]

for key, tag in LINKS:
    if key not in html:
        if "</head>" in html:
            html = html.replace("</head>", tag + "\n</head>", 1)
        changed = True
        print("injected", key)
    else:
        print("ok", key)

for key, tag in SCRIPTS:
    if key not in html:
        if "</body>" in html:
            html = html.replace("</body>", tag + "\n</body>", 1)
        else:
            html += "\n" + tag + "\n"
        changed = True
        print("injected", key)
    else:
        print("ok", key)

if changed:
    INDEX.write_text(html, encoding="utf-8")
    print("wrote", INDEX.stat().st_size)
else:
    print("no changes")
