const bgPage = chrome.extension.getBackgroundPage(); // Get background page for extension
let search = null, bgQueue = null, bgSearchClass = null, modal = null;

async function prepare() {
  await bgPage.prepareToOpen(_, true);
  search = new SearchUI(); bgQueue = bgPage.gGetQueue();
  bgSearchClass = bgPage.gSetSearchUI(search);
}
/**
 * Starts the search crazy UI and prepares all the search triggers.
 */
async function startSearchCrazy() {
  /** Detect when user closes page so background page can remove anything it doesn't need without the search UI. **/
  await prepare();
  window.addEventListener('beforeunload', (e) => { bgPage.gSetSearchUI(null); });
  search.prepareSearch();
  bgSearchClass.addTrigger('rid', {'name':'Ben Peterson', 'reqId':'AFEG4RKNBSL4T', 'groupId':'', 'title':'', 'reqName':'Ben Peterson', 'pay':0.01, 'duration':'6 minutes', 'status':'searching'}, {'duration': 12000, 'once':false, 'limitNumQueue':0, 'limitTotalQueue':0, 'limitFetches':0, 'autoGoHam':false, 'goHamDuration':0, 'tempGoHam':4000});
  bgSearchClass.addTrigger('gid', {'name':'Ibotta, Inc.', 'reqId':'', 'groupId':'30B721SJLR5BYYBNQJ0CVKKCWQZ0OI', 'title':'', 'reqName':'Ibotta, Inc.', 'pay':0.01, 'duration':'6 minutes', 'status':'disabled'}, {'duration': 12000, 'once':false, 'limitNumQueue':0, 'limitTotalQueue':0, 'limitFetches':0, 'autoGoHam':false, 'goHamDuration':0, 'tempGoHam':4000});
}
/** ================ First lines executed when page is loaded. ============================ **/
allTabs('/searchCrazy.html', count => { // Count how many Search Crazy pages are opened.
  if (count<2) startSearchCrazy(); // If there are less than 2 pages opened then start loading data.
  else haltScript(null, 'You have SearchCrazy Max running in another tab or window. You can\'t have multiple instances running or it will cause database problems.', null, 'Error starting SearchCrazy Max', true);
});
