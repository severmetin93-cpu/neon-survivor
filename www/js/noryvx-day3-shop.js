/* NORYVX Shop v5.2 — reliable cosmetics open */
(function () {
  'use strict';

  var STYLE_ID = 'nvx-shop-v52-css';

  function injectCss() {
    var old = document.getElementById('nvx-shop-v5-css');
    if (old) old.remove();
    if (document.getElementById(STYLE_ID)) return;
    var s = document.createElement('style');
    s.id = STYLE_ID;
    s.textContent = [
      '#scr-shop.screen.on{display:block!important;padding:0!important;height:100%!important;overflow-y:scroll!important;-webkit-overflow-scrolling:touch!important;touch-action:pan-y!important;}',
      '#shop-panes{display:block!important;position:static!important;height:auto!important;overflow:visible!important;}',
      '#shop-panes .s-pane{display:none!important;position:static!important;height:auto!important;overflow:visible!important;padding:12px 14px 40px!important;}',
      '#shop-panes .s-pane.on{display:block!important;}',
      '#pg-shop-list{display:block!important;visibility:visible!important;opacity:1!important;}',
      '.shop-card{display:flex!important;visibility:visible!important;opacity:1!important;}',
      '#scr-cosm.screen.on{',
      '  display:flex!important;flex-direction:column!important;align-items:stretch!important;justify-content:flex-start!important;',
      '  padding:calc(env(safe-area-inset-top,0px) + 16px) 16px calc(env(safe-area-inset-bottom,0px) + 28px)!important;',
      '  height:100%!important;max-height:100dvh!important;',
      '  overflow-y:scroll!important;-webkit-overflow-scrolling:touch!important;touch-action:pan-y!important;',
      '  background:radial-gradient(100% 50% at 50% 0%,rgba(160,92,255,.14),transparent 55%),#020812!important;',
      '  opacity:1!important;visibility:visible!important;pointer-events:auto!important;z-index:50!important;',
      '}',
      '#scr-cosm .tutorial-title{font-size:18px!important;letter-spacing:.18em!important;color:#e8f4ff!important;text-align:center!important;margin:0 0 8px!important;}',
      '#scr-cosm .tag,#cosm-cur{color:#a8d4ff!important;text-align:center!important;margin-bottom:12px!important;}',
      '#scr-cosm .cosm-tabs{display:flex!important;gap:8px!important;width:100%!important;max-width:430px!important;margin:0 auto 12px!important;}',
      '#scr-cosm .cosm-tab{flex:1!important;min-height:44px!important;border-radius:12px!important;border:1px solid rgba(34,230,255,.2)!important;background:rgba(10,18,40,.95)!important;color:rgba(180,210,255,.55)!important;font-weight:800!important;}',
      '#scr-cosm .cosm-tab.on{border-color:rgba(160,92,255,.55)!important;color:#f0e8ff!important;background:rgba(160,92,255,.15)!important;}',
      '#scr-cosm .cosm-wrap{width:100%!important;max-width:430px!important;margin:0 auto!important;max-height:none!important;overflow:visible!important;display:flex!important;flex-direction:column!important;gap:10px!important;}',
      '#scr-cosm .cosm-card{display:grid!important;grid-template-columns:54px 1fr auto!important;align-items:center!important;gap:10px!important;padding:12px 14px!important;border-radius:14px!important;border:1px solid rgba(34,230,255,.22)!important;background:rgba(10,18,40,.96)!important;color:#eaf4ff!important;text-align:left!important;}',
      '#scr-cosm #b-cosm-back{margin:16px auto 0!important;min-height:44px!important;display:block!important;}'
    ].join('\n');
    document.head.appendChild(s);
  }

  function hideAllScreens() {
    document.querySelectorAll('.screen').forEach(function (s) {
      s.classList.remove('on');
      s.style.opacity = '';
      s.style.visibility = '';
      s.style.pointerEvents = '';
    });
  }

  function showScreen(id) {
    hideAllScreens();
    var el = document.getElementById(id);
    if (!el) return null;
    el.classList.add('on');
    el.style.opacity = '1';
    el.style.visibility = 'visible';
    el.style.pointerEvents = 'auto';
    el.style.zIndex = '50';
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

  function fallbackCosmContent() {
    var neon = document.getElementById('cosm-neon-body');
    if (!neon) return;
    if (neon.innerHTML && neon.innerHTML.trim().length > 30) return;
    neon.style.display = 'flex';
    neon.innerHTML =
      '<div class="cosm-card" style="--co:#22e6ff">' +
      '<span class="cosm-orb"></span>' +
      '<span class="cosm-txt"><b>DEFAULT</b><i>Standart neon</i></span>' +
      '<span class="cosm-p">KUŞANILI</span></div>' +
      '<div class="cosm-note">Skinler yükleniyor… Geri dönüp tekrar açmayı dene.</div>';
  }

  function openCosm() {
    try {
      var cs = showScreen('scr-cosm');
      if (!cs) return;

      try {
        if (typeof window.renderCosm === 'function') window.renderCosm();
      } catch (err) {}

      /* force neon body visible */
      var neon = document.getElementById('cosm-neon-body');
      var prem = document.getElementById('cosm-premium-body');
      if (neon) {
        neon.style.display = 'flex';
        neon.style.visibility = 'visible';
        neon.style.opacity = '1';
      }
      if (prem) prem.style.display = 'none';

      fallbackCosmContent();
      attachManualScroll(cs);

      var back = document.getElementById('b-cosm-back');
      if (back) {
        back.onclick = function (e) {
          if (e) e.preventDefault();
          openShop();
        };
      }
    } catch (e) {}
  }

  function rebindCosmButtons() {
    document.querySelectorAll('.shop-cosm-btn').forEach(function (btn) {
      try { btn.removeAttribute('onclick'); } catch (e) {}
      btn.onclick = function (e) {
        if (e) {
          e.preventDefault();
          e.stopPropagation();
        }
        openCosm();
        return false;
      };
    });
  }

  function openShop() {
    try {
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
      var tabs = document.querySelectorAll('#shop-tabs .s-tab');
      if (tabs.length) {
        tabs.forEach(function (t) { t.classList.remove('on'); });
        var first = document.querySelector('#shop-tabs .s-tab[data-stab="ingame"]') || tabs[0];
        if (first) first.classList.add('on');
      }

      renderInventoryPanel();
      enhanceFreeCard();
      rebindCosmButtons();
      attachManualScroll(sc);

      /* Premium tab: also rebind when user switches tabs */
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
    while (t && hops < 8) {
      if (t.classList && t.classList.contains('shop-cosm-btn')) return t;
      if (t.id === 'scr-shop' || t === document.body) break;
      t = t.parentElement;
      hops++;
    }
    return null;
  }

  function onCosmIntent(e) {
    var btn = findCosmBtn(e.target);
    if (!btn) return;
    try {
      e.preventDefault();
      e.stopPropagation();
    } catch (err) {}
    openCosm();
  }

  function wire() {
    var hub = document.getElementById('b-hub-store');
    if (hub && !hub._shopV52) {
      hub._shopV52 = true;
      hub.addEventListener('click', function (e) {
        e.preventDefault();
        e.stopPropagation();
        openShop();
      }, true);
    }

    if (!document._nvxCosmV52) {
      document._nvxCosmV52 = true;
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
