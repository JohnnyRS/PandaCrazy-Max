let MySearchUI = null, MySearch = null, MyHistory = null, MYDB = null, MyMenu = null, MyAlarms = null, MyOptions = null;
let gLocalVersion = localStorage.getItem('PCM_version'), MyGroupings = null, MyThemes = null, MyQueue = null, MyPanda = null, MyPandaUI = null, MyModal = null;
let gPCM_pandaOpened = false, gPCM_searchOpened = false, gSearchWaiting = null;
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
  browser.runtime.sendMessage({'command':'searchUI_opened'}); document.title = 'Panda Crazy Search - Loading';
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
    document.title = 'Panda Crazy Search';
    browser.runtime.sendMessage({'command':'searchUI_start_done'});
  }, 500); // Just a small delay so messages can be read by user.
}
/**  Shows good messages in loading modal and console. Shows error message on page and console before halting script.
 * @param  {array} good - Array of good messages to display.  @param  {object} [bad] - If set then an error has happened so display it and stop script.
**/
function showMessages(good, bad=null) {
  if (bad !== null) { haltScript(bad, bad.message, null, 'Error loading data: '); } // Check for errors first.
  if (good && good.length > 0) { // Does it have good messages?
    good.forEach( value => { $('#pcm-modal-0 .modal-body').append($(`<div>${value}</div>`)); });
  }
}
function multipleWarning() {
  if (MyModal) MyModal.closeAll(); gLoadCompleted = true;
  browser.runtime.sendMessage({'command':'searchUI_start_done'});
  document.title = 'PCM Search - Error Starting';
  haltScript(null, `You have SearchCrazy Max running in another tab or window. You can't have multiple instances running or it will cause database problems.`, null, 'Error starting SearchCrazy Max', true);
}
function needsPCM() {
  if (MyModal) MyModal.closeAll();
  browser.runtime.sendMessage({'command':'searchUI_start_done'});
  document.title = 'PCM Search - Error Starting';
  haltScript(null, `PandaCrazy page must be opened and running first before you can run the search page.`, null, 'Error starting SearchCrazy Max', true);
}
/** ================ First lines executed when page is loaded. ============================ **/
document.title = 'PCM Search - Starting';
modalLoadingData( () => {
  let randTime = Math.floor(Math.random() * 600) + 100;  // Random timeout so two pages won't be trying to start at same time.
  setTimeout(() => {
    browser.runtime.sendMessage({'command':'searchUI_starting'}).then(result => {
      if (result) {
        browser.runtime.sendMessage({'command':'pandaUI_status'}).then(result => {
          if (result) {
            browser.runtime.sendMessage({'command':'searchUI_status'}).then(result => {  // Verifies no other SearchUI is running.
              if (!result) {
                gSearchWaiting = true; PCM_channel.postMessage({'msg':'search: openingSearchUI'});  // Verifies pandaUI is fully running and loaded.
                setTimeout(() => { if (gSearchWaiting) needsPCM(); }, 500);                         // If no pandaUI verification received then show error.
              } else multipleWarning();
            });
          } else needsPCM();
        });
      } else multipleWarning();
    });
  }, randTime);
});

/** ================ EventListener Section ================================================================== **/
/** Detect when user closes page so background page can remove anything it doesn't need without the panda UI. **/
window.addEventListener('beforeunload', () => {
  if (gPCM_searchOpened) browser.runtime.sendMessage({'command':'searchUI_closed'});
  if (MySearch) { MySearchUI.stopSearching(); PCM_channel.postMessage({'msg':'search: closingSearchUI'}); MyGroupings.removeAll(); }
  MyOptions = null; MyAlarms = null; MyMenu = null; MyGroupings = null; MySearchUI = null; MySearch = null; MyHistory = null; MYDB = null; MyThemes = null;
});
/** Listens on a channel for messages to make sure it's the only search page running and panda page is running. **/
PCM_channel.onmessage = (e) => {
  if (e.data) {
    const data = e.data;
    if (data.msg === 'panda crazy Loaded') { gPCM_pandaOpened = true; if (MySearchUI) MySearchUI.goRestart(); }
    else if (data.msg === 'searchTo: panda crazy running') { if (gSearchWaiting) { gSearchWaiting = null; gPCM_pandaOpened = true; gPCM_searchOpened = true; prepare(); }}
    else if (data.msg === 'panda crazy closing') { gPCM_pandaOpened = false; gPCM_searchOpened = false; if (MySearchUI) MySearchUI.lostPandaUI(); document.title = 'PCM Search - Error'; }
    alarmsListener(data);
  }
}
