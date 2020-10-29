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
      'toSearchUI':false,           // Should search jobs go directly to search UI?
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
    this.timerHamDur = {min:1000, max:30000}  // The limits for the ham duration in milliseconds.
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
    this.search = {}
    this.searchDefault = {
      'category':'search',
      'pageSize':45,
      'queueSize':30,
      'defaultDur':18000,
      'defaultFetches':0,
      'defaultHamDur':6000,
      'defaultCustDur':0,
      'defaultCustFetches':120,
      'defaultCustHamDur':10000,
      'customHistDays':10,
      'triggerHistDays':45,
      'blockedGids':[],
    }
    this.captchaCounter = 0;
    this.lastQueueAlert = -1;
    this.timerUsed = 'mainTimer';
  }
  doChanges(optionName, changes, update=true) { this[optionName] = changes; if (update) this.update(false); }
  doTimers(changes=null, update=true) { if (changes) this.doChanges('timers', changes, update); else return this.timers; }
  doGeneral(changes=null, update=true) { if (changes) this.doChanges('general', changes, update); else return this.general; }
  doSearch(changes=null, update=true) { if (changes) this.doChanges('search', changes, update); else return this.search; }
  getTimerRange() { return this.timerRange; }
  getTimerHamRange() { return this.timerHamDur; }
  getTimerSearch() { return this.timerSearch; }
  getTimerQueue() { return this.timerQueue; }
  getTimerChange() { return this.timerChange; }
  /** Load up global options from database or use and save default options into database.
   * @async                      - To wait for the options data to be loaded from the database.
   * @param {function} afterFunc - Function to call after done to send success array or error object. */
  async prepare(afterFunc) {
    let success = [], err = null;
    this.captchaCounter = 0; this.lastQueueAlert = -1; this.timerUsed = 'mainTimer';
    await MYDB.getFromDB('panda', 'options').then( async result => {
      if (result.length) { // Options were already saved in database so load and use them.
        for (const cat of ['general', 'timers', 'alarms', 'helpers', 'search']) {
          let count = arrayCount(result, (item) => { if (item.category === cat) { this[cat] = Object.assign({}, this[cat + 'Default'], item); return true; } else return false; }, true);
          if (count === 0) { await MYDB.addToDB('panda', 'options', this[cat + 'Default']).then( () => { this[cat] = Object.assign({}, this[cat + 'Default']); }); }
        }
        if (this.timers.searchDuration < 1000) { this.timers.searchDuration = this.timersDefault.searchDuration; this.update(); }
        success[0] = "Loaded all global options from database";
      } else { // Add default values to the options database and use them.
        await MYDB.addToDB('panda', 'options', this.generalDefault)
        .then( async () => { await MYDB.addToDB('panda', 'options', this.timersDefault)
          .then( async () => { await MYDB.addToDB('panda', 'options', this.alarmsDefault)
            .then( async () => { await MYDB.addToDB('panda', 'options', this.helpersDefault)
              .then( async () => { await MYDB.addToDB('panda', 'options', this.searchDefault)
                .then( () => success[0] = "Added default global options to database.", rejected => err = rejected );
              }, rejected => { err = rejected; })
            }, rejected => { err = rejected; })
          }, rejected => { err = rejected; })
        }, rejected => err = rejected);
        this.general = Object.assign({}, this.generalDefault); this.timers = Object.assign({}, this.timersDefault);
        this.alarms = Object.assign({}, this.alarmsDefault); this.helpers = Object.assign({}, this.helpersDefault);
        this.search = Object.assign({}, this.searchDefault);
      }
    }, rejected => err = rejected);
    if (afterFunc) afterFunc(success, err); // Sends good Messages or any errors in the after function for processing.
  }
  /** Removes data from memory so it's ready for closing or importing. */
  removeAll() { this.general = {}; this.timers = {}; this.alarms = {}; this.helpers = {}; this.search = {}; }
  /** Import the options from an exported file.
   * @param  {object} newData - Data with the imported objects. */
  importOptions(newData) {
    newData.timers.timerUsed = this.timers.timerUsed; this.general = newData.general; this.timers = newData.timers; this.alarms = newData.alarms;
    this.update(true);
  }
  /** Returns an array of options for easy exporting.
   * @return {array} - The array of objects to be exported. */
  exportOptions() { return [this.general, this.timers, this.alarms, this.helpers, this.search]; }
  /** Updates the global options and resets anything that is needed for example tooltips.
   * @param  {bool} [tooltips=true] - Should tooltips be reset? */
  update(tooltips=true) {
    if (tooltips) {
      // if (this.general.showHelpTooltips) $(`[data-toggle="tooltip"]`).tooltip('enable');
      // else {
        // $('[data-toggle="tooltip"]').tooltip('disable');
        // $(`.card`).find(`span[data-toggle="tooltip"], div[data-toggle="tooltip"]`).tooltip('enable');
      // }
    }
    if (myPanda.logTabs) myPanda.logTabs.updateCaptcha(this.getCaptchaCount());
    MYDB.addToDB('panda', 'options', this.general); MYDB.addToDB('panda', 'options', this.timers); MYDB.addToDB('panda', 'options', this.alarms);
    MYDB.addToDB('panda', 'options', this.helpers); MYDB.addToDB('panda', 'options', this.search);
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
    let returnValue = false, minutes = Math.trunc(seconds/60);
    if (this.general.disableQueueAlarm && this.general.disableQueueAlert) return returnValue;
    if (MyAlarms.getData('queueAlert').lessThan * 60 > seconds) {
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
  theToSearchUI(value=null, update=true) { if (value !== null) { this.general.toSearchUI = value; if (update) this.update(false); } return this.general.toSearchUI; }
  theSearchTimer(value=null, update=true) { if (value !== null) { this.timers.searchTimer = value; if (update) this.update(false); } return this.timers.searchTimer; }
  getQueueTimer() { return this.timers.queueTimer; }
  /** Change the display number used to display information in the panda cards.
   * @param  {number} display - The number for the display format to use for information in the panda card. */
  setCardDisplay(display) { this.general.cardDisplay = display; }
  /** Sets or returns the value of the volume.
   * @param  {number} [vol=null] - The value of the volume to change or null to return current value. */
  theVolume(vol=null) { if (vol) { this.alarms.volume = vol; this.update(false); } return this.alarms.volume; }
}