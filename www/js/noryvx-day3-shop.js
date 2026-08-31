/* NORYVX Shop v5 — content visible + single-screen scroll */
(function () {
  'use strict';

  var STYLE_ID = 'nvx-shop-v5-css';
  var BADGE_ID = 'nvx-ui-badge';

  function injectCss() {
    if (document.getElementById(STYLE_ID)) return;
    var s = document.createElement('style');
    s.id = STYLE_ID;
    s.textContent = [
      '#scr-shop.screen.on{',
      '  display:block!important;padding:0!important;height:100%!important;',
      '  overflow-y:scroll!important;overflow-x:hidden!important;',
      '  -webkit-overflow-scrolling:touch!important;touch-action:pan-y!important;',
      '  overscroll-behavior-y:contain!important;',
      '}',
      '#shop-panes{display:block!important;position:static!important;height:auto!important;overflow:visible!important;max-height:none!important;}',
      '#shop-panes .s-pane{display:none!important;position:static!important;height:auto!important;overflow:visible!important;max-height:none!important;padding:12px 14px 40px!important;}',
      '#shop-panes .s-pane.on{display:block!important;}',
      '#pg-shop-list{display:block!important;visibility:visible!important;opacity:1!important;min-height:80px!important;}',
      '.shop-card{display:flex!important;visibility:visible!important;opacity:1!important;}'
    ].join('\n');
    document.head.appendChild(s);
  }

  function injectBadge() {
    if (document.getElementById(BADGE_ID)) return;
    var b = document.createElement('div');
    b.id = BADGE_ID;
    b.textContent = 'SHOP v5';
    b.style.cssText = 'position:fixed;top:calc(8px + env(safe-area-inset-top,0px));left:50%;transform:translateX(-50%);z-index:9999;pointer-events:none;font-size:10px;font-weight:800;letter-spacing:.18em;padding:4px 10px;border-radius:999px;color:#041018;background:linear-gradient(90deg,#22e6ff,#a05cff)';
    document.body.appendChild(b);
    setTimeout(function () { try { b.style.opacity = '0'; } catch (e) {} }, 6000);
    setTimeout(function () { try { b.remove(); } catch (e) {} }, 7000);
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
    if (!list || !pane) return;
    if (pane.querySelector('.nvx-shop-hero')) return;
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
    if (cta && !off) {
      cta.addEventListener('click', function () {
        try { free.click(); } catch (e) {}
      });
    }
    /* keep original card visible as well — do NOT hide list content */
    pane.insertBefore(hero, pane.firstChild.nextSibling || list);
  }

  function openShop() {
    try {
      document.querySelectorAll('.screen').forEach(function (s) { s.classList.remove('on'); });
      var sc = document.getElementById('scr-shop');
      if (!sc) return;
      sc.classList.add('on');

      if (typeof window.renderShop === 'function') window.renderShop();
      else if (window.PROG && window.PROG.renderShop) window.PROG.renderShop();

      /* ensure market tab visible */
      var panes = document.querySelectorAll('#shop-panes .s-pane');
      var tabs = document.querySelectorAll('#shop-tabs .s-tab');
      if (panes.length) {
        panes.forEach(function (p) { p.classList.remove('on'); });
        var ingame = document.getElementById('spane-ingame');
        if (ingame) ingame.classList.add('on');
        else panes[0].classList.add('on');
      }
      if (tabs.length) {
        tabs.forEach(function (t) { t.classList.remove('on'); });
        var first = document.querySelector('#shop-tabs .s-tab[data-stab="ingame"]') || tabs[0];
        if (first) first.classList.add('on');
      }

      renderInventoryPanel();
      enhanceFreeCard();
      attachManualScroll(sc);

      /* debug: if list empty, show fallback text */
      var list = document.getElementById('pg-shop-list');
      if (list && !list.innerHTML.trim()) {
        list.innerHTML = '<div class="shop-section-lbl">MARKET</div><div class="shop-card"><div class="shop-card-info"><div class="shop-card-name">Yükleniyor…</div><div class="shop-card-desc">renderShop boş döndü</div></div></div>';
      }
    } catch (e) {
      console.warn('[shop-v5]', e);
    }
  }

  function wire() {
    var btn = document.getElementById('b-hub-store');
    if (btn && !btn._shopV5) {
      btn._shopV5 = true;
      btn.addEventListener('click', function (e) {
        e.preventDefault();
        e.stopPropagation();
        openShop();
      }, true);
    }
    var bShop = document.getElementById('b-shop');
    if (bShop && !bShop._shopV5) {
      bShop._shopV5 = true;
      bShop.addEventListener('click', function () { setTimeout(openShop, 0); }, true);
    }
  }

  function boot() {
    injectCss();
    injectBadge();
    wire();
    window.NVXDay3 = { openShop: openShop };
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () { setTimeout(boot, 30); });
  } else {
    setTimeout(boot, 30);
  }
  setTimeout(boot, 500);
  setTimeout(boot, 1500);
})();
