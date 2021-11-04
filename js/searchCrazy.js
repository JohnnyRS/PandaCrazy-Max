let bgPage = null, MySearchUI = null, pandaUI = null, theAlarms = null, bgQueue = null, MySearch = null, modal = null, bgHistory = null, MYDB = null, globalOpt = null;
let gLocalVersion = localStorage.getItem('PCM_version'), sGroupings = null, menus = null, themes = null, searchControl = null, MyOptions = null, MyAlarms = null;
$('body').tooltip({'selector': `.pcm-tooltipData:not(.pcm-tooltipDisable)`, 'delay': {'show':1000}, 'trigger':'hover'});

const pcm_channel = new BroadcastChannel('PCM_kpanda_band');

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
  await bgPage.prepareToOpen(_, true, gLocalVersion).then( () => {
    MySearchUI = new SearchUI(bgPage.gGetMySearchUI().searchGStats); MySearch = bgPage.gSetSearchUI(MySearchUI)/*  new ExtHitSearch(pcm_channel, MySearchUI) */;
    bgHistory = bgPage.gGetHistory(); MYDB = bgPage.gGetMYDB(); MyOptions = globalOpt = bgPage.gGetOptions(); themes = new ThemesClass();
    MyAlarms = theAlarms = new SearchAlarmsClass(pcm_channel); sGroupings = new TheGroupings('searching'); menus = new MenuClass();
    startSearchCrazy();
  });
}
/** Starts the search crazy UI and prepares all the search triggers.
 * @async - To wait for the classes to load and prepare their data. */
async function startSearchCrazy() {
  themes.prepareThemes();
  MySearchUI.prepareSearch();
  await MySearch.loadFromDB();
  MySearchUI.appendFragments();
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
pcm_channel.postMessage({'msg':'search crazy starting'});
getBgPage(); // Grabs the background page, detects if another UI is opened and then starts SearchUI.
pcm_channel.onmessage = (e) => {
  if (e.data) {
    const data = e.data;
    searchListener(data); alarmsListener(data);
  }
}  
/** ================ EventListener Section =============================================== **/
/** Detect when user closes page so background page can remove anything it doesn't need without the panda UI. **/
window.addEventListener('beforeunload', () => {
  if (MySearch) { bgPage.gSetSearchUI(null); sGroupings.removeAll(); }
  globalOpt = null; MyOptions = null; MyAlarms = null; theAlarms = null; menus = null; modal = null; sGroupings = null; MySearchUI = null; MySearch = null;
  bgQueue = null; bgHistory = null; themes = null; MYDB = null;
});

