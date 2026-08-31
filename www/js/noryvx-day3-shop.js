/* NORYVX Day 3b — FORCE visible menu redesign (inline styles) */
(function(){
  'use strict';

  var STYLE_ID = 'nvx-day3-force-css';
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
      '  letter-spacing: .3em !important;',
      '}',
      '.nvx2-play, button.nvx2-play, #b-play{',
      '  background: linear-gradient(135deg, #ff2d9b 0%, #7b2fff 50%, #00d4ff 100%) !important;',
      '  border: 2px solid #fff !important;',
      '  border-radius: 16px !important;',
      '  box-shadow: 0 0 40px rgba(255,45,155,.55), 0 8px 24px rgba(0,0,0,.5) !important;',
      '  color: #fff !important;',
      '  text-shadow: 0 1px 2px rgba(0,0,0,.4) !important;',
      '  letter-spacing: .28em !important;',
      '  padding: 18px 0 16px !important;',
      '  margin: 10px 16px !important;',
      '}',
      '.nvx2-play small{ color: rgba(255,255,255,.9) !important; opacity: 1 !important; }',
      '.nvx2-card, #nvx2-cards .nvx2-card{',
      '  background: linear-gradient(160deg, rgba(255,79,216,.12), rgba(8,14,30,.95) 40%) !important;',
      '  border: 1.5px solid rgba(255,79,216,.45) !important;',
      '  border-radius: 14px !important;',
      '  min-height: 60px !important;',
      '  box-shadow: 0 0 16px rgba(255,79,216,.15), 0 4px 14px rgba(0,0,0,.35) !important;',
      '  color: #ffe6f8 !important;',
      '}',
      '.nvx2-ms-card{',
      '  border: 1.5px solid rgba(34,230,255,.4) !important;',
      '  background: rgba(6,16,40,.95) !important;',
      '  border-radius: 12px !important;',
      '}',
      '#nvx-ui-badge{',
      '  position: fixed; top: calc(8px + env(safe-area-inset-top,0px)); left: 50%; transform: translateX(-50%);',
      '  z-index: 9999; pointer-events: none;',
      '  font-family: system-ui,sans-serif; font-size: 10px; font-weight: 800;',
      '  letter-spacing: .2em; text-transform: uppercase;',
      '  padding: 4px 10px; border-radius: 999px;',
      '  color: #041018; background: linear-gradient(90deg,#ff4fd8,#22e6ff);',
      '  box-shadow: 0 0 16px rgba(255,79,216,.5);',
      '}',
      '#nvx-inv-panel{',
      '  margin: 12px 16px; padding: 12px 14px; border-radius: 12px;',
      '  border: 1.5px solid rgba(255,79,216,.35);',
      '  background: rgba(10,14,32,.95);',
      '}',
      '#nvx-inv-panel h3{ margin:0 0 8px; font-size:11px; letter-spacing:.2em; color:#ff4fd8; }',
      '#nvx-inv-panel .inv-row{ display:flex; justify-content:space-between; padding:6px 0; border-bottom:1px solid rgba(255,255,255,.06); font-size:12px; color:#e8f0ff; }'
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

  function openShop(){
    try{
      document.querySelectorAll('.screen').forEach(function(s){ s.classList.remove('on'); });
      var sc = document.getElementById('scr-shop');
      if(sc) sc.classList.add('on');
      if(typeof window.renderShop === 'function') window.renderShop();
      else if(window.PROG && window.PROG.renderShop) window.PROG.renderShop();
      renderInventoryPanel();
    }catch(e){}
  }

  function ownedSkinsList(){
    var out = [];
    try{
      var skins = (window.Save && Save.data && Save.data.ownedSkins) || {};
      Object.keys(skins).forEach(function(k){ if(skins[k]) out.push(k); });
    }catch(e){}
    return out;
  }

  function currencyBits(){
    var c = { credits:0, shards:0, neon:0, gems:0 };
    try{ if(window.RPG && RPG.state){ c.credits = RPG.state.credits||0; c.shards = RPG.state.shards||0; } }catch(e){}
    try{ if(window.P) c.neon = P.neon||0; }catch(e){}
    try{ if(window.Save && Save.data && Save.data.iap) c.gems = Save.data.iap.gems||0; }catch(e){}
    return c;
  }

  function renderInventoryPanel(){
    var shop = document.getElementById('scr-shop');
    if(!shop) return;
    var panel = document.getElementById('nvx-inv-panel');
    if(!panel){
      panel = document.createElement('div');
      panel.id = 'nvx-inv-panel';
      var panes = document.getElementById('shop-panes') || shop;
      panes.parentNode.insertBefore(panel, panes);
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

  function wireHubStore(){
    var btn = document.getElementById('b-hub-store');
    if(btn && !btn._day3){
      btn._day3 = true;
      btn.addEventListener('click', function(e){
        e.preventDefault(); e.stopPropagation(); openShop();
      }, true);
    }
  }

  function boot(){
    injectForceCss();
    injectBadge();
    wireHubStore();
    window.NVXDay3 = { openShop: openShop, renderInventoryPanel: renderInventoryPanel };
  }

  if(document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', function(){ setTimeout(boot, 30); });
  } else {
    setTimeout(boot, 30);
  }
  setTimeout(boot, 400);
  setTimeout(boot, 1200);
})();
