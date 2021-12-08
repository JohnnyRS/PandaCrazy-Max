
/** Cleans the chrome local storage of all created data from extension. Used at start and when all pages are closed. **/
function cleanLocalStorage() {
  if (chrome.storage) {
    chrome.storage.local.get(null, values => {
      for (const key of Object.keys(values)) { if (key.includes('PCM_')) chrome.storage.local.remove(key); }
      chrome.storage.local.set({'PCM_running':false});
    });
  }
}

/** ================ EventListener Section ================================================================================================= **/
/** Handles any messages coming from other pages and sends out messages from local variables. */
chrome.runtime.onMessage.addListener( (request,_, sendResponse) => {
  if (request.command === 'pandaUI_starting') {
    chrome.storage.local.get('firstInstall', (result) => {
      chrome.storage.local.set({'firstInstall':false});
    });
    chrome.storage.local.get('startingUp', (result) => { // Find out if another page has tried to start up by checking the hold data.
      if (typeof result.startingUp === 'undefined') chrome.storage.local.set({'startingUp':request.data.tabID}, () => { sendResponse(true); });
      else sendResponse(false);
    });
  } else if (request.command === 'pandaUI_startDone') chrome.storage.local.remove('startingUp'); // Release hold on any other pages trying to start up at same time.
  else if (request.command === 'searchUI_starting') {
    chrome.storage.local.get('searchUI_startingUp', (result) => { // Find out if another page has tried to start up by checking the hold data.
      if (typeof result.searchUI_startingUp === 'undefined') chrome.storage.local.set({'searchUI_startingUp':request.data.tabID}, () => { sendResponse(true); });
      else sendResponse(false);
    });
  } else if (request.command === 'searchUI_startDone') chrome.storage.local.remove('searchUI_startingUp');
  else if (request.command === 'pandaUI_opened') { chrome.storage.local.set({'PCM_running':true}); }
  else if (request.command === 'pandaUI_status') chrome.storage.local.get('PCM_running', (r) => { sendResponse(r.PCM_running); });
  else if (request.command === 'cleanLocalStorage') cleanLocalStorage();
  return true;
});
/** Detects when the extension is first installed or restarted. **/
chrome.runtime.onInstalled.addListener( () => {
  cleanLocalStorage();
  chrome.storage.local.set({'firstInstall':true}); chrome.storage.local.remove('startingUp'); chrome.storage.local.remove('searchUI_startingUp');
  chrome.storage.local.set({'PCM_running':false});
});
