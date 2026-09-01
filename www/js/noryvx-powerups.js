/* NORYVX 1945 — expanded power-up mechanics */
(function () {
  'use strict';
  if (window.__NVX_POWERUPS_V1__) return;
  window.__NVX_POWERUPS_V1__ = true;

  /* Air-force themed labels + colors */
  var INFO = {
    shield:     { color: '#48d9ff', label: 'ENERGY SHIELD',  icon: '🛡' },
    magnet:     { color: '#ff54d9', label: 'TRACTOR BEAM',   icon: '◎' },
    overdrive:  { color: '#ffe34d', label: 'AFTERBURNER',    icon: '⚡' },
    nova:       { color: '#ff6b3b', label: 'CLUSTER BOMB',   icon: '✴' },
    powerCore:  { color: '#22e6ff', label: 'WEAPON CORE',    icon: 'P' },
    nanoRepair: { color: '#48ff9b', label: 'REPAIR KIT',     icon: '+' },
    rapid:      { color: '#a0ff60', label: 'RAPID FIRE',     icon: '»' },
    bomb:       { color: '#ff4060', label: 'SMART BOMB',     icon: '◉' },
    scoreBoost: { color: '#ffd24d', label: 'BONUS PAYLOAD',  icon: '$' }
  };

  var EXTRA_TYPES = ['rapid', 'bomb', 'scoreBoost'];

  function mergePowerInfo() {
    try {
      if (typeof POWER_INFO === 'object' && POWER_INFO) {
        Object.keys(INFO).forEach(function (k) {
          POWER_INFO[k] = INFO[k];
        });
      }
      window.POWER_INFO = window.POWER_INFO || POWER_INFO;
      if (window.POWER_INFO) {
        Object.keys(INFO).forEach(function (k) {
          window.POWER_INFO[k] = INFO[k];
        });
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

  /* Higher + more interesting enemy drops */
  function patchDropFromEnemy() {
    if (typeof dropFromEnemy !== 'function' && typeof window.dropFromEnemy !== 'function') return;
    var orig = window.dropFromEnemy || dropFromEnemy;
    if (orig.__nvxPu) return;

    function enhanced(x, y) {
      var roll = Math.random();
      var type = null;
      /* ~28% drop chance total (was ~14%) */
      if (roll < 0.08) type = 'powerCore';
      else if (roll < 0.13) type = 'shield';
      else if (roll < 0.17) type = 'nanoRepair';
      else if (roll < 0.21) type = 'magnet';
      else if (roll < 0.24) type = 'overdrive';
      else if (roll < 0.26) type = 'rapid';
      else if (roll < 0.275) type = 'bomb';
      else if (roll < 0.29) type = 'scoreBoost';
      else return;

      try {
        if (typeof powerups === 'undefined' || !powerups || !powerups.get) {
          return orig.call(this, x, y);
        }
        var d = powerups.get();
        d.x = x + (Math.random() - 0.5) * 24;
        d.y = y;
        d.type = type;
        d.t = Math.random() * Math.PI * 2;
        d._drop = true;
        d.vy = 40 + Math.random() * 35;
        d.r = 13;
        d.alive = true;
      } catch (e) {
        try { orig.call(this, x, y); } catch (e2) {}
      }
    }
    enhanced.__nvxPu = true;
    window.dropFromEnemy = enhanced;
    try { dropFromEnemy = enhanced; } catch (e) {}
  }

  function detonateBomb() {
    try {
      var radius = 160;
      var hits = 0;
      if (typeof enemies !== 'undefined' && enemies && enemies.forEach) {
        enemies.forEach(function (e) {
          if (!e || !e.alive) return;
          var d = Math.hypot(e.x - player.x, e.y - player.y);
          if (d <= radius) {
            var dmg = e.boss ? 8 : e.elite ? 4 : 99;
            try {
              if (typeof damageEnemy === 'function') damageEnemy(e, dmg, '#ff4060', 'bomb');
              else e.hp = 0;
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
          popText(player.x, player.y - 40, hits ? 'SMART BOMB ×' + hits : 'SMART BOMB', '#ff4060', 16);
        }
      } catch (fx) {}
    } catch (e) {}
  }

  function patchActivatePower() {
    if (typeof activatePower !== 'function' && typeof window.activatePower !== 'function') return;
    var orig = window.activatePower || activatePower;
    if (orig.__nvxPu) return;

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

      /* Rename feedback for classic types */
      if (type === 'overdrive' || type === 'magnet' || type === 'shield' || type === 'nova') {
        try {
          var r = orig.call(this, type);
          if (typeof popText === 'function') {
            popText(player.x, player.y - 52, info.label, info.color, 14);
          }
          return r;
        } catch (e) {
          return orig.call(this, type);
        }
      }

      return orig.call(this, type);
    }
    enhanced.__nvxPu = true;
    window.activatePower = enhanced;
    try { activatePower = enhanced; } catch (e) {}
  }

  /* Tick new timers + rapid-fire effect */
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

  /* Rapid fire: temporarily reduce weapon cooldowns */
  function patchWeaponCd() {
    try {
      if (typeof Game === 'undefined' || !Game) return;
      if (!Game.__nvxFireMulHook) {
        Game.__nvxFireMulHook = true;
      }
      /* Exposed multiplier for any fire logic that reads it */
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

  /* Soft-hook updateWeapons cooldowns if structure allows */
  function patchUpdateWeapons() {
    if (typeof updateWeapons !== 'function' && typeof window.updateWeapons !== 'function') return;
    var orig = window.updateWeapons || updateWeapons;
    if (orig.__nvxPu) return;
    function enhanced(dt) {
      tickPowers(dt);
      var mul = 1;
      try {
        if (Game && Game.powers && Game.powers.rapid > 0) mul = 1.75;
      } catch (e) {}
      try {
        /* Pass inflated dt so cooldowns drain faster */
        return orig.call(this, dt * mul);
      } catch (e2) {
        return orig.call(this, dt);
      }
    }
    enhanced.__nvxPu = true;
    window.updateWeapons = enhanced;
    try { updateWeapons = enhanced; } catch (e) {}
  }

  /* Score multiplier on kill reward path — wrap Game.score adds is hard;
     instead patch a known score path if present via combo display. */
  function patchScoreOnKill() {
    /* damageEnemy already awards score; multiply via interceptor if possible */
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
          if (gained > 0) Game.score += gained; /* double total gain */
        }
      } catch (err2) {}
      return r;
    }
    enhanced.__nvxPuScore = true;
    window.damageEnemy = enhanced;
    try { damageEnemy = enhanced; } catch (e) {}
  }

  /* Draw badges for active timed powers */
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
      'color:#eafeff;text-shadow:0 0 8px currentColor;}',
      '.nvx-pu-chip.on{display:block;}',
      '.nvx-pu-chip{display:none;}'
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
    patchWeaponCd();
    injectHudCss();
    ensureHud();
    setInterval(function () {
      mergePowerInfo();
      patchDropFromEnemy();
      patchActivatePower();
      patchUpdateWeapons();
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
