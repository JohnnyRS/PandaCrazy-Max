/** This class deals with any showing of modals for option changing.
 * @class ModalOptionsClass ##
 * @author JohnnyRS - johnnyrs@allbyjohn.com */
class ModalOptionsClass {
	constructor() {
    this.defDur = {'min':0, 'max':120000};
  }
  /** Shows the general options in a modal for changes.
   * @param  {function} [afterClose] - After Close Function */
  showGeneralOptions(afterClose=null) {
    if (!modal) modal = new ModalClass();
    const idName = modal.prepareModal(globalOpt.doGeneral(), '700px', 'pcm-generalOptModal', 'modal-lg', 'General Options', '', '', '', 'visible btn-sm', 'Save General Options', changes => {
      globalOpt.doGeneral(Object.assign(globalOpt.doGeneral(), changes)); modal.closeModal();
    });
    modal.showModal(_, () => {
      let df = document.createDocumentFragment();
      $(`<div class='pcm-detailsEdit'>Click on the options you would like to change below:</div>`).appendTo(df);
      displayObjectData([
        {'label':'Show Help Tooltips:', 'type':'trueFalse', 'key':'showHelpTooltips', 'tooltip':'Should help tooltips be shown for buttons and options? What you are reading is a tooltip.'}, 
        {'label':'Disable Queue Watch Color Alert:', 'type':'trueFalse', 'key':'disableQueueAlert', 'tooltip':'Disable the color alert in the queue watch area for HITs nearing the expiration time.'}, 
        {'label':'Disable Queue Watch Alarm:', 'type':'trueFalse', 'key':'disableQueueAlarm', 'tooltip':'Disable sounding the alarm for HITs nearing the expiration time.'}, 
        {'label':'Disable Desktop Notifications:', 'type':'trueFalse', 'key':'disableNotifications', 'tooltip':'Disable notifications shown when accepting HITs or warnings.'}, 
        {'label':'Show Fetch Highlighter on Group ID:', 'type':'trueFalse', 'key':'fetchHighlight', 'tooltip':'Should group ID be highlighted when job is trying to fetch?'}, 
        {'label':'Search Job Buttons Create Search UI Triggers:', 'type':'trueFalse', 'key':'toSearchUI', 'tooltip':'Using search buttons creates search triggers in the search UI instead of panda UI.'}, 
        {'label':'Disable Captcha Alert:', 'type':'trueFalse', 'key':'disableCaptchaAlert', 'tooltip':'Disable the captcha alert and notification. Disable this if you are a master or using another script for captchas.'}, 
        {'label':'Show Captcha Counter Text:', 'type':'trueFalse', 'key':'captchaCountText', 'tooltip':'Should the captcha count be shown on the bottom log tabbed area? Disable this if you are a master.'}, 
        {'label':'Captcha Shown After #HITs:', 'type':'text', 'key':'captchaAt', 'tooltip':'How many HITs on average will mturk show a captcha for you?'}, 
      ], df, modal.tempObject[idName], true);
      $(`<table class='table table-dark table-hover table-sm pcm-detailsTable table-bordered'></table>`).append($(`<tbody></tbody>`).append(df)).appendTo(`#${idName} .${modal.classModalBody}`);
      df = null;
    }, () => { modal = null; if (afterClose) afterClose(); });
  }
  /** Shows the timer options in a modal for changes.
   * @param  {function} [afterClose] - After Close Function */
  showTimerOptions(afterClose=null) {
    if (!modal) modal = new ModalClass();
    const idName = modal.prepareModal(globalOpt.doTimers(), '850px', 'pcm-timerOptModal', 'modal-lg', 'Timer Options', '', '', '', 'visible btn-sm', 'Save Timer Options', changes => {
      let errorFound = globalOpt.timerConfirm(changes);
      if (!errorFound) {
        globalOpt.doTimers(changes);
        bgPanda.timerChange(globalOpt.getCurrentTimer()); pandaUI.pandaGStats.setPandaTimer(globalOpt.getCurrentTimer()); bgPanda.hamTimerChange(changes.hamTimer);
        pandaUI.pandaGStats.setHamTimer(changes.hamTimer); bgSearch.timerChange(changes.searchTimer); pandaUI.pandaGStats.setSearchTimer(changes.searchTimer);
        bgQueue.timerChange(changes.queueTimer); pandaUI.pandaGStats.setQueueTimer(changes.queueTimer);
        menus.updateTimerMenu(changes.timerIncrease, changes.timerDecrease, changes.timerAddMore);
        modal.closeModal(); changes = null;
      }
    });
    modal.showModal(_, () => {
      let df = document.createDocumentFragment(), timerRange = globalOpt.getTimerRange(), timerChange = globalOpt.getTimerChange();
      let searchRange = globalOpt.getTimerSearch(), queueRange = globalOpt.getTimerQueue();
      $(`<div class='pcm-detailsEdit'>Click on the options you would like to change below:<br><span class='small pcm-modalInfo'>All timers are in milliseconds unless specified otherwise.</span></div>`).appendTo(df);
      displayObjectData([
        {'label':'Main Timer:', 'type':'number', 'key':'mainTimer', 'tooltip':`Change the main timer duration in milliseconds.`, 'minMax':timerRange}, 
        {'label':'Timer #2:', 'type':'number', 'key':'secondTimer', 'tooltip':`Change the second timer duration in milliseconds.`, 'minMax':timerRange}, 
        {'label':'Timer #3:', 'type':'number', 'key':'thirdTimer', 'tooltip':`Change the third timer duration in milliseconds.`, 'minMax':timerRange}, 
        {'label':'GoHam Timer:', 'type':'number', 'key':'hamTimer', 'tooltip':`Change the go ham timer duration in milliseconds.`, 'minMax':timerRange}, 
        {'label':'Default GoHam Timer Delay (Seconds):', 'type':'number', 'seconds':true, 'key':'hamDelayTimer', 'tooltip':'Change the default duration for jobs going into ham automatically by delay.', 'minMax':this.defDur}, 
        {'label':'Search Timer:', 'type':'number', 'key':'searchTimer', 'tooltip':`Change the search timer duration for HITs to be searched and found in milliseconds.`, 'minMax':searchRange},
        {'label':'Check Queue Every:', 'type':'number', 'key':'queueTimer', 'tooltip':'Change the timer duration for the mturk queue to be checked and updated in milliseconds. Higher amount may lower data use.', 'minMax':queueRange},
        {'label':'Timer Increase By:', 'type':'number', 'key':'timerIncrease', 'tooltip':'Change the value in milliseconds on the increase menu button to increase the current timer by.', 'minMax':timerChange},
        {'label':'Timer Decrease By:', 'type':'number', 'key':'timerDecrease', 'tooltip':'Change the value in milliseconds on the decrease menu button to decrease the current timer by.', 'minMax':timerChange},
        {'label':'Timer Add Timer By:', 'type':'number', 'key':'timerAddMore', 'tooltip':'Change the value in milliseconds on the add more time menu button to increase the current timer by.', 'minMax':timerChange},
        {'label':'Default Search Panda Durations (Seconds):', 'type':'number', 'key':'searchDuration', 'seconds':true, 'tooltip':'The duration temporarily used for any HITs found from search jobs.', 'minMax':this.defDur}
      ], df, modal.tempObject[idName], true);
      $(`<table class='table table-dark table-hover table-sm pcm-detailsTable table-bordered'></table>`).append($(`<tbody></tbody>`).append(df)).appendTo(`#${idName} .${modal.classModalBody}`);
      df = null;
    }, () => { modal = null; if (afterClose) afterClose(); });
  }
}