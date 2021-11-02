let bgPage = null; // Get the background page object for easier access.
let globalOpt = null, notify = null, theAlarms = null, menus = null, modal = null, groupings = null, sGroupings = null, pandaUI = null, history = null, myAudio = null;
let goodDB = false, errorObject = null, gNewVersion = false, bgPanda = null, bgQueue = null, bgSearch = null, bgHistory = null, MYDB = null, MyAlarms = null;
let gLocalVersion = localStorage.getItem('PCM_version'), dashboard = null, themes = null, search = null;
let gManifestData = chrome.runtime.getManifest(), highlighterBGColor = getCSSVar('bgHighlighter');
let pcmRunning = JSON.parse(localStorage.getItem('PCM_running')), gCurrentVersion = gManifestData.version;

const pcm_channel = new BroadcastChannel('PCM_kpanda_band');      // Used for sending and receiving messages from search page.
const search_channel = new BroadcastChannel('PCM_ksearch_band');  // Used specifically for promises so search page can wait for a response on search channel.

if (gCurrentVersion !== gLocalVersion) gNewVersion = true;
localStorage.setItem('PCM_version',gCurrentVersion);
$('body').tooltip({'selector': `.pcm-tooltipData:not(.pcm-tooltipDisable)`, 'delay': {'show':1000}, 'trigger':'hover'});

/** Gets the background page and sets up a global variable for it. Then it runs the modal Loading function. Also detects if another UI is opened. */
function getBgPage() {
  chrome.runtime.getBackgroundPage( backgroundPage => { 
    bgPage = backgroundPage;
    if (!bgPage.gGetPandaUI()) modalLoadingData();
    else haltScript(null, `You have PandaCrazy Max running in another tab or window. You can't have multiple instances running or it will cause database problems.`, null, 'Error starting PandaCrazy Max', true);
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
  await bgPage.prepareToOpen(true,_, gLocalVersion).then( () => {
    bgPanda = bgPage.gGetPanda(); bgQueue = bgPage.gGetQueue(); bgHistory = bgPage.gGetHistory(); bgSearch = bgPage.gGetSearch();
    globalOpt = bgPage.gGetOptions(); MyAlarms = theAlarms = bgPage.gGetAlarms(new MyAudioClass(), 'panda'); notify = new NotificationsClass(); MYDB = bgPage.gGetMYDB();
    groupings = new TheGroupings(); sGroupings = new TheGroupings('searching'); pandaUI = new PandaUI(); menus = new MenuClass(); dashboard = bgPage.gGetDash();
    themes = new ThemesClass();
    startPandaCrazy();
  });
}
/** Starts the process of loading data in the program and check for errors as it goes.
 * @async - To wait for preparations for classes to end their database operations. */
async function startPandaCrazy() {
  $('.pcm-top').addClass('unSelectable'); $('#pcm-pandaUI .pcm-quickMenu').addClass('unSelectable');
  if (bgHistory && bgPanda && bgSearch) {
    themes.prepareThemes();
    groupings.prepare(showMessages); // Wait for groupings to load and show message or error.
    sGroupings.prepare(showMessages);
    menus.preparePanda();
    bgPage.gSetPandaUI(pandaUI); // Pass the pandaUI class value to the background page for easy access.
    await bgSearch.loadFromDB();
    await pandaUI.prepare(showMessages); // Wait for panda jobs to load and show message or error.
    $('.sortable').sortable().addClass('unSelectable'); // Set up sortables Disable selection for sortables.
    showMessages(['Finished loading all!'], null, 'Main'); // Show last Message that all should be good.
    setTimeout( () => {
      modal.closeModal('Loading Data');
      bgQueue.startQueueMonitor(); bgPage.pandaUILoaded(); dashboard.doDashEarns();
    }, 300); // Just a small delay so messages can be read by user.
  } else { haltScript(errorObject, errorObject.message, 'Problem with Database.', 'Error opening database:'); }
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
getBgPage(); // Grabs the background page, detects if another UI is opened and then starts PandaUI.

/** ================ EventListener Section =============================================== **/
/** Detect when user closes page so background page can remove anything it doesn't need without the panda UI. **/
window.addEventListener('beforeunload', async () => {
  if (bgPanda) { bgPage.gSetPandaUI(null); groupings.removeAll(); sGroupings.removeAll(); }
  globalOpt = null; notify = null; theAlarms = null; MyAlarms = null; menus = null; modal = null; groupings = null; sGroupings = null; errorObject = null; bgPanda = null; myAudio = null;
  bgSearch = null; bgQueue = null; bgHistory = null; pandaUI = null; goodDB = false; gNewVersion = false; dashboard = null; themes = null; history = null; MYDB = null;
});
/** Detects when a user presses the ctrl button down so it can disable sortable and selection for cards. */
document.addEventListener('keydown', e => { if (e.key === 'Control' || e.metaKey) { $('.ui-sortable').sortable('option', 'disabled', true).addClass('unSelectable'); }});
/** Detects when a user releases the ctrl button so it can enable sortable and selection for cards. */
document.addEventListener('keyup', e => { if (e.key === 'Control' || e.metaKey) { $('.ui-sortable').sortable('option', 'disabled', false).addClass('unSelectable'); }});

pcm_channel.onmessage = async (e) => {
  if (e.data) {
    const data = e.data;
    if (data && data.object) {
      if (data.msg === 'search: save alarm') { MyAlarms.setData(data.object.alarmSound, data.object.alarm); }
    } else if (data.msg === 'search: prepare alarms') {
      let alarmData = MyAlarms.getData('triggeredAlarm'), volume = MyAlarms.volume;
      pcm_channel.postMessage({'msg':'search: alarm data', 'value':{'volume':volume, 'data':{'triggeredAlarm':alarmData}}});
    }
  }
}  