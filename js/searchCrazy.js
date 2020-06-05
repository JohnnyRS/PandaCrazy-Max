const bgPage = chrome.extension.getBackgroundPage(); // Get background page for extension
const searchUI = new SearchUI();
const bgSearchClass = bgPage.gSetSearchUI(searchUI);
const bgQueue = bgPage.gGetQueue();
const modal = new ModalClass(); // set up a modal class for a options, warnings or details
/**
 * Starts the search crazy UI and prepares all the search triggers.
 */
function startSearchCrazy() {
/** Detect when user closes page so background page can remove anything it doesn't need without the search UI. **/
window.addEventListener("beforeunload", (e) => { bgPage.gSetSearchUI(null); bgSearchClass.closedUI(); });
  searchUI.prepareSearch();
  bgSearchClass.addTrigger("rid", "AFEG4RKNBSL4T", {"name":"Ben Peterson", "duration": 6000, "once":false, "limitNumQueue":0, "limitTotalQueue":0, "limitFetches":0, "autoGoHam":false, goHamDuration:0, "tempGoHam":3000, "disabled":false, "from":"searchUI"});
  bgSearchClass.addTrigger("gid", "30B721SJLR5BYYBNQJ0CVKKCWQZ0OI", {"name":"Ibotta, Inc.", "duration": 6000, "once":false, "limitNumQueue":0, "limitTotalQueue":0, "limitFetches":0, "autoGoHam":false, goHamDuration:0, "tempGoHam":3000, "disabled":true, "from":"searchUI"});
}
/** ================ First lines executed when page is loaded. ============================ **/
allTabs('/searchCrazy.html', count => { // Count how many Search Crazy pages are opened.
  if (count<2) startSearchCrazy(); // If there are less than 2 pages opened then start loading data.
  else haltScript(null, 'You have SearchCrazy Max running in another tab or window. You can\'t have multiple instances running or it will cause database problems.', null, 'Error starting SearchCrazy Max', true);
});
