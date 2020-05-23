const bgPage = chrome.extension.getBackgroundPage(); // Get background page for extension
const searchUI = new SearchUI();
const bgSearchClass = bgPage.gSetSearchUI(searchUI);
const bgQueue = bgPage.gGetQueue();
const modal = new ModalClass(); // set up a modal class for a options, warnings or details
/**
 */
function startSearchCrazy() {
  window.addEventListener("beforeunload", (e) => { bgPage.gSetSearchUI(null); bgSearchClass.closedUI(); });
  searchUI.prepareSearch();
}
/**
 * @param  {string} title
 * @param  {string} message
 */
function displayError(title,message) {
  $(".pcm_top:first").html("");
  console.log(message); $('#pcm_searchTriggers .tab-content').html(`<H1 style="text-align:center;">${title}</H1><H5 style="color:#FF3333; text-align:center;">${message}</H5>`);
}
allTabs("/searchCrazy.html", count => { if (count<2) startSearchCrazy(); else {
  displayError(`Error starting SearchCrazy Page.`,`You have SearchCrazy Page running in another tab or window. You can't have multiple instances running or it will cause database problems.`);
}});
