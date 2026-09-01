/* NORYVX Air Force theme V3 — clean HUD + plane silhouettes */
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
      '#nvx-active-skills{',
      '  right:8px!important;',
      '  bottom:calc(env(safe-area-inset-bottom,0px) + 88px)!important;',
      '  gap:8px!important;',
      '  z-index:12!important;',
      '}',
      '#nvx-active-skills .nvx-sk{',
      '  width:46px!important;height:46px!important;border-radius:50%!important;',
      '  background:rgba(4,10,26,.88)!important;',
      '  border:1.5px solid rgba(34,230,255,.28)!important;',
      '}',
      '#nvx-active-skills .nvx-sk.ready{',
      '  border-color:rgba(34,230,255,.75)!important;',
      '  box-shadow:0 0 16px rgba(34,230,255,.4)!important;',
      '}',
      '#nvx-active-skills .sk-name{display:none!important;}',
      '#nvx-active-skills .sk-cd{',
      '  top:auto!important;bottom:2px!important;',
      '  font:700 7px IBM Plex Mono,monospace!important;',
      '}',
      '#nvx-active-skills .sk-icon{font-size:16px!important;}',
      '#nvx-active-skills .nvx-sk.locked{display:none!important;}',
      '#power-hud{',
      '  right:8px!important;',
      '  top:calc(var(--safe-t,0px) + 120px)!important;',
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
    [/\\bHero\\b/g, 'Pilot'],
    [/\\bHERO\\b/g, 'PİLOT'],
    [/Neon Şehri/gi, 'Neon Sahası'],
    [/NEON ŞEHRİ/g, 'NEON SAHASI']
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
      for (var i = 0; i < COPY.length; i++) out = out.replace(COPY[i][0], COPY[i][1]);
      if (out !== t) n.nodeValue = out;
    });
  }

  function setSubtitles() {
    var sub = document.querySelector('.nvx2-logo-sub, #nvx2-logo .nvx2-logo-sub');
    if (sub) sub.textContent = 'HAVA ÜSTÜNLÜĞÜ · BÖLGE 01';
    var playSmall = document.querySelector('.nvx2-play small');
    if (playSmall) playSmall.textContent = 'BÖLGE 01 · GÖREVE BAŞLA';
  }

  function drawFighterSilhouette(c, r, paint, elite) {
    var body = r * 1.15;
    c.save();
    c.rotate(Math.PI);
    c.shadowColor = paint.edge || '#ff4060';
    c.shadowBlur = elite ? 18 : 10;
    c.fillStyle = paint.edge || '#ff6a4a';
    c.beginPath();
    c.moveTo(-body * 0.95, body * 0.15);
    c.lineTo(-body * 0.15, -body * 0.1);
    c.lineTo(body * 0.15, -body * 0.1);
    c.lineTo(body * 0.95, body * 0.15);
    c.lineTo(body * 0.35, body * 0.35);
    c.lineTo(-body * 0.35, body * 0.35);
    c.closePath();
    c.fill();
    c.fillStyle = paint.core || '#ffe0e8';
    c.beginPath();
    c.moveTo(0, -body * 0.95);
    c.lineTo(body * 0.28, body * 0.55);
    c.lineTo(0, body * 0.35);
    c.lineTo(-body * 0.28, body * 0.55);
    c.closePath();
    c.fill();
    c.fillStyle = 'rgba(180,240,255,0.85)';
    c.beginPath();
    c.ellipse(0, -body * 0.35, body * 0.12, body * 0.18, 0, 0, Math.PI * 2);
    c.fill();
    c.shadowBlur = 14;
    c.fillStyle = elite ? '#ffd24d' : '#22e6ff';
    c.beginPath();
    c.arc(-body * 0.12, body * 0.48, body * 0.1, 0, Math.PI * 2);
    c.arc(body * 0.12, body * 0.48, body * 0.1, 0, Math.PI * 2);
    c.fill();
    c.restore();
  }

  function patchEnemyDraw() {
    if (typeof window.rrEnemyUnit === 'function' && !window.rrEnemyUnit.__af) {
      var prev = window.rrEnemyUnit;
      window.rrEnemyUnit = function (e, paint, r) {
        try {
          drawFighterSilhouette(ctx, r || e.r || 14, paint || {}, !!(e && e.elite));
        } catch (err) {
          try { return prev.apply(this, arguments); } catch (e2) {}
        }
      };
      window.rrEnemyUnit.__af = true;
    }
  }

  function declutterSkills() {
    var box = document.getElementById('nvx-active-skills');
    if (!box) return;
    box.querySelectorAll('.nvx-sk.locked').forEach(function (el) { el.style.display = 'none'; });
    box.querySelectorAll('.sk-name').forEach(function (el) { el.style.display = 'none'; });
  }

  function boot() {
    injectCss();
    setSubtitles();
    retargetText(document.getElementById('scr-menu'));
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
    patchEnemyDraw();
    declutterSkills();
  }, 2500);
})();
