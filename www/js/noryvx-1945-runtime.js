/* NORYVX 1945 + INLINE visual force (planes only, no robots) */
(function () {
  'use strict';
  if (window.__NVX1945_V4__) return;
  window.__NVX1945_V4__ = true;

  /* ========== PLANE IMAGES (repo assets) ========== */
  var HERO_IMG = { vanguard: null, striker: null, controller: null };
  var ENEMY_IMG = { scout: null, assault: null, elite: null, boss: null };

  function loadImg(map, key, path) {
    var im = new Image();
    im.decoding = 'async';
    im.src = path;
    map[key] = im;
  }
  loadImg(HERO_IMG, 'vanguard', 'assets/hero-vanguard.png');
  loadImg(HERO_IMG, 'striker', 'assets/hero-striker.png');
  loadImg(HERO_IMG, 'controller', 'assets/hero-controller.png');
  loadImg(ENEMY_IMG, 'scout', 'assets/enemy-scout.svg');
  loadImg(ENEMY_IMG, 'assault', 'assets/enemy-assault.svg');
  loadImg(ENEMY_IMG, 'elite', 'assets/enemy-elite.svg');
  loadImg(ENEMY_IMG, 'boss', 'assets/enemy-boss.svg');

  function ready(im) {
    return im && im.complete && im.naturalWidth > 0;
  }

  /* Fallback vector plane if image not ready */
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

  /* ---- MENU: replace rrHeroFull (robot full body) ---- */
  function forceMenuHero() {
    function planeHero(cxCtx, heroKey, cx, cy, scale, time) {
      var key = heroKeyNorm(heroKey);
      var t = +time || 0;
      var floatY = 5 * Math.sin(t * 1.6);
      var im = HERO_IMG[key];
      cxCtx.save();
      cxCtx.translate(cx, cy + floatY);
      if (ready(im)) {
        var h = Math.max(180, 420 * (scale || 1));
        var w = h * (im.naturalWidth / im.naturalHeight);
        cxCtx.shadowColor = heroColors(key).glow;
        cxCtx.shadowBlur = 24;
        cxCtx.drawImage(im, -w / 2, -h * 0.82, w, h);
      } else {
        cxCtx.scale(scale || 1, scale || 1);
        pathPlane(cxCtx, 90, heroColors(key), false);
      }
      cxCtx.restore();
    }
    window.rrHeroFull = planeHero;
    try { rrHeroFull = planeHero; } catch (e) {}
  }

  /* ---- GAMEPLAY: player ---- */
  function forcePlayer() {
    function planePlayer() {
      try {
        if (!player) return;
        if (player.invuln > 0 && ((performance.now() / 70) | 0) % 2 === 0) return;
        var key = 'vanguard';
        try {
          if (window.NORYVX_P3 && typeof window.NORYVX_P3.archetype === 'function') {
            key = heroKeyNorm(window.NORYVX_P3.archetype().id || window.NORYVX_P3.archetype().key);
          } else if (typeof Save !== 'undefined' && Save && Save.data && Save.data.selectedHero) {
            key = heroKeyNorm(Save.data.selectedHero);
          }
        } catch (e) {}
        var destroyed = false;
        try {
          if (typeof STATE !== 'undefined' && Game && Game.state === STATE.OVER) destroyed = true;
        } catch (e2) {}

        ctx.save();
        if (destroyed) ctx.globalAlpha = 0.35;

        try {
          if (Game && Game.powers && Game.powers.shield > 0) {
            ctx.strokeStyle = '#48d9ff';
            ctx.shadowColor = '#48d9ff';
            ctx.shadowBlur = 18;
            ctx.lineWidth = 2;
            ctx.globalAlpha = 0.65;
            ctx.beginPath();
            ctx.arc(player.x, player.y, 26, 0, Math.PI * 2);
            ctx.stroke();
            ctx.globalAlpha = destroyed ? 0.35 : 1;
          }
        } catch (e3) {}

        ctx.translate(player.x, player.y);
        var im = HERO_IMG[key];
        if (ready(im)) {
          var h = 36;
          var w = h * (im.naturalWidth / im.naturalHeight);
          ctx.shadowColor = heroColors(key).glow;
          ctx.shadowBlur = 12;
          /* nose up in menu assets; rotate so nose points up-screen (enemies come from top) */
          ctx.drawImage(im, -w / 2, -h / 2, w, h);
        } else {
          pathPlane(ctx, 14, heroColors(key), true);
        }
        ctx.restore();
      } catch (err) {}
    }
    window.drawPlayer = planePlayer;
    try { drawPlayer = planePlayer; } catch (e) {}
  }

  /* ---- GAMEPLAY: enemies — kill atlas robots ---- */
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
        ctx.shadowBlur = mode === 'boss' ? 18 : 10;
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

  /* ---- DOM: any leftover robot imgs in menu ---- */
  function forceDomImgs() {
    try {
      document.querySelectorAll('img').forEach(function (img) {
        var blob = ((img.src || '') + ' ' + (img.alt || '') + ' ' + (img.className || '') + ' ' + (img.id || '')).toLowerCase();
        var key = null;
        if (/vanguard|koruyucu/.test(blob)) key = 'vanguard';
        else if (/striker|sald/.test(blob)) key = 'striker';
        else if (/controller|kontrol/.test(blob)) key = 'controller';
        if (!key) return;
        var want = 'assets/hero-' + key + '.png';
        if ((img.getAttribute('src') || '').indexOf(want) < 0) {
          img.src = want + '?v=plane4';
          img.style.objectFit = 'contain';
          img.style.filter = 'drop-shadow(0 0 16px rgba(34,230,255,.5))';
        }
      });
    } catch (e) {}
  }

  /* ========== original 1945 HUD / rings (kept) ========== */
  function injectHudCss() {
    if (document.getElementById('nvx-1945-hud-css')) return;
    var s = document.createElement('style');
    s.id = 'nvx-1945-hud-css';
    s.textContent = [
      '#nvx-weapon-power{position:absolute!important;left:12px!important;',
      'bottom:calc(env(safe-area-inset-bottom,0px)+20px)!important;z-index:12!important;',
      'pointer-events:none!important;padding:8px 10px!important;border-radius:12px!important;',
      'background:rgba(2,10,24,.82)!important;border:1px solid rgba(34,230,255,.28)!important;',
      'display:none!important;flex-direction:column!important;gap:4px!important;}',
      '#nvx-weapon-power.on{display:flex!important;}',
      '#nvx-wp-label{font:700 7px IBM Plex Mono,monospace!important;letter-spacing:.2em!important;color:rgba(34,230,255,.65)!important;}',
      '#nvx-wp-level{font:800 20px Chakra Petch,sans-serif!important;color:#7af0ff!important;line-height:1!important;}',
      '#nvx-wp-track{width:64px!important;height:5px!important;border-radius:99px!important;background:rgba(34,230,255,.12)!important;overflow:hidden!important;}',
      '#nvx-wp-bar{height:100%!important;background:linear-gradient(90deg,#22e6ff,#7b2fff)!important;}'
    ].join('');
    document.head.appendChild(s);
  }

  function ensureGameWeaponPower() {
    try {
      if (typeof Game !== 'undefined' && Game) {
        if (typeof Game.weaponPower !== 'number' || !isFinite(Game.weaponPower)) Game.weaponPower = 1;
        Game.weaponPower = Math.max(1, Math.min(5, Game.weaponPower | 0));
      }
    } catch (e) {}
  }

  function syncWeaponHud() {
    ensureGameWeaponPower();
    var lvl = 1;
    try { lvl = (Game && Game.weaponPower) || 1; } catch (e) {}
    var el = document.getElementById('nvx-wp-level');
    if (el) el.textContent = 'LV' + lvl;
    var bar = document.getElementById('nvx-wp-bar');
    if (bar) bar.style.width = (((lvl - 1) / 4) * 100) + '%';
  }

  function setWeaponHudVisible(on) {
    var el = document.getElementById('nvx-weapon-power');
    if (!el) return;
    el.classList.toggle('on', !!on);
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

  function getRingsArray() {
    try {
      if (typeof RINGS !== 'undefined' && RINGS) return RINGS;
    } catch (e) {}
    try {
      if (window.RINGS) return window.RINGS;
    } catch (e2) {}
    return null;
  }

  function scrubRings() {
    var rings = getRingsArray();
    if (!rings) return;
    for (var i = 0; i < rings.length; i++) {
      var s = rings[i];
      if (!s || !s.alive) continue;
      if (!isFinite(s.life) || !isFinite(s.max) || s.max <= 0) {
        s.alive = false;
        s.life = 0;
        continue;
      }
      if (s.max > 0.55) s.max = 0.55;
      if (s.life > 0.55) s.life = 0.55;
      if (s.life <= 0) s.alive = false;
    }
  }

  function patchRingSystem() {
    if (window.__nvxRingPatchedV4) return;
    if (typeof ringBurst === 'function' || typeof window.ringBurst === 'function') {
      var origBurst = window.ringBurst || ringBurst;
      if (!origBurst.__nvx) {
        function safeBurst(x, y, r0, r1, color, life, w) {
          var L = life;
          if (L == null || !isFinite(L) || L <= 0) L = 0.35;
          if (L > 0.5) L = 0.5;
          try {
            return origBurst.call(this, x, y, r0, r1, color, L, w);
          } catch (e) {}
        }
        safeBurst.__nvx = true;
        window.ringBurst = safeBurst;
        try { ringBurst = safeBurst; } catch (e) {}
      }
    }
    if (typeof updateRings === 'function' || typeof window.updateRings === 'function') {
      var origUp = window.updateRings || updateRings;
      if (!origUp.__nvx) {
        function safeUpdate(dt) {
          var d = (!isFinite(dt) || dt <= 0) ? 1 / 60 : Math.min(dt, 0.1);
          try { origUp.call(this, d); } catch (e) {}
          var rings = getRingsArray();
          if (!rings) return;
          for (var i = 0; i < rings.length; i++) {
            var s = rings[i];
            if (!s || !s.alive) continue;
            s.life -= d * 1.35;
            if (s.life <= 0 || !isFinite(s.life)) {
              s.alive = false;
              s.life = 0;
            }
          }
        }
        safeUpdate.__nvx = true;
        window.updateRings = safeUpdate;
        try { updateRings = safeUpdate; } catch (e) {}
      }
    }
    window.__nvxRingPatchedV4 = true;
  }

  function bootVisual() {
    forceMenuHero();
    forcePlayer();
    forceEnemies();
    forceDomImgs();
  }

  function boot() {
    bootVisual();
    injectHudCss();
    ensureGameWeaponPower();
    patchRingSystem();
    setInterval(function () {
      bootVisual();
      scrubRings();
      setWeaponHudVisible(isPlaying());
      if (isPlaying()) syncWeaponHud();
    }, 400);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () { setTimeout(boot, 20); });
  } else {
    setTimeout(boot, 20);
  }
  setTimeout(boot, 200);
  setTimeout(boot, 1000);
  setTimeout(boot, 2500);
})();
