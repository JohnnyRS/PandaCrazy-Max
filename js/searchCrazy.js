let bgPage = null, search = null, alarms = null, bgQueue = null, bgSearch = null, modal = null, bgHistory = null;
let localVersion = localStorage.getItem('PCM_version');
$('body').tooltip({selector: `.pcm_tooltipData`, delay: {show:1100}, trigger:'hover'});

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
  await bgPage.prepareToOpen(_, true, localVersion).then( () => {
    search = new SearchUI(); alarms = new AlarmsClass(); bgSearch = bgPage.gSetSearchUI(search); bgHistory = bgPage.gGetHistory();
    startSearchCrazy();
  });
}
/** Starts the search crazy UI and prepares all the search triggers. */
async function startSearchCrazy() {
  window.addEventListener('beforeunload', () => { bgPage.gSetSearchUI(null); });
  // alarms.prepare(showMessages);
  await search.prepareSearch();
  await bgSearch.loadFromDB();
  search.appendFragments();
  modal.closeModal('Loading Data');
}
/**  Shows good messages in loading modal and console. Shows error message on page and console before halting script.
 * @param {array} good - Array of good messages to display in the loading modal and console.
 * @param {object} bad - If set then an error has happened so display it and stop script. */
function showMessages(good, bad) {
  if (bad) { haltScript(bad, bad.message, null, 'Error loading data: '); } // Check for errors first.
  if (good.length > 0) { // Does it have good messages?
    good.forEach( value => { $('#pcm_modal_0 .modal-body').append($(`<div>${value}</div>`)); console.log(value); });
  }
}
/** ================ First lines executed when page is loaded. ============================ **/
allTabs('/searchCrazy.html', count => { // Count how many Search Crazy pages are opened.
  if (count<2) modalLoadingData(); // If there are less than 2 pages opened then start loading data.
  else haltScript(null, 'You have SearchCrazy Max running in another tab or window. You can\'t have multiple instances running or it will cause database problems.', null, 'Error starting SearchCrazy Max', true);
});
