/**
 * Class for the global options and methods to change them.
 * Breaks up the options into general, timers and alarm options.
 * @class PandaGOptions
 * @author JohnnyRS - johnnyrs@allbyjohn.com
 */
class PandaGOptions {
  constructor() {
    this.general = {};
    this.generalDefault = {
      category:"general",         // Object category used for database saving and loading.
      showHelpTooltips:true,      // Should help tooltips be shown or just info tips?
      disableCaptchaAlert:false,  // Should captcha alerts and notifications be disabled?
      captchaCountText:true,      // Should the captcha count text be shown on the lower log tabbed section?
      captchaAt:35,               // Number of hits collected usually before a captcha is shown.
      disableQueueAlarm:false,    // Should the alarm not be sounded when a hit is nearing expiration?
      disableQueueAlert:false,    // Should the alert color not be shown in queue watch when a hit is near expiration?
      disableNotifications:false, // Should notifications not be shown?
      unfocusWarning:true,        // Should the warning about unfocussed window be shown?
      themeName:"normal",         // The theme name being used.
      cardDisplay:2,              // 2 = Normal look, 1 = Minimal Info, 0 = One Liner
      debugger:0                  // Main debugger level.
    };
    this.timers = {};
    this.timersDefault = {
      category:"timers",          // Object category used for database saving and loading.
      mainTimer:1000,             // The time for the main timer.
      secondTimer:1400,           // The time for the second timer.
      thirdTimer:2100,            // The time for the third timer.
      hamTimer:900,               // The time for the ham timer.
      hamDelayTimer:8,            // The duration timer for goHam on any new hits.
      queueTimer:2000,            // The time for the queue Timer.
      timerIncrease:10,
      timerDecrease:10,
      timerAddMore:650,
      timerAutoIncrease:10,
      stopAutoSlow:false,
      autoSlowDown:false,
    };
    this.timerRange = {min:600, max:15000};
    this.timerDur = {min:0, max:600}
    this.timerQueue = {min:1000, max:60000};
    this.timerChange = {min:5, max:2000};
    this.alarms = {};
    this.alarmsDefault = {
      category:"alarms",
      volume:80,
      showAlertNotify:true,
      fastSearch:false,
      unfocusDeThrottle:false,
    };
    this.captchaCounter = 0;
    this.lastQueueAlert = -1;
    this.timerUsed = 'mainTimer';
  }
  /**
   * Load up global options from database or use and save default options into database.
   * Saves any errors from trying to add to database and then sends a reject.
   * Sends success array with messages and error object from any rejects to afterFunc.
   * @async                      - To wait for the options data to be loaded from the database.
   * @param {function} afterFunc - Function to call after done to send success array or error object.
   */
  async prepare(afterFunc) {
    let success = [], err = null;
    await bgPanda.db.getFromDB(bgPanda.optionsStore, null, true, (cursor) => { return cursor.value; })
    .then( async result => {
      if (result.length) { // Options were already saved in database so load and use them.
        for (var i=0, keys=Object.keys(result); i < keys.length; i++) {
          let thisSaved = {};
          if (['general','timers','alarms'].includes(result[i].category)) {
            thisSaved = result[i];
            this[result[i].category] = Object.assign({}, this[result[i].category + 'Default'], result[i]);
          }
        }
        success[0] = "Loaded all global options from database";
      } else { // Add default values to the options database and use them.
        await bgPanda.db.addToDB(bgPanda.optionsStore, this.generalDefault)
        .then( async () => { await bgPanda.db.addToDB(bgPanda.optionsStore, this.timersDefault)
          .then( async () => { await bgPanda.db.addToDB(bgPanda.optionsStore, this.alarmsDefault)
            .then( () => success[0] = "Added default global options to database.", rejected => err = rejected );
          }, rejected => { err = rejected; })
        }, rejected => err = rejected);
        this.general = Object.assign({}, this.generalDefault);
        this.timers = Object.assign({}, this.timersDefault);
        this.alarms = Object.assign({}, this.alarmsDefault);
      }
    }, rejected => err = rejected);
    delete this.generalDefault; delete this.timersDefault; delete this.alarmsDefault;
    afterFunc(success, err); // Sends good Messages or any errors in the after function for processing.
  }
  /** Updates the global options and resets anything that is needed for example tooltips. */
  update() {
    if (this.general.showHelpTooltips) $(`[data-toggle="tooltip"]`).tooltip({delay: {show:1300}, trigger:'hover'}).tooltip('enable');
    else {
      $('[data-toggle="tooltip"]').tooltip('disable');
      $(`.card`).find(`span[data-toggle="tooltip"], div[data-toggle="tooltip"]`).tooltip('enable');
    }
    pandaUI.logTabs.updateCaptcha(this.getCaptchaCount());
    bgPanda.db.updateDB(bgPanda.optionsStore, this.general);
    bgPanda.db.updateDB(bgPanda.optionsStore, this.timers);
    bgPanda.db.updateDB(bgPanda.optionsStore, this.alarms);
  }
  /**
   * Shows the general options in a modal for changes.
   */
  showGeneralOptions() {
    const idName = modal.prepareModal(this.general, "700px", "modal-header-info modal-lg", "General Options", "", "text-right bg-dark text-light", "modal-footer-info", "visible btn-sm", "Save General Options", (changes) => {
      this.general = Object.assign(this.general, changes);
      modal.closeModal();
      this.update();
    });
    const modalBody = $(`#${idName} .${modal.classModalBody}`);
    const divContainer = $(`<table class="table table-dark table-hover table-sm pcm_detailsTable table-bordered"></table>`).append($(`<tbody></tbody>`)).appendTo(modalBody);
    displayObjectData([
      {label:"Show Help Tooltips:", type:"trueFalse", key:"showHelpTooltips", min:0, max:24, tooltip:'Should help tooltips be shown for buttons and options? What you are reading is a tooltip.'}, 
      {label:"Disable Captcha Alert:", type:"trueFalse", key:"disableCaptchaAlert", min:0, max:24, tooltip:'Disable the captcha alert and notification. Disable this if you are a master or using another script for captchas.'}, 
      {label:"Show Captcha Counter Text:", type:"trueFalse", key:"captchaCountText", tooltip:'Should the captcha count be shown on the bottom log tabbed area? Disable this if you are a master.'}, 
      {label:"Captcha shown after #hits:", type:"text", key:"captchaAt", tooltip:'How many hits on average will mturk show a captcha for you?'}, 
      {label:"Disable Queue Watch Color Alert:", type:"trueFalse", key:"disableQueueAlert", tooltip:'Disable the color alert in the queue watch area for hits nearing the expiration time.'}, 
      {label:"Disable Queue Watch Alarm:", type:"trueFalse", key:"disableQueueAlarm", tooltip:'Disable sounding the alarm for hits nearing the expiration time.'}, 
      {label:"Disable Desktop Notifications:", type:"trueFalse", key:"disableNotifications", tooltip:'Disable notifications shown when accepting hits or warnings.'}, 
      {label:"Disable Unfocused window warning:", type:"trueFalse", key:"unfocusWarning", reverse:true, tooltip:'Stop notifying me about the unfocussed window because I know what I am doing.'}
    ], divContainer, modal.tempObject[idName], true);
    $(modalBody).find('[data-toggle="tooltip"]').tooltip({delay: {show:1200}, trigger:'hover'});
    modal.showModal();
  }
  timerConfirm(v) {
    let foundError = false;
    for (const key of Object.keys(this.timers)) {
      let element = $(`#pcm_tdLabel_${key}`);
      if (element.length) {
        let range = element.data('range');
        if (v[key] < range.min || v[key] > range.max) {
          $(`#pcm_tdLabel_${key}`).css('color', 'red'); foundError = true;
        }
      }
    }
    return foundError;
  }
  /** Shows the timer options in a modal for changes. */
  showTimerOptions() {
    const idName = modal.prepareModal(this.timers, "700px", "modal-header-info modal-lg", "Timer Options", "", "text-right bg-dark text-light", "modal-footer-info", "visible btn-sm", "Save Timer Options", (changes) => {
      let errorFound = this.timerConfirm(changes); console.log(errorFound,JSON.stringify(changes));
      if (!errorFound) {
        this.timers = Object.assign(this.timers, changes);
        bgPanda.timerChange(this.timers[this.timerUsed]);
        bgPanda.hamTimerChange(this.timers.hamTimer);
        bgPanda.queueTimerChange(this.timers.queueTimer);
        menus.updateTimerMenu(this.timers.timerIncrease, this.timers.timerDecrease, this.timers.timerAddMore);
        modal.closeModal();
      }
    });
    const modalBody = $(`#${idName} .${modal.classModalBody}`);
    const divContainer = $(`<table class="table table-dark table-hover table-sm pcm_detailsTable table-bordered"></table>`).append($(`<tbody></tbody>`)).appendTo(modalBody);
    displayObjectData([
      {label:'Main Timer:', type:'number', key:'mainTimer', tooltip:`Change the main timer duration in milliseconds. Minimum is ${this.timerRange.min}.`, data:this.timerRange}, 
      {label:"Timer #2:", type:'number', key:"secondTimer", tooltip:`Change the second timer duration in milliseconds. Minimum is ${this.timerRange.min}.`, data:this.timerRange}, 
      {label:"Timer #3:", type:"number", key:"thirdTimer", tooltip:`Change the third timer duration in milliseconds. Minimum is ${this.timerRange.min}.`, data:this.timerRange}, 
      {label:"GoHam Timer:", type:"number", key:"hamTimer", tooltip:`Change the go ham timer duration in milliseconds. Minimum is ${this.timerRange.min}.`, data:this.timerRange}, 
      {label:"Default GoHam Timer Delay:", type:"number", key:"hamDelayTimer", tooltip:'Change the default duration for jobs going into ham automatically by delay.', data:this.timerDur}, 
      {label:"Check Queue Every:", type:"number", key:"queueTimer", tooltip:'Change the timer duration for the mturk queue to be checked and updated in milliseconds. Higher amount may lower data use.', data:this.timerQueue}, 
      {label:"Timer Increase By:", type:"number", key:"timerIncrease", tooltip:'Change the value in milliseconds on the increase menu button to increase the current timer by.', data:this.timerChange},
      {label:"Timer Decrease By:", type:"number", key:"timerDecrease", tooltip:'Change the value in milliseconds on the decrease menu button to decrease the current timer by.', data:this.timerChange},
      {label:"Timer Add Timer By:", type:"number", key:"timerAddMore", tooltip:'Change the value in milliseconds on the add more time menu button to increase the current timer by.', data:this.timerChange},
      {label:"Timer Auto Slowdown Increase:", type:"number", key:"timerAutoIncrease", tooltip:'', data:this.timerChange}
    ], divContainer, modal.tempObject[idName], true);
    modal.showModal();
    modalBody.find('[data-toggle="tooltip"]').tooltip({delay: {show:1200}, trigger:'hover'});
  }
  /** Shows the alarm options in a modal for changes. */
  showAlarmOptions() {
    const idName = modal.prepareModal(this.alarms, "700px", "modal-header-info modal-lg", "General Options", "", "text-right bg-dark text-light", "modal-footer-info", "visible btn-sm", "Save General Options", (changes) => {
      this.alarms = Object.assign(this.alarms, changes);
      modal.closeModal();
    });
    const modalBody = $(`#${idName} .${modal.classModalBody}`);
    const divContainer = $(`<table class="table table-dark table-hover table-sm pcm_detailsTable table-bordered"></table>`).append($(`<tbody></tbody>`)).appendTo(modalBody);
    displayObjectData([
      { label:"Show Help Tooltips:", type:"range", key:"limitNumQueue", min:0, max:24 }
    ], divContainer, modal.tempObject[idName], true);
    modal.showModal();
  }
  /** Updates the captcha text area with updated info.
   * @return {number} - Returns the value in the captcha counter. */
  updateCaptcha() {
    this.captchaCounter = (this.general.captchaAt>this.captchaCounter) ? this.captchaCounter + 1 : 0;
    return this.captchaCounter;
  }
  /**
   * Resets the captcha counter back down to 0.
   */
  resetCaptcha() { this.captchaCounter = 0; }
  /** Checks to see if it's ok to sound the queue alarm or not.
   * @param  {number} seconds - The lowest seconds on the queue to check if alarm is needed.
   * @return {bool}           - True if the queue alert should be sounded. */
  checkQueueAlert(seconds) {
    let returnValue = false, saveMinutes = true;
    if (this.general.disableQueueAlarm && this.general.disableQueueAlert) return returnValue;
    const minutes = Math.trunc(seconds/60);
    if (alarms.data.queueAlert.lessThan*60 > seconds) {
      if (this.lastQueueAlert===-1 || this.lastQueueAlert>minutes) { returnValue = true; }
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
}