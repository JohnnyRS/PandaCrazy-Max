const bgPage = chrome.extension.getBackgroundPage(); // Get background page for extension
let searchUI = new SearchUI(), globalOpt = null;
let bgSearchClass = bgPage.gSetSearchUI(searchUI);
const bgQueue = bgPage.gGetQueue();
const modal = null; // set up a modal class for a options, warnings or details
/**
 * Starts the search crazy UI and prepares all the search triggers.
 */
function startSearchCrazy() {
/** Detect when user closes page so background page can remove anything it doesn't need without the search UI. **/
window.addEventListener("beforeunload", (e) => { bgPage.gSetSearchUI(null); bgSearchClass.originRemove(); });
  searchUI.prepareSearch();
  bgSearchClass.addTrigger("rid", {"name":"Ben Peterson", "rid":"AFEG4RKNBSL4T", "gid":"", "duration": 6000, "once":false, "limitNumQueue":0, "limitTotalQueue":0, "limitFetches":0, "autoGoHam":false, goHamDuration:0, "tempGoHam":3000, "disabled":false, "from":"searchUI"});
  bgSearchClass.addTrigger("gid", {"name":"Ibotta, Inc.", "rid":"", "gid":"30B721SJLR5BYYBNQJ0CVKKCWQZ0OI", "duration": 6000, "once":false, "limitNumQueue":0, "limitTotalQueue":0, "limitFetches":0, "autoGoHam":false, goHamDuration:0, "tempGoHam":3000, "disabled":true, "from":"searchUI"});
}
/** ================ First lines executed when page is loaded. ============================ **/
allTabs('/searchCrazy.html', count => { // Count how many Search Crazy pages are opened.
  if (count<2) startSearchCrazy(); // If there are less than 2 pages opened then start loading data.
  else haltScript(null, 'You have SearchCrazy Max running in another tab or window. You can\'t have multiple instances running or it will cause database problems.', null, 'Error starting SearchCrazy Max', true);
});
