let MySearchUI = null, MyPandaUI = null, MySearch = null, MyModal = null, MyHistory = null, MYDB = null;
let gLocalVersion = localStorage.getItem('PCM_version');
$('body').tooltip({'selector': `.pcm-tooltipData:not(.pcm-tooltipDisable)`, 'delay': {'show':1000}, 'trigger':'hover'});

/** Starts up the page to show the stats and allow users to download the stats to a csv file. **/
function startUp() {
  MyHistory = new HistoryClass(); MYDB = new DatabasesClass();

  $('#pcm-theStatMaker').click( async () => {
    MyModal = new ModalClass();
    MyModal.showDialogModal('700px', 'Loading Stats', 'Please Wait. Loading up stats to save to file.', null , false, false, '', '', null, async () => {
      if (MyPandaUI) MyPandaUI.pauseToggle(true); if (MySearchUI) MySearchUI.pauseToggle(true);
      let csvContents = await MyHistory.testing();
      saveToFile(csvContents, 'PCM_stats_results_',_, () => {
        if (MyPandaUI) MyPandaUI.pauseToggle(false); if (MySearchUI) MySearchUI.pauseToggle(false);
        MyModal.closeModal('Loading Stats');
      }, false);
    });
  });
}

/** ================ First lines executed when page is loaded. ============================ **/
startUp();
