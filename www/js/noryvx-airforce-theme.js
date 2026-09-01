/* NORYVX Air Force theme — menu + in-run HUD + plane silhouettes + clean skills */
(function () {
  'use strict';
  if (window.__NVX_AF_THEME_V3__) return;
  window.__NVX_AF_THEME_V3__ = true;

  function injectCss() {
    var old = document.getElementById('nvx-af-theme-css');
    if (old) old.remove();
    var s = document.createElement('style');
    s.id = 'nvx-af-theme-css';
    s.textContent = [
      '#scr-menu{',
      '  background:',
      '    radial-gradient(100% 60% at 50% 0%, rgba(34,230,255,.14), transparent 55%),',
      '    radial-gradient(80% 50% at 0% 100%, rgba(255,80,80,.08), transparent 50%),',
      '    #020812!important;',
      '}',
      '#nvx2-hero-img, .nvx2-hero-art img, #nvx2-hero-stage img{',
      '  filter: drop-shadow(0 0 18px rgba(34,230,255,.55)) drop-shadow(0 8px 24px rgba(0,0,0,.45))!important;',
      '  transform: rotate(-12deg) scale(1.05)!important;',
      '}',
      '#weapon-hud::after{display:none!important;content:none!important;}',
      '#nvx-weapon-power{z-index:14!important;}',

      /* ===== RIGHT SKILLS — compact 1945-style ===== */',
      '#nvx-active-skills{',
      '  right:8px!important;',
      '  bottom:calc(env(safe-area-inset-bottom,0px) + 88px)!important;',
      '  gap:8px!important;',
      '  align-items:center!important;',
      '  z-index:12!important;',
      '}',
      '#nvx-active-skills .nvx-sk{',
      '  width:46px!important;',
      '  height:46px!important;',
      '  border-radius:50%!important;',
      '  background:rgba(4,10,26,.88)!important;',
      '  border:1.5px solid rgba(34,230,255,.28)!important;',
      '  box-shadow:0 4px 14px rgba(0,0,0,.35)!important;',
      '}',
      '#nvx-active-skills .nvx-sk.ready{',
      '  border-color:rgba(34,230,255,.75)!important;',
      '  box-shadow:0 0 16px rgba(34,230,255,.4)!important;',
      '}',
      /* Hide name labels under buttons (BURST/HEAL text clutter) */',
      '#nvx-active-skills .sk-name{display:none!important;}',
      /* CD / LV badge — small, inside top edge */',
      '#nvx-active-skills .sk-cd{',
      '  top:auto!important;',
      '  bottom:2px!important;',
      '  font:700 7px IBM Plex Mono,monospace!important;',
      '  letter-spacing:0!important;',
      '  opacity:.9!important;',
      '}',
      '#nvx-active-skills .sk-icon{font-size:16px!important;}',
      /* Locked skills fully hidden (not grey clutter) */',
      '#nvx-active-skills .nvx-sk.locked{display:none!important;}',

      /* Power-up pills — tuck away from skills */',
      '#power-hud{',
      '  right:8px!important;',
      '  top:calc(var(--safe-t,0px) + 120px)!important;',
      '  max-width:90px!important;',
      '}',
      '#power-hud .power-pill{',
      '  min-width:0!important;',
      '  height:28px!important;',
      '  font-size:7px!important;',
      '  padding:0 8px!important;',
      '}'
    ].join('\n');
    document.head.appendChild(s);
  }

  var COPY = [
    [/Taktik Hayatta Kalma/gi, 'Hava Üstünlüğü'],
    [/TAKTİK HAYATTA KALMA/gi, 'HAVA ÜSTÜNLÜĞÜ'],
    [/Sektör/g, 'Bölge'],
    [/SEKTÖR/g, 'BÖLGE'],
    [/Komutanını Yönet/gi, 'Filoyu Yönet'],
    [/KOMUTANINI YÖNET/g, 'FİLOYU YÖNET'],
    [/Geliştir & Yükselt/gi, 'Uçak & Modül'],
    [/GELİŞTİR & YÜKSELT/g, 'UÇAK & MODÜL'],
    [/Kozmetik & Gem/gi, 'Skin & Hangar'],
    [/KOZMETİK & GEM/g, 'SKİN & HANGAR'],
    [/Robot/gi, 'Uçak'],
    [/Kahraman/gi, 'Pilot'],
    [/KAHRAMAN/g, 'PİLOT'],
    [/\bHero\b/g, 'Pilot'],
    [/\bHERO\b/g, 'PİLOT'],
    [/Neon Şehri/gi, 'Neon Sahası'],
    [/NEON ŞEHRİ/g, 'NEON SAHASI'],
    [/YETENEKLER/g, 'FİLO']
  ];

  function retargetText(root) {
    if (!root) return;
    var walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, null);
    var nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);
    nodes.forEach(function (n) {
      var t = n.nodeValue;
      if (!t || !t.trim()) return;
      var out = t;
      for (var i = 0; i < COPY.length; i++) {
        out = out.replace(COPY[i][0], COPY[i][1]);
      }
      if (out !== t) n.nodeValue = out;
    });
  }

  function setSubtitles() {
    var sub = document.querySelector('.nvx2-logo-sub, #nvx2-logo .nvx2-logo-sub');
    if (sub) sub.textContent = 'HAVA ÜSTÜNLÜĞÜ · BÖLGE 01';
    var playSmall = document.querySelector('.nvx2-play small');
    if (playSmall) playSmall.textContent = 'BÖLGE 01 · GÖREVE BAŞLA';
    var tag = document.querySelector('.nvi-tagline');
    if (tag) tag.textContent = 'AIR FORCE · BÖLGE 01';
  }

  function drawFighterSilhouette(ctx, r, paint, elite) {
    var body = r * 1.15;
    ctx.save();
    ctx.rotate(Math.PI);
    ctx.shadowColor = paint.edge || paint.core || '#ff4060';
    ctx.shadowBlur = elite ? 18 : 10;
    ctx.fillStyle = paint.edge || '#ff6a4a';
    ctx.beginPath();
    ctx.moveTo(-body * 0.95, body * 0.15);
    ctx.lineTo(-body * 0.15, -body * 0.1);
    ctx.lineTo(body * 0.15, -body * 0.1);
    ctx.lineTo(body * 0.95, body * 0.15);
    ctx.lineTo(body * 0.35, body * 0.35);
    ctx.lineTo(-body * 0.35, body * 0.35);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = paint.core || '#ffe0e8';
    ctx.beginPath();
    ctx.moveTo(0, -body * 0.95);
    ctx.lineTo(body * 0.28, body * 0.55);
    ctx.lineTo(0, body * 0.35);
    ctx.lineTo(-body * 0.28, body * 0.55);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = 'rgba(180,240,255,0.85)';
    ctx.beginPath();
    ctx.ellipse(0, -body * 0.35, body * 0.12, body * 0.18, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 14;
    ctx.fillStyle = elite ? '#ffd24d' : '#22e6ff';
    ctx.beginPath();
    ctx.arc(-body * 0.12, body * 0.48, body * 0.1, 0, Math.PI * 2);
    ctx.arc(body * 0.12, body * 0.48, body * 0.1, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  function patchEnemyDraw() {
    if (typeof window.rrEnemyUnit === 'function' && !window.rrEnemyUnit.__af) {
      var prev = window.rrEnemyUnit;
      window.rrEnemyUnit = function (e, paint, r, lod) {
        try {
          drawFighterSilhouette(ctx, r || e.r || 14, paint || {}, !!(e && e.elite));
        } catch (err) {
          try { return prev.apply(this, arguments); } catch (e2) {}
        }
      };
      window.rrEnemyUnit.__af = true;
    }
    if (typeof window.rrEliteUnit === 'function' && !window.rrEliteUnit.__af) {
      var prevE = window.rrEliteUnit;
      window.rrEliteUnit = function (e, paint, lod) {
        try {
          drawFighterSilhouette(ctx, (e && e.r) || 18, paint || {}, true);
        } catch (err) {
          try { return prevE.apply(this, arguments); } catch (e2) {}
        }
      };
      window.rrEliteUnit.__af = true;
    }
  }

  function declutterSkills() {
    var box = document.getElementById('nvx-active-skills');
    if (!box) return;
    box.querySelectorAll('.nvx-sk.locked').forEach(function (el) {
      el.style.display = 'none';
    });
    box.querySelectorAll('.sk-name').forEach(function (el) {
      el.style.display = 'none';
    });
  }

  function boot() {
    injectCss();
    setSubtitles();
    retargetText(document.getElementById('scr-menu'));
    retargetText(document.getElementById('scr-shop'));
    retargetText(document.body);
    patchEnemyDraw();
    declutterSkills();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () { setTimeout(boot, 80); });
  } else {
    setTimeout(boot, 80);
  }
  setTimeout(boot, 600);
  setTimeout(boot, 2000);
  setInterval(function () {
    retargetText(document.getElementById('run-wave-hud'));
    patchEnemyDraw();
    declutterSkills();
  }, 2500);
})();
