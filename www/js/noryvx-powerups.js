/* NORYVX 1945 — expanded power-up mechanics (balanced drops) */
(function () {
  'use strict';
  if (window.__NVX_POWERUPS_V2__) return;
  window.__NVX_POWERUPS_V2__ = true;

  /* Air-force themed labels + colors */
  var INFO = {
    shield:     { color: '#48d9ff', label: 'ENERGY SHIELD',  icon: 'S' },
    magnet:     { color: '#ff54d9', label: 'TRACTOR BEAM',   icon: 'M' },
    overdrive:  { color: '#ffe34d', label: 'AFTERBURNER',    icon: 'A' },
    nova:       { color: '#ff6b3b', label: 'CLUSTER BOMB',   icon: 'N' },
    powerCore:  { color: '#22e6ff', label: 'WEAPON CORE',    icon: 'P' },
    nanoRepair: { color: '#48ff9b', label: 'REPAIR KIT',     icon: '+' },
    rapid:      { color: '#a0ff60', label: 'RAPID FIRE',     icon: 'R' },
    bomb:       { color: '#ff4060', label: 'SMART BOMB',     icon: 'B' },
    scoreBoost: { color: '#ffd24d', label: 'BONUS PAYLOAD',  icon: '$' }
  };

  var EXTRA_TYPES = ['rapid', 'bomb', 'scoreBoost'];

  /*
   * Drop table (normal kill) — cumulative thresholds
   * Total ~19.5% any drop
   *
   *   powerCore   5.0%   weapon LV (valuable)
   *   shield      3.5%
   *   nanoRepair  3.0%
   *   magnet      2.5%
   *   overdrive   2.0%
   *   rapid       1.5%
   *   bomb        1.0%
   *   scoreBoost  1.0%
   *
   * Elite: 1.55x effective chance (reroll bias)
   * Boss:  guaranteed 1–2 quality drops handled separately
   */
  var DROP = [
    { t: 0.050, type: 'powerCore' },
    { t: 0.085, type: 'shield' },
    { t: 0.115, type: 'nanoRepair' },
    { t: 0.140, type: 'magnet' },
    { t: 0.160, type: 'overdrive' },
    { t: 0.175, type: 'rapid' },
    { t: 0.185, type: 'bomb' },
    { t: 0.195, type: 'scoreBoost' }
  ];

  function mergePowerInfo() {
    try {
      if (typeof POWER_INFO === 'object' && POWER_INFO) {
        Object.keys(INFO).forEach(function (k) { POWER_INFO[k] = INFO[k]; });
      }
      window.POWER_INFO = window.POWER_INFO || (typeof POWER_INFO !== 'undefined' ? POWER_INFO : {});
      if (window.POWER_INFO) {
        Object.keys(INFO).forEach(function (k) { window.POWER_INFO[k] = INFO[k]; });
      }
    } catch (e) {}
    try {
      if (typeof POWER_TYPES !== 'undefined' && Array.isArray(POWER_TYPES)) {
        EXTRA_TYPES.forEach(function (t) {
          if (POWER_TYPES.indexOf(t) < 0) POWER_TYPES.push(t);
        });
      }
    } catch (e2) {}
  }

  function ensureTimers() {
    try {
      if (typeof Game === 'undefined' || !Game) return;
      if (!Game.powers) Game.powers = {};
      if (typeof Game.powers.rapid !== 'number') Game.powers.rapid = 0;
      if (typeof Game.powers.scoreBoost !== 'number') Game.powers.scoreBoost = 0;
      if (typeof Game.powers.bomb !== 'number') Game.powers.bomb = 0;
    } catch (e) {}
  }

  function pickDrop(bonusMul) {
    var roll = Math.random() / (bonusMul || 1);
    for (var i = 0; i < DROP.length; i++) {
      if (roll < DROP[i].t) return DROP[i].type;
    }
    return null;
  }

  function spawnDrop(x, y, type) {
    if (!type) return;
    try {
      if (typeof powerups === 'undefined' || !powerups || !powerups.get) return false;
      var d = powerups.get();
      d.x = x + (Math.random() - 0.5) * 24;
      d.y = y;
      d.type = type;
      d.t = Math.random() * Math.PI * 2;
      d._drop = true;
      d.vy = 40 + Math.random() * 35;
      d.r = 13;
      d.alive = true;
      return true;
    } catch (e) {
      return false;
    }
  }

  function patchDropFromEnemy() {
    if (typeof dropFromEnemy !== 'function' && typeof window.dropFromEnemy !== 'function') return;
    var orig = window.dropFromEnemy || dropFromEnemy;
    if (orig.__nvxPuV2) return;

    function enhanced(x, y, flags) {
      /* flags optional: { elite:true, boss:true } */
      var mul = 1;
      try {
        if (flags && flags.boss) {
          /* Boss: 2 guaranteed useful drops */
          spawnDrop(x - 18, y, 'powerCore');
          spawnDrop(x + 18, y, Math.random() < 0.5 ? 'shield' : 'nanoRepair');
          if (Math.random() < 0.45) spawnDrop(x, y + 16, 'bomb');
          return;
        }
        if (flags && flags.elite) mul = 1.55;
        /* slight wave scaling: +0.02 per 5 waves, cap +0.08 */
        if (typeof Game !== 'undefined' && Game && Game.wave) {
          mul += Math.min(0.08, Math.floor(Game.wave / 5) * 0.02);
        }
      } catch (e) {}

      var type = pickDrop(mul);
      if (!type) return;
      if (!spawnDrop(x, y, type)) {
        try { orig.call(this, x, y); } catch (e2) {}
      }
    }
    enhanced.__nvxPuV2 = true;
    window.dropFromEnemy = enhanced;
    try { dropFromEnemy = enhanced; } catch (e) {}
  }

  /* Wrap kill path so elite/boss get bonus flags */
  function patchKillDrops() {
    if(window.__nvxWrap_powerups_slow)return; window.__nvxWrap_powerups_slow=1;
    if (typeof damageEnemy !== 'function' && typeof window.damageEnemy !== 'function') return;
    var orig = window.damageEnemy || damageEnemy;
    if (orig.__nvxPuDropFlag) return;

    function enhanced(e, amount, color, src) {
      var wasAlive = e && e.alive;
      var isElite = !!(e && e.elite);
      var isBoss = !!(e && e.boss);
      var x = e && e.x, y = e && e.y;
      var r = orig.apply(this, arguments);
      try {
        if (wasAlive && e && !e.alive && typeof dropFromEnemy === 'function') {
          /* damageEnemy already calls dropFromEnemy for normals;
             for elite/boss call again with flags if not already multi-dropped.
             Avoid double-drop on normal: only inject flags path for elite/boss. */
          if (isBoss) {
            dropFromEnemy(x, y, { boss: true });
          } else if (isElite) {
            /* elite: one extra roll with bonus mul */
            dropFromEnemy(x, y, { elite: true });
          }
        }
      } catch (err) {}
      return r;
    }
    enhanced.__nvxPuDropFlag = true;
    window.damageEnemy = enhanced;
    try { damageEnemy = enhanced; } catch (e) {}
  }

  function detonateBomb() {
    try {
      var radius = 160;
      var hits = 0;
      if (typeof enemies !== 'undefined' && enemies && enemies.forEach) {
        enemies.forEach(function (en) {
          if (!en || !en.alive) return;
          var d = Math.hypot(en.x - player.x, en.y - player.y);
          if (d <= radius) {
            var dmg = en.boss ? 8 : en.elite ? 4 : 99;
            try {
              if (typeof damageEnemy === 'function') damageEnemy(en, dmg, '#ff4060', 'bomb');
              else en.hp = 0;
            } catch (err) {}
            hits++;
          }
        });
      }
      try {
        if (typeof emit === 'function') emit(player.x, player.y, 40, '#ff4060', 320, 4, 0.9);
        if (typeof ringBurst === 'function') {
          ringBurst(player.x, player.y, 12, radius, '#ff4060', 0.45, 5);
          ringBurst(player.x, player.y, 6, radius * 0.6, '#ffe0e8', 0.35, 3);
        }
        if (typeof popText === 'function') {
          popText(player.x, player.y - 40, hits ? 'SMART BOMB x' + hits : 'SMART BOMB', '#ff4060', 16);
        }
      } catch (fx) {}
    } catch (e) {}
  }

  function patchActivatePower() {
    if (typeof activatePower !== 'function' && typeof window.activatePower !== 'function') return;
    var orig = window.activatePower || activatePower;
    if (orig.__nvxPuV2) return;

    function enhanced(type) {
      ensureTimers();
      var info = INFO[type] || { color: '#22e6ff', label: String(type).toUpperCase() };

      if (type === 'rapid') {
        Game.powers.rapid = Math.max(Game.powers.rapid || 0, 8);
        try {
          if (typeof emit === 'function') emit(player.x, player.y, 18, info.color, 200, 3, 0.55);
          if (typeof ringBurst === 'function') ringBurst(player.x, player.y, 8, 70, info.color, 0.4, 2.5);
          if (typeof popText === 'function') popText(player.x, player.y - 38, info.label, info.color, 15);
          if (typeof Audio_ !== 'undefined' && Audio_.power) Audio_.power();
        } catch (e) {}
        return;
      }

      if (type === 'bomb') {
        detonateBomb();
        try { if (typeof Audio_ !== 'undefined' && Audio_.power) Audio_.power(); } catch (e) {}
        return;
      }

      if (type === 'scoreBoost') {
        Game.powers.scoreBoost = Math.max(Game.powers.scoreBoost || 0, 10);
        try {
          if (typeof emit === 'function') emit(player.x, player.y, 16, info.color, 180, 3, 0.5);
          if (typeof ringBurst === 'function') ringBurst(player.x, player.y, 8, 60, info.color, 0.4, 2);
          if (typeof popText === 'function') popText(player.x, player.y - 38, info.label + ' x2', info.color, 15);
          if (typeof Audio_ !== 'undefined' && Audio_.power) Audio_.power();
        } catch (e) {}
        return;
      }

      if (type === 'overdrive' || type === 'magnet' || type === 'shield' || type === 'nova') {
        try {
          var r = orig.call(this, type);
          if (typeof popText === 'function') popText(player.x, player.y - 52, info.label, info.color, 14);
          return r;
        } catch (e) {
          return orig.call(this, type);
        }
      }

      return orig.call(this, type);
    }
    enhanced.__nvxPuV2 = true;
    window.activatePower = enhanced;
    try { activatePower = enhanced; } catch (e) {}
  }

  function tickPowers(dt) {
    ensureTimers();
    if (!dt || !isFinite(dt)) dt = 1 / 60;
    try {
      if (Game && Game.powers) {
        if (Game.powers.rapid > 0) Game.powers.rapid = Math.max(0, Game.powers.rapid - dt);
        if (Game.powers.scoreBoost > 0) Game.powers.scoreBoost = Math.max(0, Game.powers.scoreBoost - dt);
      }
    } catch (e) {}
  }

  function patchWeaponCd() {
    try {
      window.NVX_fireRateMul = function () {
        try {
          if (Game && Game.powers && Game.powers.rapid > 0) return 1.75;
        } catch (e) {}
        return 1;
      };
      window.NVX_scoreMul = function () {
        try {
          if (Game && Game.powers && Game.powers.scoreBoost > 0) return 2;
        } catch (e) {}
        return 1;
      };
    } catch (e) {}
  }

  function patchUpdateWeapons() {
    if (typeof updateWeapons !== 'function' && typeof window.updateWeapons !== 'function') return;
    var orig = window.updateWeapons || updateWeapons;
    if (orig.__nvxPuV2) return;
    function enhanced(dt) {
      tickPowers(dt);
      var mul = 1;
      try {
        if (Game && Game.powers && Game.powers.rapid > 0) mul = 1.75;
      } catch (e) {}
      try {
        return orig.call(this, dt * mul);
      } catch (e2) {
        return orig.call(this, dt);
      }
    }
    enhanced.__nvxPuV2 = true;
    window.updateWeapons = enhanced;
    try { updateWeapons = enhanced; } catch (e) {}
  }

  function patchScoreOnKill() {
    if(window.__nvxWrap_powerups_chain)return; window.__nvxWrap_powerups_chain=1;
    if (typeof damageEnemy !== 'function' && typeof window.damageEnemy !== 'function') return;
    var orig = window.damageEnemy || damageEnemy;
    if (orig.__nvxPuScore) return;
    function enhanced(e, amount, color, src) {
      var before = 0;
      try { before = Game.score || 0; } catch (err) {}
      var r = orig.apply(this, arguments);
      try {
        if (Game && Game.powers && Game.powers.scoreBoost > 0 && e && !e.alive) {
          var gained = (Game.score || 0) - before;
          if (gained > 0) Game.score += gained;
        }
      } catch (err2) {}
      return r;
    }
    enhanced.__nvxPuScore = true;
    /* chain with drop-flag wrapper: apply score on outermost if already wrapped */
    if (!orig.__nvxPuDropFlag) {
      window.damageEnemy = enhanced;
      try { damageEnemy = enhanced; } catch (e) {}
    }
  }

  function injectHudCss() {
    if (document.getElementById('nvx-pu-css')) return;
    var s = document.createElement('style');
    s.id = 'nvx-pu-css';
    s.textContent = [
      '#nvx-pu-bar{position:absolute;left:50%;transform:translateX(-50%);',
      'bottom:calc(env(safe-area-inset-bottom,0px) + 78px);z-index:11;',
      'display:flex;gap:6px;pointer-events:none;}',
      '.nvx-pu-chip{padding:4px 8px;border-radius:8px;font:700 8px IBM Plex Mono,monospace;',
      'letter-spacing:.06em;background:rgba(4,10,26,.85);border:1px solid rgba(34,230,255,.3);',
      'color:#eafeff;text-shadow:0 0 8px currentColor;display:none;}'
    ].join('');
    document.head.appendChild(s);
  }

  function ensureHud() {
    if (document.getElementById('nvx-pu-bar')) return;
    var bar = document.createElement('div');
    bar.id = 'nvx-pu-bar';
    bar.innerHTML = [
      '<span class="nvx-pu-chip" id="nvx-pu-rapid" style="color:#a0ff60">RAPID</span>',
      '<span class="nvx-pu-chip" id="nvx-pu-score" style="color:#ffd24d">x2 SCORE</span>',
      '<span class="nvx-pu-chip" id="nvx-pu-od" style="color:#ffe34d">AFTERBURN</span>',
      '<span class="nvx-pu-chip" id="nvx-pu-mag" style="color:#ff54d9">TRACTOR</span>'
    ].join('');
    var host = document.getElementById('scr-game') || document.body;
    host.appendChild(bar);
  }

  function syncHud() {
    ensureTimers();
    function set(id, on, text) {
      var el = document.getElementById(id);
      if (!el) return;
      el.style.display = on ? 'block' : 'none';
      if (on && text) el.textContent = text;
    }
    try {
      var p = Game && Game.powers;
      if (!p) return;
      set('nvx-pu-rapid', p.rapid > 0, 'RAPID ' + Math.ceil(p.rapid) + 's');
      set('nvx-pu-score', p.scoreBoost > 0, 'x2 ' + Math.ceil(p.scoreBoost) + 's');
      set('nvx-pu-od', p.overdrive > 0, 'AFTERBURN ' + Math.ceil(p.overdrive) + 's');
      set('nvx-pu-mag', p.magnet > 0, 'TRACTOR ' + Math.ceil(p.magnet) + 's');
    } catch (e) {}
  }

  function boot() {
    mergePowerInfo();
    ensureTimers();
    patchDropFromEnemy();
    patchActivatePower();
    patchUpdateWeapons();
    patchScoreOnKill();
    patchKillDrops();
    patchWeaponCd();
    injectHudCss();
    ensureHud();
    setInterval(function () {
      mergePowerInfo();
      patchDropFromEnemy();
      patchActivatePower();
      patchUpdateWeapons();
      patchKillDrops();
      syncHud();
    }, 2000);
    setInterval(syncHud, 200);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () { setTimeout(boot, 60); });
  } else {
    setTimeout(boot, 60);
  }
  setTimeout(boot, 700);
  setTimeout(boot, 2000);
})();
