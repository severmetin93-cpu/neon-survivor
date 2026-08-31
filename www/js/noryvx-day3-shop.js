/* NORYVX Shop v5.3 — cosmetics as fixed opaque overlay (no blank city) */
(function () {
  'use strict';

  var STYLE_ID = 'nvx-shop-v53-css';
  var OVERLAY_ID = 'nvx-cosm-overlay';

  function injectCss() {
    ['nvx-shop-v5-css', 'nvx-shop-v52-css'].forEach(function (id) {
      var n = document.getElementById(id);
      if (n) n.remove();
    });
    if (document.getElementById(STYLE_ID)) return;
    var s = document.createElement('style');
    s.id = STYLE_ID;
    s.textContent = [
      '#scr-shop.screen.on{display:block!important;padding:0!important;height:100%!important;overflow-y:scroll!important;-webkit-overflow-scrolling:touch!important;touch-action:pan-y!important;}',
      '#shop-panes{display:block!important;position:static!important;height:auto!important;overflow:visible!important;}',
      '#shop-panes .s-pane{display:none!important;position:static!important;height:auto!important;overflow:visible!important;padding:12px 14px 40px!important;}',
      '#shop-panes .s-pane.on{display:block!important;}',
      '#pg-shop-list{display:block!important;}',
      '.shop-card{display:flex!important;}',
      '#' + OVERLAY_ID + '{',
      '  position:fixed!important;inset:0!important;z-index:99999!important;',
      '  background:#020812!important;',
      '  overflow-y:auto!important;-webkit-overflow-scrolling:touch!important;touch-action:pan-y!important;',
      '  padding:calc(env(safe-area-inset-top,0px) + 12px) 16px calc(env(safe-area-inset-bottom,0px) + 24px)!important;',
      '  box-sizing:border-box!important;color:#eaf4ff!important;',
      '  font-family:system-ui,-apple-system,sans-serif!important;',
      '}',
      '#' + OVERLAY_ID + ' .nvx-c-head{display:flex;align-items:center;gap:12px;margin-bottom:14px;}',
      '#' + OVERLAY_ID + ' .nvx-c-back{width:42px;height:42px;border-radius:12px;border:1px solid rgba(34,230,255,.3);background:rgba(34,230,255,.1);color:#22e6ff;font-size:22px;}',
      '#' + OVERLAY_ID + ' .nvx-c-title{font-size:18px;font-weight:800;letter-spacing:.2em;color:#c4f0ff;}',
      '#' + OVERLAY_ID + ' .nvx-c-sub{font-size:11px;color:rgba(168,210,255,.7);margin-top:2px;}',
      '#' + OVERLAY_ID + ' .nvx-c-tabs{display:flex;gap:8px;margin-bottom:14px;}',
      '#' + OVERLAY_ID + ' .nvx-c-tab{flex:1;min-height:44px;border-radius:12px;border:1px solid rgba(34,230,255,.2);background:rgba(10,18,40,.95);color:rgba(180,210,255,.55);font-weight:800;font-size:11px;letter-spacing:.12em;}',
      '#' + OVERLAY_ID + ' .nvx-c-tab.on{border-color:rgba(160,92,255,.55);color:#f0e8ff;background:rgba(160,92,255,.15);}',
      '#' + OVERLAY_ID + ' .nvx-c-card{display:flex;align-items:center;gap:12px;padding:14px;margin-bottom:10px;border-radius:14px;border:1px solid rgba(34,230,255,.22);background:rgba(10,18,40,.96);}',
      '#' + OVERLAY_ID + ' .nvx-c-orb{width:44px;height:44px;border-radius:50%;flex-shrink:0;box-shadow:0 0 16px currentColor;}',
      '#' + OVERLAY_ID + ' .nvx-c-name{font-size:13px;font-weight:800;letter-spacing:.08em;}',
      '#' + OVERLAY_ID + ' .nvx-c-desc{font-size:11px;color:rgba(180,210,255,.55);margin-top:2px;}',
      '#' + OVERLAY_ID + ' .nvx-c-price{margin-left:auto;font-size:12px;font-weight:900;color:#ffd24d;}'
    ].join('\n');
    document.head.appendChild(s);
  }

  function hideAllScreens() {
    document.querySelectorAll('.screen').forEach(function (s) {
      s.classList.remove('on');
    });
  }

  function showScreen(id) {
    hideAllScreens();
    var el = document.getElementById(id);
    if (!el) return null;
    el.classList.add('on');
    return el;
  }

  function attachManualScroll(el) {
    if (!el || el._nvxScroll) return;
    el._nvxScroll = true;
    var startY = 0, startTop = 0, moving = false;
    el.addEventListener('touchstart', function (e) {
      if (!e.touches || !e.touches[0]) return;
      startY = e.touches[0].clientY;
      startTop = el.scrollTop;
      moving = true;
    }, { passive: true, capture: true });
    el.addEventListener('touchmove', function (e) {
      if (!moving || !e.touches || !e.touches[0]) return;
      el.scrollTop = startTop + (startY - e.touches[0].clientY);
    }, { passive: true, capture: true });
    el.addEventListener('touchend', function () { moving = false; }, { passive: true });
  }

  function currencyBits() {
    var c = { credits: 0, shards: 0, neon: 0, gems: 0 };
    try { if (window.RPG && RPG.state) { c.credits = RPG.state.credits || 0; c.shards = RPG.state.shards || 0; } } catch (e) {}
    try { if (window.P) c.neon = P.neon || 0; } catch (e) {}
    try { if (window.Save && Save.data && Save.data.iap) c.gems = Save.data.iap.gems || 0; } catch (e) {}
    return c;
  }

  function renderInventoryPanel() {
    var pane = document.getElementById('spane-ingame');
    if (!pane) return;
    var panel = document.getElementById('nvx-inv-panel');
    if (!panel) {
      panel = document.createElement('div');
      panel.id = 'nvx-inv-panel';
      pane.insertBefore(panel, pane.firstChild);
    }
    var cur = currencyBits();
    panel.innerHTML =
      '<h3>BAKİYE</h3><div class="inv-grid">' +
      '<div class="inv-chip"><span>Kredi</span><b>◎ ' + cur.credits + '</b></div>' +
      '<div class="inv-chip"><span>Shard</span><b>◆ ' + cur.shards + '</b></div>' +
      '<div class="inv-chip"><span>Neon</span><b>✦ ' + cur.neon + '</b></div>' +
      '<div class="inv-chip"><span>Gem</span><b>💎 ' + cur.gems + '</b></div></div>';
  }

  function enhanceFreeCard() {
    var list = document.getElementById('pg-shop-list');
    var pane = document.getElementById('spane-ingame');
    if (!list || !pane || pane.querySelector('.nvx-shop-hero')) return;
    var free = list.querySelector('.shop-card.free-card, .shop-card[data-free]');
    if (!free) return;
    var name = (free.querySelector('.shop-card-name') || {}).textContent || 'GÜNLÜK ÜCRETSİZ';
    var desc = (free.querySelector('.shop-card-desc') || {}).textContent || '+650 kredi · +5 shard';
    var off = free.classList.contains('off');
    var hero = document.createElement('div');
    hero.className = 'nvx-shop-hero';
    hero.innerHTML =
      '<div class="nvx-shop-hero-title">🎁 ' + name + '</div>' +
      '<div class="nvx-shop-hero-desc">' + desc + '</div>' +
      '<button type="button" class="nvx-shop-hero-cta">' + (off ? 'BEKLEMEDE' : 'HEMEN AL') + '</button>';
    var cta = hero.querySelector('.nvx-shop-hero-cta');
    if (cta && !off) cta.addEventListener('click', function () { try { free.click(); } catch (e) {} });
    pane.insertBefore(hero, pane.firstChild.nextSibling || list);
  }

  function skinList() {
    var list = [];
    try {
      if (window.NEONCOSM && NEONCOSM.PREMIUM && NEONCOSM.PREMIUM.length) {
        return NEONCOSM.PREMIUM.slice();
      }
    } catch (e) {}
    /* hardcoded fallback matching game data */
    return [
      { id: 'px_glacier', name: 'BUZUL', neon: 180, outer: '#8fe9ff', desc: 'Kutup buzu enerji çekirdeği.' },
      { id: 'px_ember', name: 'KOR', neon: 220, outer: '#ff8a4c', desc: 'Köz kırmızısı aura.' },
      { id: 'px_violet', name: 'MORF', neon: 260, outer: '#c084fc', desc: 'Mor frekans alanı.' },
      { id: 'px_toxic', name: 'TOKSİK', neon: 300, outer: '#4ade80', desc: 'Zehirli neon parıltı.' },
      { id: 'px_gold', name: 'ALTIN', neon: 400, outer: '#fbbf24', desc: 'Efsanevi altın kaplama.' }
    ];
  }

  function ownsSkin(id) {
    try {
      if (window.NEONCOSM && typeof NEONCOSM.owns === 'function') return !!NEONCOSM.owns(id);
    } catch (e) {}
    try {
      var o = (window.Save && Save.data && Save.data.ownedSkins) || {};
      return !!o[id];
    } catch (e2) {}
    return false;
  }

  function selectedSkin() {
    try { return (Save.data && Save.data.selectedSkin) || ''; } catch (e) { return ''; }
  }

  function closeOverlay() {
    var ov = document.getElementById(OVERLAY_ID);
    if (ov) ov.remove();
  }

  function openCosm() {
    try {
      closeOverlay();
      /* keep shop under but cover everything with opaque overlay */
      var cur = currencyBits();
      var skins = skinList();
      var sel = selectedSkin();

      var ov = document.createElement('div');
      ov.id = OVERLAY_ID;

      var html = '';
      html += '<div class="nvx-c-head">';
      html += '<button type="button" class="nvx-c-back" id="nvx-c-back">‹</button>';
      html += '<div><div class="nvx-c-title">KOZMETİK</div>';
      html += '<div class="nvx-c-sub">◎ ' + cur.credits + ' · ◆ ' + cur.shards + ' · ✦ ' + cur.neon + '</div></div>';
      html += '</div>';
      html += '<div class="nvx-c-tabs">';
      html += '<button type="button" class="nvx-c-tab on" data-tab="neon">NEON</button>';
      html += '<button type="button" class="nvx-c-tab" data-tab="prem">PREMIUM</button>';
      html += '</div>';
      html += '<div id="nvx-c-list"></div>';

      ov.innerHTML = html;
      document.body.appendChild(ov);
      attachManualScroll(ov);

      function paint(tab) {
        var list = ov.querySelector('#nvx-c-list');
        if (!list) return;
        if (tab === 'prem') {
          list.innerHTML =
            '<div class="nvx-c-card"><div><div class="nvx-c-name">PREMIUM SKINLER</div>' +
            '<div class="nvx-c-desc">IAP paketleri yakında. Şimdilik NEON sekmesinden skin alabilirsin.</div></div></div>';
          return;
        }
        var out = '';
        skins.forEach(function (p) {
          var own = ownsSkin(p.id);
          var on = sel === p.id;
          var price = on ? 'KUŞANILI' : own ? 'KUŞAN' : ('✦' + (p.neon || 0));
          out += '<button type="button" class="nvx-c-card" data-skin="' + p.id + '">';
          out += '<div class="nvx-c-orb" style="background:' + (p.outer || '#22e6ff') + ';color:' + (p.outer || '#22e6ff') + '"></div>';
          out += '<div style="flex:1;min-width:0;text-align:left">';
          out += '<div class="nvx-c-name" style="color:' + (p.outer || '#eaf4ff') + '">' + (p.name || p.id) + '</div>';
          out += '<div class="nvx-c-desc">' + (p.desc || '') + '</div></div>';
          out += '<div class="nvx-c-price">' + price + '</div></button>';
        });
        if (!out) out = '<div class="nvx-c-card"><div class="nvx-c-name">Skin yok</div></div>';
        list.innerHTML = out;

        list.querySelectorAll('[data-skin]').forEach(function (btn) {
          btn.addEventListener('click', function () {
            var id = btn.getAttribute('data-skin');
            try {
              if (window.NEONCOSM) {
                if (ownsSkin(id) && NEONCOSM.selectSkin) NEONCOSM.selectSkin(id);
                else if (NEONCOSM.buySkin) NEONCOSM.buySkin(id);
              }
            } catch (e) {}
            sel = selectedSkin();
            paint('neon');
          });
        });
      }

      paint('neon');

      ov.querySelector('#nvx-c-back').addEventListener('click', function () {
        closeOverlay();
        openShop();
      });

      ov.querySelectorAll('.nvx-c-tab').forEach(function (t) {
        t.addEventListener('click', function () {
          ov.querySelectorAll('.nvx-c-tab').forEach(function (x) { x.classList.remove('on'); });
          t.classList.add('on');
          paint(t.getAttribute('data-tab') === 'prem' ? 'prem' : 'neon');
        });
      });
    } catch (e) {
      console.warn('[cosm overlay]', e);
    }
  }

  function rebindCosmButtons() {
    document.querySelectorAll('.shop-cosm-btn').forEach(function (btn) {
      try { btn.removeAttribute('onclick'); } catch (e) {}
      btn.onclick = function (e) {
        if (e) { e.preventDefault(); e.stopPropagation(); }
        openCosm();
        return false;
      };
    });
  }

  function openShop() {
    try {
      closeOverlay();
      var sc = showScreen('scr-shop');
      if (!sc) return;

      if (typeof window.renderShop === 'function') window.renderShop();
      else if (window.PROG && window.PROG.renderShop) window.PROG.renderShop();

      var panes = document.querySelectorAll('#shop-panes .s-pane');
      if (panes.length) {
        panes.forEach(function (p) { p.classList.remove('on'); });
        var ingame = document.getElementById('spane-ingame');
        if (ingame) ingame.classList.add('on');
        else panes[0].classList.add('on');
      }

      renderInventoryPanel();
      enhanceFreeCard();
      rebindCosmButtons();
      attachManualScroll(sc);

      var tabBar = document.getElementById('shop-tabs');
      if (tabBar && !tabBar._nvxRebind) {
        tabBar._nvxRebind = true;
        tabBar.addEventListener('click', function () {
          setTimeout(rebindCosmButtons, 50);
        }, true);
      }
    } catch (e) {}
  }

  function findCosmBtn(node) {
    var t = node;
    if (!t) return null;
    if (t.nodeType === 3) t = t.parentElement;
    var hops = 0;
    while (t && hops < 10) {
      if (t.classList && t.classList.contains('shop-cosm-btn')) return t;
      if (t === document.body) break;
      t = t.parentElement;
      hops++;
    }
    return null;
  }

  function onCosmIntent(e) {
    var btn = findCosmBtn(e.target);
    if (!btn) return;
    try { e.preventDefault(); e.stopPropagation(); } catch (err) {}
    openCosm();
  }

  function wire() {
    var hub = document.getElementById('b-hub-store');
    if (hub && !hub._shopV53) {
      hub._shopV53 = true;
      hub.addEventListener('click', function (e) {
        e.preventDefault();
        e.stopPropagation();
        openShop();
      }, true);
    }
    if (!document._nvxCosmV53) {
      document._nvxCosmV53 = true;
      document.addEventListener('click', onCosmIntent, true);
      document.addEventListener('touchend', onCosmIntent, true);
    }
  }

  function boot() {
    try {
      injectCss();
      wire();
      window.NVXDay3 = { openShop: openShop, openCosm: openCosm };
      window.openCosm = openCosm;
      window.openShop = openShop;
    } catch (e) {}
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () { setTimeout(boot, 30); });
  } else {
    setTimeout(boot, 30);
  }
  setTimeout(boot, 400);
  setTimeout(boot, 1200);
})();
