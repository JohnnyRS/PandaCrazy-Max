let MySearchUI = null, MySearch = null, MyHistory = null, MYDB = null, MyMenu = null, MyAlarms = null, MyOptions = null;
let gLocalVersion = localStorage.getItem('PCM_version'), MyGroupings = null, MyThemes = null, MyQueue = null, MyPanda = null, MyPandaUI = null, MyModal = null;
let gPCM_pandaOpened = false, gPCM_searchOpened = false, gPCM_otherRunning = 0, gUniqueTabID = Math.random().toString(36).slice(2);
$('body').tooltip({'selector': `.pcm-tooltipData:not(.pcm-tooltipDisable)`, 'delay': {'show':1000}, 'trigger':'hover'});

const PCM_startChannel = new BroadcastChannel('PCM_kpanda_band'); // Used for starter messages to discourage multiple pages running.
const PCM_channel = new BroadcastChannel('PCM_kpanda_band');

/** Open a modal showing loading Data and then with status progress and then closes after all data is loaded.
 * @param  {function} doAfterShow - After modal shown this function will be called.
**/
function modalLoadingData(doAfterShow) {
  MyModal = new ModalClass();
  MyModal.showDialogModal('700px', 'Loading Data', 'Please Wait. Loading up all data for you.',
    null , false, false, '', '', null, () => doAfterShow() );
}
/** Prepares the main global variables with classes. **/
function prepare() {
  MySearchUI = new SearchUI(); PCM_channel.postMessage({'msg':'search: setSearchUI'}); MySearch = new ExtHitSearch();
  MyHistory = new ExtHistory(); MYDB = new ExtDBPanda(); MyOptions = new SearchGOptions(PCM_channel); MyThemes = new ThemesClass();
  MyAlarms = new SearchAlarmsClass(PCM_channel);
  MyGroupings = new TheGroupings('searching'); MyMenu = new MenuSearchClass();
  startSearchCrazy();
}
/** Starts the search crazy UI and prepares all the search triggers.
 * @async - To wait for the classes to load and prepare their data.
**/
async function startSearchCrazy() {
  MyOptions.sendOptionsToSearch();
  showMessages(['All Global Options Have Been Loaded!'], null);
  MyThemes.prepareThemes(_, showMessages);
  await MySearchUI.prepareSearch(showMessages);
  await MySearch.loadFromDB(showMessages);
  MySearchUI.appendFragments();
  await MyGroupings.prepare(showMessages);
  showMessages(['Finished Loading Everything Needed to Start!'], null); // Show last Message that all should be good.
  setTimeout( () => {
    if (MyModal) MyModal.closeModal('Loading Data');
    PCM_channel.postMessage({'msg':'search: openedSearchUI'});
  }, 500); // Just a small delay so messages can be read by user.
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
  chrome.runtime.sendMessage({'command':'searchUI_starting', 'data':{'tabID':gUniqueTabID}}, (response) => {
    if (response) PCM_startChannel.postMessage({'msg':'search crazy starting', 'value':gUniqueTabID});
    else haltScript(null, `You have SearchCrazy Max running in another tab or window. You can't have multiple instances running or it will cause database problems.`, null, 'Error starting SearchCrazy Max', true);
  });
});

/** ================ EventListener Section ================================================================== **/
/** Detect when user closes page so background page can remove anything it doesn't need without the panda UI. **/
window.addEventListener('beforeunload', () => {
  if (MySearch) { MySearchUI.stopSearching(); PCM_channel.postMessage({'msg':'search: closingSearchUI'}); MyGroupings.removeAll(); }
  gPCM_searchOpened = false; chrome.runtime.sendMessage({'command':'searchUI_startDone', 'data':{}});
  MyOptions = null; MyAlarms = null; MyMenu = null; MyGroupings = null; MySearchUI = null; MySearch = null; MyModal = null;
  MyHistory = null; MYDB = null; MyThemes = null;
});
/** Listens on a channel for messages to make sure it's the only search page running and panda page is running. **/
PCM_channel.onmessage = (e) => {
  if (e.data) {
    const data = e.data;
    if (data.msg === 'search crazy starting' && data.value) { // SearchUI trying to start so send details of this page to all other pages on channel.
      gPCM_otherRunning = 0; PCM_startChannel.postMessage({'msg':'search crazy responding', 'object':{'sender':data.value, 'tabId':gUniqueTabID, 'status':gPCM_searchOpened}});
    } else if (data.msg === 'search crazy responding' && data.object && data.object.sender === gUniqueTabID) { // Got a SearchUI response so collect stats on other pages running currently.
      if (gUniqueTabID !== data.object.tabId) { if (data.object.status) gPCM_otherRunning++; } // Count panda pages actually running.
      else if (!gPCM_searchOpened) { // Make sure current panda page isn't running already.
        setTimeout(() => { // Sets a timeout so it can get ALL responses from other pages to know if this page should start running.
          chrome.runtime.sendMessage({'command':'searchUI_startDone', 'data':{}}); // Releases hold when multiple pages try to start all at once.
          if (gPCM_otherRunning === 0) {  // No other pages are running so get started.
            if (gPCM_pandaOpened) { gPCM_searchOpened = true; prepare(); }
            else haltScript(null, `PandaCrazy page must be opened and running first before you can run the search page.`, null, 'Error starting SearchCrazy Max', true);
          }
          else haltScript(null, `You have SearchCrazy Max running in another tab or window. You can't have multiple instances running or it will cause database problems.`, null, 'Error starting SearchCrazy Max', true);
        }, 200);
      }
    } else if (data.msg === 'panda crazy responding' && data.object) { if (data.object.status) gPCM_pandaOpened = true; }
    else if (data.msg === 'panda crazy Loaded') { gPCM_pandaOpened = true; if (MySearchUI) MySearchUI.goRestart(); }
    else if (data.msg === 'panda crazy closing') {
      gPCM_pandaOpened = false; gPCM_searchOpened = false; if (MySearchUI) MySearchUI.lostPandaUI();
    }
    alarmsListener(data);
  }
}
