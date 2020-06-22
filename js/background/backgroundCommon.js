let extSearchUI = null, extPandaUI = null, searchUIClosed = false, dbGood = false, dbError=null;
let mySearch = new MturkHitSearch(950); // Little lower than 1s timer by default for hit search.
let myPanda = new MturkPanda(995, 950); // Little lower than 1s timer by default for collecting panda's.
let myQueue = new MturkQueue(2000); // 2s for queue monitor by default

/**
 * Checks if panda UI was closed so it can stop the queue monitor and search UI.
 */
function checkUIConnects() {
  if (extPandaUI === null) { myQueue.stopQueueMonitor(); mySearch.originRemove("pandaUI"); mySearch.stopSearching(); dbGood = false; }
}
/**
 * Function to set up a search UI variable for the background and returns search class.
 * @param {object} classUI - Object variable for the search UI or null if UI is closing.
 * @return {object}        - Returns the search class in background for easier access.
 */
function gSetSearchUI(classUI) {
  extSearchUI = classUI; if (classUI===null) searchUIClosed = true; return mySearch;
}
/**
 * Function to set up a panda UI variable for the background use.
 * Also checks on the status of the panda UI to see if it's closing.
 * @param {pandaUI} classUI - Object variable for the panda UI or null if UI is closing.
 */
function gSetPandaUI(classUI) {
  extPandaUI = classUI; checkUIConnects();
}
/**
 * Sends back the panda class object so pages can use it easily.
 * @return - Returns the panda class object from the external page.
 */
function gGetPanda() { return myPanda; }
/**
 * Sends back the queue class object so pages can use it easily.
 * @return - Returns the queue class object from the external page.
 */
function gGetQueue() { return myQueue; }

/**
 * Checks to make sure the database is fully opened and if not it will keep checking for 30 seconds.
 * After 30 seconds it will timeout and reject with an error.
 * @return {promise} - Returns true if database opened. Rejects if timedout waiting for an open database.
 */
async function gCheckPandaDB() { return await myPanda.testDB() }

// Open the panda DB and sets a good variable or sets database error variable.
myPanda.openDB().then( e => { dbGood = true; }, rejected => { dbError=rejected; });
