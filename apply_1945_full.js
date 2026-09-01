#!/usr/bin/env node
'use strict';
const fs = require('fs');
const FILE = require('path').join(__dirname, 'www/index.html');
let html = fs.readFileSync(FILE, 'utf8');

function rep(old, nw, label) {
  if (!html.includes(old)) { console.error('❌ NOT FOUND:', label || old.slice(0,70).trim()); return false; }
  html = html.replace(old, nw);
  console.log('✅', label || old.slice(0,60).trim());
  return true;
}

// ================================================================
// 1. ENEMY BULLET POOL + TÜM DÜŞMAN ATEŞ SİSTEMİ
// ================================================================
rep(
`/* AUTO WEAPON PROJECTILES */
const projectiles=Pool(()=>({
  alive:false,`,
`/* ====================================================
   DÜŞMAN MERMİ HAVUZU (1945 stili - aşağı inen mermiler)
==================================================== */
const enemyBullets=Pool(()=>({
  alive:false, x:0, y:0, vx:0, vy:0, r:3.5, color:'#ff3040', damage:1, life:0, pattern:'single', _twitch:Math.random()*TAU
}));

/* Tek düşman mermisi ateşle */
function fireEB(e, nx, ny, spd, color, r){
  const b=enemyBullets.get();
  b.x=e.x+(Math.random()-0.5)*e.r*0.5;
  b.y=e.y+e.r*0.6;
  b.vx=nx*spd; b.vy=ny*spd;
  b.r=r||3.5; b.color=color; b.life=3.2; b.damage=1;
}

/* Düşman tipi bazlı ateş deseni */
function enemyShoot(e){
  if(!e.alive||e.y<-e.r||e.y>H+20)return;
  if(e.boss){bossFire(e);return;}
  if(e.elite){eliteFire(e);return;}

  const t=e.type;
  /* 0 SCOUT DRONE — tek hızlı plazma atışı */
  if(t===0){
    fireEB(e,0,1,340,'#ff2040',3);

  /* 1 ASSAULT MECH — 3'lü spread burst */
  }else if(t===1){
    for(let i=-1;i<=1;i++){
      const a=i*0.22;
      fireEB(e,Math.sin(a),Math.cos(a),280,'#ff6020',3.5);
    }

  /* 2 ORBITAL STRIKER — hedef kilitli hassas atış */
  }else if(t===2){
    const dx=player.x-e.x, dy=player.y-e.y;
    const d=Math.hypot(dx,dy)||1;
    fireEB(e,dx/d,dy/d,260,'#c040ff',4);
    /* Küçük yan mermiler */
    fireEB(e,(dx/d)*0.8-dy/d*0.25,(dy/d)*0.8+dx/d*0.25,220,'#a030dd',2.5);
    fireEB(e,(dx/d)*0.8+dy/d*0.25,(dy/d)*0.8-dx/d*0.25,220,'#a030dd',2.5);

  /* 3 RUSH UNIT — çift hızlı atış */
  }else if(t===3){
    fireEB(e,-0.12,1,420,'#ff1060',3);
    fireEB(e, 0.12,1,420,'#ff1060',3);

  /* 4 SCATTER UNIT — 5'li yelpaze */
  }else{
    for(let i=-2;i<=2;i++){
      const a=i*0.18;
      fireEB(e,Math.sin(a),Math.cos(a),240,'#30ff80',3);
    }
  }
}

function eliteFire(e){
  /* Elite: Hızlı üçlü + hedef kilitli */
  const dx=player.x-e.x, dy=player.y-e.y;
  const d=Math.hypot(dx,dy)||1;
  fireEB(e,dx/d,dy/d,400,'#ffe340',4.5);
  fireEB(e,dx/d-0.18,dy/d,360,'#ffaa00',3);
  fireEB(e,dx/d+0.18,dy/d,360,'#ffaa00',3);
}

function bossFire(e){
  /* Boss ateş fazları */
  const phase=e.bossPhase||1;
  const tier=e.bossTier||1;
  const dx=player.x-e.x, dy=player.y-e.y;
  const d=Math.hypot(dx,dy)||1;
  const t=performance.now()/1000;

  if(phase===1){
    /* Faz 1: Dairesel sarmal + hedef kilitli */
    const count=6+tier;
    for(let i=0;i<count;i++){
      const a=(i/count)*TAU+t*0.8;
      fireEB(e,Math.cos(a),Math.sin(a),200,'#ff3b6b',5);
    }
    /* Hedef kilitli çift mermi */
    fireEB(e,dx/d,dy/d,320,'#ff6b3b',5);
    fireEB(e,dx/d,dy/d-0.15,300,'#ff9b2b',4);

  }else if(phase===2){
    /* Faz 2: Çarpraz yelpaze sağanağı */
    const count=8+tier*2;
    for(let i=0;i<count;i++){
      const a=(i/count)*TAU+t*1.4;
      fireEB(e,Math.cos(a),Math.sin(a),260,'#ff1040',5.5);
    }
    /* Hızlı hedef kilitli */
    for(let i=-1;i<=1;i++){
      const a2=i*0.14;
      fireEB(e,Math.sin(a2+Math.atan2(dy,dx)),Math.cos(a2+Math.atan2(dy,dx))*0.8,380,'#ff4080',4.5);
    }

  }else{
    /* Faz 3: Tam ekran halı bombalama */
    const count=12+tier*3;
    for(let i=0;i<count;i++){
      const a=(i/count)*TAU+t*2.2;
      fireEB(e,Math.cos(a),Math.sin(a),320,'#ff0020',6);
    }
    /* Merkeze yaklaşık hassas sağanak */
    for(let i=0;i<4;i++){
      const offset=(i/4)*TAU+t*0.5;
      fireEB(e,Math.cos(offset)*0.6+dx/d*0.4, Math.sin(offset)*0.6+dy/d*0.4, 420,'#ff80ff',4);
    }
  }
}

/* AUTO WEAPON PROJECTILES */
const projectiles=Pool(()=>({
  alive:false,`,
'enemy bullet pool + fire system'
);

// ================================================================
// 2. ENEMY SHOOT CD — updateEnemy içinde çağır
//    "e.x+=e.vx*dt; e.y+=e.vy*dt;" sonrasına ekle
// ================================================================
rep(
`  /* Yatay sınır: ekrandan çıkmasın (x bounce) */
  if(!e.boss){
    if(e.x<e.r){e.x=e.r;e.vx=Math.abs(e.vx);}
    if(e.x>W-e.r){e.x=W-e.r;e.vx=-Math.abs(e.vx);}
  }

  e.ang=(e.ang||0)+dt*(2.2+e.type*0.55);`,
`  /* Yatay sınır: ekrandan çıkmasın (x bounce) */
  if(!e.boss){
    if(e.x<e.r){e.x=e.r;e.vx=Math.abs(e.vx);}
    if(e.x>W-e.r){e.x=W-e.r;e.vx=-Math.abs(e.vx);}
  }

  /* 1945 — Düşman ateş zamanlayıcısı */
  if(e.y>0 && e.y<H*0.9){
    /* Ekrandaysa ateş et */
    const baseCD = e.boss?0.9 : e.elite?0.7 : [1.6,1.9,2.2,1.4,1.8][e.type]||1.8;
    const waveScale=Math.max(0.45, 1-((Game.wave||1)-1)*0.04);
    e._scd=(e._scd||baseCD*waveScale)-dt;
    if(e._scd<=0){
      e._scd=baseCD*waveScale*(0.88+Math.random()*0.24);
      enemyShoot(e);
    }
  }

  e.ang=(e.ang||0)+dt*(2.2+e.type*0.55);`,
'enemy shoot CD in updateEnemy'
);

// ================================================================
// 3. updateEnemyBullets + drawEnemyBullets
// ================================================================
rep(
`function drawMeteors(){`,
`/* Düşman mermisi güncelleme */
function updateEnemyBullets(dt){
  enemyBullets.forEach(b=>{
    b.life-=dt;
    if(b.life<=0){b.alive=false;return;}
    b.x+=b.vx*dt; b.y+=b.vy*dt;
    /* Ekran dışı */
    if(b.x<-40||b.x>W+40||b.y<-40||b.y>H+80){b.alive=false;return;}
    /* Oyuncuya çarpış */
    if(Game.state===STATE.PLAYING && player.invuln<=0){
      const d=Math.hypot(b.x-player.x,b.y-player.y);
      if(d<b.r+BALANCE.player.radius-2){
        b.alive=false;
        Game.damage();
      }
    }
  });
}

/* Düşman mermisi çizim — Neon plazma topları */
function drawEnemyBullets(){
  const t2=performance.now()/1000;
  enemyBullets.forEach(b=>{
    if(!b.alive)return;
    ctx.save();
    ctx.translate(b.x,b.y);
    const ang=Math.atan2(b.vy,b.vx);
    ctx.rotate(ang);
    const spd=Math.hypot(b.vx,b.vy);
    const trailL=Math.min(spd*0.028,20);
    const k=Math.min(1,b.life/0.5);

    /* İz */
    const tg=ctx.createLinearGradient(-trailL,0,0,0);
    tg.addColorStop(0,'rgba(0,0,0,0)');
    tg.addColorStop(1,b.color.replace(')',' , 0.45)').replace('rgb','rgba').replace('##','#'));
    ctx.globalAlpha=0.5*k;
    ctx.fillStyle=tg;
    ctx.beginPath(); ctx.ellipse(-trailL*0.5,0,trailL,b.r*0.55,0,0,TAU); ctx.fill();

    /* Ana gövde */
    ctx.globalAlpha=k;
    ctx.shadowColor=b.color; ctx.shadowBlur=14;
    ctx.fillStyle=b.color;
    ctx.beginPath(); ctx.arc(0,0,b.r,0,TAU); ctx.fill();

    /* Parlak çekirdek */
    ctx.shadowBlur=6; ctx.fillStyle='#ffffff'; ctx.globalAlpha=0.75*k;
    ctx.beginPath(); ctx.arc(b.r*0.1,0,b.r*0.42,0,TAU); ctx.fill();

    ctx.restore();
  });
}

function drawMeteors(){`,
'updateEnemyBullets + drawEnemyBullets'
);

// ================================================================
// 4. Render loop'a drawEnemyBullets ekle
// ================================================================
rep(
`  drawWeapons();
  drawEnemies();
  drawRings();`,
`  drawWeapons();
  drawEnemyBullets();
  drawEnemies();
  drawRings();`,
'drawEnemyBullets in render loop'
);

// ================================================================
// 5. Update loop'a updateEnemyBullets ekle
// ================================================================
rep(
`    updateOrbs(dt);

    updatePowerups(dt);`,
`    updateEnemyBullets(dt);

    updateOrbs(dt);

    updatePowerups(dt);`,
'updateEnemyBullets in update loop'
);

// ================================================================
// 6. POWER CORE SISTEMI — Düşman dropları + silah gücü
// ================================================================
rep(
`const powerups=Pool(()=>({
  alive:false,
  x:0,
  y:0,
  type:"",
  t:0,
  r:BALANCE.power.radius
}));`,
`const powerups=Pool(()=>({
  alive:false,
  x:0,
  y:0,
  type:"",
  t:0,
  r:BALANCE.power.radius,
  vy:0,         /* Drop için: aşağı kayma */
  _drop:false   /* Düşman dropu mu? */
}));

/* Oyunun silah gücü (1-5, 1945 P sistemi) */
if(typeof Game!=='undefined')Game.weaponPower=1;`,
'powerups pool + weaponPower state'
);

// ================================================================
// 7. Drop fonksiyonları + activatePower'a powerCore ekle
// ================================================================
rep(
`function activatePower(type){`,
`/* 1945 — Düşmandan drop spawn */
function dropFromEnemy(x, y){
  const roll=Math.random();
  let type;
  if(roll<0.07)      type='powerCore'; /* %7 silah güç art. */
  else if(roll<0.11) type='shield';    /* %4 kalkan */
  else if(roll<0.14) type='nanoRepair';/* %3 can yenile */
  else return;                         /* %86 drop yok */

  const d=powerups.get();
  d.x=x+(Math.random()-0.5)*20;
  d.y=y;
  d.type=type;
  d.t=Math.random()*TAU;
  d._drop=true;
  d.vy=45+Math.random()*30; /* Aşağı yavaş kayar */
  d.r=12;
}

function activatePower(type){`,
'dropFromEnemy function'
);

// ================================================================
// 8. activatePower — powerCore + nanoRepair işle
// ================================================================
rep(
`  const c=
    POWER_INFO[type].color;`,
`  /* 1945 özel power'ları */
  if(type==='powerCore'){
    Game.weaponPower=Math.min(5,(Game.weaponPower||1)+1);
    emit(player.x,player.y,20,'#22e6ff',220,3,.6);
    ringBurst(player.x,player.y,10,80,'#22e6ff',.5,3);
    popText(player.x,player.y-38,'POWER UP! LV'+Game.weaponPower,'#22e6ff',15);
    updateWeaponPowerHUD();
    return;
  }
  if(type==='nanoRepair'){
    const healed=player.hp<player.hpMax;
    player.hp=Math.min(player.hpMax,player.hp+1);
    emit(player.x,player.y,18,'#48ff9b',180,3,.5);
    ringBurst(player.x,player.y,8,65,'#48ff9b',.45,2.5);
    popText(player.x,player.y-38,healed?'NANO REPAIR +1':' HP FULL ','#48ff9b',13);
    try{if(typeof updateHullHUD==='function')updateHullHUD();}catch(er){}
    return;
  }

  const c=
    POWER_INFO[type]&&POWER_INFO[type].color||'#22e6ff';`,
'activatePower powerCore + nanoRepair'
);

// ================================================================
// 9. updatePowerups — drop'lar aşağı kayar + pick up mantığı
// ================================================================
rep(
`  powerups.forEach(p=>{

    p.t+=dt*2;

    const d=
      Math.hypot(
        player.x-p.x,
        player.y-p.y
      );

    if(
      d<
      BALANCE.player.radius+
      p.r+
      5
    ){

      p.alive=false;

      activatePower(
        p.type
      );

    }

  });`,
`  powerups.forEach(p=>{
    p.t+=dt*2;
    /* Drop ise aşağı kayar */
    if(p._drop){
      p.y+=p.vy*dt;
      if(p.y>H+40){p.alive=false;return;}
    }
    const d=Math.hypot(player.x-p.x,player.y-p.y);
    if(d<BALANCE.player.radius+p.r+5){
      p.alive=false;
      activatePower(p.type);
    }
  });`,
'updatePowerups drop scroll'
);

// ================================================================
// 10. drawPowerups — Power Core çizimi ekle
// ================================================================
rep(
`function drawPowerups(){

  powerups.forEach(p=>{`,
`/* Silah gücü HUD güncelle */
function updateWeaponPowerHUD(){
  const el=document.getElementById('nvx-wp-level');
  if(el)el.textContent='LV'+(Game.weaponPower||1);
  const bar=document.getElementById('nvx-wp-bar');
  if(bar)bar.style.width=(((Game.weaponPower||1)-1)/4*100)+'%';
}

function drawPowerups(){
  powerups.forEach(p=>{`,
'drawPowerups + updateWeaponPowerHUD'
);

// ================================================================
// 11. damageEnemy kill block — drop çağrısı ekle
// ================================================================
rep(
`    }else{
      const reward=25*(e.type===1?2:1);
      Game.score+=reward*Game.combo;
      Game.chain++;
      Game.combo=clamp(1+Math.floor(Game.chain/3),1,BALANCE.economy.comboMax);
      Game.maxCombo=Math.max(Game.maxCombo,Game.combo);
      Game.comboTimer=BALANCE.economy.comboWindowSec;
      Game.energy+=e.type===1?2:1;
      emit(e.x,e.y,12,enemyPaint(e).core,180,3,.5);
      if(window.RPG_onEnemyKilled)window.RPG_onEnemyKilled(e);
      ringBurst(e.x,e.y,e.r*.4,e.r*1.9,enemyPaint(e).edge,.34,2);
      popText(e.x,e.y-12,"+"+reward,enemyPaint(e).core,12);
      Audio_.power();
    }`,
`    }else{
      const reward=25*(e.type===1?2:1);
      Game.score+=reward*Game.combo;
      Game.chain++;
      Game.combo=clamp(1+Math.floor(Game.chain/3),1,BALANCE.economy.comboMax);
      Game.maxCombo=Math.max(Game.maxCombo,Game.combo);
      Game.comboTimer=BALANCE.economy.comboWindowSec;
      Game.energy+=e.type===1?2:1;
      emit(e.x,e.y,12,enemyPaint(e).core,180,3,.5);
      if(window.RPG_onEnemyKilled)window.RPG_onEnemyKilled(e);
      ringBurst(e.x,e.y,e.r*.4,e.r*1.9,enemyPaint(e).edge,.34,2);
      popText(e.x,e.y-12,"+"+reward,enemyPaint(e).core,12);
      Audio_.power();

      /* 1945 — Düşman dropu */
      dropFromEnemy(e.x, e.y);

      /* Dalga öldürme sayacı */
      Game._waveKills=(Game._waveKills||0)+1;
      const waveTarget=15+Math.floor((Game.wave||1)*2.5);
      if(Game._waveKills>=waveTarget){
        Game._waveKills=0;
        popText(W/2,H*0.38,'DALGA TEMİZLENDİ!','#22e6ff',18);
        ringBurst(W/2,H*0.4,20,120,'#22e6ff',.6,5);
        emit(W/2,H*0.4,30,'#22e6ff',280,4,.7);
        /* Silah gücü bonusu: her 3 dalgada +1 */
        if((Game.wave||1)%3===0 && (Game.weaponPower||1)<5){
          setTimeout(()=>{ Game.weaponPower=Math.min(5,(Game.weaponPower||1)+1); updateWeaponPowerHUD(); }, 600);
        }
      }
    }`,
'damageEnemy drop + wave kill counter'
);

// ================================================================
// 12. fireProjectile — Game.weaponPower bazlı spread
// ================================================================
rep(
`  /* Spread shot: seviyeye göre yan mermiler */
  const shots=level>=4?3:level>=2?2:1;
  const spreadAngle=level>=4?0.18:0.12;`,
`  /* 1945 Weapon Power: silah gücü bazlı ateş deseni */
  const wp=Game.weaponPower||1;
  const shots=wp>=5?5:wp>=4?4:wp>=3?3:wp>=2?2:1;
  const spreadAngle=wp>=5?0.22:wp>=4?0.18:wp>=3?0.14:0.10;`,
'fireProjectile weaponPower spread'
);

// ================================================================
// 13. Silah Gücü HUD + Power Core görsel
// ================================================================
rep(
`<!-- ACTIVE SKILL HUD — 3 in-game skills -->`,
`<!-- WEAPON POWER HUD — 1945 P sistemi -->
<div id="nvx-weapon-power">
  <div id="nvx-wp-label">POWER</div>
  <div id="nvx-wp-level">LV1</div>
  <div id="nvx-wp-track"><div id="nvx-wp-bar" style="width:0%"></div></div>
</div>
<!-- ACTIVE SKILL HUD — 3 in-game skills -->`,
'weapon power HUD HTML'
);

rep(
`/* ============ ACTIVE SKILL BUTTONS ============ */`,
`/* ============ WEAPON POWER HUD ============ */
#nvx-weapon-power{
  position:absolute;
  left:10px;
  bottom:calc(env(safe-area-inset-bottom,0px)+18px);
  z-index:9;
  display:none;
  flex-direction:column;
  align-items:flex-start;
  gap:3px;
  pointer-events:none;
}
#nvx-weapon-power.on{ display:flex; }
#nvx-wp-label{
  font:700 6px 'IBM Plex Mono'; letter-spacing:.22em;
  color:rgba(34,230,255,.55);
}
#nvx-wp-level{
  font:800 18px 'Chakra Petch'; color:#22e6ff;
  text-shadow:0 0 14px rgba(34,230,255,.7); line-height:1;
}
#nvx-wp-track{
  width:58px; height:4px; border-radius:99px;
  background:rgba(34,230,255,.12);
  border:1px solid rgba(34,230,255,.22); overflow:hidden;
}
#nvx-wp-bar{
  height:100%;
  background:linear-gradient(90deg,#22e6ff,#6040ff);
  transition:width .35s ease;
}
/* ============ ACTIVE SKILL BUTTONS ============ */`,
'weapon power HUD CSS'
);

// ================================================================
// 14. Weapon power HUD toggle (game state ile)
// ================================================================
rep(
`    if(window.ACTIVE_SKILLS){
      for(const sk of Object.values(window.ACTIVE_SKILLS)) sk.cd=Math.max(0,sk.cd-dt);
      updateActiveSkillHUD();
    }`,
`    if(window.ACTIVE_SKILLS){
      for(const sk of Object.values(window.ACTIVE_SKILLS)) sk.cd=Math.max(0,sk.cd-dt);
      updateActiveSkillHUD();
    }
    /* Weapon power HUD */
    const _wpEl=document.getElementById('nvx-weapon-power');
    if(_wpEl)_wpEl.classList.toggle('on',true);
    updateWeaponPowerHUD();`,
'weapon power HUD update in loop'
);

// ================================================================
// 15. Power Core drop görsel çizimi — drawPowerups içine
// ================================================================
rep(
`function drawPowerups(){
  powerups.forEach(p=>{`,
`function drawPowerups(){
  const _pt=performance.now()/1000;
  powerups.forEach(p=>{
    /* Power Core özel görsel */
    if(p.type==='powerCore'){
      ctx.save();
      ctx.translate(p.x,p.y+(Math.sin(_pt*2.8+p.t)*4));
      const _pulse=(Math.sin(_pt*3.8+p.t)+1)*0.5;
      /* Hex glow */
      ctx.shadowColor='#22e6ff'; ctx.shadowBlur=22+_pulse*10;
      ctx.globalAlpha=0.85+_pulse*0.15;
      /* Altıgen */
      ctx.beginPath();
      for(let i=0;i<6;i++){
        const a=i/6*TAU-TAU/12;
        const r=10+_pulse*2;
        i===0?ctx.moveTo(Math.cos(a)*r,Math.sin(a)*r):ctx.lineTo(Math.cos(a)*r,Math.sin(a)*r);
      }
      ctx.closePath();
      ctx.strokeStyle='#22e6ff'; ctx.lineWidth=2; ctx.stroke();
      ctx.fillStyle='rgba(34,230,255,0.18)'; ctx.fill();
      /* P harfi */
      ctx.fillStyle='#eafeff'; ctx.font='bold 9px IBM Plex Mono';
      ctx.textAlign='center'; ctx.textBaseline='middle';
      ctx.fillText('P',0,0);
      ctx.restore();
      return;
    }
    /* Nano Repair özel görsel */
    if(p.type==='nanoRepair'){
      ctx.save();
      ctx.translate(p.x,p.y+(Math.sin(_pt*2.4+p.t)*4));
      const _pulse=(Math.sin(_pt*3.2+p.t)+1)*0.5;
      ctx.shadowColor='#48ff9b'; ctx.shadowBlur=18+_pulse*8;
      ctx.strokeStyle='#48ff9b'; ctx.lineWidth=2.5; ctx.globalAlpha=0.9+_pulse*0.1;
      ctx.beginPath(); ctx.moveTo(0,-9); ctx.lineTo(0,9); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(-9,0); ctx.lineTo(9,0); ctx.stroke();
      ctx.beginPath(); ctx.arc(0,0,10,0,TAU); ctx.stroke();
      ctx.restore();
      return;
    }`,
'drawPowerups power core visual'
);

// ================================================================
// 16. Boss'un mevcut güncelleme aşamalarına ateş ekle
//     (updateBossEnemy içinde ayrı cd)
// ================================================================
rep(
`  /* Boss giriş yavaşlaması: hedef Y'ye gelince dur */
  if(e.boss && e._bossEntryY && e.y<e._bossEntryY){
    /* Giriş fazı: aşağı in */
  }else if(e.boss && e._bossEntryY && e.vy>0 && e.y>=e._bossEntryY){
    e._bossEntryY=null; /* Giriş tamamlandı, boss AI devralır */
  }`,
`  /* Boss giriş yavaşlaması: hedef Y'ye gelince dur */
  if(e.boss && e._bossEntryY && e.y<e._bossEntryY){
    /* Giriş fazı: aşağı in — henüz ateş etme */
    e._scd=2.0;
  }else if(e.boss && e._bossEntryY && e.vy>0 && e.y>=e._bossEntryY){
    e._bossEntryY=null;
  }`,
'boss entry fire suppress'
);

// ================================================================
// 17. Game reset'te weaponPower sıfırla
// ================================================================
rep(
`  player.x=W/2;
  player.y=H*0.82; /* 1945 — Ekranın altı */`,
`  player.x=W/2;
  player.y=H*0.82;
  /* 1945 — Silah gücünü sıfırla */
  Game.weaponPower=1;
  Game._waveKills=0;
  updateWeaponPowerHUD();`,
'reset weaponPower on game start'
);

// ================================================================
// 18. Elite drop (daha değerli)
// ================================================================
rep(
`      emit(e.x,e.y,28,"#ffe34d",250,4,.8);
      ringBurst(e.x,e.y,e.r*.5,e.r*3.0,"#ffe34d",.5,4);
      popText(e.x,e.y-18,"ELITE +"+reward,"#ffe34d",14);
      Audio_.power();
      vibrate([18,25,18]);`,
`      emit(e.x,e.y,28,"#ffe34d",250,4,.8);
      ringBurst(e.x,e.y,e.r*.5,e.r*3.0,"#ffe34d",.5,4);
      popText(e.x,e.y-18,"ELITE +"+reward,"#ffe34d",14);
      Audio_.power();
      vibrate([18,25,18]);
      /* Elite her zaman power core düşürür */
      dropFromEnemy(e.x,e.y); dropFromEnemy(e.x,e.y);`,
'elite double drop'
);

// ================================================================
// 19. Boss drop — tam power level + nano repair
// ================================================================
rep(
`      popText(W/2,H*.25,"WARDEN YOK EDİLDİ","#ffe34d",20);
      Audio_.power();
      vibrate([40,50,40,70]);`,
`      popText(W/2,H*.25,"WARDEN YOK EDİLDİ","#ffe34d",20);
      Audio_.power();
      vibrate([40,50,40,70]);
      /* Boss dropu: 3x power core + nano repair */
      for(let _bi=0;_bi<3;_bi++) dropFromEnemy(e.x+(_bi-1)*40,e.y);
      setTimeout(()=>dropFromEnemy(e.x,e.y+30),300);`,
'boss multi-drop'
);

// Kaydet
fs.writeFileSync(FILE, html, 'utf8');
console.log('\n✅ 1945 Full Integration tamamlandı!');
