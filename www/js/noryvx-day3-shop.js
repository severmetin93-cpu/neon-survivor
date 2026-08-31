/* NORYVX Pro Shop — design + WebView-safe manual scroll */
(function () {
  'use strict';

  var STYLE_ID = 'nvx-day3-force-css';
  var SHOP_STYLE_ID = 'nvx-shop-force-css';
  var BADGE_ID = 'nvx-ui-badge';

  function injectMenuCss() {
    if (document.getElementById(STYLE_ID)) return;
    var s = document.createElement('style');
    s.id = STYLE_ID;
    s.textContent = [
      '#scr-menu{background:radial-gradient(100% 60% at 50% -10%,rgba(255,80,200,.18),transparent 50%),radial-gradient(80% 50% at 100% 100%,rgba(34,230,255,.14),transparent 45%),#01040e!important}',
      '.nvx2-logo-main{background:linear-gradient(90deg,#ff4fd8,#22e6ff,#a05cff)!important;-webkit-background-clip:text!important;background-clip:text!important;-webkit-text-fill-color:transparent!important}',
      '.nvx2-play,button.nvx2-play,#b-play{background:linear-gradient(135deg,#ff2d9b 0%,#7b2fff 50%,#00d4ff 100%)!important;border:2px solid #fff!important;border-radius:16px!important;box-shadow:0 0 40px rgba(255,45,155,.55)!important;color:#fff!important}',
      '.nvx2-card,#nvx2-cards .nvx2-card{background:linear-gradient(160deg,rgba(255,79,216,.12),rgba(8,14,30,.95) 40%)!important;border:1.5px solid rgba(255,79,216,.45)!important;border-radius:14px!important;min-height:60px!important;color:#ffe6f8!important}',
      '#nvx-ui-badge{position:fixed;top:calc(8px + env(safe-area-inset-top,0px));left:50%;transform:translateX(-50%);z-index:9999;pointer-events:none;font-size:10px;font-weight:800;letter-spacing:.2em;padding:4px 10px;border-radius:999px;color:#041018;background:linear-gradient(90deg,#ff4fd8,#22e6ff)}'
    ].join('\n');
    document.head.appendChild(s);
  }

  function injectShopCss() {
    if (document.getElementById(SHOP_STYLE_ID)) return;
    var s = document.createElement('style');
    s.id = SHOP_STYLE_ID;
    s.textContent = [
      '#scr-shop.screen.on{display:flex!important;flex-direction:column!important;padding:0!important;overflow:hidden!important;height:100%!important;max-height:100dvh!important}',
      '#shop-panes{flex:1 1 auto!important;min-height:0!important;position:relative!important;overflow:hidden!important;display:block!important}',
      '#shop-panes .s-pane{display:none!important;position:absolute!important;inset:0!important;overflow-y:scroll!important;-webkit-overflow-scrolling:touch!important;touch-action:pan-y!important;overscroll-behavior-y:contain!important;padding:12px 14px 40px!important;box-sizing:border-box!important}',
      '#shop-panes .s-pane.on{display:block!important}',
      '#shop-hdr,#shop-tabs{flex:0 0 auto!important}'
    ].join('\n');
    document.head.appendChild(s);
  }

  function injectBadge() {
    if (document.getElementById(BADGE_ID)) return;
    var b = document.createElement('div');
    b.id = BADGE_ID;
    b.textContent = 'PRO SHOP v4';
    document.body.appendChild(b);
    setTimeout(function () { try { b.style.opacity = '0'; b.style.transition = 'opacity .6s'; } catch (e) {} }, 7000);
    setTimeout(function () { try { b.remove(); } catch (e) {} }, 8000);
  }

  /** Manual touch scroll — works when CSS overflow fails in game WebViews */
  function attachManualScroll(el) {
    if (!el || el._nvxScroll) return;
    el._nvxScroll = true;
    var startY = 0;
    var startTop = 0;
    var moving = false;

    el.addEventListener('touchstart', function (e) {
      if (!e.touches || !e.touches[0]) return;
      startY = e.touches[0].clientY;
      startTop = el.scrollTop;
      moving = true;
    }, { passive: true, capture: true });

    el.addEventListener('touchmove', function (e) {
      if (!moving || !e.touches || !e.touches[0]) return;
      var dy = startY - e.touches[0].clientY;
      el.scrollTop = startTop + dy;
    }, { passive: true, capture: true });

    el.addEventListener('touchend', function () { moving = false; }, { passive: true, capture: true });
    el.addEventListener('touchcancel', function () { moving = false; }, { passive: true, capture: true });
  }

  function layoutShopHeights() {
    var shop = document.getElementById('scr-shop');
    var panes = document.getElementById('shop-panes');
    var hdr = document.getElementById('shop-hdr');
    var tabs = document.getElementById('shop-tabs');
    if (!shop || !panes) return;

    var vh = window.innerHeight || document.documentElement.clientHeight;
    var used = 0;
    if (hdr) used += hdr.getBoundingClientRect().height;
    if (tabs) used += tabs.getBoundingClientRect().height;
    var h = Math.max(180, vh - used);
    panes.style.height = h + 'px';
    panes.style.maxHeight = h + 'px';
    panes.style.flex = '0 0 ' + h + 'px';

    document.querySelectorAll('#shop-panes .s-pane').forEach(function (p) {
      p.style.height = h + 'px';
      p.style.maxHeight = h + 'px';
      p.style.overflowY = 'scroll';
      p.style.webkitOverflowScrolling = 'touch';
      p.style.touchAction = 'pan-y';
      attachManualScroll(p);
    });
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
      '<h3>BAKİYE</h3>' +
      '<div class="inv-grid">' +
      '<div class="inv-chip"><span>Kredi</span><b>◎ ' + cur.credits + '</b></div>' +
      '<div class="inv-chip"><span>Shard</span><b>◆ ' + cur.shards + '</b></div>' +
      '<div class="inv-chip"><span>Neon</span><b>✦ ' + cur.neon + '</b></div>' +
      '<div class="inv-chip"><span>Gem</span><b>💎 ' + cur.gems + '</b></div>' +
      '</div>';
  }

  function enhanceFreeCard() {
    var pane = document.getElementById('spane-ingame');
    if (!pane) return;
    var free = pane.querySelector('.shop-card.free-card, .shop-card[data-free]');
    if (!free || pane.querySelector('.nvx-shop-hero')) return;

    var name = (free.querySelector('.shop-card-name') || {}).textContent || 'GÜNLÜK ÜCRETSİZ';
    var desc = (free.querySelector('.shop-card-desc') || {}).textContent || '+650 kredi · +5 shard';
    var off = free.classList.contains('off');
    var hero = document.createElement('div');
    hero.className = 'nvx-shop-hero';
    hero.innerHTML =
      '<div class="nvx-shop-hero-title">🎁 ' + name + '</div>' +
      '<div class="nvx-shop-hero-desc">' + desc + '</div>' +
      '<button type="button" class="nvx-shop-hero-cta' + (off ? ' off' : '') + '">' +
      (off ? 'BEKLEMEDE' : 'HEMEN AL') + '</button>';

    var cta = hero.querySelector('.nvx-shop-hero-cta');
    if (cta && !off) {
      cta.addEventListener('click', function () {
        try { free.click(); } catch (e) {}
        setTimeout(function () { openShop(true); }, 80);
      });
    }
    free.style.display = 'none';
    pane.insertBefore(hero, pane.firstChild);
  }

  function openShop(keep) {
    try {
      if (!keep) {
        document.querySelectorAll('.screen').forEach(function (s) { s.classList.remove('on'); });
      }
      var sc = document.getElementById('scr-shop');
      if (sc) sc.classList.add('on');

      if (typeof window.renderShop === 'function') window.renderShop();
      else if (window.PROG && window.PROG.renderShop) window.PROG.renderShop();

      renderInventoryPanel();
      enhanceFreeCard();
      layoutShopHeights();
      setTimeout(layoutShopHeights, 40);
      setTimeout(layoutShopHeights, 200);
      setTimeout(function () {
        enhanceFreeCard();
        layoutShopHeights();
      }, 350);
    } catch (e) {
      console.warn('[pro-shop]', e);
    }
  }

  function wire() {
    var btn = document.getElementById('b-hub-store');
    if (btn && !btn._proShop) {
      btn._proShop = true;
      btn.addEventListener('click', function (e) {
        e.preventDefault();
        e.stopPropagation();
        openShop(false);
      }, true);
    }
    var tabs = document.getElementById('shop-tabs');
    if (tabs && !tabs._proShop) {
      tabs._proShop = true;
      tabs.addEventListener('click', function () {
        setTimeout(layoutShopHeights, 30);
      }, true);
    }
    window.addEventListener('resize', function () {
      if (document.getElementById('scr-shop') && document.getElementById('scr-shop').classList.contains('on')) {
        layoutShopHeights();
      }
    });
  }

  function boot() {
    injectMenuCss();
    injectShopCss();
    injectBadge();
    wire();
    window.NVXDay3 = { openShop: openShop, layoutShopHeights: layoutShopHeights };
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () { setTimeout(boot, 30); });
  } else {
    setTimeout(boot, 30);
  }
  setTimeout(boot, 500);
  setTimeout(boot, 1500);
})();
