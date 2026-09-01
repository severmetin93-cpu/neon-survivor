/* NORYVX Air Force theme — UI copy + menu presentation */
(function () {
  'use strict';
  if (window.__NVX_AF_THEME__) return;
  window.__NVX_AF_THEME__ = true;

  function injectCss() {
    if (document.getElementById('nvx-af-theme-css')) return;
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
    [/\bHERO\b/g, 'PİLOT']
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
  }

  function boot() {
    injectCss();
    setSubtitles();
    retargetText(document.getElementById('scr-menu'));
    retargetText(document.getElementById('scr-shop'));
    retargetText(document.body);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () { setTimeout(boot, 80); });
  } else {
    setTimeout(boot, 80);
  }
  setTimeout(boot, 600);
  setTimeout(boot, 2000);
})();
