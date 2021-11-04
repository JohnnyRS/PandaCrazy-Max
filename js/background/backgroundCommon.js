let extSearchUI = null, extPandaUI = null, dbError = null, savedSearchUI = null, pandaOpening = false, searchOpening = false, newUpdatedVersion = null;
let pandaUIOpened = false, searchUIOpened = false, MYDB = null, mySearch = null, myPanda = null, myHistory = null, myQueue = null, gLocalVersion = null;
let pandaTimer = null, queueTimer = null, searchTimer = null, MyOptions = null, MyAlarms = null, myDash = null, currentTab = null, firstInstall = false;
let MySearchUI = new ExtSearchUI(null);
chrome.storage.local.set({'PCM_running':false});

/** Checks if panda UI was closed so it can stop the queue monitor and search UI. */
function checkUIConnects() {
  if (extPandaUI === null) { myQueue.stopQueueMonitor(); mySearch.stopSearching(); }
  if (!pandaUIOpened && !searchUIOpened) { removeAll(); MYDB = null; MyOptions = null; MyAlarms = null; } 
}
/** Cleans the chrome local storage of all created data from extension. Used at start and when all pages are closed. */
function cleanLocalStorage() {
  if (chrome.storage) {
    chrome.storage.local.get(null, values => { for (const key of Object.keys(values)) { if (key.includes('PCM_')) chrome.storage.local.remove(key); } });
    chrome.storage.local.set({'PCM_running':false});
  }
}
/** Removes all data and classes. Also closes any databases opened when page is closing. */
function removeAll() {
  mySearch.removeAll(); myPanda.closeDB(); mySearch.closeDB(); myHistory.closeDB(); MyAlarms.removeAll(); MyOptions.removeAll();
  myPanda = null; mySearch = null; myHistory = null; myQueue = null; myDash = null; pandaTimer = null; queueTimer = null; searchTimer = null; dbError = null;
  extPandaUI = null;
  cleanLocalStorage();
}
/** Importing data so make sure searchUI gets refreshed if it was opened also. */
function searchUIImporting() { savedSearchUI = extSearchUI; gSetSearchUI(null); }
/** Returns the search UI class. Useful when detecting if the UI is already opened in another tab.
 * @return {class} - The Search UI Class. */
function gGetSearchUI() { return extSearchUI; }
function gGetMySearchUI() { return MySearchUI; }
/** Function to set up a search UI variable for the background and returns search class.
 * @param {class} classUI - Object variable for the search UI or null if UI is closing.
 * @return {class}        - Returns the search class in background for easier access. */
function gSetSearchUI(classUI) {
  extSearchUI = classUI;
  if (classUI === null) { if (pandaUIOpened) mySearch.originRemove(); myPanda.searchUIConnect(false); MyAlarms.setAudioClass(null, 'search'); searchUIOpened = false; }
  else if (myPanda) myPanda.searchUIConnect(true);
  checkUIConnects();
  return mySearch;
}
/** Returns the panda UI class. Useful when detecting if the UI is already opened in another tab.
 * @return {class} - The Panda UI Class. */
function gGetPandaUI() { return extPandaUI; }
/** Function to set up a panda UI variable for the background use. Also checks on the status of the panda UI to see if it's closing.
 * @param {pandaUI} classUI - Object variable for the panda UI or null if UI is closing. */
function gSetPandaUI(classUI) {
  if (classUI === null) { myPanda.removeAll(true); MyAlarms.setAudioClass(null, 'panda'); pandaUIOpened = false; }
  extPandaUI = classUI; checkUIConnects();
}
/** Theme has been changed so tell searchUI about it so it can change it's theme also. */
function themeChanged() { if (MySearchUI) MySearchUI.themeChanged(); }
/** Sends back the panda class object so pages can use it easily.
 * @return {class} - Returns the panda class object from the external page. */
function gGetPanda() { return myPanda; }
/** Sends back the queue class object so pages can use it easily.
 * @return {class} - Returns the queue class object from the external page. */
function gGetQueue() { return myQueue; }
/** Sends back the dashboard class object so pages can use it easily.
 * @return {class} - Returns the dashboard class object from the external page. */
function gGetDash() { return myDash; }
/** Sends back the search class object so pages can use it easily.
 * @return {class} - Returns the search class object from the external page. */
function gGetSearch() { return mySearch; }
/** Sends back the history class object so pages can use it easily.
 * @return {class} - Returns the history class object from the external page. */
function gGetHistory() { return myHistory; }
/** Sends back the MYDB class object so pages can use it easily.
 * @return {class} - Returns the MYDB class object from the external page. */
function gGetMYDB() { return MYDB; }
/** Sends back the options class object so pages can use it easily.
 * @return {class} - Returns the options class object from the external page. */
function gGetOptions() { return MyOptions; }
/** Sets up the audio class to the alarms class and then returns the alarms class.
 * @param  {class} audioClass - Audio Class  @param  {object} ui - User Interface
 * @return {class}            - Returns the alarms class. */
function gGetAlarms(audioClass, ui) { MyAlarms.setAudioClass(audioClass, ui); return MyAlarms; }
/** Checks for the history and panda database to be set. If not ready then recursively calls 50 times until the databases are ready.
 * @async - to wait for recursive calls to send a promised return. */
async function gCheckPandaDB() {
  new Promise( resolve => {
    let counting = 0;
    checkDBs = () => {
      counting++;
      if (myHistory.db && myPanda.db) return true; else if (counting > 50) return false; else setTimeout( checkDBs(), 20 );
    }
    resolve(checkDBs());
  });
}
/** Open the panda and search DB and sets a good variable or sets database error variable.
 * @async - To wait for databases to be opened and data loaded.
 * @param  {bool} [panda] - Should panda be prepared?  @param  {bool} [search] - Should search be prepared?  @param  {string} [version] - Extension Version */
async function prepareToOpen(panda=null, search=null, version=null) {
  let historyWipe = false; gLocalVersion = version; if (compareVersion(version, '0.8.7')) historyWipe = true; // For older versions of history.
  if (!panda && !search) return; else if (panda) pandaOpening = true; else if (search) searchOpening = true;
  if (panda && searchOpening) await delay(1500); else if (search && pandaOpening) await delay(1500);
  if (!MYDB) MYDB = new DatabasesClass();
  if (!MyOptions) MyOptions = new PandaGOptions();
  if (!MyAlarms) MyAlarms = new AlarmsClass();
  await MYDB.openSearching().then( async () => {
    await MYDB.openHistory(historyWipe).then( async () => {
      if (!myPanda && !searchUIOpened) {
        chrome.storage.local.set({'PCM_running':true});
        myHistory = new HistoryClass();
        dbHistoryGood = true;
        pandaTimer = new TimerClass(995,970,'pandaTimer'); // little lower than 1s for panda timer by default
        queueTimer = new TimerClass(2000,1000,'queueTimer'); // 2s for queue monitor by default
        searchTimer = new TimerClass(950,920,'searchTimer'); // little lower than 1s for search timer by default
        myQueue = new MturkQueue(2000); myDash = new MturkDashboard(); myPanda = new MturkPanda(995, 950);
        await MYDB.openPCM().then( async () => {
          await MYDB.openStats(true).then( async () => {
            await MyOptions.prepare();
            myHistory.maintenance();
            mySearch = new MturkHitSearch(950);
            myPanda.timerChange(MyOptions.getCurrentTimer()); mySearch.timerChange(MyOptions.theSearchTimer()); myQueue.timerChange(MyOptions.getQueueTimer());
            MyAlarms.prepare();
          }, rejected => { dbError = rejected; });
        }, rejected => { dbError = rejected; });
      }
      if (panda) { pandaUIOpened = true; pandaOpening = false; }
      if (search) { searchUIOpened = true; searchOpening = false; }
    }, rejected => { dbError = rejected; console.error(rejected); } );
  }, rejected => { dbError = rejected; console.error(rejected); } );
}
/** Once PandaUI is fully loaded check if searchUI needs to refresh and reset all tooltips using tooltip options. */
function pandaUILoaded() {
  if (savedSearchUI) { savedSearchUI.pandaUILoaded(); savedSearchUI = null; }
  if (MyOptions) MyOptions.resetToolTips();
}
/** Once SearchUI is fully loaded check if tooltips needs to be reset using tooltip options. */
function searchUILoaded() { if (MyOptions) MyOptions.resetToolTips(); }
/** Wipe all data from memory and database from each class usually from a user wipe data request. */
async function wipeData() {
  if (!MyOptions) MyOptions = new PandaGOptions();
  if (!myHistory && !mySearch && !myPanda) {
    if (!MYDB) MYDB = new DatabasesClass();
    pandaTimer = new TimerClass(995,970,'pandaTimer'); searchTimer = new TimerClass(950,920,'searchTimer');
    myHistory = new HistoryClass(); await myHistory.wipeData();
    mySearch = new MturkHitSearch(950); await mySearch.wipeData();
    myPanda = new MturkPanda(995, 950); await myPanda.wipeData();
    myPanda = null; mySearch = null; myHistory = null; pandaTimer = null; searchTimer = null; MYDB = null;
  }
}
/** Sends commands to the current tab or sends a close popup command to popup page.
 * @param {object} options - Options Object  @param {string} comm - Command  @param {function} [popupSend] - Popup Send Function  */
function helperSendCommands(options, comm, popupSend=null) {
  if (comm === 'newUrl' || comm === 'goNext' && popupSend) popupSend(null, true);
  if (options && currentTab) { chrome.tabs.sendMessage(currentTab.id, {'command':comm, 'data':options}); }
}
/** Used when a user clicks on the extension icon to show popup. Handles options or update notice to show on popup.
 * @param {function} popupSend - Popup Send Function */
function popupOpened(tab, popupSend) {
  if (!myQueue || !MyOptions) return; // Needs queue to be running to get the queue size.
  let generalOpt = MyOptions.doGeneral(); currentTab = tab; popupSend(null,_, generalOpt.showHelpTooltips);
  if (currentTab.url && /^(?!.*chrome-extension:\/\/|.*chrome:\/\/).*$/.test(currentTab.url)) {
    if (currentTab.title && !currentTab.title.includes('NO PCM')) {
      let helperOptions = (MyOptions) ? MyOptions.helperOptions(currentTab.url, myQueue.getQueueSize(), popupSend) : $(document.createDocumentFragment());
      popupSend(helperOptions); helperOptions = null;
    }
  }
  if (newUpdatedVersion) {
    let newUpdateOptions = $(document.createDocumentFragment());
    let versionUpdate = $(`<div class='pcm-newVersionUpdate'>New version: ${newUpdatedVersion} is detected.<br></div>`).appendTo(newUpdateOptions);
    $(`<button data-toggle='confirmation'>Click to Update Extension</button>`).click( () => {
      let result = confirm('Be aware that updating now will stop all jobs running and restart the extension.\n\nAre you sure you want to update now?');
      if (result === true) { chrome.runtime.reload(); }
      else { alert('OK. Extension update will happen after next chrome start.'); newUpdatedVersion = null; popupSend(null, true); }
    }).appendTo(versionUpdate);
    versionUpdate = null;
    popupSend(newUpdateOptions); newUpdateOptions = null;
  }
}

/** Clean any local storage when first starting up. */
cleanLocalStorage();

/** Sets the newUpdatedVersion variable so next time user clicks on the extension icon it can show a notice of a new update. Also will show a notification to user. */
chrome.runtime.onUpdateAvailable.addListener( details => {
  newUpdatedVersion = details.version;
  if (extPandaUI) { extPandaUI.newVersionAvailable(newUpdatedVersion); }
});

chrome.runtime.onMessage.addListener( (request,_, sendResponse) => {
  if (request.command === 'pcmStarting') {
    chrome.storage.local.get('firstInstall', (result) => {
      if (typeof result.firstInstall === 'undefined') firstInstall = true; else firstInstall = result.firstInstall;
      chrome.storage.local.set({'firstInstall':false});
    });
    chrome.storage.local.get('startingUp', (result) => { // Find out if another page has tried to start up by checking the hold data.
      if (typeof result.startingUp === 'undefined') chrome.storage.local.set({'startingUp':request.data.tabID}, () => { sendResponse(true); });
      else sendResponse(false);
    });
    return true;
  } else if (request.command === 'startDone') chrome.storage.local.remove('startingUp'); // Release hold on any other pages trying to start up at same time.
});

chrome.runtime.onInstalled.addListener( () => { chrome.storage.local.set({'firstInstall':true}); chrome.storage.local.remove('startingUp'); });
