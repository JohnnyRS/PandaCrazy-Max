let MyAlarms = null, MyPandaUI = null, MyNotify = null, MySGroupings = null, MyHistory = null, MYDB = null, MyGroupings = null, MyQueue = null;
let gNewVersion = false, MySearch = null, MyDash = null, MyThemes = null, MyOptions = null, MyPanda = null, MyMenus = null, MyModal = null;
let gLocalVersion = localStorage.getItem('PCM_version'), MySearchUI = new ExtSearchUI(), MyPandaTimer = null, MyQueueTimer = null, MySearchTimer = null;
let gPCM_pandaOpened = false, gPCM_searchOpened = false, gPCM_otherRunning = 0, gUniqueTabID = Math.random().toString(36).slice(2), gNewUpdatedVersion = null;
let gCurrentVersion = chrome.runtime.getManifest().version;

const PCM_startChannel = new BroadcastChannel('PCM_kpanda_band'); // Used for starter messages to discourage multiple pages running.
const PCM_channel = new BroadcastChannel('PCM_kpanda_band');      // Used for sending and receiving messages from search page.

if (gCurrentVersion !== gLocalVersion) gNewVersion = true;
localStorage.setItem('PCM_version',gCurrentVersion);
$('body').tooltip({'selector': `.pcm-tooltipData:not(.pcm-tooltipDisable)`, 'delay': {'show':1000}, 'trigger':'hover'});

/** Open a modal showing loading Data and then with status progress and then closes after all data is loaded.
 * @param  {function} doAfterShow - After modal shown this function will be called.
**/
function modalLoadingData(doAfterShow) {
  MyModal = new ModalClass();
  MyModal.showDialogModal('700px', 'Loading Data', 'Please Wait. Loading up all data for you.',
    null , false, false, '', '', null, doAfterShow() ); // Calls startPandaCrazy after modal shown.
}
/** Prepares the main global variables with classes and background data.
 * @async - To wait for the database functions to finish opening up databases.
**/
async function prepare() {
  let historyWipe = false; if (compareVersion(gLocalVersion, '0.8.7')) historyWipe = true; // For older versions of history.
  MYDB = new DatabasesClass(); MyOptions = new PandaGOptions(); MyHistory = new HistoryClass();
  MyPandaTimer = new TimerClass(995,970,'pandaTimer'); // little lower than 1s for panda timer by default
  MyQueueTimer = new TimerClass(2000,1000,'queueTimer'); // 2s for queue monitor by default
  MySearchTimer = new TimerClass(950,920,'searchTimer'); // little lower than 1s for search timer by default
  await MYDB.openSearching().then( async () => {
    await MYDB.openHistory(historyWipe).then( async () => {
      await MYDB.openPCM().then( async () => {
        await MYDB.openStats(true).then( async () => {
          await MyOptions.prepare(showMessages);
          MyAlarms = new AlarmsClass();
          MyQueue = new MturkQueue(2000); MyDash = new MturkDashboard(); MyPanda = new MturkPanda(995, 950); MySearch = new MturkHitSearch(950);
          MyHistory.maintenance(showMessages);
          MyPanda.timerChange(MyOptions.getCurrentTimer());
          MySearch.timerChange(MyOptions.theSearchTimer());
          MyQueue.timerChange(MyOptions.getQueueTimer());
          await MyAlarms.prepare(showMessages);
          MyNotify = new NotificationsClass();
          MyGroupings = new TheGroupings(); MySGroupings = new TheGroupings('searching'); MyPandaUI = new PandaUI(); MyMenus = new MenuClass();
          MyThemes = new ThemesClass();
          startPandaCrazy();
        });
      });
    });
  });
}
/** Starts the process of loading data in the program and check for errors as it goes.
 * @async - To wait for preparations for classes to end their database operations.
**/
async function startPandaCrazy() {
  $('.pcm-top').addClass('unSelectable'); $('#pcm-pandaUI .pcm-quickMenu').addClass('unSelectable');
  if (MyHistory && MyPanda && MySearch) {
    MyThemes.prepareThemes(_, showMessages);
    await MyGroupings.prepare(showMessages);  // Wait for groupings to load and show message or error.
    await MySGroupings.prepare(showMessages); // Wait for search groupings to load and show message or error.
    MyMenus.preparePanda(showMessages);
    await MySearch.loadFromDB(showMessages);
    await MyPandaUI.prepare(showMessages);    // Wait for panda jobs to load and show message or error.
    $('.sortable').sortable().addClass('unSelectable'); // Set up sortables Disable selection for sortables.
    showMessages(['Finished Loading Everything Needed to Start!'], null); // Show last Message that all should be good.
    setTimeout( () => {
      if (MyModal) MyModal.closeModal('Loading Data'); gPCM_pandaOpened = true;
      MyQueue.startQueueMonitor(); MyDash.doDashEarns();
      chrome.runtime.sendMessage({'command':'pandaUI_opened'});
      PCM_channel.postMessage({'msg':'panda crazy Loaded'});
    }, 500); // Just a small delay so messages can be read by user.
  } else { haltScript('Halting for error', 'Important data has not been loaded correctly.', 'Problem with Database.', 'Error opening database:'); }
}

/**  Shows good messages in loading modal and console. Shows error message on page and console before halting script.
 * @param  {array} good - Array of good messages to display.  @param  {object} [bad] - If set then an error has happened so display it and stop script.
**/
function showMessages(good, bad=null) {
  if (bad !== null) { haltScript(bad, bad.message, null, 'Error loading data: '); } // Check for errors first.
  if (good.length > 0) { // Does it have good messages?
    good.forEach( value => { $('#pcm-modal-0 .modal-body').append($(`<div>${value}</div>`)); });
  }
}
/** ================ First lines executed when page is loaded. ============================ **/
modalLoadingData( () => {
  chrome.runtime.sendMessage({'command':'pandaUI_starting', 'data':{'tabID':gUniqueTabID}}, (response) => {
    if (response) PCM_startChannel.postMessage({'msg':'panda crazy starting', 'value':gUniqueTabID});
    else haltScript(null, `You have PandaCrazy Max running in another tab or window. You can't have multiple instances running or it will cause database problems.`, null, 'Error starting PandaCrazy Max', true);
  });
});

/** ================ EventListener Section ================================================================================================= **/
/** Detect when user closes page so all caches can be flushed to database and memory use gets released. Also sets PCM_running flag to false. **/
window.addEventListener('beforeunload', async () => {
  if (MyPanda) {
    chrome.storage.local.set({'PCM_running':false}); gPCM_pandaOpened = false; gPCM_searchOpened = false; PCM_channel.postMessage({'msg':'panda crazy closing'});
    chrome.runtime.sendMessage({'command':'pandaUI_startDone', 'data':{}}); chrome.runtime.sendMessage({'command':'cleanLocalStorage'});
    MyQueue.stopQueueMonitor(); MySearch.stopSearching(); MyAlarms.removeAll(); MyOptions.removeAll(); MyPanda.removeAll(true); MyPanda.closeDB();
    MyAlarms.setAudioClass(null, 'panda'); MyGroupings.removeAll(); MySGroupings.removeAll(); await MyHistory.closeDB(); await MySearch.closeDB();
  }
  MyNotify = null; MyAlarms = null; MyModal = null; MyMenus = null; MyHistory = null; MYDB = null; MySearch = null; MyDash = null; MyOptions = null; MyQueue = null; MyPanda = null;
  MyPandaUI = null; MyThemes = null; MyGroupings = null; MySGroupings = null; gNewVersion = false; MySearchUI = null; MyPandaTimer = null; MyQueueTimer = null; MySearchTimer = null;
});
/** Detects when a user presses the ctrl button down so it can disable sortable and selection for cards. **/
document.addEventListener('keydown', e => { if (e.key === 'Control' || e.metaKey) { $('.ui-sortable').sortable('option', 'disabled', true).addClass('unSelectable'); }});
/** Detects when a user releases the ctrl button so it can enable sortable and selection for cards. **/
document.addEventListener('keyup', e => { if (e.key === 'Control' || e.metaKey) { $('.ui-sortable').sortable('option', 'disabled', false).addClass('unSelectable'); }});
/** Sets the gNewUpdatedVersion variable so next time user clicks on the extension icon it can show a notice of a new update. Also will show a notification to user. **/
chrome.runtime.onUpdateAvailable.addListener( details => {
  gNewUpdatedVersion = details.version;
  if (MyPandaUI) { MyPandaUI.newVersionAvailable(gNewUpdatedVersion); }
});
/** Detects when a popup is opened so it can send a response with options and other relevant info. **/
chrome.runtime.onMessage.addListener( async (request,_, sendResponse) => {
  if (request.command === 'popupOpened') {
    if (!MyQueue || !MyOptions) sendResponse(null); // Needs queue to be running to get the queue size.
    else {
      let sendData = {'toolTips':MyOptions.doGeneral().showHelpTooltips, 'sessionQueue':MyOptions.theSessionQueue(), 'queueSize':MyQueue.getQueueSize(), 'helpers':MyOptions.theHelperOptions(), 'gNewUpdatedVersion':gNewUpdatedVersion};
      sendResponse(sendData);
    }
  }
  return true;
});
/** Listens on a channel for messages to make sure it's the only panda page running and dealing with the SearchUI page. **/
PCM_channel.onmessage = async (e) => {
  if (e.data) {
    const data = e.data;
    if ((data.msg === 'panda crazy starting' || data.msg === 'search crazy starting') && data.value) { // PCM trying to start so send details of this page to all other pages on channel.
      gPCM_otherRunning = 0; PCM_startChannel.postMessage({'msg':'panda crazy responding', 'object':{'sender':data.value, 'tabId':gUniqueTabID, 'status':gPCM_pandaOpened}});
    } else if (data.msg === 'panda crazy responding' && data.object && data.object.sender === gUniqueTabID) { // Got a PCM response so collect stats on other pages running currently.
      if (gUniqueTabID !== data.object.tabId) { if (data.object.status) gPCM_otherRunning++; } // Count panda pages actually running.
      else if (!gPCM_pandaOpened) { // Make sure current panda page isn't running already.
        setTimeout(() => { // Sets a timeout so it can get ALL responses from other pages to know if this page should start running.
          chrome.runtime.sendMessage({'command':'pandaUI_startDone', 'data':{}}); // Releases hold when multiple pages try to start all at once.
          if (gPCM_otherRunning === 0) { gPCM_pandaOpened = true; prepare(); } // No other pages are running so get started.
          else haltScript(null, `You have PandaCrazy Max running in another tab or window. You can't have multiple instances running or it will cause database problems.`, null, 'Error starting PandaCrazy Max', true);
        }, 200);
      }
    } else if (data.msg === 'search: updateOptions' && data.object) {
      let theObject = data.object;
      MyOptions.doGeneral(theObject.general, false); MyOptions.doSearch(theObject.search, false); MyOptions.doTimers(theObject.timers, false); MyOptions.doAlarms(theObject.alarms, false);
      MyOptions.update(false);
    } else if (data.msg === 'search: closingSearchUI') { MyPandaUI.searchUIConnect(false); gPCM_searchOpened = false; if (gPCM_pandaOpened) MySearch.originRemove(); }
    else if (data.msg === 'search: openedSearchUI') {  }
    else if (data.msg === 'search: setSearchUI') { if (MyPanda) MyPanda.searchUIConnect(true); gPCM_searchOpened = true; }
    else if (data.msg === 'search: sendOptionsToSearch') { if (MyOptions) MyOptions.sendOptionsToSearch(); }
    alarmsListener(data);
  }
}
