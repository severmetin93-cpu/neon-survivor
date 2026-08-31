/* NORYVX Day 3c — menu polish + professional shop scroll */
(function(){
  'use strict';

  var STYLE_ID = 'nvx-day3-force-css';
  var SHOP_STYLE_ID = 'nvx-shop-force-css';
  var BADGE_ID = 'nvx-ui-badge';

  function injectForceCss(){
    if(document.getElementById(STYLE_ID)) return;
    var s = document.createElement('style');
    s.id = STYLE_ID;
    s.textContent = [
      '#scr-menu{',
      '  background: radial-gradient(100% 60% at 50% -10%, rgba(255,80,200,.18), transparent 50%),',
      '    radial-gradient(80% 50% at 100% 100%, rgba(34,230,255,.14), transparent 45%),',
      '    #01040e !important;',
      '}',
      '#nvx2-logo .nvx2-logo-main, .nvx2-logo-main{',
      '  background: linear-gradient(90deg, #ff4fd8, #22e6ff, #a05cff) !important;',
      '  -webkit-background-clip: text !important;',
      '  background-clip: text !important;',
      '  -webkit-text-fill-color: transparent !important;',
      '  filter: drop-shadow(0 0 20px rgba(255,79,216,.55)) !important;',
      '}',
      '.nvx2-play, button.nvx2-play, #b-play{',
      '  background: linear-gradient(135deg, #ff2d9b 0%, #7b2fff 50%, #00d4ff 100%) !important;',
      '  border: 2px solid #fff !important;',
      '  border-radius: 16px !important;',
      '  box-shadow: 0 0 40px rgba(255,45,155,.55), 0 8px 24px rgba(0,0,0,.5) !important;',
      '  color: #fff !important;',
      '}',
      '.nvx2-card, #nvx2-cards .nvx2-card{',
      '  background: linear-gradient(160deg, rgba(255,79,216,.12), rgba(8,14,30,.95) 40%) !important;',
      '  border: 1.5px solid rgba(255,79,216,.45) !important;',
      '  border-radius: 14px !important;',
      '  min-height: 60px !important;',
      '  color: #ffe6f8 !important;',
      '}',
      '#nvx-ui-badge{',
      '  position: fixed; top: calc(8px + env(safe-area-inset-top,0px)); left: 50%; transform: translateX(-50%);',
      '  z-index: 9999; pointer-events: none;',
      '  font-size: 10px; font-weight: 800; letter-spacing: .2em; text-transform: uppercase;',
      '  padding: 4px 10px; border-radius: 999px;',
      '  color: #041018; background: linear-gradient(90deg,#ff4fd8,#22e6ff);',
      '}'
    ].join('\n');
    document.head.appendChild(s);
  }

  function injectShopScrollCss(){
    if(document.getElementById(SHOP_STYLE_ID)) return;
    var s = document.createElement('style');
    s.id = SHOP_STYLE_ID;
    s.textContent = [
      '#scr-shop.screen.on{',
      '  display:flex !important; flex-direction:column !important;',
      '  padding:0 !important; overflow:hidden !important; height:100% !important;',
      '  touch-action:manipulation !important;',
      '}',
      '#shop-panes{ flex:1 1 auto !important; min-height:0 !important; overflow:hidden !important; display:flex !important; flex-direction:column !important; }',
      '#shop-panes .s-pane{',
      '  display:none !important; overflow-y:auto !important; overflow-x:hidden !important;',
      '  -webkit-overflow-scrolling:touch !important; touch-action:pan-y !important;',
      '  overscroll-behavior:contain !important;',
      '  padding:12px 16px calc(env(safe-area-inset-bottom,0px) + 28px) !important;',
      '  gap:10px !important; box-sizing:border-box !important;',
      '}',
      '#shop-panes .s-pane.on{ display:flex !important; flex-direction:column !important; flex:1 1 auto !important; min-height:0 !important; }',
      '#shop-hdr,#shop-tabs{ flex-shrink:0 !important; }',
      'body.shop-open, html.shop-open{ touch-action:manipulation !important; }'
    ].join('\n');
    document.head.appendChild(s);
  }

  function injectBadge(){
    if(document.getElementById(BADGE_ID)) return;
    var b = document.createElement('div');
    b.id = BADGE_ID;
    b.textContent = 'UI REDESIGN v3';
    document.body.appendChild(b);
    setTimeout(function(){ try{ b.style.opacity='0'; b.style.transition='opacity .6s'; }catch(e){} }, 8000);
    setTimeout(function(){ try{ b.remove(); }catch(e){} }, 9000);
  }

  function currencyBits(){
    var c = { credits:0, shards:0, neon:0, gems:0 };
    try{ if(window.RPG && RPG.state){ c.credits = RPG.state.credits||0; c.shards = RPG.state.shards||0; } }catch(e){}
    try{ if(window.P) c.neon = P.neon||0; }catch(e){}
    try{ if(window.Save && Save.data && Save.data.iap) c.gems = Save.data.iap.gems||0; }catch(e){}
    return c;
  }

  function ownedSkinsList(){
    var out = [];
    try{
      var skins = (window.Save && Save.data && Save.data.ownedSkins) || {};
      Object.keys(skins).forEach(function(k){ if(skins[k]) out.push(k); });
    }catch(e){}
    return out;
  }

  function renderInventoryPanel(){
    var pane = document.getElementById('spane-ingame');
    if(!pane) return;
    var panel = document.getElementById('nvx-inv-panel');
    if(!panel){
      panel = document.createElement('div');
      panel.id = 'nvx-inv-panel';
      /* Inside scrollable pane — does not break flex header/tabs */
      pane.insertBefore(panel, pane.firstChild);
    }
    var cur = currencyBits();
    var skins = ownedSkinsList();
    var html = '<h3>ENVANTER</h3>';
    html += '<div class="inv-row"><span>Kredi</span><b>◎ '+cur.credits+'</b></div>';
    html += '<div class="inv-row"><span>Shard</span><b>◆ '+cur.shards+'</b></div>';
    html += '<div class="inv-row"><span>Neon</span><b>✦ '+cur.neon+'</b></div>';
    html += '<div class="inv-row"><span>Gem</span><b>💎 '+cur.gems+'</b></div>';
    html += '<div class="inv-row"><span>Skin</span><b>'+skins.length+'</b></div>';
    if(!skins.length) html += '<div class="inv-row" style="opacity:.5"><span>Henüz ek skin yok</span></div>';
    panel.innerHTML = html;
  }

  function fixShopScroll(){
    var panes = document.getElementById('shop-panes');
    if(panes){
      panes.style.flex = '1 1 auto';
      panes.style.minHeight = '0';
      panes.style.overflow = 'hidden';
    }
    document.querySelectorAll('#shop-panes .s-pane').forEach(function(p){
      p.style.overflowY = 'auto';
      p.style.webkitOverflowScrolling = 'touch';
      p.style.touchAction = 'pan-y';
      if(p.classList.contains('on')){
        p.style.display = 'flex';
        p.style.flexDirection = 'column';
        p.style.flex = '1 1 auto';
        p.style.minHeight = '0';
      }
    });
  }

  function openShop(){
    try{
      document.querySelectorAll('.screen').forEach(function(s){ s.classList.remove('on'); });
      var sc = document.getElementById('scr-shop');
      if(sc) sc.classList.add('on');
      document.documentElement.classList.add('shop-open');
      document.body.classList.add('shop-open');
      if(typeof window.renderShop === 'function') window.renderShop();
      else if(window.PROG && window.PROG.renderShop) window.PROG.renderShop();
      renderInventoryPanel();
      fixShopScroll();
      setTimeout(fixShopScroll, 50);
      setTimeout(fixShopScroll, 200);
    }catch(e){}
  }

  function closeShopFlags(){
    document.documentElement.classList.remove('shop-open');
    document.body.classList.remove('shop-open');
  }

  function wireHubStore(){
    var btn = document.getElementById('b-hub-store');
    if(btn && !btn._day3){
      btn._day3 = true;
      btn.addEventListener('click', function(e){
        e.preventDefault(); e.stopPropagation(); openShop();
      }, true);
    }
    var back = document.getElementById('b-shop-back');
    if(back && !back._day3){
      back._day3 = true;
      back.addEventListener('click', function(){ closeShopFlags(); }, true);
    }
    /* Tab switch: re-apply scroll after pane change */
    var tabs = document.getElementById('shop-tabs');
    if(tabs && !tabs._day3scroll){
      tabs._day3scroll = true;
      tabs.addEventListener('click', function(){
        setTimeout(fixShopScroll, 30);
      }, true);
    }
  }

  function boot(){
    injectForceCss();
    injectShopScrollCss();
    injectBadge();
    wireHubStore();
    window.NVXDay3 = { openShop: openShop, renderInventoryPanel: renderInventoryPanel, fixShopScroll: fixShopScroll };
  }

  if(document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', function(){ setTimeout(boot, 30); });
  } else {
    setTimeout(boot, 30);
  }
  setTimeout(boot, 400);
  setTimeout(boot, 1200);
})();
