/**
 * Class for the global options and functions to change them.
 * Breaks up the options into general, timers and alarms options.
 */
class PandaGOptions {
  constructor() {
    this.general = {
      category:"general",
      showHelpTooltips:true, // done
      disableCaptchaAlert:false,
      captchaCountText:true, // done
      captchaAt:35, // done
      disableQueueAlarm:false, // done
      disableQueueAlert:false, // done
      disableNotifications:false,
      unfocusWarning:true,
      themeName:"normal",
      debugger:0
    };
    this.timers = {
      category:"timers",
      mainTimer:1000,
      secondTimer:1400,
      thirdTimer:2100,
      hamTimer:900,
      hamDelayTimer:8,
      queueTimer:2000,
      timerIncrease:10,
      timerDecrease:10,
      timerAddMore:650,
      timerAutoIncrease:10,
      stopAutoSlow:false,
      autoSlowDown:false
    };
    this.alarms = {
      category:"alarms",
      volume:80,
      showAlertNotify:true,
      fastSearch:false,
      unfocusDeThrottle:false,
    };
    this.captchaCounter = 0;
    this.lastQueueAlert = -1;
  }
  /**
   * Load up global options from database or use and save default options into database.
   * Saves any errors from trying to add to database and then sends a reject.
   * Sends success array with messages and error object from any rejects to afterFunc.
   * @param {function} afterFunc    Function to call after done to send success array or error object.
   */
  async prepare(afterFunc) {
    let success = [], err = null;
    await bgPanda.db.getFromDB(bgPanda.optionsStore, null, true, (cursor) => { return cursor.value; })
    .then( async result => {
      if (result.length) { // Options were already saved in database so load and use them.
        for (var i=0, keys=Object.keys(result); i < keys.length; i++) {
          if (['general','timers','alarms'].includes(result[i].category)) this[result[i].category] = result[i];
        }
        success[0] = "Loaded all global options from database";
      } else { // Add default values to the options database and use them.
        await bgPanda.db.addToDB(bgPanda.optionsStore, this.general)
        .then( async () => { await bgPanda.db.addToDB(bgPanda.optionsStore, this.timers)
          .then( async () => { await bgPanda.db.addToDB(bgPanda.optionsStore, this.alarms)
            .then( () => success[0] = "Added default global options to database.", rejected => err = rejected );
          }, rejected => { err = rejected; })
        }, rejected => err = rejected);
      }
    }, rejected => err = rejected);
    afterFunc.call(this, success, err); // Sends good Messages or any errors in the after function for processing.
  }
  /**
   */
  update() {
    if (this.general.showHelpTooltips) $(`[data-toggle="tooltip"]`).tooltip({delay: {show:1300}, trigger:'hover'}).tooltip('enable');
    else { $('[data-toggle="tooltip"]').tooltip('disable'); $(`.card`).find(`span[data-toggle="tooltip"], div[data-toggle="tooltip"]`).tooltip('enable'); }
   }
  /**
   */
  showGeneralOptions() {
    const idName = modal.prepareModal(this.general, "700px", "modal-header-info modal-lg", "General Options", "", "text-right bg-dark text-light", "modal-footer-info", "visible btn-sm", "Save General Options", (changes) => {
      this.general = Object.assign(this.general, changes);
      modal.closeModal();
      this.update();
    });
    const modalBody = $(`#${idName} .${modal.classModalBody}`);
    const divContainer = $(`<table class="table table-dark table-hover table-sm pcm_detailsTable table-bordered"></table>`).append($(`<tbody></tbody>`)).appendTo(modalBody); console.log(modal.tempObject[idName]);
    displayObjectData([
      { label:"Show Help Tooltips:", type:"trueFalse", key:"showHelpTooltips", min:0, max:24 }, 
      { label:"Disable Captcha Alert:", type:"trueFalse", key:"disableCaptchaAlert", min:0, max:24 }, 
      { label:"Show Captcha Counter Text:", type:"trueFalse", key:"captchaCountText" }, 
      { label:"Captcha shown after #hits:", type:"text", key:"captchaAt" }, 
      { label:"Disable Queue Watch Color Alert:", type:"trueFalse", key:"disableQueueAlert" }, 
      { label:"Disable Queue Watch Alarm:", type:"trueFalse", key:"disableQueueAlarm" }, 
      { label:"Disable Desktop Notifications:", type:"trueFalse", key:"disableNotifications" }, 
      { label:"Show Unfocused window warning:", type:"trueFalse", key:"unfocusWarning" }
    ], divContainer, modal.tempObject[idName], true);
    modal.showModal();
   }
  /**
   */
  showTimerOptions() {
    const idName = modal.prepareModal(this.timers, "700px", "modal-header-info modal-lg", "General Options", "", "text-right bg-dark text-light", "modal-footer-info", "visible btn-sm", "Save General Options", (changes) => {
      this.timers = Object.assign(this.timers, changes);
      modal.closeModal();
    });
    const modalBody = $(`#${idName} .${modal.classModalBody}`);
    const divContainer = $(`<table class="table table-dark table-hover table-sm pcm_detailsTable table-bordered"></table>`).append($(`<tbody></tbody>`)).appendTo(modalBody);
    displayObjectData([
      { label:"Main Timer:", type:"text", key:"mainTimer" }, 
      { label:"Timer #2:", type:"text", key:"secondTimer" }, 
      { label:"Timer #3:", type:"text", key:"thirdTimer" }, 
      { label:"GoHam Timer:", type:"text", key:"hamTimer" }, 
      { label:"Default GoHam Timer Delay:", type:"text", key:"hamDelayTimer" }, 
      { label:"Check Queue Every:", type:"text", key:"queueTimer" }, 
      { label:"Timer Increase By:", type:"text", key:"timerIncrease" },
      { label:"Timer Decrease By:", type:"text", key:"timerDecrease" },
      { label:"Timer Add Timer By:", type:"text", key:"timerAddMore" },
      { label:"Timer Auto Slowdown Increase:", type:"text", key:"timerAutoIncrease" }
    ], divContainer, modal.tempObject[idName], true);
    modal.showModal();
   }
  /**
   */
  showAlarmOptions() {
    const idName = modal.prepareModal(this.alarms, "700px", "modal-header-info modal-lg", "General Options", "", "text-right bg-dark text-light", "modal-footer-info", "visible btn-sm", "Save General Options", (changes) => {
      this.alarms = Object.assign(this.alarms, changes);
      modal.closeModal();
    });
    const modalBody = $(`#${idName} .${modal.classModalBody}`);
    const divContainer = $(`<table class="table table-dark table-hover table-sm pcm_detailsTable table-bordered"></table>`).append($(`<tbody></tbody>`)).appendTo(modalBody);
    displayObjectData([
      { label:"Show Help Tooltips:", type:"range", key:"limitNumQueue", min:0, max:24 }, 
      { label:"Disable Captcha Alert:", type:"range", key:"limitTotalQueue", min:0, max:24 }, 
      { label:"Show Captcha Counter Text:", type:"trueFalse", key:"once" }, 
      { label:"Captcha shown after #hits:", type:"text", key:"acceptLimit" }, 
      { label:"Disable Queue Watch Alarm:", type:"text", key:"duration" }, 
      { label:"Disable Queue Watch Alert:", type:"text", key:"duration" }, 
      { label:"Disable Dekstop Notifications:", type:"trueFalse", key:"autoGoHam" }, 
      { label:"Show Unfocused window warning:", type:"text", key:"hamDuration" }
    ], divContainer, modal.tempObject[idName], true);
    modal.showModal();
   }
  /**
   */
  updateCaptcha() {
    if (this.general.captchaCountText) {
      this.captchaCounter = (this.general.captchaAt>this.captchaCounter) ? this.captchaCounter + 1 : 0;
      return this.captchaCounter;
    } else return null;
  }
  /**
   */
  resetCaptcha() { this.captchaCounter = 0; }
  /**
   * @param  {number} seconds
   */
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
  /**
   */
  isQueueAlert() { return !this.general.disableQueueAlert; }
  /**
   */
  isQueueAlarm() { return !this.general.disableQueueAlarm; }
  /**
   */
  getTimer1() { return this.timers.mainTimer; }
  /**
   */
  getTimer2() { return this.timers.secondTimer; }
  /**
   */
  getTimer3() { return this.timers.thirdTimer; }
  /**
   */
  getCaptchaCount() { return this.captchaCounter; }
}