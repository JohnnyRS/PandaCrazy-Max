let extSearchUI = null, extPandaUI = null, dbError = null, savedSearchUI = null;
let pandaUIOpened = false, searchUIOpened = false;
let mySearch = null, myPanda = null, myHistory = null, myQueue = null;
let pandaTimer = null, queueTimer = null, searchTimer = null;

/** Checks if panda UI was closed so it can stop the queue monitor and search UI. */
function checkUIConnects() {
  if (extPandaUI === null) { myQueue.stopQueueMonitor(); mySearch.stopSearching(); }
  if (!pandaUIOpened && !searchUIOpened) removeAll();
}
/** Removes all data and classes. Also closes any databases opened when page is closing. */
function removeAll() {
  mySearch.removeAll(); myPanda.closeDB(); mySearch.closeDB(); myHistory.closeDB(); 
  myPanda = null; mySearch = null; myHistory = null; myQueue = null;
  pandaTimer = null; queueTimer = null; searchTimer = null;
  if (chrome.storage) chrome.storage.local.set({'pcm_running':false});
}
function searchUIImporting() { savedSearchUI = extSearchUI; gSetSearchUI(null); }
/** Function to set up a search UI variable for the background and returns search class.
 * @param {object} classUI - Object variable for the search UI or null if UI is closing.
 * @return {object}        - Returns the search class in background for easier access. */
function gSetSearchUI(classUI) {
  extSearchUI = classUI;
  if (classUI === null) { if (pandaUIOpened) mySearch.originRemove(); searchUIOpened = false; }
  checkUIConnects();
  return mySearch;
}
/** Function to set up a panda UI variable for the background use. Also checks on the status of the panda UI to see if it's closing.
 * @param {pandaUI} classUI - Object variable for the panda UI or null if UI is closing. */
async function gSetPandaUI(classUI) {
  if (!classUI) { myPanda.removeAll(true); pandaUIOpened = false; }
  extPandaUI = classUI; checkUIConnects();
}
/** Sends back the panda class object so pages can use it easily.
 * @return - Returns the panda class object from the external page. */
function gGetPanda() { return myPanda; }
/** Sends back the queue class object so pages can use it easily.
 * @return - Returns the queue class object from the external page. */
function gGetQueue() { return myQueue; }
/** Sends back the search class object so pages can use it easily.
 * @return - Returns the search class object from the external page. */
function gGetSearch() { return mySearch; }
/** Sends back the history class object so pages can use it easily.
 * @return - Returns the history class object from the external page. */
function gGetHistory() { return myHistory; }
/** Checks to make sure the database is fully opened and if not it will keep checking for 30 seconds.
 * @return {promise} - Returns true if database opened. Rejects if timedout waiting for an open database. */
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
  if (!panda && !search) return;
  if (!myPanda && !searchUIOpened) {
    chrome.storage.local.set({'pcm_running':true});
    myHistory = new HistoryClass();
    await myHistory.openDB(historyWipe).then( async () => {
      dbHistoryGood = true;
      myHistory.maintenance();
      pandaTimer = new TimerClass(995,970,'pandaTimer'); // little lower than 1s for panda timer by default
      queueTimer = new TimerClass(2000,1000,'queueTimer'); // 2s for queue monitor by default
      searchTimer = new TimerClass(950,920,'searchTimer'); // little lower than 1s for search timer by default
      myQueue = new MturkQueue(2000);
      myPanda = new MturkPanda(995, 950);
      await myPanda.openDB().then( async () => {
        mySearch = new MturkHitSearch(950);
        await mySearch.openDB().then(_, rejected => { dbError = rejected; console.error(rejected); } )
      }, rejected => { dbError = rejected; });
    }, rejected => { dbError = rejected; console.error(rejected); } );
  }
  if (panda) pandaUIOpened = true;
  if (search) searchUIOpened = true;
}
function pandaUILoaded() { if (savedSearchUI) savedSearchUI.pandaUILoaded(); }
function wipeData() {
  if (!myHistory && !mySearch && !myPanda) {
    myHistory = new HistoryClass(); myHistory.wipeData(); myHistory = null;
    mySearch = new MturkHitSearch(); mySearch.wipeData(); mySearch = null;
    myPanda = new MturkPanda(); myPanda.wipeData(); myPanda = null;
  }
}