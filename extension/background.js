// Keeps the blocking rules and the page script in sync with the user's settings.
const DEFAULTS = { enabled: true, disabledSites: [] };
const SCRIPT_ID = 'nocast';

async function getState() {
  return { ...DEFAULTS, ...(await chrome.storage.local.get(DEFAULTS)) };
}

function siteOf(url) {
  try {
    const u = new URL(url);
    if (u.protocol !== 'http:' && u.protocol !== 'https:') return null;
    return u.hostname.replace(/^www\./, '');
  } catch { return null; }
}

// Which saved entry (if any) covers this site, e.g. "youtube.com" covers "m.youtube.com".
function coveringEntry(site, list) {
  if (!site) return null;
  return list.find(e => site === e || site.endsWith('.' + e)) || null;
}

function patternsFor(site) {
  const isIp = /^[\d.]+$/.test(site) || site.startsWith('[');
  return isIp ? [`*://${site}/*`] : [`*://*.${site}/*`];
}

async function sync() {
  const { enabled, disabledSites } = await getState();

  // 1. Network blocking of Cast scripts (global on/off).
  await chrome.declarativeNetRequest.updateEnabledRulesets(
    enabled ? { enableRulesetIds: ['rules'] } : { disableRulesetIds: ['rules'] }
  );

  // 2. Per-site exceptions: allow everything on pages from turned-off sites.
  const old = await chrome.declarativeNetRequest.getDynamicRules();
  const addRules = disabledSites.length ? [{
    id: 1,
    priority: 100,
    action: { type: 'allowAllRequests' },
    condition: { requestDomains: disabledSites, resourceTypes: ['main_frame', 'sub_frame'] }
  }] : [];
  await chrome.declarativeNetRequest.updateDynamicRules({
    removeRuleIds: old.map(r => r.id),
    addRules
  });

  // 3. The page script that hides casting APIs, skipping turned-off sites.
  const existing = await chrome.scripting.getRegisteredContentScripts({ ids: [SCRIPT_ID] });
  if (existing.length) await chrome.scripting.unregisterContentScripts({ ids: [SCRIPT_ID] });
  if (enabled) {
    await chrome.scripting.registerContentScripts([{
      id: SCRIPT_ID,
      js: ['nocast.js'],
      matches: ['<all_urls>'],
      excludeMatches: disabledSites.flatMap(patternsFor),
      runAt: 'document_start',
      allFrames: true,
      world: 'MAIN'
    }]);
  }

  await updateAllBadges();
}

async function updateBadge(tabId, url) {
  const { enabled, disabledSites } = await getState();
  const site = siteOf(url);
  const off = !enabled || !!coveringEntry(site, disabledSites);
  try {
    await chrome.action.setBadgeText({ tabId, text: off ? 'OFF' : '' });
  } catch {}
}

async function updateAllBadges() {
  const tabs = await chrome.tabs.query({});
  await Promise.all(tabs.map(t => updateBadge(t.id, t.url || '')));
}

chrome.runtime.onInstalled.addListener(() => {
  chrome.action.setBadgeBackgroundColor({ color: '#6b7280' });
  sync();
});
chrome.runtime.onStartup.addListener(() => {
  chrome.action.setBadgeBackgroundColor({ color: '#6b7280' });
  sync();
});

chrome.tabs.onUpdated.addListener((tabId, info, tab) => {
  if (info.url || info.status === 'loading') updateBadge(tabId, tab.url || '');
});
chrome.tabs.onActivated.addListener(async ({ tabId }) => {
  try { const tab = await chrome.tabs.get(tabId); updateBadge(tabId, tab.url || ''); } catch {}
});

chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  if (msg && msg.type === 'sync') {
    sync().then(() => sendResponse(true), err => sendResponse({ error: String(err) }));
    return true;
  }
});
