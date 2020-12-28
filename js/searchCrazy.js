let bgPage = null, search = null, pandaUI = null, alarms = null, bgQueue = null, bgSearch = null, modal = null, bgHistory = null, MYDB = null, globalOpt = null;
let localVersion = localStorage.getItem('PCM_version'), sGroupings = null, menus = null, themes = null;
$('body').tooltip({'selector': `.pcm-tooltipData:not(.pcm-tooltipDisable)`, 'delay': {'show':1000}, 'trigger':'hover'});

/** Gets the background page and sets up a global variable for it. Then it runs the prepare function. */
function getBgPage() {
  chrome.runtime.getBackgroundPage( backgroundPage => {
    bgPage = backgroundPage;
    if (!bgPage.gGetSearchUI()) modalLoadingData();
    else haltScript(null, `You have SearchCrazy Max running in another tab or window. You can't have multiple instances running or it will cause database problems.`, null, 'Error starting SearchCrazy Max', true);
  });
}
/** Open a modal showing loading Data and then after it shows on screen go start Panda Crazy. */
function modalLoadingData() {
  modal = new ModalClass();
  modal.showDialogModal('700px', 'Loading Data', 'Please Wait. Loading up all data for you.',
    null , false, false, '', '', null, () => prepare() ); // Calls startPandaCrazy after modal shown.
}
/** Prepares the main global variables with classes and background data.
 * @async - To wait for the preparetoopen function to finish opening up databases. */
async function prepare() {
  await bgPage.prepareToOpen(_, true, localVersion).then( () => {
    search = new SearchUI(); bgSearch = bgPage.gSetSearchUI(search); bgHistory = bgPage.gGetHistory(); MYDB = bgPage.gGetMYDB(); globalOpt = bgPage.gGetOptions();
    themes = new ThemesClass(); alarms = bgPage.gGetAlarms(new MyAudioClass(), 'search'); sGroupings = new TheGroupings('searching'); menus = new MenuClass();
    startSearchCrazy();
  });
}
/** Starts the search crazy UI and prepares all the search triggers.
 * @async - To wait for the classes to load and prepare their data. */
async function startSearchCrazy() {
  themes.prepareThemes();
  search.prepareSearch();
  await bgSearch.loadFromDB();
  search.appendFragments();
  sGroupings.prepare(showMessages);
  modal.closeModal('Loading Data');
  bgPage.searchUILoaded();
}
/**  Shows good messages in loading modal and console. Shows error message on page and console before halting script.
 * @param {array} good - Array of good messages to display  @param {object} bad - If set then an error has happened so display it and stop script. */
function showMessages(good, bad) {
  if (bad) { haltScript(bad, bad.message, null, 'Error loading data: '); } // Check for errors first.
  if (good.length > 0) { // Does it have good messages?
    good.forEach( value => { $('#pcm-modal-0 .modal-body').append($(`<div>${value}</div>`)); });
  }
}
/** ================ First lines executed when page is loaded. ============================ **/
getBgPage(); // Grabs the background page, detects if another UI is opened and then starts SearchUI.

/** ================ EventListener Section =============================================== **/
/** Detect when user closes page so background page can remove anything it doesn't need without the panda UI. **/
window.addEventListener('beforeunload', () => {
  if (bgSearch) { bgPage.gSetSearchUI(null); sGroupings.removeAll(); }
  globalOpt = null; alarms = null; menus = null; modal = null; sGroupings = null; search = null; bgSearch = null; bgQueue = null; bgHistory = null; themes = null; MYDB = null;
});
