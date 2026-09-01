/* NORYVX — inject professional cyberpunk gameplay chrome */
(function () {
  'use strict';
  if (window.__NVX_GP_PRO__) return;
  window.__NVX_GP_PRO__ = true;

  function ensureCss() {
    if (document.getElementById('nvx-gameplay-pro-css-link')) return;
    var link = document.createElement('link');
    link.id = 'nvx-gameplay-pro-css-link';
    link.rel = 'stylesheet';
    link.href = 'css/noryvx-gameplay-pro.css?v=1';
    document.head.appendChild(link);
  }

  function ensureFrame() {
    if (document.getElementById('nvx-cp-frame')) return;
    var frame = document.createElement('div');
    frame.id = 'nvx-cp-frame';
    frame.innerHTML = [
      '<div class="nvx-cp-vignette"></div>',
      '<div class="nvx-cp-grid"></div>',
      '<div class="nvx-cp-scan"></div>',
      '<div class="nvx-cp-corner c-tl"></div>',
      '<div class="nvx-cp-corner c-tr"></div>',
      '<div class="nvx-cp-corner c-bl"></div>',
      '<div class="nvx-cp-corner c-br"></div>'
    ].join('');
    document.body.appendChild(frame);

    if (!document.getElementById('nvx-cp-topstrip')) {
      var strip = document.createElement('div');
      strip.id = 'nvx-cp-topstrip';
      strip.innerHTML = '<span class="dot"></span><span>SECTOR <b id="nvx-cp-sector">01</b></span><span>·</span><span>LINK <b>STABLE</b></span>';
      document.body.appendChild(strip);
    }
  }

  function isPlaying() {
    try {
      if (typeof Game === 'undefined' || !Game) return false;
      if (typeof STATE !== 'undefined' && STATE && STATE.PLAYING != null) {
        return Game.state === STATE.PLAYING || Game.state === STATE.LEVELUP || Game.state === STATE.COUNTDOWN;
      }
      return Game.state === 'PLAYING' || Game.state === 'LEVELUP';
    } catch (e) {
      return false;
    }
  }

  function sync() {
    var strip = document.getElementById('nvx-cp-topstrip');
    var frame = document.getElementById('nvx-cp-frame');
    var on = isPlaying();
    if (strip) strip.classList.toggle('on', on);
    if (frame) frame.style.opacity = on ? '1' : '0';
    try {
      var sec = document.getElementById('nvx-cp-sector');
      if (sec && typeof Game !== 'undefined' && Game) {
        var w = Math.max(1, Game.wave || Game.level || 1);
        sec.textContent = (w < 10 ? '0' : '') + w;
      }
    } catch (e) {}
  }

  function boot() {
    ensureCss();
    ensureFrame();
    sync();
    setInterval(sync, 400);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () { setTimeout(boot, 60); });
  } else {
    setTimeout(boot, 60);
  }
  setTimeout(boot, 600);
})();
