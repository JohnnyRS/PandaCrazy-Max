let bgPage = null, SearchUI = null, PandaUI = null, theAlarms = null, bgQueue = null, bgSearch = null, modal = null, bgHistory = null, MYDB = null, globalOpt = null;
let gLocalVersion = localStorage.getItem('PCM_version'), sGroupings = null, menus = null, themes = null;
$('body').tooltip({'selector': `.pcm-tooltipData:not(.pcm-tooltipDisable)`, 'delay': {'show':1000}, 'trigger':'hover'});

function getBgPage() {
  chrome.runtime.getBackgroundPage( backgroundPage => {
    bgPage = backgroundPage;
    bgHistory = bgPage.gGetHistory(); MYDB = bgPage.gGetMYDB();

    $('#pcm-theStatMaker').click( async () => {
      modal = new ModalClass();
      modal.showDialogModal('700px', 'Loading Stats', 'Please Wait. Loading up stats to save to file.', null , false, false, '', '', null, async () => {
        if (PandaUI) PandaUI.pauseToggle(true); if (SearchUI) SearchUI.pauseToggle(true);
        let csvContents = await bgHistory.testing();
        saveToFile(csvContents, 'PCM_stats_results_',_, () => {
          if (PandaUI) PandaUI.pauseToggle(false); if (SearchUI) SearchUI.pauseToggle(false);
          modal.closeModal('Loading Stats');
        }, false);
      });
    });
  });
}

/** ================ First lines executed when page is loaded. ============================ **/
getBgPage(); // Grabs the background page, detects if another UI is opened and then starts SearchUI.
