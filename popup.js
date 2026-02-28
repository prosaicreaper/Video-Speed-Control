// popup.js

let currentHostname = '';
let tabId = null;

chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
  if (!tabs[0]) return;
  tabId = tabs[0].id;
  try { currentHostname = new URL(tabs[0].url).hostname; }
  catch { currentHostname = ''; }

  document.getElementById('siteHost').textContent = currentHostname || 'Unknown site';

  document.getElementById('togInput').addEventListener('change', (e) => {
    setEnabled(e.target.checked);
  });

  loadAndRender();
});

// ── Render ────────────────────────────────────────────────────────────────
function loadAndRender() {
  chrome.storage.sync.get(['disabledSites', 'siteSpeed'], (data) => {
    const disabledSites = data.disabledSites || [];
    const siteSpeed = data.siteSpeed || {};

    const isEnabled = !disabledSites.includes(currentHostname);
    const speed = siteSpeed[currentHostname] !== undefined ? siteSpeed[currentHostname] : 1.0;

    document.getElementById('speedBadge').innerHTML =
      `${speed.toFixed(1)}<span class="x">×</span>`;

    const togInput = document.getElementById('togInput');
    const togLabel = document.getElementById('togLabel');
    togInput.checked = isEnabled;
    togLabel.className = 'tog ' + (isEnabled ? 'on' : '');

    const lbl = document.getElementById('siteLabel');
    lbl.textContent = isEnabled ? 'active on this site' : 'disabled on this site';
    lbl.className = 'site-label ' + (isEnabled ? 'on' : 'off');

    renderBlocked(disabledSites);
  });
}

// ── Toggle ────────────────────────────────────────────────────────────────
function setEnabled(enabled) {
  chrome.storage.sync.get(['disabledSites'], (data) => {
    let disabledSites = data.disabledSites || [];
    if (!enabled) {
      if (!disabledSites.includes(currentHostname)) disabledSites.push(currentHostname);
    } else {
      disabledSites = disabledSites.filter(s => s !== currentHostname);
    }
    chrome.storage.sync.set({ disabledSites }, () => {
      notifyTab({ type: 'STATE_CHANGED', enabled });
      loadAndRender();
    });
  });
}

// ── Blocked list ──────────────────────────────────────────────────────────
function renderBlocked(disabledSites) {
  const list = document.getElementById('blockedList');
  list.innerHTML = '';
  if (!disabledSites.length) {
    list.innerHTML = '<div class="empty">no disabled sites</div>';
    return;
  }
  disabledSites.forEach(site => {
    const item = document.createElement('div');
    item.className = 'blocked-item';
    item.innerHTML = `<span>${site}</span><button data-site="${site}" title="Re-enable">✕</button>`;
    list.appendChild(item);
  });
  list.querySelectorAll('button').forEach(btn => {
    btn.addEventListener('click', () => {
      const site = btn.dataset.site;
      chrome.storage.sync.get(['disabledSites'], (data) => {
        const updated = (data.disabledSites || []).filter(s => s !== site);
        chrome.storage.sync.set({ disabledSites: updated }, () => {
          if (site === currentHostname) notifyTab({ type: 'STATE_CHANGED', enabled: true });
          loadAndRender();
        });
      });
    });
  });
}

// ── Reset ─────────────────────────────────────────────────────────────────
document.getElementById('resetBtn').addEventListener('click', () => {
  chrome.storage.sync.get(['siteSpeed'], (data) => {
    const siteSpeed = data.siteSpeed || {};
    siteSpeed[currentHostname] = 1.0;
    chrome.storage.sync.set({ siteSpeed }, () => {
      notifyTab({ type: 'RESET_SPEED' });
      loadAndRender();
    });
  });
});

// ── Messaging ─────────────────────────────────────────────────────────────
function notifyTab(msg) {
  if (tabId == null) return;
  chrome.tabs.sendMessage(tabId, msg).catch(() => {});
}
