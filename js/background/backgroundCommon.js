let extSearchUI = null, extPandaUI = null, dbError = null, savedSearchUI = null, pandaOpening = false, searchOpening = false;
let pandaUIOpened = false, searchUIOpened = false, MYDB = null, mySearch = null, myPanda = null, myHistory = null, myQueue = null;
let pandaTimer = null, queueTimer = null, searchTimer = null, MyOptions = null, MyAlarms = null, myDash = null, currentTab = {'url':'about:blank', 'tabId':null};
chrome.storage.local.set({'PCM_running':false});

/** Checks if panda UI was closed so it can stop the queue monitor and search UI. */
function checkUIConnects() {
  if (extPandaUI === null) { myQueue.stopQueueMonitor(); mySearch.stopSearching(); }
  if (!pandaUIOpened && !searchUIOpened) { removeAll(); MYDB = null; MyOptions = null; MyAlarms = null; } 
}
/** Cleans the chrome local storage of all created data from extension. Used at start and when all pages are closed. */
function cleanLocalStorage() {
  if (chrome.storage) {
    chrome.storage.local.get(null, (values) => {
      for (const key of Object.keys(values)) { if (key.includes('PCM_')) chrome.storage.local.remove(key); }
    })
    chrome.storage.local.set({'PCM_running':false});
  }
}
/** Removes all data and classes. Also closes any databases opened when page is closing. */
function removeAll() {
  mySearch.removeAll(); myPanda.closeDB(); mySearch.closeDB(); myHistory.closeDB(); MyAlarms.removeAll(); MyOptions.removeAll();
  myPanda = null; mySearch = null; myHistory = null; myQueue = null; myDash = null; pandaTimer = null; queueTimer = null; searchTimer = null; dbError = null;
  cleanLocalStorage();
}
function searchUIImporting() { savedSearchUI = extSearchUI; gSetSearchUI(null); }
/** Function to set up a search UI variable for the background and returns search class.
 * @param {object} classUI - Object variable for the search UI or null if UI is closing.
 * @return {object}        - Returns the search class in background for easier access. */
function gSetSearchUI(classUI) {
  extSearchUI = classUI;
  if (classUI === null) { if (pandaUIOpened) mySearch.originRemove(); myPanda.searchUIConnect(false); MyAlarms.setAudioClass(null, 'search'); searchUIOpened = false; }
  else if (myPanda) myPanda.searchUIConnect(true);
  checkUIConnects();
  return mySearch;
}
/** Function to set up a panda UI variable for the background use. Also checks on the status of the panda UI to see if it's closing.
 * @param {pandaUI} classUI - Object variable for the panda UI or null if UI is closing. */
async function gSetPandaUI(classUI) {
  if (classUI === null) { myPanda.removeAll(true); MyAlarms.setAudioClass(null, 'panda'); pandaUIOpened = false; }
  extPandaUI = classUI; checkUIConnects();
}
function themeChanged() {
  if (extSearchUI) extSearchUI.themeChanged(true);
}
/** Sends back the panda class object so pages can use it easily.
 * @return - Returns the panda class object from the external page. */
function gGetPanda() { return myPanda; }
/** Sends back the queue class object so pages can use it easily.
 * @return - Returns the queue class object from the external page. */
function gGetQueue() { return myQueue; }
function gGetDash() { return myDash; }
/** Sends back the search class object so pages can use it easily.
 * @return - Returns the search class object from the external page. */
function gGetSearch() { return mySearch; }
/** Sends back the history class object so pages can use it easily.
 * @return - Returns the history class object from the external page. */
function gGetHistory() { return myHistory; }
/** Checks to make sure the database is fully opened and if not it will keep checking for 30 seconds.
 * @return {promise} - Returns true if database opened. Rejects if timedout waiting for an open database. */
function gGetMYDB() { return MYDB; }
function gGetOptions() { return MyOptions; }
function gGetAlarms(audioClass, ui) { MyAlarms.setAudioClass(audioClass, ui); return MyAlarms; }
async function gCheckPandaDB() { new Promise(resolve => {
    let counting = 0;
    checkDBs = () => {
      counting++;
      if (myHistory.db && myPanda.db) return true;
      else if (counting > 50) return true;
      else setTimeout( checkDBs(), 20 );
    }
    resolve(checkDBs());
  });
}
// Open the panda and search DB and sets a good variable or sets database error variable.
async function prepareToOpen(panda=null, search=null, version=null) {
  let historyWipe = false; if (compareversion(version, '0.8.7')) historyWipe = true; // For older versions of history.
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
        myHistory.maintenance();
        pandaTimer = new TimerClass(995,970,'pandaTimer'); // little lower than 1s for panda timer by default
        queueTimer = new TimerClass(2000,1000,'queueTimer'); // 2s for queue monitor by default
        searchTimer = new TimerClass(950,920,'searchTimer'); // little lower than 1s for search timer by default
        myQueue = new MturkQueue(2000); myDash = new MturkDashboard(); myPanda = new MturkPanda(995, 950);
        await MYDB.openPCM().then( async () => {
          await MYDB.openStats(true).then( async () => {
            await MyOptions.prepare();
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
function pandaUILoaded() { if (savedSearchUI) { savedSearchUI.pandaUILoaded(); savedSearchUI = null; } }
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
function popupOpened() {
  console.log('popup opened');
}
function getCurrentTab(doAfter=null) {
  chrome.tabs.query({ active: true, currentWindow: true
  }, function(tabs) {
    let tab = tabs[0];
    let url = tab.url; console.log(url);
    if (doAfter) doAfter(url);
  });
}

cleanLocalStorage();
