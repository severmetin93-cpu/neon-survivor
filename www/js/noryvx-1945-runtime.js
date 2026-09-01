/* NORYVX x 1945 Air Force — runtime + ring cleanup + visual-force loader */
(function () {
  'use strict';
  if (window.__NVX1945_V3__) return;
  window.__NVX1945_V3__ = true;

  function loadVisualForce() {
    if (window.__NVX_VISUAL_FORCE_V1__ || document.getElementById('nvx-visual-force')) return;
    var s = document.createElement('script');
    s.id = 'nvx-visual-force';
    s.src = 'js/noryvx-visual-force.js?v=26';
    s.async = true;
    document.head.appendChild(s);
  }

  function injectHudCss() {
    if (document.getElementById('nvx-1945-hud-css')) return;
    var s = document.createElement('style');
    s.id = 'nvx-1945-hud-css';
    s.textContent = [
      '#nvx-weapon-power{',
      '  position:absolute!important;left:12px!important;',
      '  bottom:calc(env(safe-area-inset-bottom,0px) + 20px)!important;',
      '  z-index:12!important;pointer-events:none!important;',
      '  padding:8px 10px!important;border-radius:12px!important;',
      '  background:rgba(2,10,24,.82)!important;',
      '  border:1px solid rgba(34,230,255,.28)!important;',
      '  box-shadow:0 0 18px rgba(34,230,255,.12)!important;',
      '  display:none!important;flex-direction:column!important;gap:4px!important;',
      '}',
      '#nvx-weapon-power.on{display:flex!important;}',
      '#nvx-wp-label{font:700 7px IBM Plex Mono,monospace!important;letter-spacing:.2em!important;color:rgba(34,230,255,.65)!important;}',
      '#nvx-wp-level{font:800 20px Chakra Petch,sans-serif!important;color:#7af0ff!important;text-shadow:0 0 16px rgba(34,230,255,.75)!important;line-height:1!important;}',
      '#nvx-wp-track{width:64px!important;height:5px!important;border-radius:99px!important;background:rgba(34,230,255,.12)!important;border:1px solid rgba(34,230,255,.25)!important;overflow:hidden!important;}',
      '#nvx-wp-bar{height:100%!important;background:linear-gradient(90deg,#22e6ff,#7b2fff)!important;transition:width .3s ease!important;}'
    ].join('\n');
    document.head.appendChild(s);
  }

  function hexAlpha(c, a) {
    if (!c) return 'rgba(255,48,64,' + a + ')';
    if (c.charAt(0) === '#') {
      var h = c.slice(1);
      if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
      var r = parseInt(h.slice(0, 2), 16) || 255;
      var g = parseInt(h.slice(2, 4), 16) || 48;
      var b = parseInt(h.slice(4, 6), 16) || 64;
      return 'rgba(' + r + ',' + g + ',' + b + ',' + a + ')';
    }
    return c;
  }

  function ensureGameWeaponPower() {
    try {
      if (typeof Game !== 'undefined' && Game) {
        if (typeof Game.weaponPower !== 'number' || !isFinite(Game.weaponPower)) Game.weaponPower = 1;
        Game.weaponPower = Math.max(1, Math.min(5, Game.weaponPower | 0));
        if (typeof Game._waveKills !== 'number') Game._waveKills = 0;
      }
    } catch (e) {}
  }

  function syncWeaponHud() {
    ensureGameWeaponPower();
    var lvl = 1;
    try { lvl = (typeof Game !== 'undefined' && Game && Game.weaponPower) || 1; } catch (e) {}
    var el = document.getElementById('nvx-wp-level');
    if (el) el.textContent = 'LV' + lvl;
    var bar = document.getElementById('nvx-wp-bar');
    if (bar) bar.style.width = (((lvl - 1) / 4) * 100) + '%';
  }

  function setWeaponHudVisible(on) {
    var el = document.getElementById('nvx-weapon-power');
    if (!el) return;
    if (on) el.classList.add('on');
    else el.classList.remove('on');
  }

  function isPlaying() {
    try {
      if (typeof Game === 'undefined' || !Game) return false;
      var st = Game.state;
      if (typeof STATE !== 'undefined' && STATE && STATE.PLAYING != null) {
        return st === STATE.PLAYING || st === 'PLAYING';
      }
      return st === 'PLAYING' || st === 1;
    } catch (e) {
      return false;
    }
  }

  function getRingsArray() {
    try {
      if (typeof RINGS !== 'undefined' && RINGS && RINGS.length) return RINGS;
    } catch (e) {}
    try {
      if (window.RINGS && window.RINGS.length) return window.RINGS;
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
    if (window.__nvxRingPatched) return;

    if (typeof window.ringBurst === 'function' || typeof ringBurst === 'function') {
      var origBurst = window.ringBurst || ringBurst;
      if (!origBurst.__nvx) {
        function safeBurst(x, y, r0, r1, color, life, w) {
          var L = life;
          if (L == null || !isFinite(L) || L <= 0) L = 0.35;
          if (L > 0.5) L = 0.5;
          try {
            return origBurst.call(this, x, y, r0, r1, color, L, w);
          } catch (e) {
            try {
              var rings = getRingsArray();
              if (!rings) return;
              var s = null;
              for (var i = 0; i < rings.length; i++) {
                if (!rings[i].alive) { s = rings[i]; break; }
              }
              if (!s) s = rings[0];
              s.alive = true;
              s.x = x; s.y = y;
              s.r0 = r0 || 4; s.r1 = r1 || 40;
              s.max = s.life = L;
              s.color = color || '#22e6ff';
              s.w = w || 3;
            } catch (e2) {}
          }
        }
        safeBurst.__nvx = true;
        window.ringBurst = safeBurst;
        try { ringBurst = safeBurst; } catch (e) {}
      }
    }

    if (typeof window.updateRings === 'function' || typeof updateRings === 'function') {
      var origUp = window.updateRings || updateRings;
      if (!origUp.__nvx) {
        function safeUpdate(dt) {
          var d = dt;
          if (!isFinite(d) || d <= 0) d = 1 / 60;
          if (d > 0.1) d = 0.1;
          try { origUp.call(this, d); } catch (e) {}
          var rings = getRingsArray();
          if (rings) {
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
        }
        safeUpdate.__nvx = true;
        window.updateRings = safeUpdate;
        try { updateRings = safeUpdate; } catch (e) {}
      }
    }

    window.__nvxRingPatched = true;
  }

  function patchDrawEnemyBullets() {
    var orig = null;
    try {
      if (typeof window.drawEnemyBullets === 'function') orig = window.drawEnemyBullets;
      else if (typeof drawEnemyBullets === 'function') orig = drawEnemyBullets;
    } catch (e) {}
    if (!orig || orig.__nvx1945) return;

    function safeDraw() {
      try {
        if (typeof enemyBullets === 'undefined' || !enemyBullets || !enemyBullets.forEach) {
          return orig.apply(this, arguments);
        }
        var TAU = Math.PI * 2;
        enemyBullets.forEach(function (b) {
          if (!b || !b.alive) return;
          ctx.save();
          ctx.translate(b.x, b.y);
          var ang = Math.atan2(b.vy, b.vx);
          ctx.rotate(ang);
          var spd = Math.hypot(b.vx, b.vy);
          var trailL = Math.min(spd * 0.028, 20);
          var k = Math.min(1, b.life / 0.5);
          var col = b.color || '#ff3040';

          var tg = ctx.createLinearGradient(-trailL, 0, 0, 0);
          tg.addColorStop(0, 'rgba(0,0,0,0)');
          tg.addColorStop(1, hexAlpha(col, 0.45));
          ctx.globalAlpha = 0.5 * k;
          ctx.fillStyle = tg;
          ctx.beginPath();
          ctx.ellipse(-trailL * 0.5, 0, trailL, b.r * 0.55, 0, 0, TAU);
          ctx.fill();

          ctx.globalAlpha = k;
          ctx.shadowColor = col;
          ctx.shadowBlur = 14;
          ctx.fillStyle = col;
          ctx.beginPath();
          ctx.arc(0, 0, b.r, 0, TAU);
          ctx.fill();

          ctx.shadowBlur = 6;
          ctx.fillStyle = '#ffffff';
          ctx.globalAlpha = 0.75 * k;
          ctx.beginPath();
          ctx.arc(b.r * 0.1, 0, b.r * 0.42, 0, TAU);
          ctx.fill();
          ctx.restore();
        });
      } catch (err) {
        try { orig.apply(this, arguments); } catch (e2) {}
      }
    }
    safeDraw.__nvx1945 = true;
    window.drawEnemyBullets = safeDraw;
    try { drawEnemyBullets = safeDraw; } catch (e) {}
  }

  function ensureHudFn() {
    if (typeof window.updateWeaponPowerHUD !== 'function') {
      window.updateWeaponPowerHUD = syncWeaponHud;
    }
  }

  var lastPlaying = false;
  function tickHud() {
    var playing = isPlaying();
    if (playing !== lastPlaying) {
      lastPlaying = playing;
      setWeaponHudVisible(playing);
      if (playing) {
        ensureGameWeaponPower();
        syncWeaponHud();
      } else {
        scrubRings();
      }
    } else if (playing) {
      setWeaponHudVisible(true);
    }
  }

  function patchStart() {
    if (typeof window.startGame === 'function' && !window.startGame.__nvx1945) {
      var sg = window.startGame;
      window.startGame = function () {
        scrubRings();
        var r = sg.apply(this, arguments);
        try {
          ensureGameWeaponPower();
          syncWeaponHud();
          setWeaponHudVisible(true);
        } catch (e) {}
        return r;
      };
      window.startGame.__nvx1945 = true;
    }
  }

  function boot() {
    loadVisualForce();
    injectHudCss();
    ensureHudFn();
    ensureGameWeaponPower();
    patchDrawEnemyBullets();
    patchRingSystem();
    patchStart();
    setInterval(tickHud, 250);
    setInterval(function () {
      loadVisualForce();
      patchDrawEnemyBullets();
      patchRingSystem();
      scrubRings();
    }, 1500);
    setInterval(patchStart, 2000);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () { setTimeout(boot, 50); });
  } else {
    setTimeout(boot, 50);
  }
  setTimeout(boot, 800);
  setTimeout(boot, 2500);
})();
