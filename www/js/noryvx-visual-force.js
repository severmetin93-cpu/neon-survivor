/* NORYVX Visual Force — robots OUT, planes IN (gameplay + menu) */
(function () {
  'use strict';
  if (window.__NVX_VISUAL_FORCE_V1__) return;
  window.__NVX_VISUAL_FORCE_V1__ = true;

  var ROBOT_SPRITES = {
    hunter: 1, tank: 1, orbiter: 1, dasher: 1, weaver: 1,
    elite: 1, boss: 1, unit: 1, robot: 1
  };

  /* ---- pure canvas plane (nose toward -Y local, we rotate for direction) ---- */
  function paintPlane(c, r, colors, opts) {
    opts = opts || {};
    var body = r * (opts.scale || 1.2);
    var wing = colors.wing || colors.edge || '#22e6ff';
    var hull = colors.hull || colors.core || '#c8f4ff';
    var glow = colors.glow || wing;
    var elite = !!opts.elite;
    var boss = !!opts.boss;

    c.save();
    /* face down the screen (toward bottom) like shmup */
    c.rotate(Math.PI);
    c.shadowColor = glow;
    c.shadowBlur = boss ? 22 : elite ? 16 : 10;

    /* wings */
    c.fillStyle = wing;
    c.beginPath();
    c.moveTo(-body * 1.05, body * 0.12);
    c.lineTo(-body * 0.12, -body * 0.08);
    c.lineTo(body * 0.12, -body * 0.08);
    c.lineTo(body * 1.05, body * 0.12);
    c.lineTo(body * 0.38, body * 0.38);
    c.lineTo(-body * 0.38, body * 0.38);
    c.closePath();
    c.fill();

    if (boss) {
      c.globalAlpha = 0.85;
      c.beginPath();
      c.moveTo(-body * 1.25, body * 0.28);
      c.lineTo(-body * 0.5, body * 0.05);
      c.lineTo(-body * 0.35, body * 0.4);
      c.closePath();
      c.fill();
      c.beginPath();
      c.moveTo(body * 1.25, body * 0.28);
      c.lineTo(body * 0.5, body * 0.05);
      c.lineTo(body * 0.35, body * 0.4);
      c.closePath();
      c.fill();
      c.globalAlpha = 1;
    }

    /* fuselage */
    c.fillStyle = hull;
    c.beginPath();
    c.moveTo(0, -body * 1.05);
    c.lineTo(body * 0.3, body * 0.55);
    c.lineTo(0, body * 0.32);
    c.lineTo(-body * 0.3, body * 0.55);
    c.closePath();
    c.fill();

    /* cockpit */
    c.fillStyle = 'rgba(200,240,255,0.92)';
    c.beginPath();
    c.ellipse(0, -body * 0.38, body * 0.13, body * 0.2, 0, 0, Math.PI * 2);
    c.fill();

    /* engines */
    c.shadowBlur = 18;
    c.fillStyle = elite || boss ? '#ffd24d' : glow;
    c.beginPath();
    c.arc(-body * 0.14, body * 0.52, body * 0.11, 0, Math.PI * 2);
    c.arc(body * 0.14, body * 0.52, body * 0.11, 0, Math.PI * 2);
    c.fill();

    /* engine flame */
    c.globalAlpha = 0.75;
    c.fillStyle = elite || boss ? '#ff9040' : '#7af0ff';
    c.beginPath();
    c.moveTo(-body * 0.14, body * 0.58);
    c.lineTo(-body * 0.06, body * 0.58);
    c.lineTo(-body * 0.1, body * 0.85 + Math.sin(performance.now() / 40) * body * 0.06);
    c.closePath();
    c.fill();
    c.beginPath();
    c.moveTo(body * 0.06, body * 0.58);
    c.lineTo(body * 0.14, body * 0.58);
    c.lineTo(body * 0.1, body * 0.85 + Math.cos(performance.now() / 40) * body * 0.06);
    c.closePath();
    c.fill();
    c.globalAlpha = 1;

    c.restore();
  }

  function archColors() {
    var id = 'vanguard';
    try {
      if (window.NORYVX_P3 && typeof window.NORYVX_P3.archetype === 'function') {
        var a = window.NORYVX_P3.archetype();
        id = String(a.id || a.key || a.name || 'vanguard').toLowerCase();
      } else if (window.P3S && P3S.archetype) {
        id = String(P3S.archetype).toLowerCase();
      }
    } catch (e) {}
    if (id.indexOf('striker') >= 0) {
      return { wing: '#ff6a3d', hull: '#ffe0d0', glow: '#ff8040' };
    }
    if (id.indexOf('controller') >= 0) {
      return { wing: '#b070ff', hull: '#f0e0ff', glow: '#c080ff' };
    }
    return { wing: '#22e6ff', hull: '#d8f8ff', glow: '#7af0ff' };
  }

  function enemyColors(paint, elite, boss) {
    if (boss) return { wing: '#ff3b6b', hull: '#ffd0d8', glow: '#ff6090' };
    if (elite) return { wing: '#ffe34d', hull: '#fff4c8', glow: '#ffd24d' };
    return {
      wing: (paint && (paint.edge || paint.core)) || '#ff6a4a',
      hull: (paint && paint.core) || '#ffe0e8',
      glow: (paint && paint.edge) || '#ff4060'
    };
  }

  /* Block old robot atlas frames */
  function patchAtlas() {
    try {
      if (typeof atlasHas === 'function' && !atlasHas.__nvxForce) {
        var prev = atlasHas;
        window.atlasHas = function (name) {
          if (name && ROBOT_SPRITES[String(name).toLowerCase()]) return false;
          return prev.apply(this, arguments);
        };
        window.atlasHas.__nvxForce = true;
        try { atlasHas = window.atlasHas; } catch (e) {}
      }
    } catch (e) {}
  }

  function patchEnemyDraw() {
    function unit(e, paint, r, lod) {
      var rad = r || (e && e.r) || 14;
      paintPlane(ctx, rad, enemyColors(paint, false, false), { elite: false });
    }
    function elite(e, paint, lod) {
      paintPlane(ctx, (e && e.r) || 18, enemyColors(paint, true, false), { elite: true, scale: 1.25 });
    }
    function boss(e, lod) {
      paintPlane(ctx, (e && e.r) || 28, enemyColors(null, false, true), { boss: true, scale: 1.55 });
    }
    window.rrEnemyUnit = unit;
    window.rrEliteUnit = elite;
    window.rrBossUnit = boss;
    try { rrEnemyUnit = unit; } catch (e) {}
    try { rrEliteUnit = elite; } catch (e) {}
    try { rrBossUnit = boss; } catch (e) {}
  }

  function patchPlayerDraw() {
    if (typeof drawPlayer !== 'function' && typeof window.drawPlayer !== 'function') return;
    var orig = window.drawPlayer || drawPlayer;
    if (orig.__nvxForce) return;

    function enhanced() {
      try {
        var blink = player.invuln > 0 && (performance.now() / 70 | 0) % 2 === 0;
        if (blink) return;

        var destroyed = false;
        try {
          if (typeof STATE !== 'undefined' && Game && Game.state === STATE.OVER) destroyed = true;
        } catch (e) {}

        ctx.save();
        if (destroyed) ctx.globalAlpha = 0.34;

        /* shield ring */
        try {
          if (Game && Game.powers && Game.powers.shield > 0) {
            ctx.strokeStyle = '#48d9ff';
            ctx.shadowColor = '#48d9ff';
            ctx.shadowBlur = 20;
            ctx.lineWidth = 2;
            ctx.globalAlpha = 0.6;
            ctx.beginPath();
            ctx.arc(player.x, player.y, 24, 0, Math.PI * 2);
            ctx.stroke();
            ctx.globalAlpha = destroyed ? 0.34 : 1;
          }
        } catch (e) {}

        /* trail */
        try {
          if (player.trail && player.trail.length > 2) {
            var col = archColors();
            for (var i = 2; i < player.trail.length; i += 2) {
              var t = i / player.trail.length;
              ctx.globalAlpha = t * 0.25;
              ctx.fillStyle = col.glow;
              ctx.beginPath();
              ctx.arc(player.trail[i], player.trail[i + 1], 2 + t * 3, 0, Math.PI * 2);
              ctx.fill();
            }
            ctx.globalAlpha = destroyed ? 0.34 : 1;
          }
        } catch (e2) {}

        ctx.translate(player.x, player.y);
        var cols = archColors();
        if (Game && Game.powers && Game.powers.overdrive > 0) {
          cols = { wing: '#ffe34d', hull: '#fff8c7', glow: '#ffe34d' };
        }
        paintPlane(ctx, 14, cols, { scale: 1.15 });
        ctx.restore();
      } catch (err) {
        try { return orig.apply(this, arguments); } catch (e3) {}
      }
    }
    enhanced.__nvxForce = true;
    window.drawPlayer = enhanced;
    try { drawPlayer = enhanced; } catch (e) {}
  }

  /* Menu hero portrait — ship PNG, locked with defineProperty so nothing can override */
  var _vfShipImgs = (function () {
    var imgs = {};
    ['vanguard', 'striker', 'controller'].forEach(function (k) {
      var im = new Image();
      im.src = 'assets/hero-' + k + '.png?v=ship1';
      imgs[k] = im;
    });
    return imgs;
  }());

  function _shipHeroDraw(cxCtx, heroKey, cx, cy, scale, time) {
    var key = (heroKey === 'striker' || heroKey === 'controller') ? heroKey : 'vanguard';
    var t = +time || 0;
    var floatOff = 5 * Math.sin(t * 1.74) * scale;
    var glowCol = key === 'striker' ? '#ff8040' : key === 'controller' ? '#c080ff' : '#7af0ff';
    var img = _vfShipImgs[key];
    cxCtx.save();
    cxCtx.shadowColor = glowCol;
    cxCtx.shadowBlur = 30 * scale;
    if (img && img.complete && img.naturalWidth > 0) {
      var shipH = Math.round(210 * scale);
      var shipW = Math.round(img.naturalWidth / img.naturalHeight * shipH);
      cxCtx.drawImage(img, cx - shipW / 2, cy - shipH / 2 + floatOff, shipW, shipH);
    } else {
      var colors = key === 'striker'
        ? { wing: '#ff6a3d', hull: '#ffe0d0', glow: '#ff8040' }
        : key === 'controller'
          ? { wing: '#b070ff', hull: '#f0e0ff', glow: '#c080ff' }
          : { wing: '#22e6ff', hull: '#d8f8ff', glow: '#7af0ff' };
      cxCtx.save();
      cxCtx.translate(cx, cy + floatOff);
      cxCtx.scale(scale * 0.55, scale * 0.55);
      cxCtx.rotate(Math.PI);
      paintPlane(cxCtx, 90, colors, { scale: 1.2 });
      cxCtx.restore();
    }
    cxCtx.restore();
  }
  _shipHeroDraw.__nvxForce = true;

  function patchMenuHero() {
    try {
      Object.defineProperty(window, 'rrHeroFull', {
        get: function () { return _shipHeroDraw; },
        set: function () {},
        configurable: false
      });
    } catch (e) {
      window.rrHeroFull = _shipHeroDraw;
    }
    try { rrHeroFull = _shipHeroDraw; } catch (e) {}
  }

  function boot() {
    patchAtlas();
    patchEnemyDraw();
    patchPlayerDraw();
    patchMenuHero();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () { setTimeout(boot, 30); });
  } else {
    setTimeout(boot, 30);
  }
  setTimeout(boot, 200);
  setTimeout(boot, 800);
  setTimeout(boot, 2000);
  /* Keep overrides if other scripts reassigned functions */
  setInterval(boot, 3000);
})();
