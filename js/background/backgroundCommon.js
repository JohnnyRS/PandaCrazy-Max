let extSearchUI = null, extPandaUI = null, searchUIClosed = false, dbGood = false, dbError=null;
let mySearch = new MturkHitSearch(950); // Little lower than 1s timer by default for hit search.
let myPanda = new MturkPanda(995, 950); // Little lower than 1s timer by default for collecting panda's.
let myQueue = new MturkQueue(2000); // 2s for queue monitor by default

/**
 * Checks if panda UI was closed so it can stop the queue monitor and search UI.
 */
function checkUIConnects() {
  if (extPandaUI===null) { myQueue.stopQueueMonitor(); mySearch.closedUI("pandaUI"); mySearch.stopSearching(); }
}
/**
 * Function to set up a search UI variable for the background and returns search class.
 * @param {object} classUI    Object variable for the search UI or null if UI is closing.
 * @return {object}           Returns the search class in background for easier access.
 */
function gSetSearchUI(classUI) {
  extSearchUI = classUI; if (classUI===null) searchUIClosed = true; return mySearch;
}
/**
 * Function to set up a panda UI variable for the background use.
 * Also checks on the status of the panda UI to see if it's closing.
 * @param {object} classUI    Object variable for the panda UI or null if UI is closing.
 */
function gSetPandaUI(classUI) {
  extPandaUI = classUI; checkUIConnects();
}
function gGetPanda() { return myPanda; } // Returns the panda class for easier access from UI's.
function gGetQueue() { return myQueue; } // Returns the queue class for easier access from UI's.

// Open the panda DB and sets a good variable or sets database error variable.
myPanda.openDB().then( e => { dbGood = true; }, rejected => { dbError=rejected; });

/**
 * Checks to make sure the database is fully opened and if not it will keep checking for 30 seconds.
 * After 30 seconds it will timeout and reject with an error.
 * @return {promise}    Returns true if database opened. Rejects if timedout waiting for an open database.
 */
function gCheckPandaDB() {
  let timeout = 30000; // 30 seconds timeout to wait for a good opened database
  const start = Date.now(); // Get date started to know if 30 seconds has passed.
  return new Promise(waitForDB);
  function waitForDB(resolve, reject) {
    /**
     * Recursive function to check if dbGood is true meaning that the database has opened up.
     * Uses setTimeout to run this function over again until 30 seconds has elapsed.
     * @return {promise}      Resolves to true if database opened. Rejects with timedout Error object.
     */
    if (dbGood) resolve(dbGood); // If database is opened send a resolve with true.
    else if (dbError) reject(dbError); // If opening a database ends in error then reject with Error object.
    else if ( (Date.now() - start) >= timeout) reject(new Error("Timedout waiting for DB to open."));
    else setTimeout(waitForDB.bind(this, resolve, reject), 1000);
  }
}
