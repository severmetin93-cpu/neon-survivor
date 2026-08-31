/* NORYVX Day 2 — Missions wiring polish + CSS fallback inject */
(function(){
  'use strict';

  (function ensureCss(){
    if(document.querySelector('link[href*="nvx2-menu-polish"]')) return;
    var l=document.createElement('link');
    l.rel='stylesheet';
    l.href='css/nvx2-menu-polish.css';
    document.head.appendChild(l);
  })();

  function afterRunEndRefresh(){
    try{
      if(window.MS7 && typeof MS7.updateHubCard==='function') MS7.updateHubCard();
      if(window.MS7 && MS7._tab==='missions' && typeof MS7.renderMissions==='function') MS7.renderMissions();
      if(typeof window.renderMissions==='function'){
        var el=document.getElementById('scr-missions');
        if(el && el.classList.contains('on')) window.renderMissions();
      }
    }catch(e){}
  }

  function patchOnRunEnd(){
    if(!window.MissionsDB || MissionsDB._day2Patched) return;
    var orig = MissionsDB.onRunEnd && MissionsDB.onRunEnd.bind(MissionsDB);
    if(!orig) return;
    MissionsDB.onRunEnd = function(stats){
      var r = orig(stats);
      afterRunEndRefresh();
      return r;
    };
    MissionsDB._day2Patched = true;
  }

  function wireHub(){
    var card = document.getElementById('ms7-hub-card');
    if(!card || card._day2) return;
    card._day2 = true;
    card.addEventListener('click', function(e){
      e.preventDefault();
      if(window.MS7) MS7.open();
    }, true);
  }

  function boot(){
    patchOnRunEnd();
    wireHub();
    try{
      if(window.MissionsDB){
        MissionsDB.load();
        MissionsDB.checkReset();
        MissionsDB.checkAchievements();
      }
      if(window.MS7 && MS7.updateHubCard) MS7.updateHubCard();
    }catch(e){}
  }

  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded', function(){ setTimeout(boot, 50); });
  else setTimeout(boot, 50);
  setTimeout(boot, 500);
  setTimeout(boot, 1500);
})();
