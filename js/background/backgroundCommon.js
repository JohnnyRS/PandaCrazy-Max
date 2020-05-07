let extSearchUI = null, extPandaUI = null, searchUIClosed = false;
let mySearch = new MturkHitSearch(950); // little lower than 1s panda timer by default for hit search
let myPanda = new MturkPanda(995, 950); // little lower than 1s panda timer by default for hit search
let myQueue = new MturkQueue(2000); // 2s for queue monitor by default

function checkUIConnects() {
  if (extPandaUI===null) { myQueue.stopQueueMonitor(); mySearch.closedUI("pandaUI"); mySearch.stopSearching(); }
}
function gSetSearchUI(classUI) { extSearchUI = classUI; if (classUI===null) searchUIClosed = true; return mySearch; }
function gSetPandaUI(classUI) { extPandaUI = classUI; checkUIConnects(); return myPanda; }
function gReturnQueueClass() { return myQueue; }