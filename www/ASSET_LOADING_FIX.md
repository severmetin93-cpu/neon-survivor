# Asset Loading Fix

Hero Vanguard, Striker and Controller are embedded as base64 data URLs in index.html.
The hero UI no longer depends on `./assets/hero-*.png` resolving from Android's
content:// media URL.

This specifically targets the broken-image/alt-text issue seen when opening the
ZIP-extracted index.html directly in Android Chrome.
