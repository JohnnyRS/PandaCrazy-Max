let bgPage = null, search = null, bgQueue = null, bgSearchClass = null, modal = null;
let localVersion = localStorage.getItem('PCM_version');

/** Open a modal showing loading Data and then after it shows on screen go start Panda Crazy. */
function modalLoadingData() {
  modal = new ModalClass();
  modal.showDialogModal('700px', 'Loading Data', 'Please Wait. Loading up all data for you.',
    null , false, false, '', '', null, () => getBgPage() ); // Calls startPandaCrazy after modal shown.
}
async function getBgPage() {
  chrome.runtime.getBackgroundPage( async (backgroundPage) => {
    bgPage = backgroundPage; await prepare();
  });
}
async function prepare() {
  await bgPage.prepareToOpen(_, true, localVersion);
  search = new SearchUI(); bgSearchClass = bgPage.gSetSearchUI(search);
  startSearchCrazy();
}
/** Starts the search crazy UI and prepares all the search triggers. */
async function startSearchCrazy() {
  window.addEventListener('beforeunload', () => { bgPage.gSetSearchUI(null); });
  await search.prepareSearch();
  await bgSearchClass.loadFromDB();
  //await bgSearchClass.addTrigger('rid', {'name':'Ben Peterson', 'reqId':'AFEG4RKNBSL4T', 'groupId':'', 'title':'', 'reqName':'Ben Peterson', 'pay':0.01, 'duration':'6 minutes', 'status':'searching'}, {'duration': 12000, 'once':false, 'limitNumQueue':0, 'limitTotalQueue':0, 'limitFetches':0, 'autoGoHam':false, 'tempGoHam':4000, 'acceptLimit':0});
  //await bgSearchClass.addTrigger('gid', {'name':'Ibotta, Inc.', 'reqId':'', 'groupId':'30B721SJLR5BYYBNQJ0CVKKCWQZ0OI', 'title':'', 'reqName':'Ibotta, Inc.', 'pay':0.01, 'duration':'6 minutes', 'status':'disabled'}, {'duration': 12000, 'once':false, 'limitNumQueue':0, 'limitTotalQueue':0, 'limitFetches':0, 'autoGoHam':false, 'tempGoHam':4000, 'acceptLimit':0});
  search.appendFragments();
  modal.closeModal('Loading Data');
  setTimeout( () => {
  }, 0); // Just a small delay so messages can be read by user.
}
/** ================ First lines executed when page is loaded. ============================ **/
allTabs('/searchCrazy.html', count => { // Count how many Search Crazy pages are opened.
  if (count<2) modalLoadingData(); // If there are less than 2 pages opened then start loading data.
  else haltScript(null, 'You have SearchCrazy Max running in another tab or window. You can\'t have multiple instances running or it will cause database problems.', null, 'Error starting SearchCrazy Max', true);
});
