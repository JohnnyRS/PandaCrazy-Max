let globalOpt=null, modal=null, pandaUI=null, alarms=null, notify=null, groupings=null, menus=null;
let goodDB=false, errorObject = null;
let bgPage = chrome.extension.getBackgroundPage(); // Get the background page object for easier access.
let bgPanda = bgPage.gGetPanda(), bgQueue = bgPage.gGetQueue(); // Get objects to panda and queue class.

/**
 * Open a modal showing loading Data and then after it shows on screen go start Panda Crazy.
 */
function modalLoadingData() {
  modal = new ModalClass();
  modal.showDialogModal('700px', 'Loading Data', 'Please Wait. Loading up all data for you.',
    null , false, false, '', '', null, startPandaCrazy ); // Calls startPandaCrazy after modal shown.
}
/**
 * Starts the process of loading data in the program and check for errors as it goes.
 * Make sure to check for a good DB open and wait for slower computers.
 */
async function startPandaCrazy() {
  await bgPage.gCheckPandaDB().then( result => { goodDB = result; }, rejected => errorObject = rejected );
  if (goodDB) {
    globalOpt = new PandaGOptions();
    await globalOpt.prepare( showMessages ); // Wait for global options to load and show message or error.
    pandaUI = new PandaUI();
    alarms = new AlarmsClass();
    await alarms.prepare( showMessages ); // Wait for alarms to load and show message or error.
    notify = new NotificationsClass();
    groupings = new PandaGroupings();
    await groupings.prepare( showMessages ); // Wait for groupings to load and show message or error.
    menus = new MenuClass("pcm_quickMenu");
    bgPage.gSetPandaUI(pandaUI); // Pass the pandaUI class value to the background page for easy access.
    await pandaUI.prepare( showMessages ); // Wait for panda jobs to load and show message or error.
  
    $('[data-toggle="tooltip"]').tooltip({delay: {show:1300}, trigger:'hover'}); // Enable all tooltips.
    $('.sortable').sortable().disableSelection(); // Set up sortables Disable selection for sortables.
    showMessages(['Finished loading all!'], null, "Main"); // Show last Message that all should be good.
    setTimeout( () => modal.closeModal('Loading Data'), 600); // Just a small delay so messages can be read by user.
  } else { haltScript(errorObject, errorObject.message, "Problem with Database.", 'Error opening database:'); }
}

/** 
 * Shows good messages in loading modal and console. Shows error message on page and console before halting script.
 * @param {array} good    Array of good messages to display in the loading modal and console.
 * @param {object} bad    If set then an error has happened so display it and stop script.
 */
function showMessages(good, bad) {
  if (bad) { haltScript(bad, bad.message, null, 'Error loading data: '); } // Check for errors first.
  if (good.length > 0) { // Does it have good messages?
    good.forEach( value => { $('#pcm_modal_0 .modal-body').append($(`<div>${value}</div>`)); console.log(value); });
  }
}

/** ================ First lines executed when page is loaded. ============================ **/
allTabs('/pandaCrazy.html', count => { // Count how many Panda Crazy pages are opened.
  if (count<2) modalLoadingData(); // If there are less than 2 pages opened then start loading data.
  else haltScript(null, 'You have PandaCrazy Max running in another tab or window. You can\'t have multiple instances running or it will cause database problems.', null, 'Error starting PandaCrazy Max', true);
});

/** ================ EventListener Section =============================================== **/
/** Detect when user closes page so background page can remove anything it doesn't need without the panda UI. **/
window.addEventListener('beforeunload', (e) => { bgPanda.removeAll(); bgPage.gSetPandaUI(null); });
document.addEventListener('keydown', (e) => { // Disables sortable and selection on cards if ctrl key is pushed down.
  if ((event.keyCode ? event.keyCode : event.which)===17) { $('.ui-sortable').sortable( 'option', 'disabled', true ).disableSelection(); }
});
document.addEventListener("keyup", (e) => { // Enables sortable and selection on cards if ctrl key is let go.
  if ((event.keyCode ? event.keyCode : event.which)===17) { $('.ui-sortable').sortable( 'option', 'disabled', false ).disableSelection(); }
});
