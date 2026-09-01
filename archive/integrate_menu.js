#!/usr/bin/env node
'use strict';
const fs = require('fs');

const GAME = '/data/data/com.termux/files/home/projects/noryvx-final-fixed/www/index.html';
const MENU = '/data/data/com.termux/files/home/neon-survivor/www/norvyx-menu.html';

let game = fs.readFileSync(GAME, 'utf8');
const menu = fs.readFileSync(MENU, 'utf8');

// ── 1. Extract base64 hero image from menu prototype ──────────────────────────
const b64 = menu.match(/src="(data:image\/png;base64,[^"]+)"/)[1];

// ── 2. Extract the animation JS (lines 397..717 in menu file) ─────────────────
// Find everything between <script> and end of IIFE
const scriptContentStart = menu.indexOf('<script>') + '<script>'.length;
// The script ends with: })();\n\n</body>
const scriptContentEnd = menu.lastIndexOf('})();') + '})();'.length;
let animJS = menu.slice(scriptContentStart, scriptContentEnd);

// Adapt for game integration:
// 1. Use nvx-city-canvas instead of canvas#c
// 2. Only animate when scr-menu is visible
// 3. Remove startGame function (game already has it)
animJS = animJS
  .replace("document.getElementById('c')", "document.getElementById('nvx-city-canvas')")
  .replace('function startGame() {\n  window.location.href = \'game.html\';\n}\n\n', '');

// Wrap in a guard: only run when scr-menu is active
const animWrapped = `
(function nvxMenuAnim() {
'use strict';

const canvas = document.getElementById('nvx-city-canvas');
const ctx = canvas.getContext('2d');
let W = 0, H = 0, t = 0;

function resize() {
  W = canvas.width  = window.innerWidth;
  H = canvas.height = window.innerHeight;
  initRain();
}
window.addEventListener('resize', resize);
resize();

const CHARS = '01アイウエオカキクケコタチツテトナニヌネノABCDEF◈◆▲⬡';
const CHAR_W = 14;
let drops = [];

function initRain() {
  const cols = Math.ceil(W / CHAR_W);
  drops = Array.from({ length: cols }, (_, i) => ({
    x: i * CHAR_W,
    y: Math.random() * -H,
    speed: 35 + Math.random() * 90,
    len: 8 + Math.floor(Math.random() * 16),
    chars: Array.from({ length: 24 }, () => CHARS[Math.floor(Math.random() * CHARS.length)]),
    bright: Math.random() > 0.65,
    timer: 0,
    interval: 0.08 + Math.random() * 0.12
  }));
}

function drawRain(dt) {
  ctx.font = '12px monospace';
  for (const d of drops) {
    d.timer += dt;
    if (d.timer > d.interval) {
      d.timer = 0;
      d.chars.pop();
      d.chars.unshift(CHARS[Math.floor(Math.random() * CHARS.length)]);
    }
    d.y += d.speed * dt;
    if (d.y > H + d.len * 14) {
      d.y = -d.len * 14 - Math.random() * H * 0.5;
      d.speed = 35 + Math.random() * 90;
      d.bright = Math.random() > 0.65;
    }
    for (let j = 0; j < d.len; j++) {
      const cy = d.y - j * 14;
      if (cy < -14 || cy > H + 14) continue;
      let alpha, color;
      if (j === 0) {
        alpha = d.bright ? 1.0 : 0.7;
        color = d.bright ? '255,255,255' : '34,230,255';
        ctx.shadowColor = '#22e6ff';
        ctx.shadowBlur  = d.bright ? 18 : 8;
      } else {
        const fade = 1 - j / d.len;
        alpha = fade * (d.bright ? 0.65 : 0.35);
        color = '34,230,255';
        ctx.shadowBlur = 0;
      }
      ctx.fillStyle = 'rgba(' + color + ',' + alpha + ')';
      ctx.fillText(d.chars[j] || '0', d.x, cy);
    }
  }
  ctx.shadowBlur = 0;
}

const BLDGS = (() => {
  const arr = [];
  const n = 22;
  for (let i = 0; i < n; i++) {
    const layer = i % 3;
    arr.push({
      xFrac: i / n + (Math.random() * 0.02 - 0.01),
      wFrac: 0.03 + Math.random() * 0.055,
      hFrac: (layer === 0 ? 0.25 : layer === 1 ? 0.18 : 0.12) + Math.random() * 0.18,
      layer,
      windows: Array.from({ length: 30 }, () => ({
        xr: Math.random(), yr: Math.random(),
        on: Math.random() > 0.4,
        phase: Math.random() * Math.PI * 2,
        color: Math.random() > 0.6 ? '160,92,255' : Math.random() > 0.5 ? '34,230,255' : '255,79,216'
      })),
      neonSide: Math.random() > 0.5,
      neonColor: Math.random() > 0.5 ? '#22e6ff' : '#a05cff'
    });
  }
  return arr.sort((a, b) => a.layer - b.layer);
})();

function drawCity(t) {
  for (const b of BLDGS) {
    const bx = b.xFrac * W, bw = b.wFrac * W, bh = b.hFrac * H, by = H - bh;
    const dark = b.layer === 0 ? 'rgba(4,10,28,0.92)' : b.layer === 1 ? 'rgba(3,8,22,0.88)' : 'rgba(2,5,15,0.82)';
    ctx.fillStyle = dark;
    ctx.fillRect(bx, by, bw, bh);
    const ww = Math.max(2, bw * 0.18), wh = Math.max(2, bh * 0.055);
    for (const w of b.windows) {
      const wx = bx + (w.xr * 0.8 + 0.1) * bw - ww / 2;
      const wy = by + (w.yr * 0.85 + 0.05) * bh - wh / 2;
      if (wx < bx || wx + ww > bx + bw) continue;
      const lit = w.on && Math.sin(t * 0.3 + w.phase) > -0.95;
      if (!lit) continue;
      const a = 0.5 + Math.sin(t * 1.2 + w.phase) * 0.3;
      ctx.fillStyle = 'rgba(' + w.color + ',' + a + ')';
      ctx.fillRect(wx, wy, ww, wh);
    }
    if (b.neonSide) {
      const pa = 0.5 + Math.sin(t * 1.8 + b.xFrac * 10) * 0.4;
      ctx.strokeStyle = b.neonColor;
      ctx.globalAlpha = pa * 0.6;
      ctx.lineWidth = 1.5;
      ctx.shadowColor = b.neonColor;
      ctx.shadowBlur = 6;
      ctx.beginPath(); ctx.moveTo(bx, by); ctx.lineTo(bx, by + bh * 0.6); ctx.stroke();
      ctx.shadowBlur = 0; ctx.globalAlpha = 1;
    }
  }
}

function drawGrid(t) {
  const vx = W * 0.5, vy = H * 0.55;
  ctx.strokeStyle = 'rgba(34,100,180,0.12)';
  ctx.lineWidth = 0.8;
  const rows = 10;
  for (let i = 0; i < rows; i++) {
    const frac = i / rows;
    const y = vy + (H - vy) * frac;
    const xs = W * 0.5 * (1 - frac), xe = W - xs;
    ctx.beginPath(); ctx.moveTo(xs, y); ctx.lineTo(xe, y); ctx.stroke();
  }
  const cols = 18;
  for (let i = 0; i <= cols; i++) {
    const frac = i / cols;
    const sx = frac * W, sy = H;
    ctx.beginPath(); ctx.moveTo(sx, sy); ctx.lineTo(vx, vy); ctx.stroke();
  }
}

let glitchTimer = 0, glitchActive = false, glitchLines = [];
function drawGlitch(dt) {
  glitchTimer -= dt;
  if (glitchTimer <= 0) {
    glitchTimer = 2 + Math.random() * 5;
    glitchActive = Math.random() > 0.6;
    if (glitchActive) {
      glitchLines = Array.from({ length: 3 + Math.floor(Math.random() * 5) }, () => ({
        y: Math.random() * H, h: 1 + Math.random() * 6, shift: (Math.random() - 0.5) * 30
      }));
    }
  }
  if (!glitchActive) return;
  for (const l of glitchLines) {
    try {
      const d = ctx.getImageData(0, l.y, W, l.h);
      ctx.putImageData(d, l.shift, l.y);
    } catch(e) {}
  }
}

function drawScan(t) {
  const y = (t * 60) % (H + 80) - 40;
  const g = ctx.createLinearGradient(0, y, 0, y + 80);
  g.addColorStop(0, 'rgba(34,230,255,0)');
  g.addColorStop(0.5, 'rgba(34,230,255,0.04)');
  g.addColorStop(1, 'rgba(34,230,255,0)');
  ctx.fillStyle = g; ctx.fillRect(0, y, W, 80);
}

function drawVignette() {
  const g = ctx.createRadialGradient(W/2, H/2, H*0.3, W/2, H/2, H*0.8);
  g.addColorStop(0, 'rgba(2,6,17,0)');
  g.addColorStop(1, 'rgba(2,6,17,0.72)');
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
}

function drawVanguard(t) {
  const el = document.getElementById('nvx2-hero-img');
  if (!el) return;
  const r = el.getBoundingClientRect();
  if (!r.width) return;
  const vx = r.left + r.width / 2;
  const vy = r.top + r.height / 2;
  const flt = Math.sin(t * 2.85) * 10;
  const pulse = (Math.sin(t * 2.24) + 1) / 2;

  const ag = ctx.createRadialGradient(vx, vy + flt, 0, vx, vy + flt, 170);
  ag.addColorStop(0, 'rgba(100,80,255,' + (0.18 + pulse * 0.08) + ')');
  ag.addColorStop(0.5, 'rgba(34,230,255,' + (0.10 + pulse * 0.06) + ')');
  ag.addColorStop(1, 'rgba(34,230,255,0)');
  ctx.fillStyle = ag;
  ctx.beginPath(); ctx.arc(vx, vy + flt, 170, 0, Math.PI * 2); ctx.fill();

  const gy = r.top + r.height * 0.90;
  const gg = ctx.createRadialGradient(vx, gy, 0, vx, gy, 90);
  gg.addColorStop(0, 'rgba(34,230,255,' + (0.25 + pulse * 0.12) + ')');
  gg.addColorStop(1, 'rgba(34,230,255,0)');
  ctx.fillStyle = gg;
  ctx.beginPath(); ctx.ellipse(vx, gy, 90, 16, 0, 0, Math.PI * 2); ctx.fill();

  for (let i = 0; i < 3; i++) {
    const ph = t * 0.45 + i * Math.PI * 2 / 3;
    const rr = 65 + i * 30 + Math.sin(ph) * 7;
    const a  = (0.12 - i * 0.03) * (0.7 + 0.3 * Math.sin(ph));
    ctx.strokeStyle = 'rgba(34,230,255,' + a + ')';
    ctx.lineWidth = 1;
    ctx.shadowColor = '#22e6ff'; ctx.shadowBlur = 6;
    ctx.beginPath(); ctx.arc(vx, vy + flt, rr, 0, Math.PI * 2); ctx.stroke();
  }
  ctx.shadowBlur = 0;
}

// Initial dark fill
ctx.fillStyle = '#020611';
ctx.fillRect(0, 0, W, H);

function frame(ts) {
  if (!frame.last) frame.last = ts;
  const dt = Math.min((ts - frame.last) / 1000, 0.05);
  t += dt;
  frame.last = ts;

  const menuEl = document.getElementById('scr-menu');
  if (!menuEl || !menuEl.classList.contains('on')) {
    requestAnimationFrame(frame);
    return;
  }

  ctx.fillStyle = 'rgba(2,6,17,0.18)';
  ctx.fillRect(0, 0, W, H);

  drawCity(t);
  drawGrid(t);
  drawRain(dt);
  drawScan(t);
  drawGlitch(dt);
  drawVignette();
  drawVanguard(t);

  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);

})();
`;

// ── 3. New #scr-menu HTML ─────────────────────────────────────────────────────
const newMenuHTML = `<div class="screen on" id="scr-menu">
<canvas id="nvx-city-canvas" style="position:absolute;inset:0;width:100%;height:100%;display:block;pointer-events:none;z-index:0"></canvas>

<div id="nvx2-ui">
  <!-- HUD -->
  <div id="nvx2-hud">
    <div><span class="nvx2-version">V20.3.1</span> <span class="nvx2-phase">· PHASE 3</span></div>
    <div style="letter-spacing:0.2em;color:#22e6ff;font-weight:700;">NORVYX</div>
    <div>LV <span id="profile-level" style="color:#22e6ff;font-weight:700;">1</span> &nbsp;|&nbsp; <span class="nvx2-gems">&#9670; <b id="profile-currency">0</b></span></div>
  </div>

  <!-- Logo -->
  <div id="nvx2-logo">
    <div class="nvx2-logo-main">NORVYX</div>
    <span class="nvx2-logo-sub">Taktik Hayatta Kalma &middot; Sekt&ouml;r 01</span>
  </div>

  <!-- Hero Area -->
  <div id="nvx2-hero-area">
    <img id="nvx2-hero-img" alt="Vanguard" src="${b64}">
    <img id="noryvx-unified-hero-menu-img" alt="" style="display:none" aria-hidden="true">
  </div>

  <!-- Vanguard info bar -->
  <div id="nvx2-vinfo">
    <span class="nvx2-vi-label">VANGUARD &nbsp;|&nbsp; BEST SKOR</span>
    <div class="nvx2-vi-bar-wrap"><div class="nvx2-vi-bar-fill" style="width:0%"></div></div>
    <span class="nvx2-vi-score" id="menu-best">--</span>
  </div>

  <!-- OYNA button -->
  <button id="b-play" class="nvx2-play">
    OYNA<small>SEKT&Ouml;RE G&#304;R&#304;&#350; YAP</small>
  </button>

  <!-- Cards: HERO / DEVELOP / SYSTEM -->
  <div id="nvx2-cards">
    <button class="nvx2-card" id="b-rpgchar"><span class="nvx2-card-ico">&#9876;</span>HERO<small>KOMUTANINI Y&Ouml;NET</small></button>
    <button class="nvx2-card" id="b-phase3"><span class="nvx2-card-ico">&#11042;</span>DEVELOP<small>GEL&#304;&#350;T&#304;R &amp; Y&Uuml;KSELT</small></button>
    <button class="nvx2-card" id="b-settings"><span class="nvx2-card-ico">&#9881;</span>SYSTEM<small>AYARLAR &amp; D&#304;&#286;ER</small></button>
  </div>

  <!-- Mission + Season row -->
  <div id="nvx2-msrow">
    <div class="nvx2-ms-card">
      <div class="nvx2-ms-tag">G&Uuml;NL&Uuml;K G&Ouml;REV</div>
      <div class="nvx2-ms-name">D&uuml;&scaron;manlar&#305; Yok Et</div>
      <div class="nvx2-ms-bar"><div class="nvx2-ms-fill" style="width:0%"></div></div>
      <div class="nvx2-ms-rew">0 / 25 &nbsp; &#9670; 150</div>
    </div>
    <div class="nvx2-ms-card">
      <div class="nvx2-ms-tag" style="color:#ff4fd8">SEZON 1</div>
      <div class="nvx2-ms-name">PROTOCOL REBIRTH</div>
      <div class="nvx2-ms-bar"><div class="nvx2-ms-fill" style="width:12%"></div></div>
      <div class="nvx2-ms-rew">12%</div>
    </div>
  </div>

  <!-- News ticker -->
  <div id="nvx2-news">
    <span class="nvx2-news-lbl">HABER</span>
    <div class="nvx2-ticker-wrap"><span class="nvx2-ticker">&#9672; NORVYX yay&#305;nda! &#304;lk sezon Protocol Rebirth ba&#351;lad&#305; &middot; &#9672; VANGUARD g&uuml;ncellemesi: Kalkan sistemi aktif &middot; &#9672; Neon Ya&#287;muru etkinli&#287;i: Bonus hasar aktif &middot; &#9672; Yeni sekt&ouml;rler yak&#305;nda geliyor</span></div>
  </div>
</div>

<!-- Hidden buttons required by game JS -->
<div style="display:none"><button id="b-mastery"></button><button id="b-tech"></button><button id="b-how"></button><button id="b-upgrades"></button><button id="b-sectors"></button><button id="b-build"></button><button id="b-missions"></button><button id="b-ach"></button><button id="b-save"></button><button id="b-shop"></button><button id="b-cosm"></button><button id="b-kill"></button><button id="b-skins"></button><button id="b-battlepass"></button><button id="b-leaderboard"></button><button id="b-language-open"></button><button id="t-sound"></button><button id="t-vibe"></button></div>
</div>`;

// ── 4. New CSS to inject ───────────────────────────────────────────────────────
const newCSS = `
/* ═══ NVX2 MENU REDESIGN ═══════════════════════════════════════════════════ */
#scr-menu { background:#020611 !important; }
#nvx2-ui {
  position:absolute; inset:0; z-index:1;
  display:flex; flex-direction:column; align-items:stretch;
  pointer-events:none;
}
#nvx2-ui > * { pointer-events:auto; }

/* HUD */
#nvx2-hud {
  display:flex; align-items:center; justify-content:space-between;
  padding:10px 16px 12px;
  background:linear-gradient(to bottom,rgba(2,6,17,0.92),transparent);
  font-size:11px; letter-spacing:0.12em; color:#88c8ff; flex-shrink:0;
}
.nvx2-version { color:#22e6ff; font-weight:700; }
.nvx2-phase   { color:#a0c8ff; }
.nvx2-gems    { color:#ffdd44; font-weight:700; }

/* Logo */
#nvx2-logo { text-align:center; padding:2px 16px 0; flex-shrink:0; }
.nvx2-logo-main {
  font-size:clamp(28px,7vw,48px); font-weight:900; letter-spacing:0.25em;
  background:linear-gradient(135deg,#22e6ff 0%,#4488ff 50%,#aa44ff 100%);
  -webkit-background-clip:text; -webkit-text-fill-color:transparent;
  background-clip:text; filter:drop-shadow(0 0 12px rgba(34,230,255,0.6));
  line-height:1;
}
.nvx2-logo-sub {
  font-size:clamp(9px,2.5vw,13px); letter-spacing:0.3em; color:#4488aa;
  text-transform:uppercase; margin-top:2px; display:block;
}

/* Hero area */
#nvx2-hero-area {
  flex:1; min-height:200px; background:transparent;
  pointer-events:none; display:flex; align-items:center; justify-content:center;
}
#nvx2-hero-img {
  width:min(68vw,300px); height:min(68vw,300px); object-fit:contain;
  filter:drop-shadow(0 0 18px rgba(34,230,255,0.7)) drop-shadow(0 0 40px rgba(34,230,255,0.35)) drop-shadow(0 0 80px rgba(100,80,255,0.2));
  animation:nvx2HeroFloat 2.2s ease-in-out infinite, nvx2HeroPulse 2.8s ease-in-out infinite;
}
@keyframes nvx2HeroFloat {
  0%,100%{transform:translateY(0) scale(1)} 50%{transform:translateY(-10px) scale(1.012)}
}
@keyframes nvx2HeroPulse {
  0%,100%{filter:drop-shadow(0 0 16px rgba(34,230,255,0.65)) drop-shadow(0 0 38px rgba(34,230,255,0.30)) drop-shadow(0 0 70px rgba(100,80,255,0.18))}
  50%{filter:drop-shadow(0 0 26px rgba(34,230,255,0.95)) drop-shadow(0 0 55px rgba(34,230,255,0.50)) drop-shadow(0 0 100px rgba(100,80,255,0.30))}
}

/* Vinfo bar */
#nvx2-vinfo {
  flex-shrink:0; margin:0 16px 6px; padding:8px 14px;
  background:rgba(8,14,30,0.82); border:1px solid rgba(34,230,255,0.2);
  border-radius:8px; display:flex; align-items:center; gap:12px;
}
.nvx2-vi-label { font-size:9px; letter-spacing:0.18em; color:#4488aa; white-space:nowrap; text-transform:uppercase; }
.nvx2-vi-bar-wrap { flex:1; height:6px; background:rgba(34,230,255,0.1); border-radius:3px; overflow:hidden; }
.nvx2-vi-bar-fill { height:100%; background:linear-gradient(90deg,#22e6ff,#4488ff); border-radius:3px; box-shadow:0 0 8px #22e6ff; }
.nvx2-vi-score { font-size:10px; color:#88c8ff; white-space:nowrap; letter-spacing:0.1em; }

/* OYNA button */
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
.nvx2-play:active { transform:scale(0.98); box-shadow:0 0 14px rgba(34,230,255,0.3),0 2px 10px rgba(0,0,0,0.5); }

/* Cards */
#nvx2-cards { flex-shrink:0; display:flex; gap:8px; margin:0 16px 8px; }
.nvx2-card {
  flex:1; padding:10px 4px 8px;
  background:rgba(8,14,30,0.82); border:1px solid rgba(34,230,255,0.18);
  border-radius:8px; color:#88c8ff; font-size:10px; font-weight:700;
  letter-spacing:0.15em; text-align:center; cursor:pointer;
  text-transform:uppercase; transition:border-color 0.2s,background 0.2s;
  display:flex; flex-direction:column; align-items:center; gap:2px;
}
.nvx2-card-ico { font-size:16px; display:block; margin-bottom:2px; }
.nvx2-card small { font-size:8px; font-weight:400; letter-spacing:0.08em; color:#4488aa; display:block; margin-top:1px; }
.nvx2-card:active { border-color:rgba(34,230,255,0.55); background:rgba(8,18,40,0.92); }

/* Mission / Season row */
#nvx2-msrow { flex-shrink:0; display:flex; gap:8px; margin:0 16px 8px; }
.nvx2-ms-card { flex:1; padding:9px 12px; background:rgba(8,14,30,0.82); border:1px solid rgba(34,230,255,0.14); border-radius:8px; }
.nvx2-ms-tag { font-size:8px; letter-spacing:0.2em; color:#22e6ff; text-transform:uppercase; margin-bottom:3px; }
.nvx2-ms-name { font-size:11px; font-weight:700; color:#c8e6ff; margin-bottom:4px; }
.nvx2-ms-bar { height:3px; background:rgba(34,230,255,0.12); border-radius:2px; overflow:hidden; margin-bottom:3px; }
.nvx2-ms-fill { height:100%; background:linear-gradient(90deg,#22e6ff,#4488ff); border-radius:2px; }
.nvx2-ms-rew { font-size:9px; color:#4488aa; }

/* News ticker */
#nvx2-news {
  flex-shrink:0; display:flex; align-items:center;
  padding:7px 14px; background:rgba(4,8,20,0.88);
  border-top:1px solid rgba(34,230,255,0.12); gap:10px; overflow:hidden;
}
.nvx2-news-lbl {
  font-size:8px; letter-spacing:0.25em; color:#22e6ff; font-weight:700;
  white-space:nowrap; text-transform:uppercase;
  border:1px solid rgba(34,230,255,0.4); padding:2px 6px; border-radius:3px;
}
.nvx2-ticker-wrap { overflow:hidden; flex:1; white-space:nowrap; }
.nvx2-ticker {
  display:inline-block; font-size:10px; color:#7aabcc;
  animation:nvx2Scroll 28s linear infinite;
}
@keyframes nvx2Scroll { 0%{transform:translateX(100vw)} 100%{transform:translateX(-100%)} }
/* ═══ END NVX2 ══════════════════════════════════════════════════════════════ */
`;

// ── 5. Perform replacements in game HTML ──────────────────────────────────────

// 5a. Add CSS before </style> (the style block right before the first screen div)
//     Find the </style> just before line 2753 (the scr-menu area)
const styleCloseIdx = game.lastIndexOf('</style>', game.indexOf('<div class="screen on" id="scr-menu">'));
if (styleCloseIdx === -1) { console.error('Could not find </style> before scr-menu'); process.exit(1); }
game = game.slice(0, styleCloseIdx) + newCSS + game.slice(styleCloseIdx);
console.log('CSS injected');

// 5b. Replace #scr-menu block
const menuStart = game.indexOf('<div class="screen on" id="scr-menu">');
if (menuStart === -1) { console.error('scr-menu not found'); process.exit(1); }

// Find closing </div> for scr-menu — it's followed by the city-anim script
// We need to find the end of the scr-menu block
// It ends with: </div>\n\n<script id="nvx-city-anim">
const cityAnimMarker = '<script id="nvx-city-anim">';
const cityAnimIdx = game.indexOf(cityAnimMarker);
if (cityAnimIdx === -1) { console.error('city-anim script not found'); process.exit(1); }

// The scr-menu block ends just before the city-anim script
// Find the last </div> before cityAnimIdx
let menuEndIdx = game.lastIndexOf('</div>', cityAnimIdx);
while (menuEndIdx > menuStart && game.slice(menuEndIdx, menuEndIdx + 10) === '</div>') {
  // Check if this is after the hidden buttons div
  if (game.slice(menuEndIdx - 200, menuEndIdx).includes('b-battlepass')) {
    menuEndIdx += '</div>'.length;
    break;
  }
  menuEndIdx = game.lastIndexOf('</div>', menuEndIdx - 1);
}

// Simpler: find the closing of the hidden buttons div
// The scr-menu outer div closes right after the hidden buttons div
// Pattern: </div>\n</div>\n\n<script id="nvx-city-anim">
const beforeCityAnim = game.slice(cityAnimIdx - 300, cityAnimIdx);
const lastTwoClosing = beforeCityAnim.lastIndexOf('</div>\n</div>');
const scr_menu_close = cityAnimIdx - 300 + lastTwoClosing + '</div>\n</div>'.length;

game = game.slice(0, menuStart) + newMenuHTML + '\n' + game.slice(scr_menu_close);
console.log('scr-menu replaced');

// 5c. Replace the city-anim script
const cityAnimStart2 = game.indexOf('<script id="nvx-city-anim">');
const cityAnimEndMarker = '</script>';
const cityAnimEnd2 = game.indexOf(cityAnimEndMarker, cityAnimStart2) + cityAnimEndMarker.length;

const newAnimScript = `<script id="nvx-city-anim">\n${animWrapped}\n</script>`;
game = game.slice(0, cityAnimStart2) + newAnimScript + game.slice(cityAnimEnd2);
console.log('Animation replaced');

// ── 6. Write output ───────────────────────────────────────────────────────────
fs.writeFileSync(GAME, game, 'utf8');
console.log('Done! Lines:', game.split('\n').length);
