/* Swap menu/tutorial hero images to Air Force plane SVGs */
(function () {
  'use strict';
  if (window.__NVX_HERO_ASSETS_V2__) return;
  window.__NVX_HERO_ASSETS_V2__ = true;

  var MAP = {
    vanguard: 'assets/hero-vanguard.svg?v=af2',
    striker: 'assets/hero-striker.svg?v=af2',
    controller: 'assets/hero-controller.svg?v=af2'
  };

  function detectKey(img) {
    var blob = [
      img.getAttribute('src') || '',
      img.getAttribute('data-src') || '',
      img.getAttribute('alt') || '',
      img.id || '',
      img.className || '',
      (img.parentElement && img.parentElement.id) || '',
      (img.parentElement && img.parentElement.className) || ''
    ].join(' ');
    if (/vanguard|vanguardi|tank|koruyucu/i.test(blob)) return 'vanguard';
    if (/striker|saldiri|saldırı|attack/i.test(blob)) return 'striker';
    if (/controller|kontrol|support/i.test(blob)) return 'controller';
    return null;
  }

  function apply() {
    document.querySelectorAll('img').forEach(function (img) {
      var key = detectKey(img);
      if (!key || !MAP[key]) return;
      var cur = img.getAttribute('src') || '';
      if (cur.indexOf(MAP[key].split('?')[0]) >= 0) return;
      img.src = MAP[key];
      img.style.objectFit = 'contain';
      img.style.filter = 'drop-shadow(0 0 14px rgba(34,230,255,.45))';
    });

    /* Also force known ids used in tutorials */
    ['nvx-intro-hero', 'nvx2-hero-img', 'hero-img', 'menu-hero'].forEach(function (id) {
      var el = document.getElementById(id);
      if (!el || el.tagName !== 'IMG') return;
      var key = detectKey(el) || 'vanguard';
      el.src = MAP[key];
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () { setTimeout(apply, 50); });
  } else {
    setTimeout(apply, 50);
  }
  setTimeout(apply, 400);
  setTimeout(apply, 1200);
  setTimeout(apply, 3000);
  setInterval(apply, 5000);
})();
