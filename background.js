// background.js - Speedster service worker

chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.sync.set({ disabledSites: [], siteSpeed: {} });
});

// Update the badge on the extension icon for the active tab
chrome.runtime.onMessage.addListener((msg, sender) => {
  if (msg.type !== 'UPDATE_BADGE') return;
  // Only update badge for the top-level frame (not iframes)
  if (sender.frameId !== 0) return;

  const tabId = sender.tab && sender.tab.id;
  if (!tabId) return;

  const speed = msg.speed;
  const enabled = msg.enabled;

  if (!enabled) {
    chrome.action.setBadgeText({ text: 'OFF', tabId });
    chrome.action.setBadgeBackgroundColor({ color: '#888888', tabId });
    return;
  }

  // Show e.g. "1.0" or "1.5" — keep it short for the badge
  const label = speed === 1.0 ? '1.0×' : speed.toFixed(1) + '×';
  chrome.action.setBadgeText({ text: label, tabId });

  // Green-tinted when above normal, neutral at 1.0, amber when below
  let color;
  if (speed > 1.0)      color = '#2e7d32'; // dark green
  else if (speed < 1.0) color = '#e65100'; // amber
  else                  color = '#37474f'; // neutral dark slate

  chrome.action.setBadgeBackgroundColor({ color, tabId });
});

// Clear badge when navigating away from a tab
chrome.tabs.onUpdated.addListener((tabId, changeInfo) => {
  if (changeInfo.status === 'loading') {
    chrome.action.setBadgeText({ text: '', tabId });
  }
});
