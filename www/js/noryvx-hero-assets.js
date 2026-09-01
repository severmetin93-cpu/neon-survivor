/* Swap menu/tutorial hero images to Air Force plane SVGs */
(function () {
  'use strict';
  if (window.__NVX_HERO_ASSETS__) return;
  window.__NVX_HERO_ASSETS__ = true;

  var MAP = {
    vanguard: 'assets/hero-vanguard.svg',
    striker: 'assets/hero-striker.svg',
    controller: 'assets/hero-controller.svg'
  };

  function apply() {
    document.querySelectorAll('img').forEach(function (img) {
      var src = (img.getAttribute('src') || '') + ' ' + (img.getAttribute('data-src') || '');
      var key = null;
      if (/vanguard/i.test(src)) key = 'vanguard';
      else if (/striker/i.test(src)) key = 'striker';
      else if (/controller/i.test(src)) key = 'controller';
      if (key && MAP[key] && src.indexOf('.svg') < 0) {
        img.src = MAP[key] + '?v=af1';
      }
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () { setTimeout(apply, 50); });
  } else {
    setTimeout(apply, 50);
  }
  setTimeout(apply, 500);
  setTimeout(apply, 1500);
})();
