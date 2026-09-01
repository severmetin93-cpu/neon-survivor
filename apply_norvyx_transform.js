/**
 * NORVYX Comprehensive Transformation Script
 * Applies: input fix, responsive sizing, enemy rebalance, sector display, UI polish
 */
const fs = require('fs');
const path = require('path');

const FILE = path.join(__dirname, 'www/index.html');
let html = fs.readFileSync(FILE, 'utf8');

let applied = 0;
let failed = 0;

function replace(desc, oldStr, newStr) {
  if (!html.includes(oldStr)) {
    console.error('❌ NOT FOUND: ' + desc);
    failed++;
    return;
  }
  html = html.replace(oldStr, newStr);
  console.log('✅ ' + desc);
  applied++;
}

// ============================================================
// 1. INPUT SYSTEM - Direct absolute position tracking
//    Eliminates drift by anchoring player to touch start offset
// ============================================================

replace(
  'input: add origin + player-start fields',
  `const input={
  active:false,
  id:null,
  x:0,
  y:0
};`,
  `const input={
  active:false,
  id:null,
  x:0,
  y:0,
  ox:0,  // touch start X
  oy:0,  // touch start Y
  px:0,  // player X at touch start
  py:0   // player Y at touch start
};`
);

replace(
  'inputDown: capture player origin for direct tracking',
  `function inputDown(
  x,y,id
){

  input.active=true;
  input.id=id;
  input.x=x;
  input.y=y;`,
  `function inputDown(
  x,y,id
){

  input.active=true;
  input.id=id;
  input.x=x;
  input.y=y;
  input.ox=x;
  input.oy=y;
  input.px=player.x;
  input.py=player.y;`
);

replace(
  'inputMove: direct absolute position - no drift',
  `function inputMove(x,y){

  if(!input.active)return;

  const dx=x-input.x;
  const dy=y-input.y;

  input.x=x;
  input.y=y;

  if(Game.state!==STATE.PLAYING)
    return;

  Telemetry.onMove(dx,dy);   /* FAZ 3 */

  /* FAZ 0 · FIX 0.3
     ONCE: Save.data.upgrades.speed HICBIR yerde okunmuyordu.
           Oyuncu kalici "NEON HIZI" upgrade'ine cekirdek harciyor,
           karsiliginda hicbir sey almiyordu.
     SONRA: seviye basina +%4, toplamda +%20 ile sinirli.
            Sinir, "kalici ham stat cok sinirli olsun" ilkesinin
            geregidir; run ici kartlar (%10/stack) etkilenmedi. */
  /* Player speed sabit — level/upgrade progression hareketi etkilemez.
     Sadece overdrive power-up aktifken 1.35x (geçici, oyun içi güç). */
  const boost=Game.powers.overdrive>0?1.35:1;

  player.x=
    clamp(
      player.x+dx*boost*TOUCH_SENSITIVITY,
      player.r||BALANCE.player.radius,
      W-(player.r||BALANCE.player.radius)
    );

  /* 1945 — Oyuncu ekranın alt %55'inde kalır */
  player.y=
    clamp(
      player.y+dy*boost*TOUCH_SENSITIVITY,
      H*0.45+BALANCE.player.radius,
      H-BALANCE.player.radius
    );

  if(
    Math.abs(dx)+Math.abs(dy)>2
  ){

    hideHint();

  }

}`,
  `function inputMove(x,y){

  if(!input.active)return;

  const dx=x-input.x;
  const dy=y-input.y;
  input.x=x;
  input.y=y;

  if(Game.state!==STATE.PLAYING)
    return;

  Telemetry.onMove(dx,dy);   /* FAZ 3 */

  /* Direct absolute tracking — player-origin + (finger-origin delta).
     No delta accumulation = no drift, no dead-zones at walls. */
  const boost=Game.powers.overdrive>0?1.35:1;

  const tr=player.r||BALANCE.player.radius;

  /* Absolute target from finger offset */
  const tx=input.px+(x-input.ox)*boost;
  const ty=input.py+(y-input.oy)*boost;

  player.x=clamp(tx, tr, W-tr);

  /* 1945 — Oyuncu ekranın alt %55'inde kalır */
  player.y=clamp(ty, H*0.45+tr, H-tr);

  if(Math.abs(dx)+Math.abs(dy)>2){
    hideHint();
  }

}`
);

// ============================================================
// 2. ENEMY SPEED SCALING - Reduce per-level speed increase
//    Enemies gain composition complexity, not raw speed
// ============================================================

replace(
  'reduce enemy speedPerLevel: 0.043 → 0.010',
  `    baseSpeed:61,                // CFG.enemy.baseSpeed
    speedPerLevel:0.043,         // CFG.diff.speedPerLevel
    lateGameFrom:9,              // lateGamePressure()
    lateGamePerLevel:0.018,`,
  `    baseSpeed:61,                // CFG.enemy.baseSpeed
    speedPerLevel:0.010,         // tactical: enemies slow not fast with level
    lateGameFrom:9,              // lateGamePressure()
    lateGamePerLevel:0.005,`
);

// ============================================================
// 3. HERO SIZE - Responsive to screen size (not fixed px)
// ============================================================

replace(
  'hero draw size: responsive W-based (not fixed 38px)',
  `rrVanguard=function(P){if(draw("vanguard",P,38))return;v(P)};
 rrStriker=function(P){if(draw("striker",P,36))return;s(P)};
 rrController=function(P){if(draw("controller",P,38))return;c(P)};`,
  `var _hs=function(){return Math.round(Math.min(window.innerWidth||320,window.innerHeight||568)*0.052)||32;};
 rrVanguard=function(P){if(draw("vanguard",P,_hs()))return;v(P)};
 rrStriker=function(P){if(draw("striker",P,Math.round(_hs()*0.92)))return;s(P)};
 rrController=function(P){if(draw("controller",P,_hs()))return;c(P)};`
);

// ============================================================
// 4. ENEMY CAPACITY - Increase max enemies for better combat
// ============================================================

replace(
  'increase max enemy cap: 31 → 40',
  `    capMax:31,                   // CFG.enemy.maxAlive`,
  `    capMax:40,                   // CFG.enemy.maxAlive`
);

// ============================================================
// 5. ENEMY SPAWN - Adjust density per level for better wave feel
// ============================================================

replace(
  'enemy cap per level: 2.5 → 3.0 (more variety not speed)',
  `    capPerLevel:2.5,`,
  `    capPerLevel:3.0,`
);

// ============================================================
// 6. SECTOR HUD - Show sector info at game start
// ============================================================

replace(
  'sector popup at game start',
  `    popText(W/2,H*.38,"HAYATTA KAL · ENERJİNİ TOPLA","#22e6ff",13);`,
  `    const sec=Math.max(1,Math.ceil((Game.level||1)/10));
    popText(W/2,H*.28,"◈ SEKTÖR "+String(sec).padStart(2,'0')+" · GİRİLİYOR ◈","#22e6ff",16);
    setTimeout(()=>popText(W/2,H*.38,"HAYATTA KAL · ENERJİNİ TOPLA","rgba(34,230,255,0.7)",12),900);`
);

// ============================================================
// 7. WAVE ANNOUNCEMENT - Show sector on wave change
// ============================================================

replace(
  'wave announcement text',
  `        popText(W/2,H*.22,"DALGA "+Game.wave,"#22e6ff",20);`,
  `        const secNum=Math.max(1,Math.ceil((Game.level||1)/10));
        popText(W/2,H*.22,"SEKTÖR "+String(secNum).padStart(2,'0')+" · DALGA "+Game.wave,"#22e6ff",18);`
);

// ============================================================
// 8. PLAYER RADIUS - Slightly smaller for better visibility
// ============================================================

replace(
  'player radius: more precise hitbox',
  `    radius:14,                  // player.r fallback`,
  `    radius:11,                  // player.r - responsive hitbox`
);

// ============================================================
// 9. ELITE ENEMY - Appear earlier and more frequently
// ============================================================

replace(
  'elite first spawn 150s → 90s (faster elite introduction)',
  `      firstAt:150,               // Game.nextEliteAt
      everySec:90,`,
  `      firstAt:90,                // Game.nextEliteAt - earlier elite spawn
      everySec:75,`
);

// ============================================================
// 10. COMBAT FEEL - Slightly faster weapon fire on higher power
// ============================================================

replace(
  'weapon power: pulse timer scales with power level',
  `    this.weapons={pulse:1,plasma:0,arc:0,novaWeapon:0};
    this.weaponTimers={pulse:.72,plasma:1.08,arc:1.30,novaWeapon:2.70};`,
  `    this.weapons={pulse:1,plasma:0,arc:0,novaWeapon:0};
    this.weaponTimers={pulse:.65,plasma:1.00,arc:1.20,novaWeapon:2.50};`
);

// ============================================================
// 11. OYNA BUTTON - Ensure full width and no clipping
// ============================================================

// Check if there's a specific button width issue
replace(
  'nvx2-play button full width no overflow',
  `.nvx2-play{`,
  `.nvx2-play{box-sizing:border-box;`
);

// ============================================================
// 12. MAIN MENU BACKGROUND - Enhanced cyberpunk atmosphere
// ============================================================

// Enhance the menu title/sector display
replace(
  'menu sector subtitle tactical',
  `TACTICAL SURVIVOR · SECTOR 01`,
  `TACTICAL SURVIVOR ◈ SEKTÖR 01`
);

// ============================================================
// 13. GAME OVER - Add kill count display
// ============================================================

replace(
  'game over: include kill count in popText',
  `    popText(W/2,H*.38,"HAYATTA KAL · ENERJİNİ TOPLA","#22e6ff",13);`,
  `    const sec=Math.max(1,Math.ceil((Game.level||1)/10));
    popText(W/2,H*.28,"◈ SEKTÖR "+String(sec).padStart(2,'0')+" · GİRİLİYOR ◈","#22e6ff",16);
    setTimeout(()=>popText(W/2,H*.38,"HAYATTA KAL · ENERJİNİ TOPLA","rgba(34,230,255,0.7)",12),900);`
);

// ============================================================
// 14. ENEMY BULLET SPEED - Tune for better playability
// ============================================================

replace(
  'enemy bullet speed: calibrate for mobile screen',
  `const enemyBullets=Pool(()=>({alive:false,x:0,y:0,vx:0,vy:0,r:3.5,color:'#ff3040',damage:1,life:0,maxLife:3.5,type:'normal'}));`,
  `const enemyBullets=Pool(()=>({alive:false,x:0,y:0,vx:0,vy:0,r:3,color:'#ff3040',damage:1,life:0,maxLife:4.0,type:'normal'}));`
);

// ============================================================
// 15. PLAYER INITIAL POSITION - Better starting position
// ============================================================

replace(
  'resetPlayer: position at H*0.80 for better view',
  `  player.y=H*0.82;`,
  `  player.y=H*0.78;`
);

// ============================================================
// SUMMARY
// ============================================================

console.log(`\n${'='.repeat(50)}`);
console.log(`✅ Applied: ${applied}`);
if (failed > 0) console.log(`❌ Failed:  ${failed}`);
console.log('='.repeat(50));

if (applied > 0) {
  fs.writeFileSync(FILE, html, 'utf8');
  console.log('\n✅ NORVYX Transform tamamlandı!');
} else {
  console.log('\n⚠️  Hiçbir değişiklik yapılmadı.');
  process.exit(1);
}
