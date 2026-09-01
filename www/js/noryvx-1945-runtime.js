/* NORYVX x 1945 Air Force — runtime integration layer */
(function () {
  'use strict';
  if (window.__NVX1945__) return;
  window.__NVX1945__ = true;

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
      }
    } else if (playing) {
      setWeaponHudVisible(true);
    }
  }

  function patchStart() {
    if (typeof window.startGame === 'function' && !window.startGame.__nvx1945) {
      var sg = window.startGame;
      window.startGame = function () {
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
    injectHudCss();
    ensureHudFn();
    ensureGameWeaponPower();
    patchDrawEnemyBullets();
    patchStart();
    setInterval(tickHud, 250);
    setInterval(patchDrawEnemyBullets, 2000);
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
