class PandaGOptions {
  constructor() {
    this.general = {
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
      alarmVolume:80,
      showAlertNotify:true,
      fastSearch:false,
      unfocusDeThrottle:false
     };
    this.alarmsLessThan2 = {filename:"sword-hit-01.mp3", payRate:"0.02", lessMinutes:99},
    this.alarmsLessThan2Short = {filename:"less2Short.mp3", payRate:"0.02", lessMinutes:2},
    this.alarmsLessThan5 = {filename:"lessthan5.mp3", payRate:"0.05", lessMinutes:99},
    this.alarmsLessThan5Short = {filename:"lessthan5short.mp3", payRate:"0.05", lessMinutes:5},
    this.alarmsLessThan15 = {filename:"lessthan15.mp3", payRate:"0.15", lessMinutes:99},
    this.alarmsLessThan15Short = {filename:"lessthan15Short.mp3", payRate:"0.15", lessMinutes:8},
    this.alarmsMoreThan15 = {filename:"higher-alarm.mp3", payRate:"0.15", lessMinutes:99},
    this.alarmsQueueFull = {filename:"Your queue is full - Paul.mp3", payRate:"", lessMinutes:99},
    this.alarmsQueueAlert = {filename:"Ship_Brass_Bell.mp3", payRate:"", lessMinutes:3},
    this.alarmsLoggedOut = {filename:"CrowCawSynthetic.wav", payRate:"", lessMinutes:99}
    this.captchaCounter = 0;
    this.lastQueueAlert = -1;
  }
  update() {
    if (this.general.showHelpTooltips) $(`[data-toggle="tooltip"]`).tooltip({delay: {show:1300}, trigger:'hover'}).tooltip('enable');
    else { $('[data-toggle="tooltip"]').tooltip('disable'); $(`.card`).find(`span[data-toggle="tooltip"], div[data-toggle="tooltip"]`).tooltip('enable'); }
   }
  showGeneralOptions() {
    const idName = panda.modal.prepareModal(this.general, "700px", "modal-header-info modal-lg", "General Options", "", "text-right bg-dark text-light", "modal-footer-info", "visible btn-sm", "Save General Options", (changes) => {
      this.general = Object.assign(this.general, changes);
      panda.modal.closeModal();
      this.update();
    });
    const modalBody = $(`#${idName} .${panda.modal.classModalBody}`);
    const divContainer = $(`<table class="table table-dark table-hover table-sm pcm_detailsTable table-bordered"></table>`).append($(`<tbody></tbody>`)).appendTo(modalBody); console.log(panda.modal.tempObject[idName]);
    displayObjectData([
      { label:"Show Help Tooltips:", type:"trueFalse", key:"showHelpTooltips", min:0, max:24 }, 
      { label:"Disable Captcha Alert:", type:"trueFalse", key:"disableCaptchaAlert", min:0, max:24 }, 
      { label:"Show Captcha Counter Text:", type:"trueFalse", key:"captchaCountText" }, 
      { label:"Captcha shown after #hits:", type:"text", key:"captchaAt" }, 
      { label:"Disable Queue Watch Color Alert:", type:"trueFalse", key:"disableQueueAlert" }, 
      { label:"Disable Queue Watch Alarm:", type:"trueFalse", key:"disableQueueAlarm" }, 
      { label:"Disable Desktop Notifications:", type:"trueFalse", key:"disableNotifications" }, 
      { label:"Show Unfocused window warning:", type:"trueFalse", key:"unfocusWarning" }
    ], divContainer, panda.modal.tempObject[idName], true);
    panda.modal.showModal();
   }
  showTimerOptions() {
    const idName = panda.modal.prepareModal(this.timers, "700px", "modal-header-info modal-lg", "General Options", "", "text-right bg-dark text-light", "modal-footer-info", "visible btn-sm", "Save General Options", (changes) => {
      this.timers = Object.assign(this.timers, changes);
      panda.modal.closeModal();
    });
    const modalBody = $(`#${idName} .${panda.modal.classModalBody}`);
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
    ], divContainer, panda.modal.tempObject[idName], true);
    panda.modal.showModal();
   }
  showAlarmOptions() {
    const idName = panda.modal.prepareModal(this.alarms, "700px", "modal-header-info modal-lg", "General Options", "", "text-right bg-dark text-light", "modal-footer-info", "visible btn-sm", "Save General Options", (changes) => {
      this.alarms = Object.assign(this.alarms, changes);
      panda.modal.closeModal();
    });
    const modalBody = $(`#${idName} .${panda.modal.classModalBody}`);
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
    ], divContainer, panda.modal.tempObject[idName], true);
    panda.modal.showModal();
   }
  updateCaptcha() {
    if (this.general.captchaCountText) {
      this.captchaCounter = (this.general.captchaAt>this.captchaCounter) ? this.captchaCounter + 1 : 0;
      return this.captchaCounter;
    } else return null;
  }
  resetCaptcha() { this.captchaCounter = 0; }
  checkQueueAlert(seconds) {
    let returnValue = false, saveMinutes = true;
    if (this.general.disableQueueAlarm && this.general.disableQueueAlert) return returnValue;
    const minutes = Math.trunc(seconds/60);
    if (this.alarmsQueueAlert.lessMinutes*60 > seconds) {
      if (this.lastQueueAlert===-1 || this.lastQueueAlert>minutes) { returnValue = true; }
      this.lastQueueAlert = minutes;
    } else this.lastQueueAlert = -1;
    return returnValue;
  }
  isQueueAlert() { return !this.general.disableQueueAlert; }
  isQueueAlarm() { return !this.general.disableQueueAlarm; }
  getTimer1() { return this.timers.mainTimer; }
  getTimer2() { return this.timers.secondTimer; }
  getTimer3() { return this.timers.thirdTimer; }
  getCaptchaCount() { return this.captchaCounter; }
}