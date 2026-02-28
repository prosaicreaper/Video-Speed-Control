// content.js - Speedster · in-page HUD v1.2

const DEFAULT_SPEED = 1.0;
const STEP = 0.1;
const MIN_SPEED = 0.1;
const MAX_SPEED = 5.0;
const HUD_HIDE_DELAY = 2000;

// Use exact hostname so youtube.com and music.youtube.com are separate
const hostname = location.hostname;

let currentSpeed = DEFAULT_SPEED;
let isEnabled = true;
let hud = null;
let hideTimer = null;

// ─── Storage ────────────────────────────────────────────────────────────────

function loadState(callback) {
  chrome.storage.sync.get(['disabledSites', 'siteSpeed'], (data) => {
    const disabledSites = data.disabledSites || [];
    isEnabled = !disabledSites.includes(hostname);
    const siteSpeed = data.siteSpeed || {};
    currentSpeed = siteSpeed[hostname] !== undefined ? siteSpeed[hostname] : DEFAULT_SPEED;
    callback();
  });
}

function saveSpeed() {
  chrome.storage.sync.get(['siteSpeed'], (data) => {
    const siteSpeed = data.siteSpeed || {};
    siteSpeed[hostname] = currentSpeed;
    chrome.storage.sync.set({ siteSpeed }, () => {
      // Tell background to update the badge on the active tab
      chrome.runtime.sendMessage({ type: 'UPDATE_BADGE', speed: currentSpeed, enabled: isEnabled })
        .catch(() => {});
    });
  });
}

// ─── Media ──────────────────────────────────────────────────────────────────

function getMediaElements() {
  return Array.from(document.querySelectorAll('video, audio'));
}

function applySpeed(speed) {
  currentSpeed = Math.round(Math.max(MIN_SPEED, Math.min(MAX_SPEED, speed)) * 10) / 10;
  getMediaElements().forEach(el => { el.playbackRate = currentSpeed; });
  saveSpeed();
  showOrUpdateHUD();
}

function watchMedia() {
  getMediaElements().forEach(el => {
    if (!el._speedsterWatched) {
      el._speedsterWatched = true;
      el.addEventListener('ratechange', () => {
        if (!isEnabled) return;
        // Site tried to reset rate — enforce ours
        if (Math.abs(el.playbackRate - currentSpeed) > 0.001) {
          el.playbackRate = currentSpeed;
        }
      });
    }
    if (el.tagName === 'VIDEO') attachVideoHover(el);
  });
}

const mediaObserver = new MutationObserver(() => {
  if (!isEnabled) return;
  getMediaElements().forEach(el => {
    if (el.playbackRate !== currentSpeed) el.playbackRate = currentSpeed;
  });
  watchMedia();
});

// ─── YouTube soft-navigation (SPA) support ──────────────────────────────────
// YouTube navigates between videos without a full page reload. We listen for
// the yt-navigate-finish event and re-apply speed after each navigation.

let _ytNavBound = false;
function bindYTNavigation() {
  if (_ytNavBound || !hostname.includes('youtube.com')) return;
  _ytNavBound = true;
  window.addEventListener('yt-navigate-finish', () => {
    if (!isEnabled) return;
    // Small delay to let YouTube set up its player
    setTimeout(() => {
      getMediaElements().forEach(el => {
        el._speedsterWatched = false; // re-watch after new player init
        el.playbackRate = currentSpeed;
      });
      watchMedia();
      chrome.runtime.sendMessage({ type: 'UPDATE_BADGE', speed: currentSpeed, enabled: isEnabled })
        .catch(() => {});
    }, 800);
  });
}

// ─── HUD ────────────────────────────────────────────────────────────────────

function getAnchorVideo() {
  const videos = Array.from(document.querySelectorAll('video'));
  if (!videos.length) return null;

  const vph = window.innerHeight;
  const vpw = window.innerWidth;
  const vpCx = vpw / 2;
  const vpCy = vph / 2;

  let best = null;
  let bestScore = -Infinity;

  for (const v of videos) {
    const r = v.getBoundingClientRect();
    // Skip videos entirely off-screen
    if (r.bottom <= 0 || r.top >= vph || r.right <= 0 || r.left >= vpw) continue;
    // Skip tiny videos (avatars, thumbnails, ads)
    if (r.width < 80 || r.height < 50) continue;

    // Visible intersection area
    const visW = Math.min(r.right, vpw) - Math.max(r.left, 0);
    const visH = Math.min(r.bottom, vph) - Math.max(r.top, 0);
    const visArea = visW * visH;

    // Distance of video centre from viewport centre (lower = better)
    const cx = r.left + r.width / 2;
    const cy = r.top + r.height / 2;
    const dist = Math.hypot(cx - vpCx, cy - vpCy);

    // Score: maximise visible area, break ties by proximity to viewport centre
    const score = visArea - dist * 0.5;

    if (score > bestScore) {
      bestScore = score;
      best = v;
    }
  }

  return best;
}

function buildHUD() {
  if (!document.getElementById('__speedster_style__')) {
    const style = document.createElement('style');
    style.id = '__speedster_style__';
    style.textContent = `
      #__speedster_hud__ {
        position: absolute;
        top: 12px;
        left: 12px;
        display: flex;
        align-items: center;
        gap: 3px;
        background: rgba(0,0,0,0.55);
        backdrop-filter: blur(8px);
        -webkit-backdrop-filter: blur(8px);
        border: 1px solid rgba(255,255,255,0.09);
        border-radius: 100px;
        padding: 3px 7px 3px 5px;
        z-index: 2147483646;
        opacity: 0;
        transition: opacity 0.3s ease;
        font-family: 'SF Mono', ui-monospace, 'Cascadia Mono', monospace;
        user-select: none;
        box-shadow: 0 2px 10px rgba(0,0,0,0.5);
        pointer-events: auto;
      }
      #__speedster_hud__ .sp-btn {
        width: 18px; height: 18px;
        border-radius: 50%;
        background: rgba(255,255,255,0.08);
        border: none;
        color: rgba(255,255,255,0.7);
        font-size: 15px;
        line-height: 1;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 0; margin: 0;
        transition: background 0.12s, transform 0.1s;
        flex-shrink: 0;
        outline: none;
      }
      #__speedster_hud__ .sp-btn:hover { background: rgba(255,255,255,0.2); color: #fff; }
      #__speedster_hud__ .sp-btn:active { transform: scale(0.82); }
      #__speedster_hud__ .sp-val {
        font-size: 11px; font-weight: 600;
        color: rgba(255,255,255,0.88);
        min-width: 26px; text-align: center;
        line-height: 1; padding: 0 1px;
      }
      #__speedster_hud__ .sp-x {
        font-size: 8px;
        color: rgba(255,255,255,0.38);
        vertical-align: 1px;
      }
    `;
    (document.head || document.documentElement).appendChild(style);
  }

  const el = document.createElement('div');
  el.id = '__speedster_hud__';
  el.innerHTML = `
    <button class="sp-btn" id="sp-minus" title="Slower (S)">−</button>
    <span class="sp-val" id="sp-val">${currentSpeed.toFixed(1)}<span class="sp-x">×</span></span>
    <button class="sp-btn" id="sp-plus" title="Faster (D)">+</button>
  `;

  el.querySelector('#sp-minus').addEventListener('click', (e) => {
    e.stopPropagation();
    applySpeed(currentSpeed - STEP);
  });
  el.querySelector('#sp-plus').addEventListener('click', (e) => {
    e.stopPropagation();
    applySpeed(currentSpeed + STEP);
  });

  el.addEventListener('mouseenter', () => { clearTimeout(hideTimer); el.style.opacity = '1'; });
  el.addEventListener('mouseleave', () => { scheduleHide(); });

  return el;
}

function getHUDContainer() {
  const fs = document.fullscreenElement || document.webkitFullscreenElement;
  return fs || document.body;
}

function positionHUD() {
  if (!hud) return;
  const video = getAnchorVideo();
  const container = getHUDContainer();
  const isFullscreen = !!(document.fullscreenElement || document.webkitFullscreenElement);

  if (hud.parentElement !== container) {
    hud.remove();
    container.appendChild(hud);
  }

  if (isFullscreen) {
    hud.style.position = 'fixed';
    hud.style.top = '12px';
    hud.style.left = '12px';
    hud.style.bottom = '';
    return;
  }

  if (video) {
    const parent = video.parentElement;
    if (!parent) return;
    const pStyle = window.getComputedStyle(parent);
    const positioned = ['relative','absolute','fixed','sticky'].includes(pStyle.position);

    if (positioned && parent !== document.body && parent !== document.documentElement) {
      if (hud.parentElement !== parent) { hud.remove(); parent.appendChild(hud); }
      hud.style.position = 'absolute';
      hud.style.top = '12px';
      hud.style.left = '12px';
      hud.style.bottom = '';
    } else {
      const rect = video.getBoundingClientRect();
      hud.style.position = 'fixed';
      hud.style.top = (rect.top + 12) + 'px';
      hud.style.left = (rect.left + 12) + 'px';
      hud.style.bottom = '';
    }
  } else {
    hud.style.position = 'fixed';
    hud.style.top = 'auto';
    hud.style.bottom = '20px';
    hud.style.left = '20px';
  }
}

document.addEventListener('fullscreenchange', () => positionHUD());
document.addEventListener('webkitfullscreenchange', () => positionHUD());

function scheduleHide() {
  clearTimeout(hideTimer);
  hideTimer = setTimeout(() => { if (hud) hud.style.opacity = '0'; }, HUD_HIDE_DELAY);
}

function showOrUpdateHUD() {
  if (!hud) {
    hud = buildHUD();
    getHUDContainer().appendChild(hud);
  }
  hud.querySelector('#sp-val').innerHTML =
    `${currentSpeed.toFixed(1)}<span class="sp-x">×</span>`;
  positionHUD();
  requestAnimationFrame(() => { if (hud) hud.style.opacity = '1'; });
  scheduleHide();
}

window.addEventListener('resize', () => {
  if (hud && parseFloat(hud.style.opacity) > 0) positionHUD();
});

window.addEventListener('scroll', () => {
  if (hud && parseFloat(hud.style.opacity) > 0) positionHUD();
}, { passive: true });

// Proximity hover — works even when overlays block the video element
let _hoverActive = false;
document.addEventListener('mousemove', (e) => {
  if (!isEnabled) return;
  const video = getAnchorVideo();
  if (!video) return;

  const rect = video.getBoundingClientRect();
  const inZone = (
    e.clientX >= rect.left && e.clientX <= rect.left + 120 &&
    e.clientY >= rect.top  && e.clientY <= rect.top  + 80
  );
  const overHUD = hud && hud.matches(':hover');

  if (inZone || overHUD) {
    if (!_hoverActive) {
      _hoverActive = true;
      if (!hud) { hud = buildHUD(); getHUDContainer().appendChild(hud); }
      positionHUD();
      requestAnimationFrame(() => { if (hud) hud.style.opacity = '1'; });
    }
    clearTimeout(hideTimer);
  } else {
    if (_hoverActive) { _hoverActive = false; scheduleHide(); }
  }
}, { passive: true });

function attachVideoHover(video) {}

// ─── Keys ───────────────────────────────────────────────────────────────────

document.addEventListener('keydown', (e) => {
  if (!isEnabled) return;
  if (e.target.matches('input, textarea, [contenteditable], select')) return;
  if (e.metaKey || e.ctrlKey || e.altKey) return;

  if (e.key === 'd' || e.key === 'D') {
    e.preventDefault();
    applySpeed(currentSpeed + STEP);
  } else if (e.key === 's' || e.key === 'S') {
    e.preventDefault();
    applySpeed(currentSpeed - STEP);
  } else if (e.key === 'a' || e.key === 'A') {
    e.preventDefault();
    applySpeed(DEFAULT_SPEED);
  }
}, true);

// ─── Messages from popup ────────────────────────────────────────────────────

chrome.runtime.onMessage.addListener((msg) => {
  if (msg.type === 'STATE_CHANGED') {
    isEnabled = msg.enabled;
    if (!isEnabled) {
      getMediaElements().forEach(el => { el.playbackRate = DEFAULT_SPEED; });
      if (hud) hud.style.opacity = '0';
      chrome.runtime.sendMessage({ type: 'UPDATE_BADGE', speed: currentSpeed, enabled: false })
        .catch(() => {});
    } else {
      applySpeed(currentSpeed);
    }
  } else if (msg.type === 'RESET_SPEED') {
    applySpeed(DEFAULT_SPEED);
  }
});

// ─── Init ───────────────────────────────────────────────────────────────────

loadState(() => {
  const tryApply = () => {
    if (isEnabled) {
      getMediaElements().forEach(el => { el.playbackRate = currentSpeed; });
    }
    watchMedia();
    bindYTNavigation();
    // Send initial badge state
    chrome.runtime.sendMessage({ type: 'UPDATE_BADGE', speed: currentSpeed, enabled: isEnabled })
      .catch(() => {});
  };

  tryApply();
  window.addEventListener('load', tryApply);

  mediaObserver.observe(document.body || document.documentElement, {
    childList: true, subtree: true
  });
  setInterval(watchMedia, 1500);
});
