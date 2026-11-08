<p align="center">
  <img src="extension/icons/128.png" width="96" alt="CastGuard icon">
</p>

<h1 align="center">CastGuard</h1>

<p align="center">
  Stop websites like YouTube from hijacking Chrome's <b>Cast tab</b>.<br>
  Keep mirroring your tab, with per-site toggles like uBlock.
</p>

---

## The problem

You pick **Cast tab** in Chrome, start a YouTube video, and... the tab mirror closes and your TV launches its own YouTube app instead. Some other video sites do the same thing.

That happens because the site's player looks for a cast session, takes it over, and hands playback to the TV's app. Chrome has no setting to stop it.

## What CastGuard does

CastGuard hides casting from websites so they can't take over. Chrome's own **Cast tab** works at the browser level, so it keeps mirroring normally.

- Blocks the Google Cast SDK scripts sites use to find your TV (`cast_sender.js`, `cast_framework.js`)
- Hides the browser casting APIs from pages (Presentation API and Remote Playback API)
- Popup with a **power button for the current site** and a **switch for all sites**
- List of sites you've turned it off on, with one-click undo
- `OFF` badge on the icon when the current tab isn't protected
- No data collected, no network requests, no tracking

> **Heads up:** while CastGuard is on, the cast buttons *inside* websites (like the one in YouTube's player) won't work. That's the point. Turn it off for a site from the popup if you want them back.

## Install

CastGuard isn't on the Chrome Web Store, so you load it yourself. It takes about a minute.

1. [Download this repo as a ZIP](https://github.com/addition-official/castguard/archive/refs/heads/main.zip) and unzip it (or `git clone` it).
2. Open `chrome://extensions`.
3. Turn on **Developer mode** (top right).
4. Click **Load unpacked** and select the **`extension`** folder.
5. Pin CastGuard from the puzzle-piece menu so the popup is one click away.

Works in Chrome and other Chromium browsers (Edge, Brave, etc.) that support Manifest V3.

### Updating

Download the new version, replace your `extension` folder, then click the reload arrow on CastGuard's card in `chrome://extensions`. Your settings are kept.

## Using it

1. Open a site and click the CastGuard icon.
2. The big button turns protection on or off **for that site** (and its subdomains). Blue means protected.
3. **Protect all sites** turns everything on or off.
4. The tab reloads automatically so the change takes effect.
5. Then cast as normal: Chrome menu, **Cast...**, **Sources**, **Cast tab**.

## How it works

| Part | File | What it does |
| --- | --- | --- |
| Network rules | `extension/rules.json` | Blocks Cast SDK scripts from `gstatic.com` and any self-hosted `cast_sender.js` / `cast_framework.js` |
| Page script | `extension/nocast.js` | Runs before the page's own scripts and hides `navigator.presentation`, `PresentationRequest`, `HTMLMediaElement.remote` and `chrome.cast` |
| Settings | `extension/background.js` | Turns the rules and page script on or off, and adds exceptions for sites you've turned off |
| Popup | `extension/popup.html`, `popup.js` | The toggle UI |

### Permissions

- **Read and change data on all sites:** needed so the page script can run on any site before its player loads.
- **declarativeNetRequest:** blocks the Cast SDK scripts.
- **scripting:** registers the page script, skipping sites you've turned off.
- **storage:** saves your on/off settings locally.

## Troubleshooting

- **A site still takes over the cast:** make sure the popup shows it as protected, reload the tab, and try again. If it still happens, [open an issue](https://github.com/addition-official/castguard/issues) with the site's link.
- **A site's video player is broken:** turn CastGuard off for that site from the popup and open an issue.

## License

[MIT](LICENSE)

## A note on how this was built

This started as "why does casting YouTube open my TV's YouTube app instead of just mirroring the tab?" The usual answers didn't work: picking **Sources > Cast tab** still got hijacked the moment a video started, the uBlock Origin filter fix is gone since Chrome dropped Manifest V2, and casting the whole screen wasn't what I wanted. The cause turned out to be the page's own player grabbing the cast session through Google's Cast SDK. Blocking that one script fixed YouTube. Hiding the browser's Presentation and Remote Playback APIs from pages extended the fix to sites that host the SDK themselves or skip it. The per-site toggle came later, because I missed uBlock's popup.

I used AI assistance throughout: for figuring out why the takeover happens, for the extension code, the icon, and this README. Testing it on my own TV, deciding what it should and shouldn't do, and shaping how it works and looks are mine.
