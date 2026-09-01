#!/usr/bin/env node
'use strict';
const fs = require('fs');
const file = '/data/data/com.termux/files/home/projects/noryvx-final-fixed/www/index.html';
let html = fs.readFileSync(file, 'utf8');

// FIX 1: Hide #run-wave-hud when scr-menu is active
// Add CSS rule after the NVX2 section
const cssInsert = `
/* Hide game-only HUD elements while in main menu */
#scr-menu.on ~ #run-wave-hud,
#scr-menu.on ~ * #run-wave-hud { opacity:0 !important; visibility:hidden !important; }
#run-wave-hud { opacity:0 !important; transition:opacity .2s ease; }
#run-wave-hud.on { opacity:1 !important; }
`;

// Inject after the nvx2 CSS block (before </style> that closes it)
html = html.replace(
  '/* ═══ END NVX2 ══════════════════════════════════════════════════════════════ */',
  '/* ═══ END NVX2 ══════════════════════════════════════════════════════════════ */\n' + cssInsert
);

// FIX 2: Remove profile-level from HUD — game JS just shows "1" number
// Replace the whole right HUD section with only currency, level shown in hero info bar
html = html.replace(
  /<div style="display:flex;align-items:center;gap:8px;"><span style="background:rgba\(34,230,255,0\.15\)[^>]+>LV&nbsp;<span id="profile-level">1<\/span><\/span><span id="profile-currency"[^>]+>&#9670;&nbsp;0<\/span><\/div>/,
  '<div><span id="profile-currency" style="color:#ffdd44;font-weight:700;font-size:11px;letter-spacing:0.05em;">&#9670;&nbsp;0</span><span id="profile-level" style="display:none">1</span></div>'
);

// FIX 3: OYNA button — remove fixed width, use flexbox stretch for true full-width
// Also add neon flicker animation
html = html.replace(
`/* OYNA button */
.nvx2-play {
  flex-shrink:0; width:calc(100% - 32px); margin:6px 16px;
  padding:14px 0 12px;
  background:linear-gradient(135deg,#22e6ff 0%,#1155cc 50%,#8822cc 100%);
  border:none; border-radius:10px; color:#fff;
  font-size:clamp(18px,5vw,26px); font-weight:900;
  letter-spacing:0.3em; text-transform:uppercase; cursor:pointer;
  box-shadow:0 0 24px rgba(34,230,255,0.5),0 4px 20px rgba(0,0,0,0.5);
  position:relative; overflow:hidden; text-align:center; line-height:1.2;
  transition:transform 0.1s, box-shadow 0.1s;
}
.nvx2-play small { display:block; font-size:clamp(8px,2.2vw,11px); letter-spacing:0.3em; font-weight:400; opacity:0.85; margin-top:2px; }
.nvx2-play::before { content:''; position:absolute; inset:0; background:linear-gradient(to bottom,rgba(255,255,255,0.15),transparent); pointer-events:none; }
.nvx2-play:active { transform:scale(0.98); box-shadow:0 0 14px rgba(34,230,255,0.3),0 2px 10px rgba(0,0,0,0.5); }`,
`/* OYNA button */
@keyframes nvx2NeonPulse {
  0%,100% {
    box-shadow:0 0 20px rgba(34,230,255,0.55),0 0 40px rgba(34,230,255,0.25),0 4px 20px rgba(0,0,0,0.6),inset 0 0 20px rgba(34,230,255,0.08);
    border-color:rgba(34,230,255,0.6);
  }
  50% {
    box-shadow:0 0 40px rgba(34,230,255,1.0),0 0 80px rgba(34,230,255,0.5),0 0 120px rgba(100,80,255,0.3),0 4px 20px rgba(0,0,0,0.6),inset 0 0 30px rgba(34,230,255,0.18);
    border-color:rgba(34,230,255,1.0);
  }
}
@keyframes nvx2Shimmer {
  0%   { transform:translateX(-120%) skewX(-20deg); }
  100% { transform:translateX(320%)  skewX(-20deg); }
}
.nvx2-play {
  flex-shrink:0;
  align-self:stretch;
  margin:6px 16px;
  padding:15px 0 13px;
  background:linear-gradient(135deg,#0a2a55 0%,#112266 40%,#221155 100%);
  border:1.5px solid rgba(34,230,255,0.6);
  border-radius:10px; color:#fff;
  font-size:clamp(18px,5vw,26px); font-weight:900;
  letter-spacing:0.35em; text-transform:uppercase; cursor:pointer;
  position:relative; overflow:hidden; text-align:center; line-height:1.2;
  animation:nvx2NeonPulse 2s ease-in-out infinite;
  transition:transform 0.1s;
}
.nvx2-play small { display:block; font-size:clamp(8px,2.2vw,11px); letter-spacing:0.3em; font-weight:400; opacity:0.75; margin-top:3px; color:#88ddff; }
.nvx2-play::before {
  content:'';
  position:absolute; top:0; left:0; width:40%; height:100%;
  background:linear-gradient(90deg,transparent,rgba(34,230,255,0.18),transparent);
  animation:nvx2Shimmer 2.4s ease-in-out infinite;
  pointer-events:none;
}
.nvx2-play::after {
  content:'';
  position:absolute; inset:0;
  background:linear-gradient(to bottom,rgba(255,255,255,0.08),transparent 60%);
  pointer-events:none;
}
.nvx2-play:active { transform:scale(0.97); }`
);

fs.writeFileSync(file, html, 'utf8');
console.log('Done. Lines:', html.split('\n').length);
