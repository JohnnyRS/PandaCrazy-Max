let MYDB = null, MyOptions = null, MyHistory = null, MyPandaTimer = null, MySearchTimer = null, MyPanda = null, MySearch = null, MyModal = null;

/** Wipe all data from the database.
 * @async - To wait for the classes to wipe all the data.
**/
async function wipeData() {
  if (!MYDB) MYDB = new DatabasesClass(); if (!MyOptions) MyOptions = new PandaGOptions(); if (!MyHistory) MyHistory = new HistoryClass(false);
  if (!MySearch && !MyPanda) {
    await MyHistory.wipeData();
    MyPandaTimer = new TimerClass(995,970,'pandaTimer'); MySearchTimer = new TimerClass(950,920,'searchTimer'); // Panda and Search class needs the timer classes.
    MySearch = new MturkHitSearch(950); await MySearch.wipeData();
    MyPanda = new MturkPanda(995, 950); await MyPanda.wipeData();
    MYDB = null; MyOptions = null; MyHistory = null; MyPandaTimer = null; MySearchTimer = null; MyPanda = null; MySearch = null;
  }
}
/** Shows the help page and provides a button to wipe all data if needed. **/
function startHelp() {
  $('.pcm-versionNumber').html(`Current Extension Version: ${localStorage.getItem('PCM_version')} (<a href='https://github.com/JohnnyRS/PandaCrazy-Max/wiki/Versions'>Version history page</a>)`);
  $('#pcm-resetMyData').click( () => {
    browser.runtime.sendMessage({'command':'pandaUI_status'}).then(async (response) => {
      MyModal = new ModalClass();
      if (response) MyModal.showDialogModal('700px', 'Please Close the Panda Crazy Page!', 'You must close the Panda Crazy Max page first before wiping the data.', null, false, false);
      else  {
        MyModal.showDialogModal('600px', 'Wipe All Data', 'Do you really want to delete all your saved data?<br>You will go back to default values!', async () => {
          await wipeData();
          MyModal.closeModal(); await delay(100); // Just a small delay so modal can close completely.
          MyModal.showDialogModal('700px', 'All data has been wiped!', 'All old data has been deleted and default values will be loaded.<br>You may close this page and start up PandaCrazy Max by clicking on the button below.', null, false, false,_,_,_,_, () => { window.open('pandaCrazy.html', '_blank'); myModal = null; window.close(); });
        }, true, true,_,_,_,_, () => {});
      }
    });
  });
}

/** ================ First lines executed when page is loaded. ============================ **/
startHelp(); // First thing to do is start up the help page!
