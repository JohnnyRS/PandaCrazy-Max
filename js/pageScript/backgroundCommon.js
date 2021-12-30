let isFirefox = navigator.userAgent.toLowerCase().indexOf('firefox') > -1;
if (!isFirefox) importScripts('../../lib/browser-polyfill.js');  // To make it compatible with firefox message sending with a Promise.
let gStarting = false;  // Temporary variable used to keep multiple pages running at same time. Stays in memory only when service worker is active.

/** Cleans the chrome local storage of all created data from extension. Used at start and when all pages are closed. **/
function cleanLocalStorage() {
  gStarting = false;
  if (browser.storage) {
    browser.storage.local.get(null).then(values => {
      for (const key of Object.keys(values)) { if (key.includes('PCM_')) browser.storage.local.remove(key); }
    });
  }
}

/** ================ EventListener Section ================================================================================================= **/
/** Handles any messages coming from other pages and sends out messages from local variables. */
browser.runtime.onMessage.addListener(request => {
  if (request.command === 'pandaUI_opened') browser.storage.local.set({'PCM_running':true});
  else if (request.command === 'pandaUI_closed') { browser.storage.local.remove('PCM_running'); cleanLocalStorage(); }
  else if (request.command === 'pandaUI_status') return browser.storage.local.get('PCM_running').then(r => r.PCM_running);
  else if (request.command === 'searchUI_opened') browser.storage.local.set({'PCM_searchUI_running':true});
  else if (request.command === 'searchUI_closed') browser.storage.local.remove('PCM_searchUI_running');
  else if (request.command === 'searchUI_status') return browser.storage.local.get('PCM_searchUI_running').then(r => r.PCM_searchUI_running);
  else if (request.command === 'pandaUI_startDone' || request.command === 'searchUI_start_done') gStarting = false;
  else if (request.command === 'doTimeout') { return new Promise((resolve) => { setTimeout((thisId) => resolve(thisId), request.value, request.id); }); }
  else if (request.command === 'pandaUI_starting' || request.command === 'searchUI_starting') {
    if (!gStarting) { gStarting = true; return Promise.resolve(true); } else return Promise.resolve(false);
  }
});
/** Detects when the extension is first installed or restarted. **/
browser.runtime.onInstalled.addListener( () => { cleanLocalStorage(); browser.storage.local.set({'firstInstall':true}); });
