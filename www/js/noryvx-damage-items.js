/* NORYVX — damage-boosting run items + temp power */
(function () {
  'use strict';
  if (window.__NVX_DMG_ITEMS_V1__) return;
  window.__NVX_DMG_ITEMS_V1__ = true;

  /*
   * Run passives (level-up cards)
   * damage  — +12% weapon damage / stack (soft cap 5)
   * pierce  — +1 pierce / stack (cap 3)
   * overclock — -6% fire cooldown / stack (cap 4)
   * payload — +18% boss/elite damage / stack (cap 3)
   */
  var ITEMS = {
    damage: {
      icon: '⚔',
      title: 'AP ROUNDS',
      desc: 'Tüm silah hasarını +%12 artır. İlk 5 stack güçlü.',
      kind: 'passive',
      max: 5,
      perStack: 0.12
    },
    pierce: {
      icon: '◎',
      title: 'ARMOR PIERCE',
      desc: 'Mermiler +1 hedef deler. En fazla 3 stack.',
      kind: 'passive',
      max: 3,
      perStack: 1
    },
    overclock: {
      icon: '⚙',
      title: 'GUN OVERCLOCK',
      desc: 'Ateş hızı +%6 (cooldown düşer). Max 4 stack.',
      kind: 'passive',
      max: 4,
      perStack: 0.06
    },
    payload: {
      icon: '💣',
      title: 'HEAVY PAYLOAD',
      desc: 'Elite ve boss hasarı +%18. Max 3 stack.',
      kind: 'passive',
      max: 3,
      perStack: 0.18
    }
  };

  function ensureRunUpgrades() {
    try {
      if (typeof Game === 'undefined' || !Game) return;
      if (!Game.runUpgrades) Game.runUpgrades = { speed: 0, magnet: 0, score: 0 };
      Object.keys(ITEMS).forEach(function (k) {
        if (typeof Game.runUpgrades[k] !== 'number') Game.runUpgrades[k] = 0;
      });
    } catch (e) {}
  }

  function stacks(key) {
    ensureRunUpgrades();
    try {
      return Math.max(0, Game.runUpgrades[key] | 0);
    } catch (e) {
      return 0;
    }
  }

  function damageMul() {
    var s = Math.min(ITEMS.damage.max, stacks('damage'));
    return 1 + s * ITEMS.damage.perStack;
  }

  function pierceBonus() {
    return Math.min(ITEMS.pierce.max, stacks('pierce')) * ITEMS.pierce.perStack;
  }

  function cooldownMul() {
    var s = Math.min(ITEMS.overclock.max, stacks('overclock'));
    return Math.pow(1 - ITEMS.overclock.perStack, s);
  }

  function eliteBossMul() {
    var s = Math.min(ITEMS.payload.max, stacks('payload'));
    return 1 + s * ITEMS.payload.perStack;
  }

  /* Temp combat buff from power-up drop */
  function ensureTemp() {
    try {
      if (!Game.powers) Game.powers = {};
      if (typeof Game.powers.dmgBoost !== 'number') Game.powers.dmgBoost = 0;
    } catch (e) {}
  }

  function tempDamageMul() {
    ensureTemp();
    try {
      if (Game.powers.dmgBoost > 0) return 1.35;
    } catch (e) {}
    return 1;
  }

  window.NVX_DMG = {
    damageMul: damageMul,
    pierceBonus: pierceBonus,
    cooldownMul: cooldownMul,
    eliteBossMul: eliteBossMul,
    tempDamageMul: tempDamageMul,
    items: ITEMS
  };

  function injectChoices() {
    try {
      if (typeof RUN_CHOICES === 'object' && RUN_CHOICES) {
        Object.keys(ITEMS).forEach(function (k) {
          if (!RUN_CHOICES[k]) {
            RUN_CHOICES[k] = {
              icon: ITEMS[k].icon,
              title: ITEMS[k].title,
              desc: ITEMS[k].desc,
              kind: 'passive'
            };
          }
        });
      }
      if (typeof P2_PASSIVE_MAX === 'object' && P2_PASSIVE_MAX) {
        Object.keys(ITEMS).forEach(function (k) {
          P2_PASSIVE_MAX[k] = ITEMS[k].max;
        });
      }
    } catch (e) {}
  }

  function patchChoosePerk() {
    if (typeof chooseRunPerk !== 'function' && typeof window.chooseRunPerk !== 'function') return;
    var orig = window.chooseRunPerk || chooseRunPerk;
    if (orig.__nvxDmg) return;

    function enhanced(type) {
      ensureRunUpgrades();
      if (ITEMS[type]) {
        try {
          if (typeof Game === 'undefined' || !Game || Game.state !== STATE.LEVELUP) {
            return orig.call(this, type);
          }
          var max = ITEMS[type].max;
          var cur = Game.runUpgrades[type] | 0;
          if (cur >= max) {
            try {
              if (typeof popText === 'function') {
                popText(player.x, player.y - 34, ITEMS[type].title + ' MAX', '#ff9a3d', 14);
              }
            } catch (e) {}
            return orig.call(this, type);
          }
          Game.runUpgrades[type] = cur + 1;
          try {
            if (typeof popText === 'function') {
              popText(
                player.x,
                player.y - 34,
                ITEMS[type].title + ' Lv.' + Game.runUpgrades[type],
                '#ff6b4a',
                15
              );
              if (typeof emit === 'function') emit(player.x, player.y, 16, '#ff6b4a', 180, 3, 0.5);
              if (typeof Audio_ !== 'undefined' && Audio_.power) Audio_.power();
            }
          } catch (e2) {}
          /* Resume run like native passive path */
          try {
            if (typeof resumeAfterLevelUp === 'function') resumeAfterLevelUp();
            else if (typeof closeLevelUp === 'function') closeLevelUp();
            else {
              Game.state = STATE.PLAYING;
              var scr = document.getElementById('scr-levelup');
              if (scr) scr.classList.remove('on');
            }
          } catch (e3) {
            try { Game.state = STATE.PLAYING; } catch (e4) {}
          }
          return;
        } catch (err) {
          return orig.call(this, type);
        }
      }
      return orig.call(this, type);
    }
    enhanced.__nvxDmg = true;
    window.chooseRunPerk = enhanced;
    try { chooseRunPerk = enhanced; } catch (e) {}
  }

  function patchWeaponStat() {
    if (typeof weaponStat !== 'function' && typeof window.weaponStat !== 'function') return;
    var orig = window.weaponStat || weaponStat;
    if (orig.__nvxDmg) return;

    function enhanced(key, level) {
      var st = orig.call(this, key, level);
      try {
        if (!st) return st;
        st.damage = (st.damage || 1) * damageMul() * tempDamageMul();
        st.cooldown = (st.cooldown || 0.3) * cooldownMul();
        st.pierce = (st.pierce || 0) + pierceBonus();
      } catch (e) {}
      return st;
    }
    enhanced.__nvxDmg = true;
    window.weaponStat = enhanced;
    try { weaponStat = enhanced; } catch (e) {}
  }

  function patchDamageEnemy() {
    if (typeof damageEnemy !== 'function' && typeof window.damageEnemy !== 'function') return;
    var orig = window.damageEnemy || damageEnemy;
    if (orig.__nvxDmgElite) return;

    function enhanced(e, amount, color, src) {
      var a = amount;
      try {
        if (e && (e.elite || e.boss)) {
          a = amount * eliteBossMul();
        }
      } catch (err) {}
      return orig.call(this, e, a, color, src);
    }
    enhanced.__nvxDmgElite = true;
    window.damageEnemy = enhanced;
    try { damageEnemy = enhanced; } catch (e) {}
  }

  /* Temporary AP boost power-up drop */
  function patchDrops() {
    if (typeof dropFromEnemy !== 'function' && typeof window.dropFromEnemy !== 'function') return;
    var orig = window.dropFromEnemy || dropFromEnemy;
    if (orig.__nvxDmgDrop) return;

    function enhanced(x, y, flags) {
      /* 2.5% chance dedicated damage boost orb on top of normal table */
      if (!flags || (!flags.boss && !flags.elite)) {
        if (Math.random() < 0.025) {
          try {
            if (typeof powerups !== 'undefined' && powerups && powerups.get) {
              var d = powerups.get();
              d.x = x;
              d.y = y;
              d.type = 'dmgBoost';
              d.t = Math.random() * Math.PI * 2;
              d._drop = true;
              d.vy = 42 + Math.random() * 30;
              d.r = 13;
              d.alive = true;
              return;
            }
          } catch (e) {}
        }
      }
      return orig.apply(this, arguments);
    }
    enhanced.__nvxDmgDrop = true;
    window.dropFromEnemy = enhanced;
    try { dropFromEnemy = enhanced; } catch (e) {}
  }

  function patchActivate() {
    if (typeof activatePower !== 'function' && typeof window.activatePower !== 'function') return;
    var orig = window.activatePower || activatePower;
    if (orig.__nvxDmgAct) return;

    function enhanced(type) {
      if (type === 'dmgBoost') {
        ensureTemp();
        Game.powers.dmgBoost = Math.max(Game.powers.dmgBoost || 0, 9);
        try {
          if (typeof emit === 'function') emit(player.x, player.y, 20, '#ff6b4a', 220, 3, 0.55);
          if (typeof ringBurst === 'function') ringBurst(player.x, player.y, 8, 70, '#ff6b4a', 0.4, 3);
          if (typeof popText === 'function') popText(player.x, player.y - 38, 'AP BOOST +35%', '#ff6b4a', 15);
          if (typeof Audio_ !== 'undefined' && Audio_.power) Audio_.power();
        } catch (e) {}
        return;
      }
      return orig.call(this, type);
    }
    enhanced.__nvxDmgAct = true;
    window.activatePower = enhanced;
    try { activatePower = enhanced; } catch (e) {}
  }

  function tickTemp(dt) {
    ensureTemp();
    try {
      if (Game.powers.dmgBoost > 0) {
        Game.powers.dmgBoost = Math.max(0, Game.powers.dmgBoost - (dt || 0.1));
      }
    } catch (e) {}
  }

  function injectHud() {
    if (document.getElementById('nvx-dmg-css')) return;
    var s = document.createElement('style');
    s.id = 'nvx-dmg-css';
    s.textContent = [
      '#nvx-dmg-chip{position:absolute;left:50%;transform:translateX(-50%);',
      'bottom:calc(env(safe-area-inset-bottom,0px)+110px);z-index:11;pointer-events:none;',
      'padding:4px 10px;border-radius:8px;font:700 8px IBM Plex Mono,monospace;',
      'letter-spacing:.08em;background:rgba(20,6,6,.88);border:1px solid rgba(255,100,60,.45);',
      'color:#ff9a70;display:none;}'
    ].join('');
    document.head.appendChild(s);
    if (!document.getElementById('nvx-dmg-chip')) {
      var el = document.createElement('div');
      el.id = 'nvx-dmg-chip';
      el.textContent = 'AP BOOST';
      (document.getElementById('scr-game') || document.body).appendChild(el);
    }
  }

  function syncHud() {
    injectHud();
    var el = document.getElementById('nvx-dmg-chip');
    if (!el) return;
    try {
      ensureTemp();
      var on = Game.powers && Game.powers.dmgBoost > 0;
      el.style.display = on ? 'block' : 'none';
      if (on) el.textContent = 'AP BOOST ' + Math.ceil(Game.powers.dmgBoost) + 's';
    } catch (e) {}
  }

  /* Level-up UI: try inject extra buttons if card container exists */
  function injectLevelupButtons() {
    var root = document.getElementById('scr-levelup') || document.querySelector('.levelup, #levelup');
    if (!root) return;
    if (root.dataset.nvxDmgBtns) return;
    /* Don't force UI structure — chooseRunPerk works when cards reference type ids.
       If native renderer iterates RUN_CHOICES keys, injectChoices is enough. */
    root.dataset.nvxDmgBtns = '1';
  }

  function boot() {
    ensureRunUpgrades();
    injectChoices();
    patchChoosePerk();
    patchWeaponStat();
    patchDamageEnemy();
    patchDrops();
    patchActivate();
    injectHud();
    setInterval(function () {
      injectChoices();
      patchChoosePerk();
      patchWeaponStat();
      patchDamageEnemy();
      patchDrops();
      patchActivate();
      tickTemp(0.5);
      syncHud();
      injectLevelupButtons();
    }, 500);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () { setTimeout(boot, 80); });
  } else {
    setTimeout(boot, 80);
  }
  setTimeout(boot, 700);
})();
