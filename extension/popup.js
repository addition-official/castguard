const DEFAULTS = { enabled: true, disabledSites: [] };
const $ = id => document.getElementById(id);
let tab = null, site = null;

function siteOf(url) {
  try {
    const u = new URL(url);
    if (u.protocol !== 'http:' && u.protocol !== 'https:') return null;
    return u.hostname.replace(/^www\./, '');
  } catch { return null; }
}
function coveringEntry(s, list) {
  if (!s) return null;
  return list.find(e => s === e || s.endsWith('.' + e)) || null;
}

async function getState() {
  return { ...DEFAULTS, ...(await chrome.storage.local.get(DEFAULTS)) };
}

async function apply(newState, reload = true) {
  await chrome.storage.local.set(newState);
  await chrome.runtime.sendMessage({ type: 'sync' });
  if (reload && tab && site) chrome.tabs.reload(tab.id);
  render();
}

async function render() {
  const { enabled, disabledSites } = await getState();
  const covered = coveringEntry(site, disabledSites);
  const onHere = enabled && !covered;

  $('global').checked = enabled;
  $('site').textContent = site || 'This page';
  const power = $('power');
  power.classList.toggle('off', !onHere);
  power.disabled = !site || !enabled;

  $('status').textContent =
    !site ? 'Not available on this page'
    : !enabled ? 'Off everywhere'
    : covered ? 'Off on this site'
    : 'Protecting this site';

  $('count').textContent = disabledSites.length;
  const list = $('list');
  list.innerHTML = '';
  if (!disabledSites.length) {
    const li = document.createElement('li');
    li.className = 'empty';
    li.textContent = 'None';
    list.appendChild(li);
  }
  for (const s of [...disabledSites].sort()) {
    const li = document.createElement('li');
    const name = document.createElement('span');
    name.textContent = s;
    const x = document.createElement('button');
    x.textContent = '✕';
    x.title = 'Turn protection back on for ' + s;
    x.onclick = async () => {
      const st = await getState();
      await apply({ disabledSites: st.disabledSites.filter(e => e !== s) }, coveringEntry(site, [s]) !== null);
    };
    li.append(name, x);
    list.appendChild(li);
  }
}

$('power').onclick = async () => {
  if (!site) return;
  const st = await getState();
  const covered = coveringEntry(site, st.disabledSites);
  const disabledSites = covered
    ? st.disabledSites.filter(e => e !== covered)
    : [...st.disabledSites, site];
  await apply({ disabledSites });
};

$('global').onchange = async e => {
  await apply({ enabled: e.target.checked });
};

(async () => {
  [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  site = siteOf(tab && tab.url);
  render();
})();
