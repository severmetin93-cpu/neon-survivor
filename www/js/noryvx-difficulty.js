/* NORYVX — difficulty presets + level curve + reward scaling */
(function () {
  'use strict';
  if (window.__NVX_DIFF_V2__) return;
  window.__NVX_DIFF_V2__ = true;

  var KEY = 'noryvx_difficulty_v1';

  /*
   * Combat pressure + reward multipliers
   * reward: cores / XP / end-bonus scale
   * score: in-run score scale
   * drop: power-up drop chance scale
   */
  var PRESETS = {
    easy: {
      id: 'easy', label: 'KOLAY',
      hp: 0.85, speed: 0.88, cap: 0.85, fire: 0.80,
      score: 0.85, drop: 1.15,
      reward: 0.75, xp: 0.80, cores: 0.75
    },
    normal: {
      id: 'normal', label: 'NORMAL',
      hp: 1.00, speed: 1.00, cap: 1.00, fire: 1.00,
      score: 1.00, drop: 1.00,
      reward: 1.00, xp: 1.00, cores: 1.00
    },
    hard: {
      id: 'hard', label: 'ZOR',
      hp: 1.25, speed: 1.12, cap: 1.15, fire: 1.20,
      score: 1.25, drop: 0.90,
      reward: 1.40, xp: 1.35, cores: 1.45
    },
    ace: {
      id: 'ace', label: 'ASE',
      hp: 1.55, speed: 1.22, cap: 1.30, fire: 1.40,
      score: 1.55, drop: 0.80,
      reward: 1.85, xp: 1.70, cores: 2.00
    }
  };

  function loadId() {
    try {
      var v = localStorage.getItem(KEY);
      if (v && PRESETS[v]) return v;
    } catch (e) {}
    return 'normal';
  }

  function saveId(id) {
    try { localStorage.setItem(KEY, id); } catch (e) {}
  }

  function current() {
    return PRESETS[loadId()] || PRESETS.normal;
  }

  function rewardMul() {
    return current().reward || 1;
  }

  function coresMul() {
    return current().cores || 1;
  }

  function xpMul() {
    return current().xp || 1;
  }

  window.NVX_DIFF = {
    presets: PRESETS,
    get: current,
    id: loadId,
    set: function (id) {
      if (!PRESETS[id]) return;
      saveId(id);
      renderPicker();
      try {
        if (typeof popText === 'function' && typeof W !== 'undefined') {
          var p = PRESETS[id];
          popText(W / 2, H * 0.18, 'ZORLUK: ' + p.label + '  ·  ÖDÜL x' + p.reward.toFixed(2), '#22e6ff', 15);
        }
      } catch (e) {}
    },
    rewardMul: rewardMul,
    coresMul: coresMul,
    xpMul: xpMul
  };

  function levelPressure(level) {
    var L = Math.max(1, level | 0);
    if (L <= 3) return 0.92 + (L - 1) * 0.04;
    if (L <= 7) return 1.00 + (L - 4) * 0.05;
    if (L <= 12) return 1.20 + (L - 8) * 0.055;
    if (L <= 19) return 1.48 + (L - 13) * 0.05;
    return 1.83 + (L - 20) * 0.04;
  }

  function patchBalance() {
    try {
      if (typeof BALANCE === 'undefined' || !BALANCE || !BALANCE.enemy) return;
      if (BALANCE.enemy.__nvxDiffV2) return;
      var origHp = BALANCE.enemy.hpCurve;
      BALANCE.enemy.hpCurve = function (level) {
        var base = typeof origHp === 'function' ? origHp.call(BALANCE.enemy, level) : 1;
        var p = current();
        return base * p.hp * (0.85 + 0.15 * levelPressure(level));
      };
      var origLate = typeof lateGamePressure === 'function' ? lateGamePressure : null;
      if (origLate && !origLate.__nvxDiffV2) {
        window.lateGamePressure = function (level) {
          var v = origLate(level);
          return v * current().speed * (0.9 + 0.1 * levelPressure(level));
        };
        window.lateGamePressure.__nvxDiffV2 = true;
        try { lateGamePressure = window.lateGamePressure; } catch (e) {}
      }
      if (typeof enemyCapForLevel === 'function' && !enemyCapForLevel.__nvxDiffV2) {
        var origCap = enemyCapForLevel;
        window.enemyCapForLevel = function (level) {
          var c = origCap(level);
          return Math.max(4, Math.round(c * current().cap));
        };
        window.enemyCapForLevel.__nvxDiffV2 = true;
        try { enemyCapForLevel = window.enemyCapForLevel; } catch (e) {}
      }
      BALANCE.enemy.__nvxDiffV2 = true;
    } catch (e) {}
  }

  function patchEnemyFire() {
    window.NVX_enemyFireMul = function () { return current().fire; };
  }

  function patchDrops() {
    window.NVX_dropMul = function () { return current().drop; };
  }

  /* In-run score on kills */
  function patchScore() {
    if(window.__nvxWrap_difficulty)return; window.__nvxWrap_difficulty=1;
    if (typeof damageEnemy !== 'function' && typeof window.damageEnemy !== 'function') return;
    var orig = window.damageEnemy || damageEnemy;
    if (orig.__nvxDiffScoreV2) return;
    function enhanced(e, amount, color, src) {
      var before = 0;
      try { before = Game.score || 0; } catch (err) {}
      var r = orig.apply(this, arguments);
      try {
        if (e && !e.alive) {
          var gained = (Game.score || 0) - before;
          var mul = current().score;
          if (gained > 0 && mul !== 1) {
            Game.score = before + Math.round(gained * mul);
          }
          /* Scale run core bonus grants that happened inside orig for elite/boss */
          if (gained > 0 && (e.elite || e.boss)) {
            /* core bonuses already added as fixed ints inside damageEnemy;
               apply residual via tracking on Game */
          }
        }
      } catch (err2) {}
      return r;
    }
    enhanced.__nvxDiffScoreV2 = true;
    window.damageEnemy = enhanced;
    try { damageEnemy = enhanced; } catch (e) {}
  }

  /* Scale XP gains */
  function patchXP() {
    try {
      if (typeof Game === 'undefined' || !Game) return;
      if (Game.addRunXP && Game.addRunXP.__nvxDiff) return;
      if (typeof Game.addRunXP === 'function') {
        var orig = Game.addRunXP.bind(Game);
        Game.addRunXP = function (amount, reason) {
          var a = amount;
          try { a = Math.round((amount || 0) * xpMul()); } catch (e) {}
          return orig(a, reason);
        };
        Game.addRunXP.__nvxDiff = true;
      }
    } catch (e) {}
  }

  /* Scale core bonus whenever it increases + final payout */
  function patchCores() {
    try {
      if (typeof Game === 'undefined' || !Game) return;
      if (Game.__nvxCoreProxy) return;
      var _cores = Game.runCoreBonus || 0;
      Object.defineProperty(Game, 'runCoreBonus', {
        configurable: true,
        enumerable: true,
        get: function () { return _cores; },
        set: function (v) {
          var prev = _cores;
          var next = v;
          /* If increased mid-run, scale the delta by coresMul */
          if (typeof next === 'number' && next > prev) {
            var delta = next - prev;
            next = prev + Math.round(delta * coresMul());
          }
          _cores = next;
        }
      });
      Game.__nvxCoreProxy = true;
    } catch (e) {
      /* defineProperty may fail if already non-configurable */
    }
  }

  /* Final Save.data.cores add — intercept lastReward write via polling end state */
  var _lastSettled = false;
  function settleRewardBonus() {
    try {
      if (typeof Game === 'undefined' || !Game) return;
      var st = Game.state;
      var over = false;
      try {
        if (typeof STATE !== 'undefined' && STATE) {
          over = (st === STATE.OVER || st === STATE.DEAD || st === 'OVER' || st === 'DEAD');
        } else {
          over = (st === 'OVER' || st === 'DEAD' || st === 3);
        }
      } catch (e) {}
      if (!over) { _lastSettled = false; return; }
      if (_lastSettled) return;
      _lastSettled = true;

      var p = current();
      if (p.id === 'normal') return;

      /* Extra gem/core tip for hard modes */
      var bonusCores = 0;
      if (p.id === 'hard') bonusCores = 3;
      if (p.id === 'ace') bonusCores = 8;
      if (p.id === 'easy') bonusCores = 0;

      if (bonusCores > 0 && typeof Save !== 'undefined' && Save && Save.data) {
        Save.data.cores = (Save.data.cores || 0) + bonusCores;
        try { Save.save(); } catch (e2) {}
        if (Game.lastReward) {
          Game.lastReward.cores = (Game.lastReward.cores || 0) + bonusCores;
          Game.lastReward.diffBonus = bonusCores;
          Game.lastReward.diffId = p.id;
        }
      }

      /* Show banner once */
      try {
        if (typeof popText === 'function') {
          popText(W / 2, H * 0.28, p.label + ' ÖDÜL x' + p.reward.toFixed(2) + (bonusCores ? '  +' + bonusCores + ' CORE' : ''), '#ffe34d', 14);
        }
      } catch (e3) {}
    } catch (e) {}
  }

  function scrubFireRates() {
    try {
      if (typeof enemies === 'undefined' || !enemies || !enemies.forEach) return;
      var mul = current().fire;
      if (mul === 1) return;
      enemies.forEach(function (e) {
        if (!e || !e.alive || e._scd == null) return;
        if (mul > 1 && Math.random() < 0.02 * (mul - 1)) e._scd *= 0.92;
      });
    } catch (e) {}
  }

  function injectCss() {
    if (document.getElementById('nvx-diff-css')) return;
    var s = document.createElement('style');
    s.id = 'nvx-diff-css';
    s.textContent = [
      '#nvx-diff-picker{',
      '  display:flex;gap:6px;justify-content:center;flex-wrap:wrap;',
      '  margin:8px 12px 0;position:relative;z-index:6;',
      '}',
      '#nvx-diff-picker button{',
      '  font:700 9px IBM Plex Mono,monospace;letter-spacing:.06em;',
      '  padding:7px 10px;border-radius:10px;cursor:pointer;',
      '  border:1px solid rgba(34,230,255,.28);',
      '  background:rgba(4,12,28,.75);color:rgba(234,244,255,.7);',
      '  -webkit-tap-highlight-color:transparent;',
      '}',
      '#nvx-diff-picker button.on{',
      '  color:#021018;background:linear-gradient(135deg,#22e6ff,#7b5cff);',
      '  border-color:transparent;box-shadow:0 0 14px rgba(34,230,255,.35);',
      '}',
      '#nvx-diff-picker button small{',
      '  display:block;font-size:7px;opacity:.75;margin-top:2px;letter-spacing:.04em;',
      '}',
      '#nvx-diff-hint{',
      '  text-align:center;font:600 8px IBM Plex Mono,monospace;',
      '  color:rgba(234,244,255,.4);letter-spacing:.12em;margin-top:4px;',
      '}'
    ].join('\n');
    document.head.appendChild(s);
  }

  function renderPicker() {
    injectCss();
    var host = document.getElementById('scr-menu');
    if (!host) return;
    var box = document.getElementById('nvx-diff-picker');
    if (!box) {
      box = document.createElement('div');
      box.id = 'nvx-diff-picker';
      var play = host.querySelector('.nvx2-play, #b-play, [data-action="play"]');
      if (play && play.parentNode) play.parentNode.insertBefore(box, play);
      else host.appendChild(box);
      var hint = document.createElement('div');
      hint.id = 'nvx-diff-hint';
      hint.textContent = 'ZORLUK · ÖDÜL';
      box.parentNode.insertBefore(hint, box);
    }
    var cur = loadId();
    box.innerHTML = '';
    Object.keys(PRESETS).forEach(function (id) {
      var p = PRESETS[id];
      var b = document.createElement('button');
      b.type = 'button';
      b.innerHTML = p.label + '<small>ÖDÜL x' + p.reward.toFixed(2) + '</small>';
      if (id === cur) b.className = 'on';
      b.addEventListener('click', function (ev) {
        ev.preventDefault();
        ev.stopPropagation();
        window.NVX_DIFF.set(id);
      });
      box.appendChild(b);
    });
  }

  function boot() {
    patchBalance();
    patchEnemyFire();
    patchDrops();
    patchScore();
    patchXP();
    patchCores();
    renderPicker();
    setInterval(function () {
      patchBalance();
      patchScore();
      patchXP();
      patchCores();
      scrubFireRates();
      settleRewardBonus();
      if (!document.getElementById('nvx-diff-picker')) renderPicker();
    }, 1500);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () { setTimeout(boot, 80); });
  } else {
    setTimeout(boot, 80);
  }
  setTimeout(boot, 600);
  setTimeout(boot, 1800);
})();
