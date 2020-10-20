let bgPage = null; // Get the background page object for easier access.
let globalOpt = null, notify = null, alarms = null, menus = null, modal = null, groupings = null, pandaUI = null; history = null, myAudio = null;
let goodDB = false, errorObject = null, gNewVersion = false, bgPanda = null, bgQueue = null, bgSearch = null, bgHistory = null, MYDB = null, GvFocus = false;
let localVersion = localStorage.getItem('PCM_version');
let gManifestData = chrome.runtime.getManifest();
if (gManifestData.version !== localVersion) gNewVersion = true;
localStorage.setItem('PCM_version',gManifestData.version);
$('body').tooltip({selector: `.pcm_tooltipData`, delay: {show:1000}, trigger:'hover'});

/** Open a modal showing loading Data and then after it shows on screen go start Panda Crazy. */
function modalLoadingData() {
  modal = new ModalClass();
  modal.showDialogModal('700px', 'Loading Data', 'Please Wait. Loading up all data for you.',
    null , false, false, '', '', null, () => getBgPage() ); // Calls startPandaCrazy after modal shown.
}
async function getBgPage() {
  chrome.runtime.getBackgroundPage( (backgroundPage) => { bgPage = backgroundPage; prepare(); });
}
async function prepare() {
  $(window).on( 'focus blur', () => GvFocus = document.hasFocus() );
  await bgPage.prepareToOpen(true,_, localVersion).then( () => {
    bgPanda = bgPage.gGetPanda(); bgQueue = bgPage.gGetQueue(); bgHistory = bgPage.gGetHistory(); bgSearch = bgPage.gGetSearch();
    globalOpt = bgPage.gGetOptions(); alarms = bgPage.gGetAlarms(new myAudioClass(), 'panda'); notify = new NotificationsClass(); MYDB = bgPage.gGetMYDB();
    groupings = new PandaGroupings(); pandaUI = new PandaUI(); menus = new MenuClass("pcm_quickMenu");
    startPandaCrazy();
  });
}
/** Starts the process of loading data in the program and check for errors as it goes.
 * Make sure to check for a good DB open and wait for slower computers.
 * @async - To wait for preparations for classes to end their database operations. */
async function startPandaCrazy() {
  $('.pcm_top').addClass('unSelectable'); $('#pcm_quickMenu').addClass('unSelectable');
  if (bgHistory && bgPanda && bgSearch) {
    groupings.prepare(showMessages); // Wait for groupings to load and show message or error.
    menus.prepare();
    bgPage.gSetPandaUI(pandaUI); // Pass the pandaUI class value to the background page for easy access.
    await bgSearch.loadFromDB();
    await pandaUI.prepare(showMessages); // Wait for panda jobs to load and show message or error.
    $('.sortable').sortable().addClass('unSelectable'); // Set up sortables Disable selection for sortables.
    showMessages(['Finished loading all!'], null, "Main"); // Show last Message that all should be good.
    setTimeout( () => {
      modal.closeModal('Loading Data');
      bgQueue.startQueueMonitor();
      bgPage.pandaUILoaded();
    }, 300); // Just a small delay so messages can be read by user.
  } else { haltScript(errorObject, errorObject.message, "Problem with Database.", 'Error opening database:'); }
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
allTabs('/pandaCrazy.html', async (count) => { // Count how many Panda Crazy pages are opened.
  if (count<2) modalLoadingData(); // If there are less than 2 pages opened then start loading data.
  else haltScript(null, 'You have PandaCrazy Max running in another tab or window. You can\'t have multiple instances running or it will cause database problems.', null, 'Error starting PandaCrazy Max', true);
});

/** ================ EventListener Section =============================================== **/
/** Detect when user closes page so background page can remove anything it doesn't need without the panda UI. **/
window.addEventListener('beforeunload', async (e) => {
  if (bgPanda) { bgPage.gSetPandaUI(null); alarms.removeAll(); globalOpt.removeAll(); groupings.removeAll(); }
  globalOpt = null; notify = null; alarms = null; menus = null; modal = null; groupings = null; errorObject = null; bgPanda = null;
  bgSearch = null; bgQueue = null; bgHistory = null; pandaUI = null; goodDB = false; gNewVersion = false;
});
/** Detects when a user presses the ctrl button down so it can disable sortable and selection for cards. */
document.addEventListener('keydown', (e) => {
  if ((e.keyCode ? e.keyCode : e.which)===17) { $('.ui-sortable').sortable( 'option', 'disabled', true ).addClass('unSelectable'); }
});
/** Detects when a user releases the ctrl button so it can enable sortable and selection for cards. */
document.addEventListener("keyup", (e) => {
  if ((e.keyCode ? e.keyCode : e.which)===17) { $('.ui-sortable').sortable( 'option', 'disabled', false ).addClass('unSelectable'); }
});
