#!/usr/bin/env node
'use strict';
const fs = require('fs');
const FILE = require('path').join(__dirname, 'www/index.html');
let html = fs.readFileSync(FILE, 'utf8');

function rep(old, nw, label) {
  if (!html.includes(old)) { console.error('NOT FOUND:', label || old.slice(0,60).trim()); return; }
  html = html.replace(old, nw);
  console.log('OK:', label || old.slice(0,60).trim());
}

// ============================================================
// 1. MERMI GÖRSELLERİ — Dramatik enerji ışınları
// ============================================================
rep(
`function drawWeapons(){

  const t=performance.now()/1000;

  projectiles.forEach(p=>{

    ctx.save();
    ctx.translate(p.x,p.y);

    const ang=Math.atan2(p.vy||0,p.vx||1);

    if(p.type==="plasma"){

      /* PLASMA — atlas-first: use sprite when atlas is ready */
      if(atlasHas("bullet_plasma")){
        ctx.rotate(ang);
        atlasDraw("bullet_plasma",p.r*2.5);
        ctx.restore();
        return;
      }

      /* PLASMA — agir, sicak, yogun glow + plazma izi */
      ctx.rotate(ang);
      ctx.globalAlpha=.22;
      ctx.fillStyle=p.color;
      ctx.beginPath();
      ctx.ellipse(-p.r*2.6,0,p.r*3.4,p.r*1.15,0,0,TAU);
      ctx.fill();

      ctx.globalAlpha=1;
      ctx.shadowColor=p.color;
      ctx.shadowBlur=22;
      ctx.fillStyle=p.color;
      ctx.beginPath();
      ctx.arc(0,0,p.r*1.12,0,TAU);
      ctx.fill();

      ctx.shadowBlur=0;
      ctx.fillStyle="#fff3d8";
      ctx.globalAlpha=.9;
      ctx.beginPath();
      ctx.arc(p.r*.18,0,p.r*.44,0,TAU);
      ctx.fill();

    }else if(p.type==="arc"){

      /* ARC — atlas-first: use sprite when atlas is ready */
      if(atlasHas("bullet_arc")){
        ctx.rotate(ang);
        atlasDraw("bullet_arc",p.r*5);
        ctx.restore();
        return;
      }

      /* ARC — elektriksel, kirikli enerji hatti */
      ctx.rotate(ang);
      ctx.shadowColor=p.color;
      ctx.shadowBlur=14;
      ctx.strokeStyle=p.color;
      ctx.lineWidth=1.7;
      ctx.beginPath();
      ctx.moveTo(-p.r*4.2,0);
      for(let i=1;i<=4;i++){
        const f=i/4;
        ctx.lineTo(
          -p.r*4.2+p.r*4.2*f,
          Math.sin(t*46+i*2.1+p.x*.05)*p.r*(1-f)*1.5
        );
      }
      ctx.stroke();

      ctx.shadowBlur=0;
      ctx.globalAlpha=.55;
      ctx.strokeStyle="#dcbcff";
      ctx.lineWidth=.9;
      ctx.stroke();

      ctx.globalAlpha=1;
      ctx.shadowColor=p.color;
      ctx.shadowBlur=12;
      ctx.fillStyle="#f0e2ff";
      ctx.beginPath();
      ctx.arc(0,0,p.r*.82,0,TAU);
      ctx.fill();

    }else{

      /* PULSE — atlas-first: use sprite when atlas is ready */
      if(atlasHas("bullet_pulse")){
        ctx.rotate(ang);
        atlasDraw("bullet_pulse",p.r*4);
        ctx.restore();
        return;
      }

      /* PULSE — temiz, hizli cyan enerji bolt + kisa iz */
      ctx.rotate(ang);
      ctx.globalAlpha=.35;
      ctx.fillStyle=p.color;
      ctx.beginPath();
      ctx.ellipse(-p.r*1.8,0,p.r*2.4,p.r*.55,0,0,TAU);
      ctx.fill();

      ctx.globalAlpha=1;
      ctx.shadowColor=p.color;
      ctx.shadowBlur=13;
      ctx.fillStyle=p.color;
      ctx.beginPath();
      ctx.ellipse(0,0,p.r*1.35,p.r*.82,0,0,TAU);
      ctx.fill();

      ctx.shadowBlur=0;
      ctx.fillStyle="#eafcff";
      ctx.beginPath();
      ctx.arc(p.r*.28,0,p.r*.38,0,TAU);
      ctx.fill();

    }

    ctx.restore();

  });

}`,
`function drawWeapons(){
  const t=performance.now()/1000;

  projectiles.forEach(p=>{
    ctx.save();
    ctx.translate(p.x,p.y);
    const ang=Math.atan2(p.vy||0,p.vx||1);
    ctx.rotate(ang);

    const life01=Math.min(1,p.life/1.8); /* 0=ölmek üzere, 1=yeni */
    const spd=Math.hypot(p.vx,p.vy);
    const trailLen=Math.min(spd*0.045, 38); /* Hıza göre iz uzunluğu */

    if(p.type==='plasma'){
      /* PLASMA — Alevli plazma mızrağı */
      /* 1. Arka ateş kuyruğu */
      const fg=ctx.createLinearGradient(-trailLen*1.6,0,0,0);
      fg.addColorStop(0,'rgba(255,60,0,0)');
      fg.addColorStop(0.5,'rgba(255,120,20,0.35)');
      fg.addColorStop(1,'rgba(255,180,60,0.7)');
      ctx.fillStyle=fg;
      ctx.beginPath();
      ctx.ellipse(-trailLen*0.8,0,trailLen*1.4,p.r*1.1,0,0,TAU);
      ctx.fill();
      /* 2. Gövde neon glow */
      ctx.shadowColor='#ff6020'; ctx.shadowBlur=28;
      const bg=ctx.createLinearGradient(-p.r*1.2,0,p.r*1.6,0);
      bg.addColorStop(0,'#ff3000'); bg.addColorStop(0.6,'#ff7020'); bg.addColorStop(1,'#ffb040');
      ctx.fillStyle=bg;
      ctx.beginPath(); ctx.ellipse(p.r*0.2,0,p.r*1.8,p.r*0.95,0,0,TAU); ctx.fill();
      /* 3. Parlak çekirdek */
      ctx.shadowBlur=12;
      ctx.fillStyle='#fff8e0'; ctx.globalAlpha=0.95;
      ctx.beginPath(); ctx.ellipse(p.r*0.5,0,p.r*0.7,p.r*0.42,0,0,TAU); ctx.fill();
      /* 4. Uç ışık noktası */
      ctx.globalAlpha=1; ctx.shadowColor='#ffffff'; ctx.shadowBlur=18;
      ctx.fillStyle='#ffffff';
      ctx.beginPath(); ctx.arc(p.r*1.5,0,p.r*0.32,0,TAU); ctx.fill();

    }else if(p.type==='arc'){
      /* ARC — Elektrik plazma zinciri */
      const segCount=7;
      /* 1. Dış parlama hattı */
      ctx.shadowColor=p.color; ctx.shadowBlur=22;
      ctx.strokeStyle=p.color; ctx.lineWidth=3.2; ctx.globalAlpha=0.5;
      ctx.lineCap='round';
      ctx.beginPath(); ctx.moveTo(-trailLen,0);
      for(let i=1;i<=segCount;i++){
        const f=i/segCount;
        const jitter=Math.sin(t*55+i*1.8+p.x*0.04)*p.r*(1.4-f*0.8);
        ctx.lineTo(-trailLen+trailLen*f, jitter);
      }
      ctx.stroke();
      /* 2. İç parlak hat */
      ctx.globalAlpha=0.9; ctx.strokeStyle='#e8c8ff'; ctx.lineWidth=1.6; ctx.shadowBlur=10;
      ctx.beginPath(); ctx.moveTo(-trailLen,0);
      for(let i=1;i<=segCount;i++){
        const f=i/segCount;
        const jitter=Math.sin(t*55+i*1.8+p.x*0.04)*p.r*(1.4-f*0.8);
        ctx.lineTo(-trailLen+trailLen*f, jitter);
      }
      ctx.stroke();
      /* 3. Yan yıldırım kıvılcımları */
      ctx.globalAlpha=0.55; ctx.strokeStyle='#ffffff'; ctx.lineWidth=0.8; ctx.shadowBlur=6;
      for(let s=0;s<3;s++){
        const sx=-trailLen*0.6+Math.random()*trailLen*0.5;
        const sy=Math.sin(t*40+s*2.2)*p.r*0.8;
        ctx.beginPath(); ctx.moveTo(sx,sy);
        ctx.lineTo(sx+(Math.random()-0.5)*p.r*2, sy+(Math.random()-0.5)*p.r*2); ctx.stroke();
      }
      /* 4. Uç parlak top */
      ctx.globalAlpha=1; ctx.fillStyle='#f0d8ff'; ctx.shadowColor='#c080ff'; ctx.shadowBlur=20;
      ctx.beginPath(); ctx.arc(0,0,p.r*1.1,0,TAU); ctx.fill();
      ctx.fillStyle='#ffffff'; ctx.globalAlpha=0.85;
      ctx.beginPath(); ctx.arc(0,0,p.r*0.45,0,TAU); ctx.fill();

    }else{
      /* PULSE — Robotik neon enerji ışını */
      /* 1. Uzun enerji izi */
      const pg=ctx.createLinearGradient(-trailLen*1.4,0,p.r*2,0);
      pg.addColorStop(0,'rgba(34,230,255,0)');
      pg.addColorStop(0.4,'rgba(34,230,255,0.25)');
      pg.addColorStop(1,'rgba(160,220,255,0.6)');
      ctx.fillStyle=pg;
      ctx.beginPath();
      ctx.ellipse(-trailLen*0.5,0,trailLen*1.2,p.r*0.55,0,0,TAU);
      ctx.fill();
      /* 2. Ana ışın gövdesi — ince dikdörtgen */
      ctx.shadowColor='#22e6ff'; ctx.shadowBlur=24;
      const rg=ctx.createLinearGradient(-p.r,0,p.r*2.8,0);
      rg.addColorStop(0,'rgba(34,230,255,0.7)');
      rg.addColorStop(0.5,'#22e6ff');
      rg.addColorStop(1,'#80f4ff');
      ctx.fillStyle=rg; ctx.globalAlpha=0.95;
      ctx.beginPath();
      const rh=p.r*0.62;
      ctx.roundRect(-p.r*0.5,-rh,p.r*3.2,rh*2,rh);
      ctx.fill();
      /* 3. Parlak iç çekirdek şeridi */
      ctx.shadowBlur=8; ctx.fillStyle='#ffffff'; ctx.globalAlpha=0.88;
      ctx.beginPath();
      ctx.roundRect(0,-p.r*0.22,p.r*2,p.r*0.44,p.r*0.22);
      ctx.fill();
      /* 4. Uç ışık patlaması */
      ctx.globalAlpha=1; ctx.shadowColor='#ffffff'; ctx.shadowBlur=16;
      ctx.fillStyle='#eafeff';
      ctx.beginPath(); ctx.arc(p.r*2.8,0,p.r*0.52,0,TAU); ctx.fill();
    }

    ctx.restore();
  });

  /* Meteor yağmuru efekti */
  if(window._meteors) drawMeteors();
}`,
'drawWeapons energy beam replacement'
);

// ============================================================
// 2. SKILL HUD HTML — Sağ alta 3 skill butonu ekle
// ============================================================
rep(
`<div id="power-hud">`,
`<!-- ACTIVE SKILL HUD — 3 in-game skills -->
<div id="nvx-active-skills">
  <div class="nvx-sk" id="sk-burst" data-sk="burst">
    <svg class="sk-ring" viewBox="0 0 44 44"><circle cx="22" cy="22" r="18" fill="none" stroke="rgba(34,230,255,.18)" stroke-width="3"/><circle class="sk-ring-fill" cx="22" cy="22" r="18" fill="none" stroke="#22e6ff" stroke-width="3" stroke-dasharray="113" stroke-dashoffset="113" stroke-linecap="round" transform="rotate(-90 22 22)"/></svg>
    <span class="sk-icon">⬡</span>
    <span class="sk-name">BURST</span>
    <span class="sk-cd" id="sk-burst-cd">LV3</span>
  </div>
  <div class="nvx-sk" id="sk-meteor" data-sk="meteor">
    <svg class="sk-ring" viewBox="0 0 44 44"><circle cx="22" cy="22" r="18" fill="none" stroke="rgba(255,100,30,.18)" stroke-width="3"/><circle class="sk-ring-fill" cx="22" cy="22" r="18" fill="none" stroke="#ff6020" stroke-width="3" stroke-dasharray="113" stroke-dashoffset="113" stroke-linecap="round" transform="rotate(-90 22 22)"/></svg>
    <span class="sk-icon">☄</span>
    <span class="sk-name">METEOR</span>
    <span class="sk-cd" id="sk-meteor-cd">LV6</span>
  </div>
  <div class="nvx-sk" id="sk-heal" data-sk="heal">
    <svg class="sk-ring" viewBox="0 0 44 44"><circle cx="22" cy="22" r="18" fill="none" stroke="rgba(72,255,155,.18)" stroke-width="3"/><circle class="sk-ring-fill" cx="22" cy="22" r="18" fill="none" stroke="#48ff9b" stroke-width="3" stroke-dasharray="113" stroke-dashoffset="113" stroke-linecap="round" transform="rotate(-90 22 22)"/></svg>
    <span class="sk-icon">♥</span>
    <span class="sk-name">HEAL</span>
    <span class="sk-cd" id="sk-heal-cd">2m</span>
  </div>
</div>
<div id="power-hud">`,
'skill HUD HTML'
);

// ============================================================
// 3. SKILL HUD CSS
// ============================================================
rep(
`/* POWER UP HUD */

#power-hud{`,
`/* ============ ACTIVE SKILL BUTTONS ============ */
#nvx-active-skills{
  position:absolute;
  right:10px;
  bottom:calc(env(safe-area-inset-bottom,0px) + 22px);
  z-index:9;
  display:none;
  flex-direction:column;
  align-items:center;
  gap:10px;
  pointer-events:auto;
}
#nvx-active-skills.on{ display:flex; }
.nvx-sk{
  position:relative;
  width:52px; height:52px;
  display:flex; flex-direction:column;
  align-items:center; justify-content:center;
  border-radius:50%;
  background:rgba(4,10,26,.82);
  border:1px solid rgba(34,230,255,.22);
  cursor:pointer;
  touch-action:manipulation;
  -webkit-tap-highlight-color:transparent;
  transition:transform .12s,box-shadow .12s;
  user-select:none;
}
.nvx-sk:active{ transform:scale(0.91); }
.nvx-sk.ready{
  border-color:rgba(34,230,255,.7);
  box-shadow:0 0 18px rgba(34,230,255,.35), inset 0 0 12px rgba(34,230,255,.08);
}
.nvx-sk.locked{
  opacity:0.38;
  filter:grayscale(.7);
}
.nvx-sk.cooling .sk-icon{ opacity:0.5; }
#sk-burst.ready{ border-color:rgba(34,230,255,.7); box-shadow:0 0 18px rgba(34,230,255,.35); }
#sk-meteor.ready{ border-color:rgba(255,100,30,.7); box-shadow:0 0 18px rgba(255,100,30,.35); }
#sk-heal.ready{ border-color:rgba(72,255,155,.7); box-shadow:0 0 18px rgba(72,255,155,.35); }
.sk-ring{
  position:absolute; inset:0; width:100%; height:100%;
  pointer-events:none;
}
.sk-icon{
  font-size:18px; line-height:1;
  position:relative; z-index:2;
  text-shadow:0 0 12px currentColor;
}
.sk-name{
  font:700 5px 'IBM Plex Mono'; letter-spacing:.1em;
  color:rgba(234,244,255,.55); position:absolute;
  bottom:-13px; white-space:nowrap;
}
.sk-cd{
  position:absolute; top:-12px;
  font:700 8px 'IBM Plex Mono'; color:#22e6ff;
  text-shadow:0 0 8px rgba(34,230,255,.7);
  white-space:nowrap;
}
#sk-meteor .sk-cd{ color:#ff8040; text-shadow:0 0 8px rgba(255,120,40,.7); }
#sk-heal .sk-cd{ color:#48ff9b; text-shadow:0 0 8px rgba(72,255,155,.7); }

/* POWER UP HUD */

#power-hud{`,
'skill HUD CSS'
);

// ============================================================
// 4. SKILL JAVASCRIPT — State + Fonksiyonlar + Update
// ============================================================
rep(
`function updateCombatDirector(dt){
  Game.director+=dt;
  if(!Game._formationCd)Game._formationCd=12;`,
`/* ============================================================
   ACTIVE SKILL SİSTEMİ
============================================================ */
window.ACTIVE_SKILLS={
  burst: {maxCd:30,  cd:30,  unlockLevel:3,  color:'#22e6ff', label:'BURST'},
  meteor:{maxCd:60,  cd:60,  unlockLevel:6,  color:'#ff6020', label:'METEOR'},
  heal:  {maxCd:120, cd:120, unlockLevel:1,  color:'#48ff9b', label:'HEAL'},
};
const CIRC=113; /* SVG ring stroke-dasharray */

function updateActiveSkillHUD(){
  if(!window.ACTIVE_SKILLS)return;
  const lv=Game.level||0;
  let anyOn=false;
  for(const[key,sk] of Object.entries(window.ACTIVE_SKILLS)){
    const el=document.getElementById('sk-'+key);
    const cdEl=document.getElementById('sk-'+key+'-cd');
    const ring=el&&el.querySelector('.sk-ring-fill');
    if(!el)continue;
    const unlocked=lv>=sk.unlockLevel;
    const ready=unlocked&&sk.cd<=0;
    el.classList.toggle('locked',!unlocked);
    el.classList.toggle('ready',ready);
    el.classList.toggle('cooling',unlocked&&!ready);
    if(ring){
      const pct=unlocked?Math.max(0,sk.cd/sk.maxCd):1;
      ring.style.strokeDashoffset=CIRC*pct;
    }
    if(cdEl){
      if(!unlocked) cdEl.textContent='LV'+sk.unlockLevel;
      else if(ready) cdEl.textContent='HAZIR';
      else cdEl.textContent=Math.ceil(sk.cd)+'s';
    }
    if(unlocked)anyOn=true;
  }
  const hub=document.getElementById('nvx-active-skills');
  if(hub)hub.classList.toggle('on',Game.state===STATE.PLAYING&&anyOn);
}

function fireSkillBurst(){
  const sk=window.ACTIVE_SKILLS.burst;
  if(!sk||sk.cd>0||Game.level<sk.unlockLevel)return;
  sk.cd=sk.maxCd;
  /* 16 yön neon top sağanağı */
  const count=12+Math.floor(Game.level/3);
  for(let i=0;i<count;i++){
    const a=(i/count)*TAU;
    const p=projectiles.get();
    p.x=player.x; p.y=player.y;
    const spd=420+Game.level*8;
    p.vx=Math.cos(a)*spd; p.vy=Math.sin(a)*spd;
    p.r=5; p.life=1.6; p.damage=0.9+Game.level*0.05;
    p.type='pulse'; p.color='#22e6ff'; p.pierce=2; p.chain=0;
  }
  /* Efekt */
  ringBurst(player.x,player.y,16,120,'#22e6ff',.55,4);
  emit(player.x,player.y,30,'#22e6ff',320,4,.5);
  popText(player.x,player.y-40,'BURST!','#22e6ff',16);
  vibrate(12);
}

function fireSkillMeteor(){
  const sk=window.ACTIVE_SKILLS.meteor;
  if(!sk||sk.cd>0||Game.level<sk.unlockLevel)return;
  sk.cd=sk.maxCd;
  const count=8+Math.floor(Game.level/4);
  window._meteors=window._meteors||[];
  for(let i=0;i<count;i++){
    const tx=rand(40,W-40);
    const ty=rand(H*0.1,H*0.75);
    /* Gecikmiş meteor */
    setTimeout(()=>{
      if(Game.state!==STATE.PLAYING)return;
      window._meteors.push({x:tx-80,y:-60,tx,ty,vx:80,vy:280+Math.random()*120,r:9+Math.random()*5,life:1.4,born:performance.now()/1000});
      emit(tx,ty,18,'#ff4010',200,3.5,.55);
      ringBurst(tx,ty,8,55,'#ff6020',.4,3.5);
      enemies.forEach(e=>{
        if(Math.hypot(e.x-tx,e.y-ty)<60)damageEnemy(e,2.2+Game.level*0.08,'#ff4010','meteor');
      });
    },i*180+Math.random()*120);
  }
  popText(player.x,player.y-40,'METEOR!','#ff6020',16);
  vibrate(18);
}

function fireSkillHeal(){
  const sk=window.ACTIVE_SKILLS.heal;
  if(!sk||sk.cd>0||Game.level<sk.unlockLevel)return;
  if(player.hp>=player.hpMax)return; /* Zaten tam can */
  sk.cd=sk.maxCd;
  player.hp=Math.min(player.hpMax,player.hp+1);
  emit(player.x,player.y,22,'#48ff9b',180,3,.55);
  ringBurst(player.x,player.y,10,80,'#48ff9b',.5,3);
  popText(player.x,player.y-40,'+1 CAN','#48ff9b',16);
  /* HUD güncelle */
  try{if(typeof updateHullHUD==='function')updateHullHUD();}catch(e){}
  vibrate(8);
}

function drawMeteors(){
  if(!window._meteors||!window._meteors.length)return;
  const now=performance.now()/1000;
  window._meteors=window._meteors.filter(m=>{
    m.x+=m.vx*(1/60); m.y+=m.vy*(1/60);
    m.life-=(1/60);
    if(m.life<=0||m.y>H+60)return false;
    const k=Math.min(1,m.life/0.4);
    ctx.save();
    ctx.translate(m.x,m.y);
    ctx.rotate(Math.atan2(m.vy,m.vx));
    /* Ateş kuyruğu */
    const fg=ctx.createLinearGradient(-m.r*4,0,0,0);
    fg.addColorStop(0,'rgba(255,60,0,0)'); fg.addColorStop(0.5,'rgba(255,120,20,0.5)'); fg.addColorStop(1,'rgba(255,200,60,0.8)');
    ctx.globalAlpha=k*0.85; ctx.fillStyle=fg;
    ctx.beginPath(); ctx.ellipse(-m.r*2,0,m.r*3.5,m.r*0.9,0,0,TAU); ctx.fill();
    /* Taş gövde */
    ctx.shadowColor='#ff3000'; ctx.shadowBlur=20;
    ctx.fillStyle='#c03010'; ctx.globalAlpha=k;
    ctx.beginPath(); ctx.arc(0,0,m.r,0,TAU); ctx.fill();
    ctx.fillStyle='#ff6020'; ctx.globalAlpha=k*0.7;
    ctx.beginPath(); ctx.arc(-m.r*0.3,-m.r*0.3,m.r*0.5,0,TAU); ctx.fill();
    ctx.restore();
    return true;
  });
}

/* Skill buton dokunma olayı */
(function(){
  function onSkillTap(e){
    e.preventDefault(); e.stopPropagation();
    const sk=e.currentTarget.dataset.sk;
    if(sk==='burst')fireSkillBurst();
    else if(sk==='meteor')fireSkillMeteor();
    else if(sk==='heal')fireSkillHeal();
  }
  document.addEventListener('DOMContentLoaded',function(){
    document.querySelectorAll('.nvx-sk').forEach(el=>{
      el.addEventListener('pointerdown',onSkillTap,{passive:false});
    });
  });
})();

function updateCombatDirector(dt){
  Game.director+=dt;
  if(!Game._formationCd)Game._formationCd=12;`,
'skill system JS'
);

// ============================================================
// 5. Cooldown güncelleme — game update loop'una ekle
// ============================================================
rep(
`    updatePowerHUD();
    updateWeaponHUD();
    updateWaveHUD();`,
`    updatePowerHUD();
    updateWeaponHUD();
    updateWaveHUD();
    /* Skill cooldown sayacı */
    if(window.ACTIVE_SKILLS){
      for(const sk of Object.values(window.ACTIVE_SKILLS)) sk.cd=Math.max(0,sk.cd-dt);
      updateActiveSkillHUD();
    }`,
'skill cooldown update in loop'
);

// Kaydet
fs.writeFileSync(FILE, html, 'utf8');
console.log('\n✅ Skill sistemi + mermi efekti uygulandı!');
