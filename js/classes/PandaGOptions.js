/** Class for the global options and methods to change them. Breaks up the options into general, timers and alarm options.
 * @class PandaGOptions
 * @author JohnnyRS - johnnyrs@allbyjohn.com */
class PandaGOptions {
  constructor() {
    this.general = {};              // The general object used in script from database or default values.
    this.generalDefault = {         // Default values used at first run or default buttons.
      'category':"general",         // Object category used for database saving and loading.
      'showHelpTooltips':true,      // Should help tooltips be shown or just info tips?
      'disableCaptchaAlert':false,  // Should captcha alerts and notifications be disabled?
      'captchaCountText':true,      // Should the captcha count text be shown on the lower log tabbed section?
      'captchaAt':35,               // Number of hits collected usually before a captcha is shown.
      'disableQueueAlarm':false,    // Should the alarm not be sounded when a hit is nearing expiration?
      'disableQueueAlert':false,    // Should the alert color not be shown in queue watch when a hit is near expiration?
      'disableNotifications':false, // Should notifications not be shown?
      'unfocusWarning':true,        // Should the warning about unfocussed window be shown?
      'themeName':"normal",         // The theme name being used.
      'cardDisplay':2,              // 2 = Normal look, 1 = Minimal Info, 0 = One Liner card display.
      'logPanelHeight':0,           // The height of the bottom log panel if user resizes it.
      'debugger':0                  // Main debugger level.
    };
    this.timers = {};               // The timers object used in script from database or default values.
    this.timersDefault = {          // Default values used at first run or default buttons.
      'category':"timers",          // Object category used for database saving and loading.
      'mainTimer':1000,             // The time for the main timer.
      'secondTimer':1400,           // The time for the second timer.
      'thirdTimer':2100,            // The time for the third timer.
      'hamTimer':900,               // The time for the ham timer.
      'hamDelayTimer':6000,         // The duration timer for goHam on any new hits.
      'queueTimer':2000,            // The time for the queue Timer.
      'searchTimer':950,            // The time for the search Timer.
      'timerIncrease':10,           // Time in milliseconds used for the timer increase button.
      'timerDecrease':10,           // Time in milliseconds used for the timer decrease button.
      'timerAddMore':650,           // Time in milliseconds used for the timer add more button.
      'timerAutoIncrease':10,
      'stopAutoSlow':false,
      'autoSlowDown':false,
      'timerUsed':'mainTimer',
      'searchDuration':12000
    };
    this.timerRange = {min:600, max:15000};   // The limits for the timer in milliseconds when editing.
    this.timerDur = {min:1000, max:30000}     // The limits for the ham duration in milliseconds.
    this.timerQueue = {min:1000, max:60000};  // The limits for the timer queue in milliseconds when editing.
    this.timerSearch = {min:800, max:30000};  // The limits for the timer queue in milliseconds when editing.
    this.timerChange = {min:5, max:2000};     // The limits for the timer change buttons in milliseconds when editing.
    this.alarms = {};
    this.alarmsDefault = {
      'category':"alarms",
      'volume':80,
      'showAlertNotify':true,
      'ttsName':'',
      'unfocusDeThrottle':false,
    };
    this.helpers = {};
    this.helpersDefault = {
      'category':'helpers',
      'forumButtons':true,
      'TVButtons':true,
      'MTCButtons':true,
      'MTFButtons':true,
      'OHSButtons':true,
      'DiscordButtons':true,
      'SlackButtons':true,
      'mturkPageButtons':true,
      'queueCommands':true
    }
    this.captchaCounter = 0;
    this.lastQueueAlert = -1;
    this.timerUsed = 'mainTimer';
  }
  /** Load up global options from database or use and save default options into database.
   * @async                      - To wait for the options data to be loaded from the database.
   * @param {function} afterFunc - Function to call after done to send success array or error object. */
  async prepare(afterFunc) {
    let success = [], err = null;
    this.captchaCounter = 0; this.lastQueueAlert = -1; this.timerUsed = 'mainTimer';
    await bgPanda.db.getFromDB(bgPanda.optionsStore).then( async result => {
      if (result.length) { // Options were already saved in database so load and use them.
        for (var i=0, keys=Object.keys(result); i < keys.length; i++) {
          if (['general','timers','alarms','helpers'].includes(result[i].category)) {
            this[result[i].category] = Object.assign({}, this[result[i].category + 'Default'], result[i]);
          }
        }
        if (Object.keys(this.helpers).length === 0) { await bgPanda.db.addToDB(bgPanda.optionsStore, this.helpersDefault)
          .then( () => { this.helpers = Object.assign({}, this.helpersDefault); })
        }
        if (this.timers.searchDuration < 1000) { this.timers.searchDuration = this.timersDefault.searchDuration; this.update(); }
        success[0] = "Loaded all global options from database";
      } else { // Add default values to the options database and use them.
        await bgPanda.db.addToDB(bgPanda.optionsStore, this.generalDefault)
        .then( async () => { await bgPanda.db.addToDB(bgPanda.optionsStore, this.timersDefault)
          .then( async () => { await bgPanda.db.addToDB(bgPanda.optionsStore, this.alarmsDefault)
            .then( async () => { await bgPanda.db.addToDB(bgPanda.optionsStore, this.helpersDefault)
              .then( () => success[0] = "Added default global options to database.", rejected => err = rejected );
            }, rejected => { err = rejected; })
          }, rejected => { err = rejected; })
        }, rejected => err = rejected);
        this.general = Object.assign({}, this.generalDefault);
        this.timers = Object.assign({}, this.timersDefault);
        this.alarms = Object.assign({}, this.alarmsDefault);
        this.helpers = Object.assign({}, this.helpersDefault);
      }
    }, rejected => err = rejected);
    bgPanda.timerChange(this.timers[this.timerUsed]); bgSearch.timerChange(this.timers.searchTimer); bgQueue.timerChange(this.timers.queueTimer);
    afterFunc(success, err); // Sends good Messages or any errors in the after function for processing.
  }
  /** Removes data from memory so it's ready for closing or importing. */
  removeAll() { this.general = {}; this.timers = {}; this.alarms = {}; this.helpers = {}; }
  /** Import the options from an exported file.
   * @param  {object} newData - Data with the imported objects. */
  importOptions(newData) {
    newData.timers.timerUsed = this.timers.timerUsed; this.general = newData.general;
    this.timers = newData.timers; this.alarms = newData.alarms;
    this.update(true);
  }
  /** Returns an array of options for easy exporting.
   * @return {array} - The array of objects to be exported. */
  exportOptions() { return [this.general, this.timers, this.alarms, this.helpers]; }
  /** Updates the global options and resets anything that is needed for example tooltips.
   * @param  {bool} [tooltips=true] - Should tooltips be reset? */
  update(tooltips=true) {
    if (tooltips) {
      if (this.general.showHelpTooltips) $(`[data-toggle="tooltip"]`).tooltip({delay: {show:1300}, trigger:'hover'}).tooltip('enable');
      else {
        $('[data-toggle="tooltip"]').tooltip('disable');
        $(`.card`).find(`span[data-toggle="tooltip"], div[data-toggle="tooltip"]`).tooltip('enable');
      }
    }
    if (pandaUI.logTabs) pandaUI.logTabs.updateCaptcha(this.getCaptchaCount());
    bgPanda.db.addToDB(bgPanda.optionsStore, this.general);
    bgPanda.db.addToDB(bgPanda.optionsStore, this.timers);
    bgPanda.db.addToDB(bgPanda.optionsStore, this.alarms);
    bgPanda.db.addToDB(bgPanda.optionsStore, this.helpers);
  }
  /** Shows the general options in a modal for changes. */
  showGeneralOptions() {
    modal = new ModalClass();
    const idName = modal.prepareModal(this.general, "700px", "modal-header-info modal-lg", "General Options", "", "text-right bg-dark text-light", "modal-footer-info", "visible btn-sm", "Save General Options", (changes) => {
      this.general = Object.assign(this.general, changes);
      modal.closeModal();
      this.update();
    });
    let df = document.createDocumentFragment();
    $(`<div class='pcm_detailsEdit text-center mb-2'>Click on the options you would like to change below:</div>`).appendTo(df);
    displayObjectData([
      {'label':'Show Help Tooltips:', 'type':'trueFalse', 'key':'showHelpTooltips', 'tooltip':'Should help tooltips be shown for buttons and options? What you are reading is a tooltip.'}, 
      {'label':'Disable Captcha Alert:', 'type':'trueFalse', 'key':'disableCaptchaAlert', 'tooltip':'Disable the captcha alert and notification. Disable this if you are a master or using another script for captchas.'}, 
      {'label':'Show Captcha Counter Text:', 'type':'trueFalse', 'key':'captchaCountText', 'tooltip':'Should the captcha count be shown on the bottom log tabbed area? Disable this if you are a master.'}, 
      {'label':'Captcha shown after #hits:', 'type':'text', 'key':'captchaAt', 'tooltip':'How many hits on average will mturk show a captcha for you?'}, 
      {'label':'Disable Queue Watch Color Alert:', 'type':'trueFalse', 'key':'disableQueueAlert', 'tooltip':'Disable the color alert in the queue watch area for hits nearing the expiration time.'}, 
      {'label':'Disable Queue Watch Alarm:', 'type':'trueFalse', 'key':'disableQueueAlarm', 'tooltip':'Disable sounding the alarm for hits nearing the expiration time.'}, 
      {'label':'Disable Desktop Notifications:', 'type':'trueFalse', 'key':'disableNotifications', 'tooltip':'Disable notifications shown when accepting hits or warnings.'}, 
      {'label':'Disable Unfocused window warning:', 'type':'trueFalse', 'key':'unfocusWarning', 'reverse':true, 'tooltip':'Stop notifying me about the unfocussed window because I know what I am doing.'}
    ], df, modal.tempObject[idName], true);
    modal.showModal(_, () => {
      const modalBody = $(`#${idName} .${modal.classModalBody}`);
      $(`<table class='table table-dark table-hover table-sm pcm_detailsTable table-bordered'></table>`).append($(`<tbody></tbody>`).append(df)).appendTo(modalBody);
      modalBody.find(`[data-toggle='tooltip']`).tooltip({delay: {show:1200}, trigger:'hover'});
    }, () => { modal = null; });
  }
  /** Verifies all the timers changed with max and min ranges.
   * @param  {object} v - The changed timer object to verify. */
  timerConfirm(v) {
    let foundError = false;
    for (const key of Object.keys(this.timers)) {
      let element = $(`#pcm_tdLabel_${key}`);
      if (element.length) {
        let range = element.data('range');
        if (v[key] < range.min || v[key] > range.max) { $(`#pcm_tdLabel_${key}`).css('color', 'red'); foundError = true; }
      }
    }
    return foundError;
  }
  /** Shows the timer options in a modal for changes. */
  showTimerOptions() {
    modal = new ModalClass();
    const idName = modal.prepareModal(this.timers, "850px", "modal-header-info modal-lg", "Timer Options", "", "text-right bg-dark text-light", "modal-footer-info", "visible btn-sm", "Save Timer Options", (changes) => {
      let errorFound = this.timerConfirm(changes);
      if (!errorFound) {
        this.timers = Object.assign(this.timers, changes);
        bgPanda.timerChange(this.timers[this.timerUsed]); pandaUI.pandaGStats.setPandaTimer(this.timers[this.timerUsed]);
        bgPanda.hamTimerChange(this.timers.hamTimer); pandaUI.pandaGStats.setHamTimer(this.timers.hamTimer);
        bgSearch.timerChange(this.timers.searchTimer); pandaUI.pandaGStats.setSearchTimer(this.timers.searchTimer);
        bgQueue.timerChange(this.timers.queueTimer); pandaUI.pandaGStats.setQueueTimer(this.timers.queueTimer);
        menus.updateTimerMenu(this.timers.timerIncrease, this.timers.timerDecrease, this.timers.timerAddMore);
        this.update(); modal.closeModal();
      }
    });
    let df = document.createDocumentFragment();
    $(`<div class='pcm_detailsEdit text-center mb-2'>Click on the options you would like to change below:<br><span class='small text-info'>All timers are in milliseconds unless specified otherwise.</span></div>`).appendTo(df);
    displayObjectData([
      {'label':'Main Timer:', 'type':'number', 'key':'mainTimer', 'tooltip':`Change the main timer duration in milliseconds. Minimum is ${this.timerRange.min}.`, 'data':this.timerRange}, 
      {'label':'Timer #2:', 'type':'number', 'key':'secondTimer', 'tooltip':`Change the second timer duration in milliseconds. Minimum is ${this.timerRange.min}.`, 'data':this.timerRange}, 
      {'label':'Timer #3:', 'type':'number', 'key':'thirdTimer', 'tooltip':`Change the third timer duration in milliseconds. Minimum is ${this.timerRange.min}.`, 'data':this.timerRange}, 
      {'label':'GoHam Timer:', 'type':'number', 'key':'hamTimer', 'tooltip':`Change the go ham timer duration in milliseconds. Minimum is ${this.timerRange.min}.`, 'data':this.timerRange}, 
      {'label':'Default GoHam Timer Delay (Seconds):', 'type':'number', 'seconds':true, 'min':0, 'max':120, 'key':'hamDelayTimer', 'tooltip':'Change the default duration for jobs going into ham automatically by delay.', 'data':{'min':0, 'max':120000}}, 
      {'label':'Search Timer:', 'type':'number', 'key':'searchTimer', 'tooltip':'Change the search timer duration for hits to be searched and found in milliseconds. Minimum is ${this.timerRange.min}.', 'data':this.timerSearch}, 
      {'label':'Check Queue Every:', 'type':'number', 'key':'queueTimer', 'tooltip':'Change the timer duration for the mturk queue to be checked and updated in milliseconds. Higher amount may lower data use.', 'data':this.timerQueue}, 
      {'label':'Timer Increase By:', 'type':'number', 'key':'timerIncrease', 'tooltip':'Change the value in milliseconds on the increase menu button to increase the current timer by.', 'data':this.timerChange},
      {'label':'Timer Decrease By:', 'type':'number', 'key':'timerDecrease', 'tooltip':'Change the value in milliseconds on the decrease menu button to decrease the current timer by.', 'data':this.timerChange},
      {'label':'Timer Add Timer By:', 'type':'number', 'key':'timerAddMore', 'tooltip':'Change the value in milliseconds on the add more time menu button to increase the current timer by.', 'data':this.timerChange},
      {'label':'Timer Auto Slowdown Increase:', 'type':'number', 'key':'timerAutoIncrease', 'tooltip':'', 'data':this.timerChange},
      {'label':'Default search panda durations (Seconds):', 'type':'number', 'key':'searchDuration', 'seconds':true, 'min':0, 'max':120, 'tooltip':'The duration temporarily used for any hits found from search jobs.', 'data':{'min':0, 'max':120000}}
    ], df, modal.tempObject[idName], true);
    modal.showModal(_, () => {
      const modalBody = $(`#${idName} .${modal.classModalBody}`);
      $(`<table class='table table-dark table-hover table-sm pcm_detailsTable table-bordered'></table>`).append($(`<tbody></tbody>`).append(df)).appendTo(modalBody);
      modalBody.find(`[data-toggle='tooltip']`).tooltip({delay: {show:1200}, trigger:'hover'});
    }, () => { modal = null; });
  }
  /** Updates the captcha text area with updated info.
   * @return {number} - Returns the value in the captcha counter. */
  updateCaptcha() {
    this.captchaCounter = (this.general.captchaAt>this.captchaCounter) ? this.captchaCounter + 1 : 0;
    return this.captchaCounter;
  }
  /** Resets the captcha counter back down to 0. */
  resetCaptcha() { this.captchaCounter = 0; }
  /** Checks to see if it's ok to sound the queue alarm or not.
   * @param  {number} seconds - The lowest seconds on the queue to check if alarm is needed.
   * @return {bool}           - True if the queue alert should be sounded. */
  checkQueueAlert(seconds) {
    let returnValue = false, saveMinutes = true;
    if (this.general.disableQueueAlarm && this.general.disableQueueAlert) return returnValue;
    const minutes = Math.trunc(seconds/60);
    if (alarms.getData('queueAlert').lessThan * 60 > seconds) {
      if (this.lastQueueAlert===-1 || this.lastQueueAlert > minutes) { returnValue = true; }
      this.lastQueueAlert = minutes;
    } else this.lastQueueAlert = -1;
    return returnValue;
  }
  /** Is the queue alert enabled?
   * @return {bool} - True if queue alert is enabled. */
  isQueueAlert() { return !this.general.disableQueueAlert; }
  /** Is the queue alarm enabled?
   * @return {bool} - True if queue alarm is enabled. */
  isQueueAlarm() { return !this.general.disableQueueAlarm; }
  /** Are the notifications enabled?
   * @return {bool} - True if notifications are enabled. */
  isNotifications() { return !this.general.disableNotifications; }
  /** Is the captcha alert enabled?
   * @return {bool} - True if captcha alert is enabled. */
  isCaptchaAlert() { return !this.general.disableCaptchaAlert; }
  /** Should user be warned about unfocussed window?
   * @return {bool} - True if warning about unfocussed window is enabled. */
  isUnfocusWarning() { return this.general.unfocusWarning; }
  /** Change timer to using the main timer and return that value.
   * @return {number} - Returns the value for the main timer. */
  useTimer1() { this.timerUsed = 'mainTimer'; return this.timers.mainTimer; }
  /** Change timer to using the second timer and return that value.
   * @return {number} - Returns the value for the second timer. */
  useTimer2() { this.timerUsed = 'secondTimer'; return this.timers.secondTimer; }
  /** Change timer to using the third timer and return that value.
   * @return {number} - Returns the value for the third timer. */
  useTimer3() { this.timerUsed = 'thirdTimer'; return this.timers.thirdTimer; }
  /** Return the current timer value.
   * @return {number} - Returns the value for the current timer. */
  getCurrentTimer() { return this.timers[this.timerUsed]; }
  /** Get the ham delay time to use for new hits when goHam gets turned on. */
  getHamDelayTimer() { return this.timers.hamDelayTimer; }
  /** Get the search duration time to use for new hits when it starts to collect before searching. */
  theSearchDuration(val) { if (val) { this.timers.searchDuration = val; this.update(false); } return this.timers.searchDuration; }
  /** Get the timer increase value for increase timer button. */
  getTimerIncrease() { return this.timers.timerIncrease; }
  /** Get the timer decrease value for decrease timer button. */
  getTimerDecrease() { return this.timers.timerDecrease; }
  /** Get the timer add more value for add more time to timer button. */
  getTimerAddMore() { return this.timers.timerAddMore; }
  /** Gets the captcha counter.
   * @return {number} - Returns the number for the captcha counter. */
  getCaptchaCount() { return this.captchaCounter; }
  /** Gets the panda card display format
   * @return {number} - Returns the number for the display format to show information. */
  getCardDisplay() { return this.general.cardDisplay; }
  /** Change the display number used to display information in the panda cards.
   * @param  {number} display - The number for the display format to use for information in the panda card. */
  setCardDisplay(display) { this.general.cardDisplay = display; }
  /** Sets or returns the value of the volume.
   * @param  {number} [vol=null] - The value of the volume to change or null to return current value. */
  theVolume(vol=null) { if (vol) { this.alarms.volume = vol; this.update(false); } return this.alarms.volume; }
}