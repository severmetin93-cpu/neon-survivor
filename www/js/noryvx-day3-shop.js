/* NORYVX Shop v5.1 — shop + cosmetics open fix */
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
      '}',
      '#shop-panes{display:block!important;position:static!important;height:auto!important;overflow:visible!important;}',
      '#shop-panes .s-pane{display:none!important;position:static!important;height:auto!important;overflow:visible!important;padding:12px 14px 40px!important;}',
      '#shop-panes .s-pane.on{display:block!important;}',
      '#pg-shop-list,.shop-card{display:flex!important;visibility:visible!important;opacity:1!important;}',
      '#pg-shop-list{display:block!important;}',
      /* Cosmetics screen — same single-scroll pattern */',
      '#scr-cosm.screen.on{',
      '  display:flex!important;flex-direction:column!important;align-items:stretch!important;',
      '  justify-content:flex-start!important;',
      '  padding:calc(env(safe-area-inset-top,0px) + 16px) 16px calc(env(safe-area-inset-bottom,0px) + 28px)!important;',
      '  height:100%!important;max-height:100dvh!important;',
      '  overflow-y:scroll!important;overflow-x:hidden!important;',
      '  -webkit-overflow-scrolling:touch!important;touch-action:pan-y!important;',
      '  background:radial-gradient(100% 50% at 50% 0%,rgba(160,92,255,.12),transparent 55%),#020812!important;',
      '  z-index:40!important;',
      '}',
      '#scr-cosm .tutorial-title{',
      '  font-size:18px!important;letter-spacing:.2em!important;color:#e8f4ff!important;',
      '  text-shadow:0 0 16px rgba(160,92,255,.45)!important;margin:0 0 8px!important;text-align:center!important;',
      '}',
      '#scr-cosm .tag,#cosm-cur{',
      '  color:#a8d4ff!important;font-size:12px!important;margin-bottom:12px!important;text-align:center!important;',
      '}',
      '#scr-cosm .cosm-tabs{',
      '  display:flex!important;gap:8px!important;width:100%!important;max-width:430px!important;margin:0 auto 12px!important;',
      '}',
      '#scr-cosm .cosm-tab{',
      '  flex:1!important;min-height:44px!important;border-radius:12px!important;',
      '  border:1px solid rgba(34,230,255,.2)!important;background:rgba(10,18,40,.95)!important;',
      '  color:rgba(180,210,255,.55)!important;font-weight:800!important;',
      '}',
      '#scr-cosm .cosm-tab.on{',
      '  border-color:rgba(160,92,255,.55)!important;color:#f0e8ff!important;',
      '  background:rgba(160,92,255,.15)!important;',
      '}',
      '#scr-cosm .cosm-wrap{',
      '  width:100%!important;max-width:430px!important;margin:0 auto!important;',
      '  max-height:none!important;overflow:visible!important;',
      '  display:flex!important;flex-direction:column!important;gap:10px!important;',
      '}',
      '#scr-cosm .cosm-card{',
      '  display:grid!important;grid-template-columns:54px 1fr auto!important;',
      '  align-items:center!important;gap:10px!important;width:100%!important;',
      '  padding:12px 14px!important;border-radius:14px!important;',
      '  border:1px solid rgba(34,230,255,.22)!important;',
      '  background:linear-gradient(160deg,rgba(14,24,52,.98),rgba(6,12,28,.96))!important;',
      '  color:#eaf4ff!important;text-align:left!important;',
      '}',
      '#scr-cosm #b-cosm-back{',
      '  margin:16px auto 0!important;min-height:44px!important;min-width:120px!important;',
      '  display:block!important;',
      '}'
    ].join('\n');
    document.head.appendChild(s);
  }

  function injectBadge(text) {
    var old = document.getElementById(BADGE_ID);
    if (old) old.remove();
    var b = document.createElement('div');
    b.id = BADGE_ID;
    b.textContent = text || 'SHOP v5';
    b.style.cssText = 'position:fixed;top:calc(8px + env(safe-area-inset-top,0px));left:50%;transform:translateX(-50%);z-index:9999;pointer-events:none;font-size:10px;font-weight:800;letter-spacing:.18em;padding:4px 10px;border-radius:999px;color:#041018;background:linear-gradient(90deg,#22e6ff,#a05cff)';
    document.body.appendChild(b);
    setTimeout(function () { try { b.style.opacity = '0'; } catch (e) {} }, 5000);
    setTimeout(function () { try { b.remove(); } catch (e) {} }, 6000);
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
      cta.addEventListener('click', function () { try { free.click(); } catch (e) {} });
    }
    pane.insertBefore(hero, pane.firstChild.nextSibling || list);
  }

  function fallbackCosmContent() {
    var neon = document.getElementById('cosm-neon-body');
    if (!neon) return;
    if (neon.innerHTML && neon.innerHTML.trim().length > 20) return;
    neon.innerHTML =
      '<div class="cosm-card" style="--co:#22e6ff">' +
      '<span class="cosm-orb"></span>' +
      '<span class="cosm-txt"><b>DEFAULT</b><i>Standart neon görünüm</i></span>' +
      '<span class="cosm-p">KUŞANILI</span></div>' +
      '<div class="cosm-note">Skin listesi yüklenemedi veya boş. Geri dönüp tekrar dene.</div>';
    neon.style.display = '';
  }

  function openCosm() {
    try {
      document.querySelectorAll('.screen').forEach(function (s) { s.classList.remove('on'); });
      var cs = document.getElementById('scr-cosm');
      if (!cs) {
        console.warn('[cosm] scr-cosm missing');
        return;
      }
      cs.classList.add('on');
      cs.style.opacity = '1';
      cs.style.visibility = 'visible';
      cs.style.pointerEvents = 'auto';
      cs.style.zIndex = '40';

      try {
        if (typeof window.renderCosm === 'function') window.renderCosm();
      } catch (err) {
        console.warn('[cosm] renderCosm error', err);
      }

      fallbackCosmContent();
      attachManualScroll(cs);
      injectBadge('COSM v5');

      /* back button → shop or menu */
      var back = document.getElementById('b-cosm-back');
      if (back && !back._nvx) {
        back._nvx = true;
        back.addEventListener('click', function (e) {
          e.preventDefault();
          openShop();
        }, true);
      }
    } catch (e) {
      console.warn('[cosm open]', e);
    }
  }

  function openShop() {
    try {
      document.querySelectorAll('.screen').forEach(function (s) { s.classList.remove('on'); });
      var sc = document.getElementById('scr-shop');
      if (!sc) return;
      sc.classList.add('on');

      if (typeof window.renderShop === 'function') window.renderShop();
      else if (window.PROG && window.PROG.renderShop) window.PROG.renderShop();

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
      wireCosmButtons();
    } catch (e) {
      console.warn('[shop-v5]', e);
    }
  }

  function wireCosmButtons() {
    document.querySelectorAll('.shop-cosm-btn').forEach(function (btn) {
      if (btn._nvxCosm) return;
      btn._nvxCosm = true;
      btn.addEventListener('click', function (e) {
        e.preventDefault();
        e.stopPropagation();
        openCosm();
      }, true);
    });
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
    /* Event delegation for dynamically rendered cosm buttons */
    if (!document._nvxCosmDel) {
      document._nvxCosmDel = true;
      document.addEventListener('click', function (e) {
        var t = e.target;
        if (!t) return;
        var btn = t.closest ? t.closest('.shop-cosm-btn') : null;
        if (!btn && t.classList && t.classList.contains('shop-cosm-btn')) btn = t;
        if (btn) {
          e.preventDefault();
          e.stopPropagation();
          openCosm();
        }
      }, true);
    }
  }

  function boot() {
    injectCss();
    wire();
    window.NVXDay3 = { openShop: openShop, openCosm: openCosm };
    window.openCosm = openCosm;
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () { setTimeout(boot, 30); });
  } else {
    setTimeout(boot, 30);
  }
  setTimeout(boot, 500);
  setTimeout(boot, 1500);
})();
