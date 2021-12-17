let MyAlarms = null, MyPandaUI = null, MyNotify = null, MySGroupings = null, MyHistory = null, MYDB = null, MyGroupings = null, MyQueue = null;
let gNewVersion = false, MySearch = null, MyDash = null, MyThemes = null, MyOptions = null, MyPanda = null, MyMenus = null, MyModal = null;
let gLocalVersion = localStorage.getItem('PCM_version'), MySearchUI = new ExtSearchUI(), MyPandaTimer = null, MyQueueTimer = null, MySearchTimer = null;
let gPCM_pandaOpened = false, gPCM_searchOpened = false, gNewUpdatedVersion = null, gLoadCompleted = false, gLoadVerified = false;
let gCurrentVersion = browser.runtime.getManifest().version;

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
  browser.runtime.sendMessage({'command':'pandaUI_opened'}); gPCM_pandaOpened = true; document.title = 'Panda Crazy Max - Loading';
  MYDB = new DatabasesClass(); MyOptions = new PandaGOptions(); MyHistory = new HistoryClass();
  MyPandaTimer = new TimerClass(995,970,'pandaTimer'); // little lower than 1s for panda timer by default
  MyQueueTimer = new TimerClass(2000,1000,'queueTimer'); // 2s for queue monitor by default
  MySearchTimer = new TimerClass(950,920,'searchTimer'); // little lower than 1s for search timer by default
  await MYDB.openSearching().then( async () => {
    await MYDB.openHistory(historyWipe).then( async () => {
      await MYDB.openPCM().then( async () => {
        await MYDB.openStats().then( async () => {
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
    MyMenus.preparePanda();
    await MySearch.loadFromDB(showMessages);
    await MyPandaUI.prepare();    // Wait for panda jobs to load and show message or error.
    $('.sortable').sortable().addClass('unSelectable'); // Set up sortables Disable selection for sortables.
    showMessages(['Finished Loading Everything Needed to Start!'], null); // Show last Message that all should be good.
    setTimeout( () => {
      if (MyModal) MyModal.closeAll(); gLoadCompleted = true;
      MyQueue.startQueueMonitor(); MyDash.doDashEarns();
      PCM_channel.postMessage({'msg':'panda crazy Loaded'});
      document.title = 'Panda Crazy Max';
      browser.runtime.sendMessage({'command':'pandaUI_startDone'});
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
function multipleWarning() {
  if (MyModal) MyModal.closeAll(); gLoadCompleted = true;
  browser.runtime.sendMessage({'command':'pandaUI_startDone'});
  document.title = 'PCM - Error Starting';
  haltScript(null, `You have PandaCrazy Max running in another tab or window. You can't have multiple instances running or it will cause database problems.`, null, 'Error starting PandaCrazy Max', true);
}
/** ================ First lines executed when page is loaded. ============================ **/
document.title = 'PCM - Starting';
modalLoadingData( () => {
  let randTime = Math.floor(Math.random() * 600) + 100;  // Random timeout so two pages won't be trying to start at same time.
  setTimeout(() => {
    browser.runtime.sendMessage({'command':'pandaUI_starting'}).then(result => {
      if (result) {
        browser.runtime.sendMessage({'command':'pandaUI_status'}).then(result => {
          if (!result) { browser.runtime.sendMessage({'command':'pandaUI_opened'}); gPCM_pandaOpened = true; prepare(); }
          else {
            PCM_channel.postMessage({'msg':'pandaUI: checking'});  // Ask if there is really another PandaUI running.
            setTimeout(() => { // Checking to see if PCM_running is actually correct and wasn't changed for some reason.
              if (!gLoadVerified) { browser.runtime.sendMessage({'command':'pandaUI_opened'}); gPCM_pandaOpened = true; prepare(); }
            }, 1000);
          }
        });
      } else multipleWarning();
    });
  }, randTime);
});

/** ================ EventListener Section ================================================================================================= **/
/** Detect when user closes page so all caches can be flushed to database and memory use gets released. Also sets PCM_running flag to false. **/
window.addEventListener('beforeunload', async () => {
  if (MyPanda) {
    browser.runtime.sendMessage({'command':'pandaUI_closed'}); gPCM_pandaOpened = false; gPCM_searchOpened = false; PCM_channel.postMessage({'msg':'panda crazy closing'});
    MyQueue.stopQueueMonitor(); MySearch.stopSearching(); MyAlarms.removeAll(); MyOptions.removeAll(); MyPanda.removeAll(true); MyPanda.closeDB();
    MyAlarms.setAudioClass(null, 'panda'); MyGroupings.removeAll(); MySGroupings.removeAll(); await MyHistory.closeDB(); await MySearch.closeDB();
  }
  MyNotify = null; MyAlarms = null; MyMenus = null; MyHistory = null; MYDB = null; MySearch = null; MyDash = null; MyOptions = null; MyQueue = null; MyPanda = null;
  MyPandaUI = null; MyThemes = null; MyGroupings = null; MySGroupings = null; gNewVersion = false; MySearchUI = null; MyPandaTimer = null; MyQueueTimer = null; MySearchTimer = null;
});
/** Sometimes a modal could get stuck if tab is not focussed so make sure 'Loading Data' modal is actually closed after load is completed. **/
$(window).focus(() => { if (gLoadCompleted && MyModal) MyModal.closeModal('Loading Data'); });
/** Detects when a user presses the ctrl button down so it can disable sortable and selection for cards. **/
document.addEventListener('keydown', e => { if (e.key === 'Control' || e.metaKey) { $('.ui-sortable').sortable('option', 'disabled', true).addClass('unSelectable'); }});
/** Detects when a user releases the ctrl button so it can enable sortable and selection for cards. **/
document.addEventListener('keyup', e => { if (e.key === 'Control' || e.metaKey) { $('.ui-sortable').sortable('option', 'disabled', false).addClass('unSelectable'); }});
/** Sets the gNewUpdatedVersion variable so next time user clicks on the extension icon it can show a notice of a new update. Also will show a notification to user. **/
browser.runtime.onUpdateAvailable.addListener(details => {
  gNewUpdatedVersion = details.version;
  if (MyPandaUI) { MyPandaUI.newVersionAvailable(gNewUpdatedVersion); }
});
/** Detects when a popup is opened so it can send a response with options and other relevant info. **/
browser.runtime.onMessage.addListener(request => {
  if (request.command === 'popupOpened') {
    if (!MyQueue || !MyOptions) return Promise.resolve(null); // Needs queue to be running to get the queue size.
    else {
      let sendData = {'toolTips':MyOptions.doGeneral().showHelpTooltips, 'sessionQueue':MyOptions.theSessionQueue(), 'queueSize':MyQueue.getQueueSize(), 'helpers':MyOptions.theHelperOptions(), 'gNewUpdatedVersion':gNewUpdatedVersion};
      return Promise.resolve(sendData);
    }
  }
});
/** Listens on a channel for messages to make sure it's the only panda page running and dealing with the SearchUI page. **/
PCM_channel.onmessage = async (e) => {
  if (e.data) {
    const data = e.data;
    if (data.msg === 'search: updateOptions' && data.object) {
      let theObject = data.object;
      MyOptions.doGeneral(theObject.general, false); MyOptions.doSearch(theObject.search, false); MyOptions.doTimers(theObject.timers, false); MyOptions.doAlarms(theObject.alarms, false);
      MyOptions.update(_, false);
    } else if (data.msg === 'search: closingSearchUI') { if (MyPandaUI) MyPandaUI.searchUIConnect(false); gPCM_searchOpened = false; if (gPCM_pandaOpened) MySearch.originRemove(); }
    else if (data.msg === 'pandaUI: checking') { if (gPCM_pandaOpened) PCM_channel.postMessage({'msg':'pandaUI: panda crazy opened'}); }
    else if (data.msg === 'pandaUI: panda crazy opened') { gLoadVerified = true; multipleWarning(); }
    else if (data.msg === 'search: openingSearchUI') { if (gPCM_pandaOpened && gLoadCompleted) PCM_channel.postMessage({'msg':'searchTo: panda crazy running'}); }
    else if (data.msg === 'search: setSearchUI') { if (MyPanda) MyPanda.searchUIConnect(true); gPCM_searchOpened = true; }
    else if (data.msg === 'search: sendOptionsToSearch') { if (MyOptions) MyOptions.sendOptionsToSearch(); }
    alarmsListener(data);
  }
}
