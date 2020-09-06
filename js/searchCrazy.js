let bgPage = null, search = null, bgQueue = null, bgSearch = null, modal = null;
let localVersion = localStorage.getItem('PCM_version');

/** Open a modal showing loading Data and then after it shows on screen go start Panda Crazy. */
function modalLoadingData() {
  modal = new ModalClass();
  modal.showDialogModal('700px', 'Loading Data', 'Please Wait. Loading up all data for you.',
    null , false, false, '', '', null, () => getBgPage() ); // Calls startPandaCrazy after modal shown.
}
async function getBgPage() {
  chrome.runtime.getBackgroundPage( async (backgroundPage) => {
    bgPage = backgroundPage; await prepare();
  });
}
async function prepare() {
  await bgPage.prepareToOpen(_, true, localVersion);
  search = new SearchUI(); bgSearch = bgPage.gSetSearchUI(search);
  startSearchCrazy();
}
/** Starts the search crazy UI and prepares all the search triggers. */
async function startSearchCrazy() {
  window.addEventListener('beforeunload', () => { bgPage.gSetSearchUI(null); });
  await search.prepareSearch();
  await bgSearch.loadFromDB();
  search.appendFragments();
  modal.closeModal('Loading Data');
}
/** ================ First lines executed when page is loaded. ============================ **/
allTabs('/searchCrazy.html', count => { // Count how many Search Crazy pages are opened.
  if (count<2) modalLoadingData(); // If there are less than 2 pages opened then start loading data.
  else haltScript(null, 'You have SearchCrazy Max running in another tab or window. You can\'t have multiple instances running or it will cause database problems.', null, 'Error starting SearchCrazy Max', true);
});
