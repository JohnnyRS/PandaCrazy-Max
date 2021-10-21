let bgPage = null, search = null, pandaUI = null, alarms = null, bgQueue = null, bgSearch = null, modal = null, bgHistory = null, MYDB = null, globalOpt = null;
let localVersion = localStorage.getItem('PCM_version'), sGroupings = null, menus = null, themes = null;
$('body').tooltip({'selector': `.pcm-tooltipData:not(.pcm-tooltipDisable)`, 'delay': {'show':1000}, 'trigger':'hover'});

function getBgPage() {
  chrome.runtime.getBackgroundPage( backgroundPage => {
    bgPage = backgroundPage;
    bgHistory = bgPage.gGetHistory(); MYDB = bgPage.gGetMYDB();

    $('#pcm-theStatMaker').click( (e) => {
      bgHistory.testing();
    });
  });
}

/** ================ First lines executed when page is loaded. ============================ **/
getBgPage(); // Grabs the background page, detects if another UI is opened and then starts SearchUI.
