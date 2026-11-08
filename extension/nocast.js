// Runs in the page before its own scripts. Hides the browser APIs that
// websites use to start their own Cast session, so they can't take over
// a tab mirror. Chrome's own "Cast tab" doesn't use these, so it keeps working.
(() => {
  try {
    Object.defineProperty(Navigator.prototype, 'presentation', {
      get: () => undefined, configurable: true
    });
  } catch (e) {}
  try {
    Object.defineProperty(HTMLMediaElement.prototype, 'disableRemotePlayback', {
      get: () => true, set: () => {}, configurable: true
    });
  } catch (e) {}
  try {
    if ('remote' in HTMLMediaElement.prototype) {
      Object.defineProperty(HTMLMediaElement.prototype, 'remote', {
        get: () => undefined, configurable: true
      });
    }
  } catch (e) {}
  try { window.PresentationRequest = undefined; } catch (e) {}
  try {
    Object.defineProperty(window, 'chrome', {
      value: Object.assign(window.chrome || {}, { cast: undefined }),
      writable: true, configurable: true
    });
  } catch (e) {}
})();
