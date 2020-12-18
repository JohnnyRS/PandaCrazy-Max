/** Class for the global options and methods to change them. Breaks up the options into general, timers and alarm options.
 * @class PandaGOptions ##
 * @author JohnnyRS - johnnyrs@allbyjohn.com */
class PandaGOptions {
  constructor() {
    this.general = {};              // The general object used in script from database or default values.
    this.generalDefault = {         // Default values used at first run or default buttons.
      'category':'general',         // Object category used for database saving and loading.
      'showHelpTooltips':true,      // Should help tooltips be shown or just info tips?
      'disableCaptchaAlert':false,  // Should captcha alerts and notifications be disabled?
      'captchaCountText':true,      // Should the captcha count text be shown on the lower log tabbed section?
      'captchaAt':35,               // Number of HITs collected usually before a captcha is shown.
      'disableQueueAlarm':false,    // Should the alarm not be sounded when a HIT is nearing expiration?
      'disableQueueAlert':false,    // Should the alert color not be shown in queue watch when a HIT is near expiration?
      'disableNotifications':false, // Should notifications not be shown?
      'unfocusWarning':true,        // Should the warning about unfocussed window be shown?
      'themeName':'normal',         // The theme name being used.
      'cardDisplay':2,              // 2 = Normal look, 1 = Minimal Info, 0 = One Liner card display.
      'logPanelHeight':0,           // The height of the bottom log panel if user resizes it.
      'toSearchUI':false,           // Should search jobs go directly to search UI?
      'fetchHighlight':true,        // Highlight the groupID when script tries to fetch it.
      'debugger':0,                 // Main debugger level.
      'volHorizontal':false,
      'tabLogHeight':0,
      'themeIndex':0,
      'theme0': '',
      'theme1': '',
      'theme2': '',
      'theme3': '',
    };
    this.timers = {};               // The timers object used in script from database or default values.
    this.timersDefault = {          // Default values used at first run or default buttons.
      'category':'timers',          // Object category used for database saving and loading.
      'mainTimer':1000,             // The time for the main timer.
      'secondTimer':1400,           // The time for the second timer.
      'thirdTimer':2100,            // The time for the third timer.
      'hamTimer':900,               // The time for the ham timer.
      'hamDelayTimer':6000,         // The duration timer for goHam on any new HITs.
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
    this.timerRange = {'min':750, 'max':15000};   // The limits for the timer in milliseconds when editing.
    this.timerHamDur = {'min':1000, 'max':30000}  // The limits for the ham duration in milliseconds.
    this.timerQueue = {'min':1000, 'max':60000};  // The limits for the timer queue in milliseconds when editing.
    this.timerSearch = {'min':800, 'max':30000};  // The limits for the timer queue in milliseconds when editing.
    this.timerChange = {'min':5, 'max':2000};     // The limits for the timer change buttons in milliseconds when editing.
    this.alarms = {};
    this.alarmsDefault = {
      'category':'alarms',
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
      'tabUniqueHits':true,
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
      'blockedGids':'',
      'blockedRids':'',
    }
    this.sessionQueue = {};
    this.captchaCounter = 0;
    this.lastQueueAlert = -1;
    this.timerUsed = 'mainTimer';
  }
  /** Changes the option with the option name and changes object. Will update database if update is true.
   * @param {string} optionName - Option Name  @param {object} changes - Object Changes  @param {bool} [update] - Update Database? */
  doChanges(optionName, changes, update=true) { this[optionName] = changes; if (update) this.update(false); }
  /** Changes the timers options with the changes object and updates database if update is true.
   * @param  {object} changes - Object Changes  @param {bool} [update] - Update Database?
   * @return {object}         - Timers Options Object */
  doTimers(changes=null, update=true) { if (changes) this.doChanges('timers', changes, update); else return this.timers; }
  /** Changes the general options with the changes object and updates database if update is true.
   * @param {object} changes - Object Changes  @param {bool} [update] - Update Database? 
   * @return {object}        - General Options Object */
 doGeneral(changes=null, update=true) { if (changes) this.doChanges('general', changes, update); else return this.general; }
  /** Changes the search options with the changes object and updates database if update is true.
   * @param {object} changes - Object Changes  @param {bool} [update] - Update Database? 
   * @return {object}        - Search Options Object */
 doSearch(changes=null, update=true) { if (changes) this.doChanges('search', changes, update); else return this.search; }
  /** Returns the timer range object.
   * @return  {object} - Returns Timer Range */
  getTimerRange() { return this.timerRange; }
  /** Returns the timer ham range object.
   * @return  {object} - Returns Timer Ham Range */
  getTimerHamRange() { return this.timerHamDur; }
  /** Returns the search timer range.
   * @return  {object} - Returns Search Timer Range */
  getTimerSearch() { return this.timerSearch; }
  /** Returns the queue timer range.
   * @return  {object} - Returns Queue Timer Range */
  getTimerQueue() { return this.timerQueue; }
  /** Returns the timer change range.
   * @return  {object} - Returns Timer Change Range */
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
          let count = arrayCount(result, item => { if (item.category === cat) { this[cat] = Object.assign({}, this[cat + 'Default'], item); return true; } else return false; }, true);
          if (Array.isArray(this.search.blockedGids)) { this.search.blockedGids = ''; await MYDB.addToDB('panda', 'options', this.search); }
          if (count === 0) { await MYDB.addToDB('panda', 'options', this[cat + 'Default']).then( () => { this[cat] = Object.assign({}, this[cat + 'Default']); }); }
        }
        if (this.timers.searchDuration < 1000) { this.timers.searchDuration = this.timersDefault.searchDuration; this.update(); }
        success[0] = 'Loaded all global options from database';
      } else { // Add default values to the options database and use them.
        await MYDB.addToDB('panda', 'options', this.generalDefault)
        .then( async () => { await MYDB.addToDB('panda', 'options', this.timersDefault)
          .then( async () => { await MYDB.addToDB('panda', 'options', this.alarmsDefault)
            .then( async () => { await MYDB.addToDB('panda', 'options', this.helpersDefault)
              .then( async () => { await MYDB.addToDB('panda', 'options', this.searchDefault)
                .then( () => success[0] = 'Added default global options to database.', rejected => err = rejected );
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
  /** Updates the global options and resets anything that is needed. */
  update() {
    if (myPanda.logTabs) myPanda.logTabs.updateCaptcha(this.getCaptchaCount());
    MYDB.addToDB('panda', 'options', this.general); MYDB.addToDB('panda', 'options', this.timers); MYDB.addToDB('panda', 'options', this.alarms);
    MYDB.addToDB('panda', 'options', this.helpers); MYDB.addToDB('panda', 'options', this.search);
  }
  /** Updates the captcha text area with updated info.
   * @return {number} - Returns the value in the captcha counter. */
  updateCaptcha() { this.captchaCounter = (this.general.captchaAt > this.captchaCounter) ? this.captchaCounter + 1 : 0; return this.captchaCounter; }
  /** Resets the captcha counter back down to 0. */
  resetCaptcha() { this.captchaCounter = 0; }
  /** Resets any tooltip helpers that should be disabled if helptooltips option is disabled or shown if enabled. */
  resetToolTips() { if (extPandaUI) extPandaUI.resetToolTips(this.general.showHelpTooltips);  }
  /** Checks to see if it's OK to sound the queue alarm or not.
   * @param  {number} seconds - The lowest seconds on the queue to check if alarm is needed.
   * @return {bool}           - True if the queue alert should be sounded. */
  checkQueueAlert(seconds) {
    let returnValue = false, minutes = Math.trunc(seconds/60), queueAlert = MyAlarms.getData('queueAlert');
    if (this.general.disableQueueAlarm && this.general.disableQueueAlert) return returnValue;
    if (!queueAlert) return returnValue;
    if (queueAlert.lessThan * 60 > seconds) {
      if (this.lastQueueAlert === -1 || this.lastQueueAlert > minutes) { returnValue = true; }
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
  /** Change timer to use the main timer and return that value.
   * @return {number} - Returns the value for the main timer. */
  useTimer1() { this.timerUsed = 'mainTimer'; return this.timers.mainTimer; }
  /** Change timer to use the second timer and return that value.
   * @return {number} - Returns the value for the second timer. */
  useTimer2() { this.timerUsed = 'secondTimer'; return this.timers.secondTimer; }
  /** Change timer to use the third timer and return that value.
   * @return {number} - Returns the value for the third timer. */
  useTimer3() { this.timerUsed = 'thirdTimer'; return this.timers.thirdTimer; }
  /** Return the current timer value.
   * @return {number} - Returns the value for the current timer. */
  getCurrentTimer() { return this.timers[this.timerUsed]; }
  /** Get the ham delay time to use for new HITs when goHam gets turned on.
   * @return {number} - Returns the value for the ham delay timer. */
  getHamDelayTimer() { return this.timers.hamDelayTimer; }
  /** Get the search duration time to use for new HITs when it starts to collect before searching.
   * @return  {number} - Returns the searchDuration timer option. */
  theSearchDuration(val) { if (val) { this.timers.searchDuration = val; this.update(false); } return this.timers.searchDuration; }
  /** Get the timer increase value for increase timer button.
   * @return {number} - Returns the number for the timer increase value. */
  getTimerIncrease() { return this.timers.timerIncrease; }
  /** Get the timer decrease value for decrease timer button.
   * @return {number} - Returns the number for the timer decrease value. */
  getTimerDecrease() { return this.timers.timerDecrease; }
  /** Get the timer add more value for add more time to timer button.
   * @return {number} - Returns the number for the timer add more value. */
  getTimerAddMore() { return this.timers.timerAddMore; }
  /** Gets the captcha counter.
   * @return {number} - Returns the number for the captcha counter. */
  getCaptchaCount() { return this.captchaCounter; }
  /** Gets the panda card display format
   * @return {number} - Returns the number for the display format to show card information. */
  getCardDisplay() { return this.general.cardDisplay; }
  /** Sets or gets the value for the to SearchUI option value.
   * @param  {bool} [value] - Searches to SearchUI?  @param {bool} [update] - Save to Database?
   * @return {bool}       - Returns the value for the to SearchUI option value. */
  theToSearchUI(value=null, update=true) { if (value !== null) { this.general.toSearchUI = value; if (update) this.update(false); } return this.general.toSearchUI; }
  /** Sets or gets the value for the search timer value.
   * @param  {number} [value] - Search Timer Value  @param {bool} [update] - Save to Database?
   * @return {number}       - Returns the value for the search timer. */
  theSearchTimer(value=null, update=true) { if (value !== null) { this.timers.searchTimer = value; if (update) this.update(false); } return this.timers.searchTimer; }
  /** Gets the queue timer value.
   * @return {number} - Returns the queue timer. */
  getQueueTimer() { return this.timers.queueTimer; }
  /** Change the display number used to display information in the panda cards.
   * @param  {number} display - The number for the display format to use for information in the panda card. */
  setCardDisplay(display) { this.general.cardDisplay = display; }
  /** Sets or Gets the value of the volume.
   * @param  {number} [vol] - The value of the volume to change or null to return current value.
   * @return {number}       - Returns the value of the volume. */
  theVolume(vol=null) { if (vol) { this.alarms.volume = vol; this.update(false); } return this.alarms.volume; }
  /** Sets or Gets the value of the volume direction.
   * @param  {bool} [vol] - The value of the volume direction to change or null to return current value.
   * @return {bool}       - Returns the value of the volume direction.  */
  theVolDir(vol=null) { if (vol) { this.general.volHorizontal = vol; this.update(false); } return this.general.volHorizontal; }
  /** Changes the value of tabLogHeight of general options or will return the tabLogHeight value if value equals null.
   * @param  {number} [value] - Height Value
   * @return {number}       - Returns tabLogHeight value. */
  theTabLogHeight(value=null) { if (value !== null) { this.general.tabLogHeight = value; this.update(false); } else return this.general.tabLogHeight; }
  /** Changes the theme index to the value given or returns the current theme index.
   * @param  {number} [value] - Theme Index Value
   * @return {string}       - Current Theme Index */
  theThemeIndex(value=null) { if (value !== null) { this.general.themeIndex = value; this.update(false); } else return this.general.themeIndex; }
  /** Changes the CSS theme string for given index or the current theme string if index is null. Returns the theme string for given index or the current theme string if index is null.
   * @param  {number} [index] - Theme Index Value  @param  {string} [cssTheme] - Theme CSS Value
   * @return {string}         - Returns current theme string. */
  theThemes(index=null, cssTheme=null) {
    if (index !== null && (index < 0 || index > 3)) return null;
    let thisIndex = (index === null) ? this.general.themeIndex : index, thisTheme = `theme${thisIndex}`;
    if (cssTheme !== null) { this.general[thisTheme] = cssTheme; this.update(false); } else return this.general[thisTheme];
  }
  /** Sends back the helper options object.
   * @return  {object} - Helpers Options */
  theHelperOptions() { return this.helpers; }
  /** Updates the current session queue data options.
   * @param {object} data - Session Options */
  theSessionQueue(data) { this.sessionQueue = data; }
  /** Adds the Panda Crazy Buttons option to the element provided to forum pages and the property for the helper option to use.
   * @param {object} appendHere - Jquery Object  @param  {string} prop - Property Name to Change */
  popupForumOptions(appendHere, prop) {
    createCheckBox(appendHere, 'Panda Crazy Buttons', '', this.helpers[prop], this.helpers[prop], ' pcm-tooltipData', ' pcm-tooltipData', 'Should PCM buttons be added?', e => {
      this.helpers[prop] = $(e.target).prop('checked'); this.update(false);
      helperSendCommands(this.helpers, 'optionsChange');
    });
  }
  /** Adds options to MTURK pages on the element provided using helper and session options from current page.
   * @param {object} appendHere - Jquery Object */
  mturkQueueOptions(appendHere) {
    createCheckBox(appendHere, 'Panda Crazy Buttons', 'pcm-mturkButtons', this.helpers.mturkPageButtons, this.helpers.mturkPageButtons, ' pcm-tooltipData', ' pcm-tooltipData', 'Should PCM buttons be added?', () => {
      this.helpers.mturkPageButtons = !this.helpers.mturkPageButtons; this.update(false); helperSendCommands(this.helpers, 'globalOptions');
    });
    createCheckBox(appendHere, 'Unique Tab Hits Restriction', 'pcm-restrictTabUnique', this.helpers.tabUniqueHits, this.helpers.tabUniqueHits, ' pcm-tooltipData', ' pcm-tooltipData', 'Allow only unique HITs in each tab.', () => {
      this.helpers.tabUniqueHits = !this.helpers.tabUniqueHits; this.update(false); helperSendCommands(this.helpers, 'globalOptions');
    });
    $(`<hr class='pcm-sessionVarsSplit'><div class='pcm-sessionOptText'>Session Options:</div>`).appendTo(appendHere);
    createCheckBox(appendHere, 'Monitor at Queue End?', 'pcm-monitorNext', this.sessionQueue.monitorNext, this.sessionQueue.monitorNext, ' pcm-tooltipData', ' pcm-tooltipData', 'Monitor Queue automatically once you finish HITs in your queue.', () => {
      this.sessionQueue.monitorNext = !this.sessionQueue.monitorNext; helperSendCommands(this.sessionQueue, 'optionsChange');
    });
  }
  /** Adds options to HIT pages on the element provided using session options from current page.
   * @param {object} appendHere - Jquery Object */
  mturkAssignedOptions(appendHere) {
    createCheckBox(appendHere, 'Same GroupID Next?', 'pcm-sameGIDHit', this.sessionQueue.gidNext, this.sessionQueue.gidNext, ' pcm-tooltipData', ' pcm-tooltipData', 'After submit go to the next HIT in queue with the same group ID as this HIT.', e => {
      this.sessionQueue.gidNext = !this.sessionQueue.gidNext; this.sessionQueue.ridNext = false;
      $(e.target).closest('.pcm-addedSection').find('#pcm-sameRIDHit').prop('checked',false);
      helperSendCommands(this.sessionQueue, 'optionsChange');
    });
    createCheckBox(appendHere, 'Same RequesterID Next?', 'pcm-sameRIDHit', this.sessionQueue.ridNext, this.sessionQueue.ridNext, ' pcm-tooltipData', ' pcm-tooltipData', 'After submit go to the next HIT in queue from the same Requester ID as this HIT.', e => {
      this.sessionQueue.ridNext = !this.sessionQueue.ridNext; this.sessionQueue.gidNext = false;
      $(e.target).closest('.pcm-addedSection').find('#pcm-sameGIDHit').prop('checked',false);
      helperSendCommands(this.sessionQueue, 'optionsChange');
    });
  }
  /**
   * Adds the go to queue position link using the number of HITs in queue and a function to send any commmands needed to popup page.
   * @param {object} appendHere - Jquery Object  @param  {number} queueSize - Number of HITs in Queue  @param  {function} popupSend - Send To Popup Function */
  mturkQueueLinks(appendHere, queueSize, popupSend=null) {
    if (queueSize > 0) {
      let gotoLink = $(`<div class='pcm-goSelectDiv'>Go To Queue Position: </div>`).appendTo(appendHere);
      let sel = $(`<select></select>`).change( e => {
        let value = $(e.target).val(), position = (value.length <= 2) ? value : '1', goUrl = null;
        if (value === 'Last') goUrl = 'https://worker.mturk.com/tasks?JRPC=lasthit'; else if (value) goUrl = `https://worker.mturk.com/tasks?JRPC=gohit${position}`;
        if (goUrl) helperSendCommands({'url':goUrl}, 'newUrl', popupSend);
      }).appendTo(gotoLink);
      sel.append($('<option>').attr('value','---').text('---'));
      sel.append($('<option>').attr('value','First').text('First'));
      for (let i=2; i<queueSize; i++) { sel.append($('<option>').attr('value',i).text(i)); }
      sel.append($('<option>').attr('value','Last').text('Last'));
      gotoLink = null; sel = null;
    }
  }
  /** Figures out which options should be shown on the popup page from the URL and then uses the queue size and popup function.
   * @param {string} url - Page URL  @param {number} queueSize - Number of HITs in Queue  @param {function} popupSend Send To Popup Function */
  helperOptions(url, queueSize, popupSend=null) {
    let df = $(document.createDocumentFragment()), onMturk = false;
    if (/\/\/worker\.mturk\.com($|\/$|.*projects[/]?|.*tasks.*|.*requesters\/.*)/.test(url)) { onMturk = true; this.mturkQueueOptions(df, popupSend); }
    if (/\/\/[^/]*\/projects\/[^/]*\/tasks\/.*?assignment_id/.test(url)) this.mturkAssignedOptions(df);
    else if (/\/\/[^/]*mturkcrowd.com.*$/.test(url)) this.popupForumOptions(df, 'MTCButtons');
    else if (/\/\/[^/]*turkerview.com.*$/.test(url)) this.popupForumOptions(df, 'TVButtons');
    else if (/\/\/[^/]*mturkforum.com.*$/.test(url)) this.popupForumOptions(df, 'MTFButtons');
    else if (/\/\/[^/]*ourhitstop.com.*$/.test(url)) this.popupForumOptions(df, 'OHSButtons');
    else if (/\/\/[^/]*slack.com.*$/.test(url)) this.popupForumOptions(df, 'SlackButtons');
    else if (/\/\/[^/]*discord.com.*$/.test(url)) this.popupForumOptions(df, 'DiscordButtons');
    if (onMturk) this.mturkQueueLinks(df, queueSize, popupSend);
    return df;
  }
}