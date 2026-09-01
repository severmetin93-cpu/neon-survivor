#!/usr/bin/env python3
from pathlib import Path
import re

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
    ("noryvx-p3-global.js", '<script src="js/noryvx-p3-global.js"></script>'),
    ("ms7-day2-fixes.js", '<script src="js/ms7-day2-fixes.js" defer></script>'),
    ("noryvx-day3-shop.js", '<script src="js/noryvx-day3-shop.js" defer></script>'),
    ("noryvx-1945-runtime.js", '<script src="js/noryvx-1945-runtime.js" defer></script>'),
    ("noryvx-airforce-theme.js", '<script src="js/noryvx-airforce-theme.js" defer></script>'),
    ("noryvx-hero-assets.js", '<script src="js/noryvx-hero-assets.js" defer></script>'),
    ("noryvx-powerups.js", '<script src="js/noryvx-powerups.js" defer></script>'),
    ("noryvx-difficulty.js", '<script src="js/noryvx-difficulty.js" defer></script>'),
    ("noryvx-combo.js", '<script src="js/noryvx-combo.js" defer></script>'),
    ("noryvx-damage-items.js", '<script src="js/noryvx-damage-items.js" defer></script>'),
]

for key, tag in LINKS:
    if key not in html:
        html = html.replace("</head>", tag + "\n</head>", 1)
        changed = True
        print("injected", key)
    else:
        print("ok", key)

for key, tag in SCRIPTS:
    if key not in html:
        if key == "noryvx-p3-global.js":
            html2, n = re.subn(r"(<body[^>]*>)", r"\1\n" + tag, html, count=1)
            html = html2 if n else html.replace("</body>", tag + "\n</body>", 1)
        elif "</body>" in html:
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
