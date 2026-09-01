/* NORYVX 1945 V6 — plane SVG assets ONLY (robot PNGs ignored) */
(function () {
  'use strict';
  if (window.__NVX1945_V6__) return;
  window.__NVX1945_V6__ = true;
  window.__NVX1945_V5__ = true;
  window.__NVX1945_V4__ = true;

  var HERO_IMG = {};
  var ENEMY_IMG = {};
  var BUST = '?v=plane6';

  function tryLoad(map, key, paths) {
    var im = new Image();
    im.decoding = 'async';
    var i = 0;
    function next() {
      if (i >= paths.length) return;
      im.src = paths[i++] + (paths[i - 1].indexOf('?') >= 0 ? '' : BUST);
    }
    im.onerror = next;
    map[key] = im;
    next();
  }

  /* SVG FIRST — never load old robot PNGs */
  tryLoad(HERO_IMG, 'vanguard', [
    'assets/hero-vanguard.svg',
    './assets/hero-vanguard.svg',
    '/assets/hero-vanguard.svg'
  ]);
  tryLoad(HERO_IMG, 'striker', [
    'assets/hero-striker.svg',
    './assets/hero-striker.svg',
    '/assets/hero-striker.svg'
  ]);
  tryLoad(HERO_IMG, 'controller', [
    'assets/hero-controller.svg',
    './assets/hero-controller.svg',
    '/assets/hero-controller.svg'
  ]);
  tryLoad(ENEMY_IMG, 'scout', ['assets/enemy-scout.svg', './assets/enemy-scout.svg']);
  tryLoad(ENEMY_IMG, 'assault', ['assets/enemy-assault.svg', './assets/enemy-assault.svg']);
  tryLoad(ENEMY_IMG, 'elite', ['assets/enemy-elite.svg', './assets/enemy-elite.svg']);
  tryLoad(ENEMY_IMG, 'boss', ['assets/enemy-boss.svg', './assets/enemy-boss.svg']);

  function ready(im) {
    return im && im.complete && im.naturalWidth > 0;
  }

  function pathPlane(c, r, colors, faceDown) {
    colors = colors || { wing: '#22e6ff', hull: '#d8f8ff', glow: '#7af0ff' };
    c.save();
    if (faceDown) c.rotate(Math.PI);
    c.shadowColor = colors.glow;
    c.shadowBlur = 14;
    var b = r * 1.15;
    c.fillStyle = colors.wing;
    c.beginPath();
    c.moveTo(-b * 1.05, b * 0.1);
    c.lineTo(-b * 0.1, -b * 0.05);
    c.lineTo(b * 0.1, -b * 0.05);
    c.lineTo(b * 1.05, b * 0.1);
    c.lineTo(b * 0.35, b * 0.35);
    c.lineTo(-b * 0.35, b * 0.35);
    c.closePath();
    c.fill();
    c.fillStyle = colors.hull;
    c.beginPath();
    c.moveTo(0, -b * 1.05);
    c.lineTo(b * 0.28, b * 0.55);
    c.lineTo(0, b * 0.3);
    c.lineTo(-b * 0.28, b * 0.55);
    c.closePath();
    c.fill();
    c.fillStyle = '#e8fbff';
    c.beginPath();
    c.ellipse(0, -b * 0.35, b * 0.12, b * 0.18, 0, 0, Math.PI * 2);
    c.fill();
    c.fillStyle = colors.glow;
    c.beginPath();
    c.arc(-b * 0.12, b * 0.5, b * 0.1, 0, Math.PI * 2);
    c.arc(b * 0.12, b * 0.5, b * 0.1, 0, Math.PI * 2);
    c.fill();
    c.restore();
  }

  function heroKeyNorm(k) {
    k = String(k || 'vanguard').toLowerCase();
    if (k.indexOf('striker') >= 0) return 'striker';
    if (k.indexOf('controller') >= 0) return 'controller';
    return 'vanguard';
  }

  function heroColors(key) {
    if (key === 'striker') return { wing: '#ff6a3d', hull: '#ffe0d0', glow: '#ff8040' };
    if (key === 'controller') return { wing: '#b070ff', hull: '#f0e0ff', glow: '#c080ff' };
    return { wing: '#22e6ff', hull: '#d8f8ff', glow: '#7af0ff' };
  }

  function drawHeroPlaneOnCtx(c, key, cx, cy, size, time) {
    key = heroKeyNorm(key);
    var t = +time || performance.now() / 1000;
    var floatY = 6 * Math.sin(t * 1.6);
    var im = HERO_IMG[key];
    c.save();
    c.translate(cx, cy + floatY);
    if (ready(im)) {
      var h = size;
      var w = h * (im.naturalWidth / im.naturalHeight);
      c.shadowColor = heroColors(key).glow;
      c.shadowBlur = 22;
      c.drawImage(im, -w / 2, -h * 0.55, w, h);
    } else {
      pathPlane(c, size * 0.28, heroColors(key), false);
    }
    c.restore();
  }

  function forceRrHeroFull() {
    function planeHero(cxCtx, heroKey, cx, cy, scale, time) {
      var size = Math.max(160, 380 * (scale || 1));
      drawHeroPlaneOnCtx(cxCtx, heroKey, cx, cy - size * 0.15, size, time);
    }
    window.rrHeroFull = planeHero;
    try { rrHeroFull = planeHero; } catch (e) {}
  }

  function forceRenderMenuHero() {
    function planeMenu(dt) {
      try {
        var scr = document.getElementById('scr-menu');
        if (!scr || !scr.classList.contains('on')) return;
        if (typeof HERO === 'undefined' || !HERO) return;
        if (!HERO.cv) {
          HERO.cv = document.getElementById('hero-canvas');
          if (!HERO.cv) return;
          HERO.cx = HERO.cv.getContext('2d');
        }
        if (!HERO.cx) return;
        try {
          if (typeof heroResize === 'function') heroResize();
        } catch (e) {}
        if (!HERO.w || !HERO.h) {
          var r = HERO.cv.getBoundingClientRect();
          var dpr = Math.min(2, window.devicePixelRatio || 1);
          if (r.width && r.height) {
            HERO.w = Math.round(r.width * dpr);
            HERO.h = Math.round(r.height * dpr);
            HERO.cv.width = HERO.w;
            HERO.cv.height = HERO.h;
          }
        }
        if (!HERO.w || !HERO.h) return;
        HERO.t = (HERO.t || 0) + (dt || 0.016);
        var key = 'vanguard';
        try {
          if (typeof heroArchId === 'function') key = heroKeyNorm(heroArchId());
          else if (Save && Save.data && Save.data.selectedHero) key = heroKeyNorm(Save.data.selectedHero);
        } catch (e) {}
        if (key !== HERO.last) {
          HERO.last = key;
          var n = document.getElementById('hero-class');
          var role = document.getElementById('hero-role');
          if (n) n.textContent = key.toUpperCase();
          if (role) {
            role.textContent =
              key === 'striker'
                ? 'INTERCEPTOR · STRIKE WING'
                : key === 'controller'
                  ? 'SUPPORT CRAFT · EW'
                  : 'HEAVY FIGHTER · FRONTLINE';
          }
        }
        var c = HERO.cx;
        var w = HERO.w;
        var h = HERO.h;
        c.clearRect(0, 0, w, h);
        var g = c.createRadialGradient(w / 2, h * 0.7, 4, w / 2, h * 0.7, w * 0.45);
        g.addColorStop(0, 'rgba(34,230,255,0.12)');
        g.addColorStop(1, 'rgba(0,0,0,0)');
        c.fillStyle = g;
        c.fillRect(0, 0, w, h);
        drawHeroPlaneOnCtx(c, key, w / 2, h * 0.52, Math.min(w, h) * 0.72, HERO.t);
      } catch (err) {}
    }
    window.renderMenuHero = planeMenu;
    try { renderMenuHero = planeMenu; } catch (e) {}
  }

  function forceNvxHeroPaint() {
    function planePaint() {
      try {
        var cv = document.getElementById('nvx-hero-canvas') || document.querySelector('#scr-rpgchar canvas');
        if (!cv) return;
        var c = cv.getContext('2d');
        if (!c) return;
        var dpr = Math.min(2, window.devicePixelRatio || 1);
        var rect = cv.getBoundingClientRect();
        var w = Math.round((rect.width || 300) * dpr);
        var h = Math.round((rect.height || 400) * dpr);
        if (cv.width !== w || cv.height !== h) {
          cv.width = w;
          cv.height = h;
        }
        c.clearRect(0, 0, w, h);
        var key = 'vanguard';
        try {
          if (typeof nvxHeroCurrent === 'function') key = heroKeyNorm(nvxHeroCurrent().key);
        } catch (e) {}
        drawHeroPlaneOnCtx(c, key, w / 2, h * 0.55, Math.min(w, h) * 0.7, performance.now() / 1000);
      } catch (err) {}
    }
    window.nvxHeroPaint = planePaint;
    try { nvxHeroPaint = planePaint; } catch (e) {}
  }

  function forcePlayer() {
    function planePlayer() {
      try {
        if (!player) return;
        if (player.invuln > 0 && ((performance.now() / 70) | 0) % 2 === 0) return;
        var key = 'vanguard';
        try {
          if (window.NORYVX_P3 && typeof window.NORYVX_P3.archetype === 'function') {
            var a = window.NORYVX_P3.archetype();
            key = heroKeyNorm(a.id || a.key || a.name);
          } else if (Save && Save.data && Save.data.selectedHero) {
            key = heroKeyNorm(Save.data.selectedHero);
          }
        } catch (e) {}
        ctx.save();
        try {
          if (Game && Game.powers && Game.powers.shield > 0) {
            ctx.strokeStyle = '#48d9ff';
            ctx.shadowColor = '#48d9ff';
            ctx.shadowBlur = 16;
            ctx.lineWidth = 2;
            ctx.globalAlpha = 0.65;
            ctx.beginPath();
            ctx.arc(player.x, player.y, 26, 0, Math.PI * 2);
            ctx.stroke();
            ctx.globalAlpha = 1;
          }
        } catch (e2) {}
        ctx.translate(player.x, player.y);
        var im = HERO_IMG[key];
        if (ready(im)) {
          var hh = 38;
          var ww = hh * (im.naturalWidth / im.naturalHeight);
          ctx.shadowColor = heroColors(key).glow;
          ctx.shadowBlur = 12;
          ctx.drawImage(im, -ww / 2, -hh / 2, ww, hh);
        } else {
          pathPlane(ctx, 14, heroColors(key), true);
        }
        ctx.restore();
      } catch (err) {}
    }
    window.drawPlayer = planePlayer;
    try { drawPlayer = planePlayer; } catch (e) {}
  }

  function forceEnemies() {
    try {
      if (typeof atlasHas === 'function' && !atlasHas.__nvxPlane) {
        var prev = atlasHas;
        window.atlasHas = function (name) {
          var n = String(name || '').toLowerCase();
          if (/hunter|tank|orbiter|dasher|weaver|elite|boss|robot|unit/.test(n)) return false;
          return prev.apply(this, arguments);
        };
        window.atlasHas.__nvxPlane = true;
        try { atlasHas = window.atlasHas; } catch (e) {}
      }
    } catch (e) {}

    function drawEnemySprite(e, paint, r, mode) {
      var rad = r || (e && e.r) || 14;
      var im =
        mode === 'boss'
          ? ENEMY_IMG.boss
          : mode === 'elite'
            ? ENEMY_IMG.elite
            : e && e.type === 1
              ? ENEMY_IMG.assault
              : ENEMY_IMG.scout;
      if (ready(im)) {
        var h = rad * (mode === 'boss' ? 3.2 : mode === 'elite' ? 2.6 : 2.4);
        var w = h * (im.naturalWidth / im.naturalHeight);
        ctx.shadowColor = (paint && paint.edge) || '#ff4060';
        ctx.shadowBlur = mode === 'boss' ? 16 : 10;
        ctx.drawImage(im, -w / 2, -h / 2, w, h);
      } else {
        var col =
          mode === 'boss'
            ? { wing: '#ff3b6b', hull: '#ffd0d8', glow: '#ff6090' }
            : mode === 'elite'
              ? { wing: '#ffe34d', hull: '#fff4c8', glow: '#ffd24d' }
              : { wing: '#ff6a4a', hull: '#ffe0e8', glow: '#ff4060' };
        pathPlane(ctx, rad, col, true);
      }
    }

    window.rrEnemyUnit = function (e, paint, r) {
      drawEnemySprite(e, paint, r, 'normal');
    };
    window.rrEliteUnit = function (e, paint) {
      drawEnemySprite(e, paint, (e && e.r) || 18, 'elite');
    };
    window.rrBossUnit = function (e) {
      drawEnemySprite(e, null, (e && e.r) || 28, 'boss');
    };
    try { rrEnemyUnit = window.rrEnemyUnit; } catch (e) {}
    try { rrEliteUnit = window.rrEliteUnit; } catch (e) {}
    try { rrBossUnit = window.rrBossUnit; } catch (e) {}
  }

  function injectHudCss() {
    if (document.getElementById('nvx-1945-hud-css')) return;
    var s = document.createElement('style');
    s.id = 'nvx-1945-hud-css';
    s.textContent =
      '#nvx-weapon-power{position:absolute!important;left:12px!important;bottom:calc(env(safe-area-inset-bottom,0px)+20px)!important;z-index:12!important;pointer-events:none!important;padding:8px 10px!important;border-radius:12px!important;background:rgba(2,10,24,.82)!important;border:1px solid rgba(34,230,255,.28)!important;display:none!important;flex-direction:column!important;gap:4px!important;}' +
      '#nvx-weapon-power.on{display:flex!important;}' +
      '#nvx-wp-label{font:700 7px IBM Plex Mono,monospace!important;letter-spacing:.2em!important;color:rgba(34,230,255,.65)!important;}' +
      '#nvx-wp-level{font:800 20px Chakra Petch,sans-serif!important;color:#7af0ff!important;line-height:1!important;}' +
      '#nvx-wp-track{width:64px!important;height:5px!important;border-radius:99px!important;background:rgba(34,230,255,.12)!important;overflow:hidden!important;}' +
      '#nvx-wp-bar{height:100%!important;background:linear-gradient(90deg,#22e6ff,#7b2fff)!important;}';
    document.head.appendChild(s);
  }

  function isPlaying() {
    try {
      if (!Game) return false;
      if (typeof STATE !== 'undefined' && STATE && STATE.PLAYING != null) return Game.state === STATE.PLAYING;
      return Game.state === 'PLAYING';
    } catch (e) {
      return false;
    }
  }

  function scrubRings() {
    var rings = null;
    try {
      if (typeof RINGS !== 'undefined') rings = RINGS;
      else if (window.RINGS) rings = window.RINGS;
    } catch (e) {}
    if (!rings) return;
    for (var i = 0; i < rings.length; i++) {
      var s = rings[i];
      if (!s || !s.alive) continue;
      if (s.max > 0.55) s.max = 0.55;
      if (s.life > 0.55) s.life = 0.55;
      if (s.life <= 0 || !isFinite(s.life)) {
        s.alive = false;
        s.life = 0;
      }
    }
  }

  function bootVisual() {
    forceRrHeroFull();
    forceRenderMenuHero();
    forceNvxHeroPaint();
    forcePlayer();
    forceEnemies();
  }

  function boot() {
    bootVisual();
    injectHudCss();
    setInterval(function () {
      bootVisual();
      scrubRings();
      var el = document.getElementById('nvx-weapon-power');
      if (el) el.classList.toggle('on', isPlaying());
    }, 300);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () {
      setTimeout(boot, 10);
    });
  } else {
    setTimeout(boot, 10);
  }
  setTimeout(boot, 150);
  setTimeout(boot, 800);
  setTimeout(boot, 2000);
})();
