/* NORYVX — difficulty presets + level curve */
(function () {
  'use strict';
  if (window.__NVX_DIFF_V1__) return;
  window.__NVX_DIFF_V1__ = true;

  var KEY = 'noryvx_difficulty_v1';

  /*
   * Presets multiply core combat pressure.
   * hp / speed / cap / fire / score
   */
  var PRESETS = {
    easy:   { id: 'easy',   label: 'KOLAY',   hp: 0.85, speed: 0.88, cap: 0.85, fire: 0.80, score: 0.85, drop: 1.15 },
    normal: { id: 'normal', label: 'NORMAL',  hp: 1.00, speed: 1.00, cap: 1.00, fire: 1.00, score: 1.00, drop: 1.00 },
    hard:   { id: 'hard',   label: 'ZOR',     hp: 1.25, speed: 1.12, cap: 1.15, fire: 1.20, score: 1.20, drop: 0.90 },
    ace:    { id: 'ace',    label: 'ASE',     hp: 1.55, speed: 1.22, cap: 1.30, fire: 1.40, score: 1.40, drop: 0.80 }
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

  window.NVX_DIFF = {
    presets: PRESETS,
    get: current,
    id: loadId,
    set: function (id) {
      if (!PRESETS[id]) return;
      saveId(id);
      renderPicker();
      try {
        if (typeof popText === 'function' && typeof player !== 'undefined') {
          popText(W / 2, H * 0.2, 'ZORLUK: ' + PRESETS[id].label, '#22e6ff', 16);
        }
      } catch (e) {}
    }
  };

  /* Level curve helpers used by patches */
  function levelPressure(level) {
    var L = Math.max(1, level | 0);
    /* smooth ramp: early gentle, mid solid, late demanding */
    if (L <= 3) return 0.92 + (L - 1) * 0.04;
    if (L <= 7) return 1.00 + (L - 4) * 0.05;
    if (L <= 12) return 1.20 + (L - 8) * 0.055;
    if (L <= 19) return 1.48 + (L - 13) * 0.05;
    return 1.83 + (L - 20) * 0.04;
  }

  function patchBalance() {
    try {
      if (typeof BALANCE === 'undefined' || !BALANCE || !BALANCE.enemy) return;
      if (BALANCE.enemy.__nvxDiff) return;
      var origHp = BALANCE.enemy.hpCurve;
      BALANCE.enemy.hpCurve = function (level) {
        var base = typeof origHp === 'function' ? origHp.call(BALANCE.enemy, level) : 1;
        var p = current();
        return base * p.hp * (0.85 + 0.15 * levelPressure(level));
      };
      var origLate = typeof lateGamePressure === 'function' ? lateGamePressure : null;
      if (origLate && !origLate.__nvxDiff) {
        window.lateGamePressure = function (level) {
          var v = origLate(level);
          return v * current().speed * (0.9 + 0.1 * levelPressure(level));
        };
        window.lateGamePressure.__nvxDiff = true;
        try { lateGamePressure = window.lateGamePressure; } catch (e) {}
      }
      if (typeof enemyCapForLevel === 'function' && !enemyCapForLevel.__nvxDiff) {
        var origCap = enemyCapForLevel;
        window.enemyCapForLevel = function (level) {
          var c = origCap(level);
          return Math.max(4, Math.round(c * current().cap));
        };
        window.enemyCapForLevel.__nvxDiff = true;
        try { enemyCapForLevel = window.enemyCapForLevel; } catch (e) {}
      }
      BALANCE.enemy.__nvxDiff = true;
    } catch (e) {}
  }

  /* Enemy bullet cadence */
  function patchEnemyFire() {
    /* waveScale already in update; multiply via Game flag read in interval scrub */
    window.NVX_enemyFireMul = function () {
      return current().fire;
    };
  }

  /* Soft-patch drop mul into powerups if present */
  function patchDrops() {
    window.NVX_dropMul = function () {
      return current().drop;
    };
    /* If powerups pickDrop exists later, it can read NVX_dropMul */
  }

  /* Score reward mild scale */
  function patchScore() {
    if (typeof damageEnemy !== 'function' && typeof window.damageEnemy !== 'function') return;
    var orig = window.damageEnemy || damageEnemy;
    if (orig.__nvxDiffScore) return;
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
        }
      } catch (err2) {}
      return r;
    }
    enhanced.__nvxDiffScore = true;
    window.damageEnemy = enhanced;
    try { damageEnemy = enhanced; } catch (e) {}
  }

  /* Enemy shoot cooldown scale via wrapping a known path is hard;
     expose and also tighten via reduced base by monkeypatching Math if needed — skip.
     Instead: on each enemy update tick bias via _scd if accessible. */
  function scrubFireRates() {
    try {
      if (typeof enemies === 'undefined' || !enemies || !enemies.forEach) return;
      var mul = current().fire;
      if (mul === 1) return;
      /* fire>1 means harder = faster shots = lower cd remaining occasionally */
      enemies.forEach(function (e) {
        if (!e || !e.alive || e._scd == null) return;
        if (mul > 1 && Math.random() < 0.02 * (mul - 1)) {
          e._scd *= 0.92;
        }
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
      '  font:700 9px IBM Plex Mono,monospace;letter-spacing:.08em;',
      '  padding:7px 10px;border-radius:10px;cursor:pointer;',
      '  border:1px solid rgba(34,230,255,.28);',
      '  background:rgba(4,12,28,.75);color:rgba(234,244,255,.7);',
      '  -webkit-tap-highlight-color:transparent;',
      '}',
      '#nvx-diff-picker button.on{',
      '  color:#021018;background:linear-gradient(135deg,#22e6ff,#7b5cff);',
      '  border-color:transparent;box-shadow:0 0 14px rgba(34,230,255,.35);',
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
      if (play && play.parentNode) {
        play.parentNode.insertBefore(box, play);
      } else {
        host.appendChild(box);
      }
      var hint = document.createElement('div');
      hint.id = 'nvx-diff-hint';
      hint.textContent = 'ZORLUK';
      box.parentNode.insertBefore(hint, box);
    }
    var cur = loadId();
    box.innerHTML = '';
    Object.keys(PRESETS).forEach(function (id) {
      var b = document.createElement('button');
      b.type = 'button';
      b.textContent = PRESETS[id].label;
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
    renderPicker();
    setInterval(function () {
      patchBalance();
      patchScore();
      scrubFireRates();
      if (!document.getElementById('nvx-diff-picker')) renderPicker();
    }, 2000);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () { setTimeout(boot, 80); });
  } else {
    setTimeout(boot, 80);
  }
  setTimeout(boot, 600);
  setTimeout(boot, 1800);
})();
