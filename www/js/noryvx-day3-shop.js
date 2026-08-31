/* NORYVX Day 3 — Shop wiring + Inventory skeleton */
(function(){
  'use strict';

  function ensureCss(href){
    if(document.querySelector('link[href*="'+href+'"]')) return;
    var l=document.createElement('link');
    l.rel='stylesheet';
    l.href=href;
    document.head.appendChild(l);
  }
  ensureCss('css/nvx2-menu-polish.css');
  ensureCss('css/noryvx-shop-day3.css');

  function openShop(){
    try{
      document.querySelectorAll('.screen').forEach(function(s){s.classList.remove('on');});
      var sc=document.getElementById('scr-shop');
      if(sc) sc.classList.add('on');
      if(typeof window.renderShop==='function') window.renderShop();
      else if(window.PROG && typeof window.PROG.renderShop==='function') window.PROG.renderShop();
      renderInventoryPanel();
    }catch(e){ console.warn('[day3 shop]', e); }
  }

  function openCosm(){
    try{
      document.querySelectorAll('.screen').forEach(function(s){s.classList.remove('on');});
      var cs=document.getElementById('scr-cosm');
      if(cs) cs.classList.add('on');
      if(typeof window.renderCosm==='function') window.renderCosm();
    }catch(e){ console.warn('[day3 cosm]', e); }
  }

  function ownedSkinsList(){
    var out=[];
    try{
      var skins=(window.Save && Save.data && Save.data.ownedSkins) || {};
      Object.keys(skins).forEach(function(k){ if(skins[k]) out.push(k); });
    }catch(e){}
    return out;
  }

  function currencyBits(){
    var c={credits:0,shards:0,neon:0,gems:0};
    try{ if(window.RPG && RPG.state){ c.credits=RPG.state.credits||0; c.shards=RPG.state.shards||0; } }catch(e){}
    try{ if(window.P) c.neon=P.neon||0; }catch(e){}
    try{ if(window.Save && Save.data && Save.data.iap) c.gems=Save.data.iap.gems||0; }catch(e){}
    return c;
  }

  function renderInventoryPanel(){
    var shop=document.getElementById('scr-shop');
    if(!shop) return;
    var panel=document.getElementById('nvx-inv-panel');
    if(!panel){
      panel=document.createElement('div');
      panel.id='nvx-inv-panel';
      var panes=document.getElementById('shop-panes') || shop;
      panes.parentNode.insertBefore(panel, panes);
    }
    var cur=currencyBits();
    var skins=ownedSkinsList();
    var html='<h3>ENVANTER</h3>';
    html+='<div class="inv-row"><span>Kredi</span><b>◎ '+cur.credits+'</b></div>';
    html+='<div class="inv-row"><span>Shard</span><b>◆ '+cur.shards+'</b></div>';
    html+='<div class="inv-row"><span>Neon</span><b>✦ '+cur.neon+'</b></div>';
    html+='<div class="inv-row"><span>Gem</span><b>💎 '+cur.gems+'</b></div>';
    html+='<div class="inv-row"><span>Skin</span><b>'+skins.length+'</b></div>';
    if(skins.length){
      html+='<div class="inv-row" style="flex-wrap:wrap;gap:4px"><span style="width:100%;opacity:.6;font-size:10px">Sahip olunan</span><span style="font-size:10px;color:#88c8ff">'+skins.slice(0,12).join(' · ')+(skins.length>12?'…':'')+'</span></div>';
    }else{
      html+='<div class="inv-empty">Henüz ek skin yok — mağazadan veya sandıktan kazan.</div>';
    }
    panel.innerHTML=html;
  }

  function wireHubStore(){
    var btn=document.getElementById('b-hub-store');
    if(btn && !btn._day3){
      btn._day3=true;
      btn.addEventListener('click', function(e){
        e.preventDefault();
        e.stopPropagation();
        openShop();
      }, true);
    }
    var bShop=document.getElementById('b-shop');
    if(bShop && !bShop._day3){
      bShop._day3=true;
      bShop.addEventListener('click', function(){ setTimeout(renderInventoryPanel, 50); });
    }
  }

  function boot(){
    wireHubStore();
    window.NVXDay3={ openShop:openShop, openCosm:openCosm, renderInventoryPanel:renderInventoryPanel };
  }

  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded', function(){ setTimeout(boot,80); });
  else setTimeout(boot,80);
  setTimeout(boot,600);
})();
