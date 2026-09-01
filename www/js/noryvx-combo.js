/* NORYVX — optimized combo multiplier curve + window scaling */
(function () {
  'use strict';
  if (window.__NVX_COMBO_V1__) return;
  window.__NVX_COMBO_V1__ = true;

  function multFromChain(chain) {
    var c = chain | 0;
    if (c < 2) return 1;
    if (c < 4) return 2;
    if (c < 7) return 3;
    if (c < 11) return 4;
    if (c < 16) return 5;
    if (c < 22) return 6;
    if (c < 29) return 7;
    if (c < 37) return 8;
    if (c < 46) return 9;
    if (c < 56) return 10;
    if (c < 68) return 11;
    return 12;
  }

  function windowForCombo(combo) {
    var base = 2.75;
    var bonus = Math.min(1.35, Math.max(0, (combo - 1) * 0.12));
    return base + bonus;
  }

  var TIER = {
    1: { name: '', color: '#8ab4c8' },
    2: { name: 'WARM', color: '#7dffb0' },
    3: { name: 'HOT', color: '#ffe34d' },
    4: { name: 'HOT', color: '#ffe34d' },
    5: { name: 'BLAZE', color: '#ff9a3d' },
    6: { name: 'BLAZE', color: '#ff9a3d' },
    7: { name: 'INFERNO', color: '#ff5a3d' },
    8: { name: 'INFERNO', color: '#ff5a3d' },
    9: { name: 'ACE', color: '#ff4fd8' },
    10: { name: 'ACE', color: '#ff4fd8' },
    11: { name: 'LEGEND', color: '#b47aff' },
    12: { name: 'LEGEND', color: '#b47aff' }
  };

  function applyComboMath() {
    try {
      if (typeof Game === 'undefined' || !Game) return;
      if (typeof BALANCE !== 'undefined' && BALANCE && BALANCE.economy) {
        BALANCE.economy.comboMax = 12;
        BALANCE.economy.comboWindowSec = windowForCombo(Game.combo || 1);
      }
      var chain = Game.chain | 0;
      var next = multFromChain(chain);
      var prev = Game.combo | 0;
      Game.combo = next;
      if (typeof Game.maxCombo === 'number') {
        Game.maxCombo = Math.max(Game.maxCombo, next);
      }
      if (next > prev && Game.comboTimer != null) {
        Game.comboTimer = Math.max(Game.comboTimer, windowForCombo(next) * 0.85);
      }
      if (next > prev && next >= 3) {
        try {
          if (typeof popText === 'function' && typeof player !== 'undefined') {
            var tier = TIER[next] || TIER[1];
            var label = 'x' + next + (tier.name ? ' ' + tier.name : '');
            popText(player.x, player.y - 50, label, tier.color, 14 + Math.min(6, next));
          }
        } catch (e) {}
      }
    } catch (e) {}
  }

  function patchBalance() {
    try {
      if (typeof BALANCE === 'undefined' || !BALANCE || !BALANCE.economy) return;
      BALANCE.economy.comboMax = 12;
      if (!BALANCE.economy.__nvxCombo) {
        BALANCE.economy.comboWindowSec = 2.75;
        BALANCE.economy.__nvxCombo = true;
      }
    } catch (e) {}
  }

  function patchKill() {
    if (typeof damageEnemy !== 'function' && typeof window.damageEnemy !== 'function') return;
    var orig = window.damageEnemy || damageEnemy;
    if (orig.__nvxCombo) return;
    function enhanced(e, amount, color, src) {
      var r = orig.apply(this, arguments);
      try {
        if (e && !e.alive) applyComboMath();
      } catch (err) {}
      return r;
    }
    enhanced.__nvxCombo = true;
    window.damageEnemy = enhanced;
    try { damageEnemy = enhanced; } catch (e) {}
  }

  function injectHud() {
    if (document.getElementById('nvx-combo-css')) return;
    var s = document.createElement('style');
    s.id = 'nvx-combo-css';
    s.textContent = [
      '#nvx-combo-badge{',
      '  position:absolute;left:50%;top:calc(var(--safe-t,0px) + 58px);',
      '  transform:translateX(-50%);z-index:12;pointer-events:none;',
      '  font:800 18px Chakra Petch,sans-serif;letter-spacing:.06em;',
      '  color:#7af0ff;text-shadow:0 0 16px rgba(34,230,255,.7);',
      '  opacity:0;transition:opacity .15s,transform .15s;',
      '}',
      '#nvx-combo-badge.on{opacity:1;transform:translateX(-50%) scale(1.05);}',
      '#nvx-combo-badge .tier{',
      '  display:block;font:700 8px IBM Plex Mono,monospace;',
      '  letter-spacing:.14em;opacity:.85;text-align:center;margin-top:2px;',
      '}',
      '#nvx-combo-bar{',
      '  width:72px;height:3px;margin:5px auto 0;border-radius:99px;',
      '  background:rgba(34,230,255,.15);overflow:hidden;',
      '}',
      '#nvx-combo-bar>i{display:block;height:100%;width:0%;',
      '  background:linear-gradient(90deg,#22e6ff,#ff4fd8);',
      '  transition:width .1s linear;}'
    ].join('\n');
    document.head.appendChild(s);

    if (!document.getElementById('nvx-combo-badge')) {
      var el = document.createElement('div');
      el.id = 'nvx-combo-badge';
      el.innerHTML = '<span class="mul">x1</span><span class="tier"></span><div id="nvx-combo-bar"><i></i></div>';
      var host = document.getElementById('scr-game') || document.body;
      host.appendChild(el);
    }
  }

  function syncHud() {
    injectHud();
    var el = document.getElementById('nvx-combo-badge');
    if (!el) return;
    try {
      if (typeof Game === 'undefined' || !Game) return;
      var playing = true;
      try {
        if (typeof STATE !== 'undefined' && STATE && STATE.PLAYING != null) {
          playing = Game.state === STATE.PLAYING;
        }
      } catch (e) {}
      var c = Game.combo | 0;
      var show = playing && c >= 2 && (Game.comboTimer || 0) > 0;
      el.classList.toggle('on', !!show);
      if (!show) return;
      var mul = el.querySelector('.mul');
      var tier = el.querySelector('.tier');
      var bar = el.querySelector('#nvx-combo-bar>i');
      var t = TIER[c] || TIER[1];
      if (mul) {
        mul.textContent = 'x' + c;
        mul.style.color = t.color;
      }
      if (tier) {
        tier.textContent = t.name || '';
        tier.style.color = t.color;
      }
      if (bar) {
        var win = windowForCombo(c);
        var pct = Math.max(0, Math.min(1, (Game.comboTimer || 0) / win));
        bar.style.width = (pct * 100) + '%';
      }
    } catch (e) {}
  }

  function tick() {
    patchBalance();
    try {
      if (typeof Game !== 'undefined' && Game && (Game.chain | 0) >= 0) {
        var want = multFromChain(Game.chain | 0);
        if ((Game.combo | 0) !== want) Game.combo = want;
        if (typeof Game.maxCombo === 'number') {
          Game.maxCombo = Math.max(Game.maxCombo | 0, want);
        }
      }
    } catch (e) {}
    syncHud();
  }

  function boot() {
    patchBalance();
    patchKill();
    injectHud();
    setInterval(tick, 100);
    setInterval(patchKill, 2000);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () { setTimeout(boot, 70); });
  } else {
    setTimeout(boot, 70);
  }
  setTimeout(boot, 700);
})();
