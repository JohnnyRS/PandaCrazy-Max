let MySearchUI = null, MySearch = null, modal = null, MyHistory = null, MYDB = null, MyMenu = null, MyAlarms = null, MyOptions = null;
let gLocalVersion = localStorage.getItem('PCM_version'), MyGroupings = null, themes = null;
let pcm_pandaOpened = false, pcm_searchOpened = false, pcm_otherRunning = 0, uniqueTabID = Math.random().toString(36).slice(2);
$('body').tooltip({'selector': `.pcm-tooltipData:not(.pcm-tooltipDisable)`, 'delay': {'show':1000}, 'trigger':'hover'});

const pcm_startChannel = new BroadcastChannel('PCM_kpanda_band'); // Used for starter messages to discourage multiple pages running.
const pcm_channel = new BroadcastChannel('PCM_kpanda_band');

/** Open a modal showing loading Data and then after it shows on screen go start Panda Crazy. */
function modalLoadingData(doAfterShow) {
  modal = new ModalClass();
  modal.showDialogModal('700px', 'Loading Data', 'Please Wait. Loading up all data for you.',
    null , false, false, '', '', null, () => doAfterShow() ); // Calls startPandaCrazy after modal shown.
}
/** Prepares the main global variables with classes and background data.
 * @async - To wait for the preparetoopen function to finish opening up databases. */
async function prepare() {
  MySearchUI = new SearchUI(); pcm_channel.postMessage({'msg':'search: setSearchUI'}); MySearch = new ExtHitSearch();
  MyHistory = new ExtHistory(); MYDB = new ExtDBPanda(); MyOptions = new SearchGOptions(pcm_channel); themes = new ThemesClass();
  MyAlarms = new SearchAlarmsClass(pcm_channel); MyGroupings = new TheGroupings('searching'); MyMenu = new MenuSearchClass();
  startSearchCrazy();
}
/** Starts the search crazy UI and prepares all the search triggers.
 * @async - To wait for the classes to load and prepare their data. */
async function startSearchCrazy() {
  MyOptions.sendOptionsToSearch();
  themes.prepareThemes();
  await MySearchUI.prepareSearch();
  await MySearch.loadFromDB();
  MySearchUI.appendFragments();
  MyGroupings.prepare(showMessages);
  modal.closeModal('Loading Data');
  pcm_channel.postMessage({'msg':'search: openedSearchUI'});
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
modalLoadingData( () => {
  chrome.runtime.sendMessage({'command':'searchUI_starting', 'data':{'tabID':uniqueTabID}}, async (response) => {
    if (response) {
      pcm_startChannel.postMessage({'msg':'search crazy starting', 'value':uniqueTabID});
    }
    else haltScript(null, `You have SearchCrazy Max running in another tab or window. You can't have multiple instances running or it will cause database problems.`, null, 'Error starting SearchCrazy Max', true);
  });
});

/** ================ EventListener Section =============================================== **/
/** Detect when user closes page so background page can remove anything it doesn't need without the panda UI. **/
window.addEventListener('beforeunload', () => {
  if (MySearch) { MySearchUI.stopSearching(); pcm_channel.postMessage({'msg':'search: closingSearchUI'}); MyGroupings.removeAll(); }
  pcm_searchOpened = false; chrome.runtime.sendMessage({'command':'searchUI_startDone', 'data':{}});
  MyOptions = null; MyAlarms = null; MyMenu = null; modal = null; MyGroupings = null; MySearchUI = null; MySearch = null;
  MyHistory = null; themes = null; MYDB = null;
});

pcm_channel.onmessage = (e) => {
  if (e.data) {
    const data = e.data;
    if (data.msg === 'search crazy starting' && data.value) { // SearchUI trying to start so send details of this page to all other pages on channel.
      pcm_otherRunning = 0; pcm_startChannel.postMessage({'msg':'search crazy responding', 'object':{'sender':data.value, 'tabId':uniqueTabID, 'status':pcm_searchOpened}});
    } else if (data.msg === 'search crazy responding' && data.object && data.object.sender === uniqueTabID) { // Got a SearchUI response so collect stats on other pages running currently.
      if (uniqueTabID !== data.object.tabId) { if (data.object.status) pcm_otherRunning++; } // Count panda pages actually running.
      else if (!pcm_searchOpened) { // Make sure current panda page isn't running already.
        setTimeout(() => { // Sets a timeout so it can get ALL responses from other pages to know if this page should start running.
          chrome.runtime.sendMessage({'command':'searchUI_startDone', 'data':{}}); // Releases hold when multiple pages try to start all at once.
          if (pcm_otherRunning === 0) {  // No other pages are running so get started.
            if (pcm_pandaOpened) { pcm_searchOpened = true; prepare(); }
            else haltScript(null, `PandaCrazy page must be opened and running first before you can run the search page.`, null, 'Error starting SearchCrazy Max', true);
          }
          else haltScript(null, `You have SearchCrazy Max running in another tab or window. You can't have multiple instances running or it will cause database problems.`, null, 'Error starting SearchCrazy Max', true);
        }, 200);
      }
    } else if (data.msg === 'panda crazy responding' && data.object) { if (data.object.status) pcm_pandaOpened = true; }
    else if (data.msg === 'panda crazy Loaded') { pcm_pandaOpened = true; if (MySearchUI) MySearchUI.goRestart(); }
    else if (data.msg === 'panda crazy closing') {
      chrome.runtime.sendMessage({'command':'searchUI_closed', 'data':{}});
      pcm_pandaOpened = false; pcm_searchOpened = false; if (MySearchUI) MySearchUI.lostPandaUI();
    }
    alarmsListener(data);
  }
}  
