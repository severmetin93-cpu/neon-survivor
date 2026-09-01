#!/usr/bin/env node
'use strict';
const fs = require('fs');
const file = '/data/data/com.termux/files/home/projects/noryvx-final-fixed/www/index.html';
let html = fs.readFileSync(file, 'utf8');

// FIX 1: Wrap noryvx-unified-hero-menu-img in its proper container div
// so existing CSS #scr-menu #noryvx-unified-hero-menu{display:none!important} hides it
html = html.replace(
  '<img id="noryvx-unified-hero-menu-img" alt="" style="display:none" aria-hidden="true">',
  '<div id="noryvx-unified-hero-menu"><img id="noryvx-unified-hero-menu-img" alt="" aria-hidden="true"></div>'
);

// FIX 2: Clean up the HUD right section — remove the confusing lone "1"
// The game JS sets profile-currency to '◆ N ÇEKİRDEK'
// Make profile-currency the whole right span, remove separate diamond prefix
// Show level as a clear badge, not inline text
html = html.replace(
  '<div>LV <span id="profile-level" style="color:#22e6ff;font-weight:700;">1</span> &nbsp;|&nbsp; <span class="nvx2-gems">&#9670; <b id="profile-currency">0</b></span></div>',
  '<div style="display:flex;align-items:center;gap:8px;"><span style="background:rgba(34,230,255,0.15);border:1px solid rgba(34,230,255,0.3);border-radius:4px;padding:2px 6px;font-size:9px;color:#22e6ff;font-weight:700;letter-spacing:0.1em;">LV&nbsp;<span id="profile-level">1</span></span><span id="profile-currency" style="color:#ffdd44;font-weight:700;font-size:10px;">&#9670;&nbsp;0</span></div>'
);

fs.writeFileSync(file, html, 'utf8');
console.log('Fixed. Lines:', html.split('\n').length);
