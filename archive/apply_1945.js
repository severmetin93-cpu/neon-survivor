#!/usr/bin/env node
'use strict';
const fs = require('fs');
const path = require('path');

const FILE = path.join(__dirname, 'www/index.html');
let html = fs.readFileSync(FILE, 'utf8');
const lines = html.split('\n');

function replaceLines(startLine, endLine, newContent) {
  // 1-indexed
  lines.splice(startLine - 1, endLine - startLine + 1, ...newContent.split('\n'));
}

function replaceStr(oldStr, newStr) {
  if (!html.includes(oldStr)) {
    console.error('NOT FOUND:', oldStr.slice(0, 80));
    return false;
  }
  html = html.replace(oldStr, newStr);
  console.log('OK:', oldStr.slice(0, 60).trim());
  return true;
}

// ============================================================
// 1. BACKGROUND — Scrolling Space Starfield
// ============================================================
replaceStr(
`function drawBackground(dt){
  bgTime+=dt;
  const t=bgTime;
  const pal=SP();
  const A=pal.A; // "r,g,b"
  const B=pal.B;

  /* 1 — Sky gradient */
  const sky=ctx.createLinearGradient(0,0,0,H*.68);
  sky.addColorStop(0, "rgba("+A+",0.04)");
  sky.addColorStop(0.55,"rgba("+A+",0.01)");
  sky.addColorStop(1,  "rgba("+B+",0.08)");
  ctx.fillStyle=pal.base;
  ctx.fillRect(0,0,W,H);
  ctx.fillStyle=sky;
  ctx.fillRect(0,0,W,H*.68);

  /* 2 — Distant city silhouette */
  if(!_bgBuildings.length||_bgBuildings[0]&&_bgBuildings[0]._W!==W)
    _bgGenBuildings();
  const groundY=H*.62;
  ctx.save();
  ctx.globalAlpha=0.55;
  for(let i=0;i<_bgBuildings.length;i++){
    const b=_bgBuildings[i];
    const bx=b.x, bh=b.h*(0.9+0.1*Math.sin(t*.18+i)), by=groundY-bh;
    ctx.fillStyle="rgba("+A+",0.07)";
    ctx.fillRect(bx,by,b.w,bh);
    /* window lights */
    ctx.fillStyle="rgba("+A+",0.28)";
    for(let r=0;r<b.wh;r++){
      const wy=by+6+r*10;
      if(wy>groundY-4)continue;
      ctx.fillRect(bx+3,wy,3,2);
      if(b.w>14) ctx.fillRect(bx+b.w-7,wy,3,2);
    }
  }
  ctx.restore();

  /* 3 — Horizon glow */
  const hg=ctx.createLinearGradient(0,groundY-40,0,groundY+20);
  hg.addColorStop(0,"rgba("+A+",0.00)");
  hg.addColorStop(0.5,"rgba("+A+",0.22)");
  hg.addColorStop(1,"rgba("+A+",0.00)");
  ctx.fillStyle=hg;
  ctx.fillRect(0,groundY-40,W,60);

  /* 4 — Ground */
  const gr=ctx.createLinearGradient(0,groundY,0,H);
  gr.addColorStop(0,"rgba("+A+",0.06)");
  gr.addColorStop(1,"rgba(0,0,0,0.0)");
  ctx.fillStyle=gr;
  ctx.fillRect(0,groundY,W,H-groundY);

  /* 5 — Perspective scanlines on ground */
  ctx.save();
  ctx.globalAlpha=0.10;
  ctx.strokeStyle="rgba("+A+",1)";
  ctx.lineWidth=0.8;
  const vx=W/2, vy=groundY;
  for(let i=1;i<10;i++){
    const py=groundY+(H-groundY)*i/9;
    const spread=W*0.5*(i/9);
    ctx.beginPath();
    ctx.moveTo(vx-spread,py);
    ctx.lineTo(vx+spread,py);
    ctx.stroke();
    if(i%2===0){
      ctx.beginPath();
      ctx.moveTo(vx-(spread*i/9),groundY);
      ctx.lineTo(vx-spread,py);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(vx+(spread*i/9),groundY);
      ctx.lineTo(vx+spread,py);
      ctx.stroke();
    }
  }
  ctx.restore();`,
`function drawBackground(dt){
  bgTime+=dt;
  const t=bgTime;

  /* 1945 — UZAY ARKA PLANI: parallax yıldız alanı */

  /* Yıldız havuzlarını oluştur */
  if(!window._st1||window._st1._W!==W){
    window._st1=Object.assign(Array.from({length:70},()=>({x:Math.random()*W,y:Math.random()*H,r:0.4+Math.random()*0.6,b:0.3+Math.random()*0.5})),{_W:W});
    window._st2=Object.assign(Array.from({length:35},()=>({x:Math.random()*W,y:Math.random()*H,r:0.7+Math.random()*1.1,b:0.5+Math.random()*0.5})),{_W:W});
    window._st3=Object.assign(Array.from({length:16},()=>({x:Math.random()*W,y:Math.random()*H,r:1.1+Math.random()*1.8,b:0.7+Math.random()*0.3,s:Math.random()*TAU})),{_W:W});
    window._bgScroll=0;
  }
  window._bgScroll=(window._bgScroll||0)+dt*72;

  /* Uzay tabanı */
  ctx.fillStyle='#020409';
  ctx.fillRect(0,0,W,H);

  /* Nebula glow 1 */
  const nbPulse=0.028+0.012*Math.sin(t*0.38);
  const ng1=ctx.createRadialGradient(W*0.28,H*0.22,0,W*0.28,H*0.22,W*0.65);
  ng1.addColorStop(0,'rgba(55,18,115,'+nbPulse*2.5+')');
  ng1.addColorStop(1,'rgba(0,0,0,0)');
  ctx.fillStyle=ng1; ctx.fillRect(0,0,W,H);

  /* Nebula glow 2 */
  const ng2=ctx.createRadialGradient(W*0.72,H*0.55,0,W*0.72,H*0.55,W*0.5);
  ng2.addColorStop(0,'rgba(18,55,115,'+nbPulse+')');
  ng2.addColorStop(1,'rgba(0,0,0,0)');
  ctx.fillStyle=ng2; ctx.fillRect(0,0,W,H);

  /* Katman 1: Uzak yavaş yıldızlar */
  const sc=window._bgScroll;
  window._st1.forEach(s=>{
    const y=(s.y+sc*0.12)%H;
    ctx.globalAlpha=s.b*(0.7+0.3*Math.sin(t*1.2+s.x));
    ctx.fillStyle='#c8d4ff';
    ctx.beginPath(); ctx.arc(s.x,y,s.r,0,TAU); ctx.fill();
  });

  /* Katman 2: Orta yıldızlar */
  window._st2.forEach(s=>{
    const y=(s.y+sc*0.32)%H;
    ctx.globalAlpha=s.b*(0.8+0.2*Math.sin(t*0.9+s.x*0.03));
    ctx.fillStyle='#dce8ff';
    ctx.beginPath(); ctx.arc(s.x,y,s.r,0,TAU); ctx.fill();
  });

  /* Katman 3: Yakın parlak yıldızlar + streak */
  window._st3.forEach(s=>{
    const y=(s.y+sc*0.68)%H;
    ctx.globalAlpha=s.b;
    ctx.fillStyle='#ffffff';
    ctx.beginPath(); ctx.arc(s.x,y,s.r,0,TAU); ctx.fill();
    /* Hareket izi */
    ctx.globalAlpha=s.b*0.3;
    ctx.strokeStyle='#ffffff';
    ctx.lineWidth=s.r*0.6;
    ctx.lineCap='round';
    ctx.beginPath(); ctx.moveTo(s.x,y); ctx.lineTo(s.x,y-sc*0.68*0.08); ctx.stroke();
  });
  ctx.globalAlpha=1;`
);

// ============================================================
// 2. Background vignette (end of drawBackground) — keep it
// ============================================================
replaceStr(
`  ctx.restore();

  /* 6 — Ambient center glow (breathing) */`,
`  /* 6 — Ambient center glow (breathing) */`
);

// ============================================================
// 3. spawnEnemy — sadece üstten spawn + aşağı velocity
// ============================================================
replaceStr(
`  /* Savaş yönetmeni: giriş yönlerini dengeli döndürür. */
  const side=(Game.directorSide + Math.floor(Math.random()*2))%4;
  Game.directorSide=(Game.directorSide+1)%4;

  if(side===0){
    e.x=rand(0,W);
    e.y=-margin;
  }else if(side===1){
    e.x=W+margin;
    e.y=rand(0,H);
  }else if(side===2){
    e.x=rand(0,W);
    e.y=H+margin;
  }else{
    e.x=-margin;
    e.y=rand(0,H);
  }`,
`  /* 1945 — Düşmanlar sadece üstten girer */
  e.x=rand(margin, W-margin);
  e.y=-margin-rand(0,40);`
);

replaceStr(
`  const a=Math.atan2(
    player.y-e.y,
    player.x-e.x
  );

  const speed=
    BALANCE.enemy.baseSpeed*
    m.speed*
    lateGamePressure(level);

  e.vx=Math.cos(a)*speed;
  e.vy=Math.sin(a)*speed;

}

function updateEliteEnemy`,
`  const speed=BALANCE.enemy.baseSpeed*m.speed*lateGamePressure(level);
  /* 1945 — Aşağı iner, hafif X sapma */
  e.vx=(Math.random()-0.5)*speed*0.28;
  e.vy=speed*(0.72+Math.random()*0.36);
  e._seed=Math.random()*TAU;

}

function updateEliteEnemy`
);

// ============================================================
// 4. spawnElite — sadece üstten
// ============================================================
replaceStr(
`  const side=(Game.directorSide+Math.floor(Math.random()*2))%4;
  Game.directorSide=(Game.directorSide+1)%4;

  if(side===0){e.x=rand(0,W);e.y=-margin;}
  else if(side===1){e.x=W+margin;e.y=rand(0,H);}
  else if(side===2){e.x=rand(0,W);e.y=H+margin;}
  else {e.x=-margin;e.y=rand(0,H);}`,
`  /* 1945 — Elite de üstten girer */
  e.x=rand(margin, W-margin);
  e.y=-margin;`
);

replaceStr(
`  const a=Math.atan2(player.y-e.y,player.x-e.x);
  const speed=
    BALANCE.enemy.baseSpeed*
    1.08*
    lateGamePressure(level);
  e.vx=Math.cos(a)*speed;
  e.vy=Math.sin(a)*speed;

  emit(e.x,e.y,18,"#ffe34d",180,3.2,.7);`,
`  const speed=BALANCE.enemy.baseSpeed*1.08*lateGamePressure(level);
  e.vx=(Math.random()-0.5)*speed*0.25;
  e.vy=speed*0.85;
  e._seed=Math.random()*TAU;

  emit(e.x,e.y,18,"#ffe34d",180,3.2,.7);`
);

// ============================================================
// 5. spawnBoss — üstten merkeze giriş
// ============================================================
replaceStr(
`  const margin=90;
  const side=Game.directorSide%4;
  Game.directorSide=(Game.directorSide+1)%4;

  if(side===0){e.x=W*.5;e.y=-margin;}
  else if(side===1){e.x=W+margin;e.y=H*.5;}
  else if(side===2){e.x=W*.5;e.y=H+margin;}
  else {e.x=-margin;e.y=H*.5;}`,
`  /* 1945 — Boss üstten iner */
  e.x=W*0.5;
  e.y=-90;`
);

replaceStr(
`  const a=Math.atan2(player.y-e.y,player.x-e.x);
  const speed=
    BALANCE.enemy.baseSpeed*
    (.54+bossTier*.022)*
    (1+(Game.level-1)*.018);

  e.vx=Math.cos(a)*speed;
  e.vy=Math.sin(a)*speed;

  Game.bossActive=true;`,
`  const speed=BALANCE.enemy.baseSpeed*(.54+bossTier*.022)*(1+(Game.level-1)*.018);
  e.vx=0;
  e.vy=speed*0.6; /* Üstten yavaş giriş */
  e._bossEntryY=H*0.18; /* Hedef Y konumu */

  Game.bossActive=true;`
);

// ============================================================
// 6. updateEnemy — 1945 aşağı iniş AI
// ============================================================
replaceStr(
`  const dx=player.x-e.x;
  const dy=player.y-e.y;
  const dist=Math.hypot(dx,dy)||1;

  const speed=
    BALANCE.enemy.baseSpeed*
    m.speed*
    (1+(level-1)*BALANCE.enemy.speedPerLevel);

  e.t+=dt;
  e.hitFlash=Math.max(0,e.hitFlash-dt*5);

  /* HUNTER */
  if(e.type===0){

    const steer=.055;

    e.vx=lerp(
      e.vx,
      dx/dist*speed,
      steer
    );

    e.vy=lerp(
      e.vy,
      dy/dist*speed,
      steer
    );

  /* TANK */
  }else if(e.type===1){

    e.vx=lerp(
      e.vx,
      dx/dist*speed,
      .018
    );

    e.vy=lerp(
      e.vy,
      dy/dist*speed,
      .018
    );

  /* ORBITER */
  }else if(e.type===2){

    const tx=-dy/dist;
    const ty=dx/dist;

    const orbitStrength=
      dist<150 ? .92 : .72;

    e.vx=lerp(
      e.vx,
      (
        tx*e.orbit*orbitStrength+
        dx/dist*.45
      )*speed,
      .065
    );

    e.vy=lerp(
      e.vy,
      (
        ty*e.orbit*orbitStrength+
        dy/dist*.45
      )*speed,
      .065
    );

  /* DASHER */
  }else if(e.type===3){

    e.dashCd-=dt;

    if(e.telegraph>0){

      e.telegraph-=dt;

      /* Dash öncesi frenleme, oyuncuya okunabilir bir uyarı verir. */
      e.vx*=Math.pow(.88,dt*60);
      e.vy*=Math.pow(.88,dt*60);

      if(e.telegraph<=0){

        e.dashing=.38;

        e.dashCd=rand(1.7,2.7);

        const aimX=player.x-e.x;
        const aimY=player.y-e.y;
        const aimD=Math.hypot(aimX,aimY)||1;

        e.vx=aimX/aimD*speed*4.2;
        e.vy=aimY/aimD*speed*4.2;

        emit(
          e.x,e.y,
          10,
          m.color,
          160,
          2.8,
          .42
        );

        vibrate(10);

      }

    }else if(e.dashing>0){

      e.dashing-=dt;

      /* Dash sırasında yönü değiştirmez. */

    }else{

      e.vx=lerp(
        e.vx,
        dx/dist*speed*.42,
        .055
      );

      e.vy=lerp(
        e.vy,
        dy/dist*speed*.42,
        .055
      );

      if(
        e.dashCd<=0 &&
        dist<360
      ){

        e.telegraph=.42;

        e.vx*=.35;
        e.vy*=.35;

      }

    }

  /* WEAVER */
  }else{

    const wave=
      Math.sin(e.t*5.2+e.x*.008);

    const tx=-dy/dist;
    const ty=dx/dist;

    const weave=.82*wave;

    e.vx=lerp(
      e.vx,
      (
        dx/dist*.72+
        tx*weave
      )*speed,
      .075
    );

    e.vy=lerp(
      e.vy,
      (
        dy/dist*.72+
        ty*weave
      )*speed,
      .075
    );

  }

  e.x+=e.vx*dt;
  e.y+=e.vy*dt;

  e.ang=(e.ang||0)+dt*(2.2+e.type*.55);

  if(e.x<-180||e.x>W+180||e.y<-180||e.y>H+180){
    e.alive=false;
  }`,
`  const speed=
    BALANCE.enemy.baseSpeed*
    m.speed*
    (1+(level-1)*BALANCE.enemy.speedPerLevel);

  e.t+=dt;
  e.hitFlash=Math.max(0,e.hitFlash-dt*5);

  /* 1945 — Tüm tipler önce aşağı iner, tip bazlı yan hareket */

  /* HUNTER — düz aşağı, hafif X homing */
  if(e.type===0){
    const xErr=player.x-e.x;
    e.vx=lerp(e.vx, xErr*0.25, 0.045*dt*60);
    e.vy=lerp(e.vy, speed, 0.05*dt*60);

  /* TANK — yavaş köşegen, sinüs X */
  }else if(e.type===1){
    e.vx=lerp(e.vx, Math.sin(e.t*0.55+e._seed||0)*speed*0.45, 0.018*dt*60);
    e.vy=lerp(e.vy, speed*0.75, 0.018*dt*60);

  /* ORBITER — geniş sinüs dalgası aşağı */
  }else if(e.type===2){
    e.vx=Math.sin(e.t*2.6+(e._seed||0))*speed*1.05;
    e.vy=lerp(e.vy, speed*0.68, 0.05*dt*60);

  /* DASHER — aşağı süzülür, oyuncuya ani dash */
  }else if(e.type===3){
    e.dashCd-=dt;
    if(e.dashing>0){
      e.dashing-=dt;
    }else if(e.telegraph>0){
      e.telegraph-=dt;
      e.vx*=Math.pow(0.88,dt*60);
      e.vy*=Math.pow(0.88,dt*60);
      if(e.telegraph<=0){
        const aimX=player.x-e.x, aimY=player.y-e.y;
        const aimD=Math.hypot(aimX,aimY)||1;
        e.vx=aimX/aimD*speed*4.0;
        e.vy=aimY/aimD*speed*4.0;
        e.dashing=0.32;
        e.dashCd=rand(1.6,2.5);
        emit(e.x,e.y,10,m.color,160,2.8,0.4);
        vibrate(8);
      }
    }else{
      e.vx=lerp(e.vx,0,0.04*dt*60);
      e.vy=lerp(e.vy,speed*0.55,0.04*dt*60);
      if(e.dashCd<=0 && e.y>-20 && e.y<H*0.75){
        e.telegraph=0.38;
        e.vx*=0.3; e.vy*=0.3;
      }
    }

  /* WEAVER — zigzag aşağı */
  }else{
    const zigzag=Math.sin(e.t*4.8+(e._seed||0))*speed*0.92;
    e.vx=lerp(e.vx, zigzag, 0.08*dt*60);
    e.vy=lerp(e.vy, speed*0.65, 0.05*dt*60);
  }

  /* Boss giriş yavaşlaması: hedef Y'ye gelince dur */
  if(e.boss && e._bossEntryY && e.y<e._bossEntryY){
    /* Giriş fazı: aşağı in */
  }else if(e.boss && e._bossEntryY && e.vy>0 && e.y>=e._bossEntryY){
    e._bossEntryY=null; /* Giriş tamamlandı, boss AI devralır */
  }

  e.x+=e.vx*dt;
  e.y+=e.vy*dt;

  /* Yatay sınır: ekrandan çıkmasın (x bounce) */
  if(!e.boss){
    if(e.x<e.r){e.x=e.r;e.vx=Math.abs(e.vx);}
    if(e.x>W-e.r){e.x=W-e.r;e.vx=-Math.abs(e.vx);}
  }

  e.ang=(e.ang||0)+dt*(2.2+e.type*0.55);

  /* 1945 — Alttan çıkarsa öl (ekrandan geçti) */
  if(e.y>H+180||(e.x<-180||e.x>W+180)){
    e.alive=false;
  }`
);

// ============================================================
// 7. resetPlayer — oyuncu ekran altında başlar
// ============================================================
replaceStr(
`  player.x=W/2;
  player.y=H*.62;`,
`  player.x=W/2;
  player.y=H*0.82; /* 1945 — Ekranın altı */`
);

// ============================================================
// 8. inputMove — Y kısıtlaması: ekranın alt %55'i
// ============================================================
replaceStr(
`  player.y=
    clamp(
      player.y+dy*boost*TOUCH_SENSITIVITY,
      BALANCE.player.radius,
      H-BALANCE.player.radius
    );`,
`  /* 1945 — Oyuncu ekranın alt %55'inde kalır */
  player.y=
    clamp(
      player.y+dy*boost*TOUCH_SENSITIVITY,
      H*0.45+BALANCE.player.radius,
      H-BALANCE.player.radius
    );`
);

// ============================================================
// 9. fireProjectile — yukarı + spread shot
// ============================================================
replaceStr(
`  const p=projectiles.get();
  const dx=target.x-player.x,dy=target.y-player.y;
  const d=Math.hypot(dx,dy)||1;
  p.x=player.x; p.y=player.y;
  p.vx=dx/d*st.speed; p.vy=dy/d*st.speed;
  p.r=st.radius; p.life=1.8; p.damage=st.damage;
  p.type=key; p.color=w.color; p.pierce=st.pierce; p.chain=st.chain;
  emit(player.x,player.y,3,w.color,80,1.6,.18);
  /* NORYVX ATTACK state — muzzle bloom timer for drawPlayer. */
  player.lastFireAt=performance.now();
  player.lastFireDx=dx/d;
  player.lastFireDy=dy/d;
  player.lastFireColor=w.color;
}`,
`  /* 1945 — Önce yukarıdaki düşmanı hedef al, yoksa en yakın */
  const aboveTarget=function(){
    let best=null,bestScore=Infinity;
    enemies.forEach(e=>{
      if(!e.alive)return;
      const dy_=player.y-e.y; /* pozitif = düşman yukarıda */
      if(dy_<-20)return; /* Oyuncunun 20px altındakini yoksay */
      const score=Math.abs(e.x-player.x)*0.4+Math.abs(dy_);
      if(score<bestScore){bestScore=score;best=e;}
    });
    return best||target;
  }();

  const tx=aboveTarget.x-player.x, ty=aboveTarget.y-player.y;
  const td=Math.hypot(tx,ty)||1;
  /* Ağırlıklı yön: %75 hedefe, %25 düz yukarı */
  const dirX=tx/td*0.75;
  const dirY=Math.min(-0.15, ty/td*0.75-0.25); /* Her zaman yukarı bileşen */
  const dirD=Math.hypot(dirX,dirY)||1;
  const fdx=dirX/dirD, fdy=dirY/dirD;

  /* Spread shot: seviyeye göre yan mermiler */
  const shots=level>=4?3:level>=2?2:1;
  const spreadAngle=level>=4?0.18:0.12;

  for(let si=0;si<shots;si++){
    const p=projectiles.get();
    const offset=(si-(shots-1)/2)*spreadAngle;
    const cos_o=Math.cos(offset), sin_o=Math.sin(offset);
    const svx=fdx*cos_o-fdy*sin_o;
    const svy=fdx*sin_o+fdy*cos_o;
    p.x=player.x+(si-(shots-1)/2)*6;
    p.y=player.y;
    p.vx=svx*st.speed; p.vy=svy*st.speed;
    p.r=st.radius; p.life=1.8; p.damage=st.damage/shots*1.2;
    p.type=key; p.color=w.color; p.pierce=st.pierce; p.chain=st.chain;
  }
  emit(player.x,player.y,3,w.color,80,1.6,.18);
  /* NORYVX ATTACK state — muzzle bloom timer for drawPlayer. */
  player.lastFireAt=performance.now();
  player.lastFireDx=fdx;
  player.lastFireDy=fdy;
  player.lastFireColor=w.color;
}`
);

// ============================================================
// 10. Formation spawning — updateCombatDirector içine ekle
// ============================================================
replaceStr(
`function updateCombatDirector(dt){
  Game.director+=dt;`,
`/* 1945 — Formasyon spawn fonksiyonu */
function spawnFormation(level){
  const configs=[
    /* V formasyon: 5 düşman */
    [{dx:0,dy:0},{dx:-32,dy:28},{dx:32,dy:28},{dx:-58,dy:52},{dx:58,dy:52}],
    /* Yatay hat: 5 düşman */
    [{dx:-64,dy:0},{dx:-32,dy:0},{dx:0,dy:0},{dx:32,dy:0},{dx:64,dy:0}],
    /* Elmas: 4 düşman */
    [{dx:0,dy:0},{dx:-36,dy:30},{dx:36,dy:30},{dx:0,dy:58}],
    /* Çapraz ok: 5 düşman */
    [{dx:0,dy:0},{dx:-24,dy:16},{dx:24,dy:16},{dx:-48,dy:32},{dx:48,dy:32}],
  ];
  const cfg=configs[Math.floor(Math.random()*configs.length)];
  const cx=rand(80,W-80);
  const margin=BALANCE.enemy.spawnMargin;
  const type=chooseEnemyType(level);
  const m=ENEMIES[type];
  const hpScale=BALANCE.enemy.hpCurve(level);
  const speed=BALANCE.enemy.baseSpeed*m.speed*lateGamePressure(level);

  cfg.forEach(off=>{
    if(enemies.count()>=enemyCapForLevel(level))return;
    const e=enemies.get();
    e.x=clamp(cx+off.dx,margin,W-margin);
    e.y=-margin-off.dy;
    e.type=type; e.r=m.r; e.t=Math.random()*TAU;
    e.fade=1; e.orbit=Math.random()<.5?1:-1;
    e.dashing=0; e.dashCd=rand(.9,2.2);
    e.telegraph=0; e.hitFlash=0;
    e.elite=false; e.boss=false;
    e.bossPhase=1; e.bossCd=0; e.bossTelegraph=0; e.eliteSeed=0;
    e.maxHp=m.hp*hpScale; e.hp=e.maxHp;
    e.vx=(Math.random()-0.5)*speed*0.22;
    e.vy=speed*(0.75+Math.random()*0.3);
    e._seed=Math.random()*TAU;
  });
}

function updateCombatDirector(dt){
  Game.director+=dt;
  if(!Game._formationCd)Game._formationCd=12;
  Game._formationCd-=dt;
  if(Game._formationCd<=0 && Game.time>15){
    spawnFormation(Game.level);
    Game._formationCd=rand(10,18)/(1+Game.level*0.04);
  }`
);

// ============================================================
// 11. Oyuncu egzoz izi — thruster yerine aşağı exhaust
// ============================================================
replaceStr(
`  /* NORYVX MOVE — thruster akitisi (trail hiz esiginde). */
  if(P.moving && !_destroyed){
    ctx.save();
    ctx.globalCompositeOperation="lighter";
    ctx.globalAlpha=0.42+0.18*Math.sin(t*18);
    ctx.fillStyle=skinOuter;
    ctx.shadowColor=skin.glow;
    ctx.shadowBlur=14;
    ctx.beginPath();
    ctx.arc(player.x,player.y+12,2.6,0,TAU);
    ctx.fill();
    ctx.restore();
  }`,
`  /* 1945 — Motor egzoz izi (her zaman görünür) */
  if(!_destroyed){
    ctx.save();
    ctx.globalCompositeOperation="lighter";
    /* Ana mavi egzoz */
    const _exhaust=ctx.createLinearGradient(0,player.y+10,0,player.y+32);
    _exhaust.addColorStop(0,"rgba(80,180,255,0.85)");
    _exhaust.addColorStop(0.5,"rgba(120,80,255,0.45)");
    _exhaust.addColorStop(1,"rgba(60,30,180,0)");
    ctx.fillStyle=_exhaust;
    ctx.beginPath();
    const _ew=4.5+1.5*Math.sin(t*22);
    ctx.ellipse(player.x,player.y+18,_ew,13,0,0,TAU);
    ctx.fill();
    /* Parlak iç çekirdek */
    ctx.globalAlpha=0.6+0.4*Math.sin(t*28);
    ctx.fillStyle="#a0e8ff";
    ctx.shadowColor="#22e6ff"; ctx.shadowBlur=8;
    ctx.beginPath();
    ctx.ellipse(player.x,player.y+11,2,5.5,0,0,TAU);
    ctx.fill();
    /* İkinci motor (soldan) */
    ctx.globalAlpha=0.45+0.3*Math.sin(t*19+1.2);
    ctx.fillStyle="#6060ff";
    ctx.shadowColor="#4444ff"; ctx.shadowBlur=6;
    ctx.beginPath();
    ctx.ellipse(player.x-7,player.y+13,1.8,8,0,0,TAU);
    ctx.fill();
    /* İkinci motor (sağdan) */
    ctx.beginPath();
    ctx.ellipse(player.x+7,player.y+13,1.8,8,0,0,TAU);
    ctx.fill();
    ctx.restore();
  }`
);

// ============================================================
// Kaydet
// ============================================================
fs.writeFileSync(FILE, html, 'utf8');
console.log('\n✅ 1945 dönüşümü tamamlandı!');
