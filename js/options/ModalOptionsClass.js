/** This class deals with any showing of modals for option changing.
 * @class ModalOptionsClass ##
 * @author JohnnyRS - johnnyrs@allbyjohn.com
**/
class ModalOptionsClass {
	constructor() {
    this.hamDur = {'min':0, 'max':120};               // The minimum and maximum duration for panda ham duration in seconds. (2 minutes max)
    this.pandaDurSeconds = {'min':0, 'max':21600};    // The minimum and maximum duration for panda jobs in seconds. (6 hours max)
    this.fetchesTempDur = {'min':0, 'max':21600};     // The minimum and maximum number of fetches allowed. (6 hour max approximately)
    this.historyRange = {'min':3, 'max':90};          // The minimum and maximum days to keep the history of HITs in the database.
    this.minPayRange = {'min':0.00, 'max':300.00};    // The minimum and maximum amount of pay to use when limiting pay HITs.
    this.minCaptchaRange = {'min':0, 'max':100};      // The minimum and maximum number of captchas to use for captcha count text.
    this.pageSize = {'min':20, 'max':100};            // The minimum and maximum amount of HITs for MTURK to show on one search page.
    this.reader = new FileReader();                   // Allows users to load in a theme file from their computer.
  }
  /** Shows the general options in a modal for changes.
   * @param  {function} [afterClose] - After close function.
  **/
  showGeneralOptions(afterClose=null) {
    if (!MyModal) MyModal = new ModalClass();
    let theseOptions = {'general': Object.assign({}, MyOptions.doGeneral()), 'search': Object.assign({}, MyOptions.doSearch())}, oldMinReward = theseOptions.search.minReward;
    const idName = MyModal.prepareModal(theseOptions, '700px', 'pcm-generalOptModal', 'modal-lg', 'General Options', '', '', '', 'visible btn-sm', 'Save General Options', changes => {
      /** When options have changed, make sure the global options are changed too. */
      let closeAndSave = () => {
        MyOptions.doGeneral(Object.assign(MyOptions.doGeneral(), changes.general)); MyOptions.doSearch(Object.assign(MyOptions.doSearch(), changes.search));
        if (MyPandaUI !== null) MyPandaUI.queueAlertUpdate();
        $('.pcm-volumeHorizGroup').css('display',(changes.general.volHorizontal) ? 'block' : 'none');
        $('.pcm-volumeVertGroup').css('display',(changes.general.volHorizontal) ? 'none': 'flex');
        if (changes.general.advancedSearchJobs) $('.pcm-requesterButton').show(); else $('.pcm-requesterButton').hide();
        setTimeout( () => MyModal.closeModal(), 0);
      }
      if (changes.search.minReward === 0 && oldMinReward !== changes.search.minReward) MyModal.showDialogModal('700px', 'Minimum Reward at $0.00 Warning.', 'When setting Minimum Reward for MTURK search page to $0.00 there may be better HITs missed if there are a lot of HITs at $0.00.', null, false, false,_,_,_,_, () => { closeAndSave(); } );
      else closeAndSave();
    });
    MyModal.showModal(_, () => {
      let df = document.createDocumentFragment();
      $(`<div class='pcm-detailsEdit'>Click on the options you would like to change below:</div>`).appendTo(df);
      if (theseOptions.search.minReward === 0) $(`<div class='pcm-optionEditWarning'>Having the Minimum Reward at $0.00 may cause better HITs to slip by if there are many HITs at $0.00.</div>`).appendTo(df);
      displayObjectData([
        {'label':'Show Help Tooltips:', 'type':'trueFalse', 'key1':'general', 'key':'showHelpTooltips', 'tooltip':'Should help tooltips be shown for buttons and options? What you are reading is a tooltip.'},
        {'label':'Disable Queue Watch Color Alert:', 'type':'trueFalse', 'key1':'general', 'key':'disableQueueAlert', 'tooltip':'Disable the color alert in the queue watch area for HITs nearing the expiration time.'},
        {'label':'Disable Queue Watch Alarm:', 'type':'trueFalse', 'key1':'general', 'key':'disableQueueAlarm', 'tooltip':'Disable sounding the alarm for HITs nearing the expiration time.'},
        {'label':'Disable Desktop Notifications:', 'type':'trueFalse', 'key1':'general', 'key':'disableNotifications', 'tooltip':'Disable notifications shown when accepting HITs or warnings.'},
        {'label':'Show Fetch Highlighter on Group ID:', 'type':'trueFalse', 'key1':'general', 'key':'fetchHighlight', 'tooltip':'Should group ID be highlighted when job is trying to fetch?'},
        {'label':'Volume Slider Horizontal:', 'type':'trueFalse', 'key1':'general', 'key':'volHorizontal', 'tooltip':'Should volume slider be shown horizontal or vertical?'},
        {'label':'Search Job Buttons Create Search UI Triggers:', 'type':'trueFalse', 'key1':'general', 'key':'toSearchUI', 'tooltip':'Using search buttons creates search triggers in the search UI instead of panda UI.'},
        {'label':'Days to keep History:', 'type':'number', 'key1':'general', 'key':'historyDays', 'tooltip':'How many days should the history of active HITs be kept? The more days the more disk space it could use.', 'minMax':this.historyRange},
        {'label':'Disable Monitoring Alert:', 'type':'trueFalse', 'key1':'general', 'key':'disableMonitorAlert', 'tooltip':'Disable the Monitor Queue Speech Alert When Queue Monitoring is Turned on.'},
        {'label':'Disable Captcha Alert:', 'type':'trueFalse', 'key1':'general', 'key':'disableCaptchaAlert', 'tooltip':`Disable the captcha alert and notification. Disable this if you are a master or using another script for captcha's.`},
        {'label':'Show Captcha Counter Text:', 'type':'trueFalse', 'key1':'general', 'key':'captchaCountText', 'tooltip':'Should the captcha count be shown on the bottom log tabbed area? Disable this if you are a master.'},
        {'label':'Captcha Shown After #HITs:', 'type':'text', 'key1':'general', 'key':'captchaAt', 'tooltip':'How many HITs on average will MTURK show a captcha for you?', 'minMax':this.minCaptchaRange},
        {'label':'Minimum Reward for MTURK Search Page:', 'type':'number', 'key1':'search', 'key':'minReward', 'money':true, 'default':0, 'tooltip':`The minimum reward to show on the search page. The default value is $0.01 but there may be some HITs at $0.00 which are qualifications. Most HITs at $0.00 are no good. Be sure to change this back after getting any qualifications you were looking for.`, 'minMax':this.minPayRange},
      ], df, MyModal.tempObject[idName], true);
      $(`<table class='table table-dark table-hover table-sm pcm-detailsTable table-bordered'></table>`).append($(`<tbody></tbody>`).append(df)).appendTo(`#${idName} .${MyModal.classModalBody}`);
      if (MyPandaUI !== null) MyPandaUI.resetToolTips(MyOptions.doGeneral().showHelpTooltips);
      df = null;
    }, () => { MyModal = null; if (afterClose) afterClose(); });
  }
  /** Shows the timer options in a modal for changes.
   * @param  {function} [afterClose] - After close function.
  **/
  showTimerOptions(afterClose=null) {
    if (!MyModal) MyModal = new ModalClass();
    const idName = MyModal.prepareModal(Object.assign({}, MyOptions.doTimers()), '850px', 'pcm-timerOptModal', 'modal-lg', 'Timer Options', '', '', '', 'visible btn-sm', 'Save Timer Options', changes => {
      let errorsFound = $('.pcm-eleLabel.pcm-optionLimited').length;
      if (errorsFound === 0) {
        MyOptions.doTimers(Object.assign(MyOptions.doTimers(), changes));
        MyPanda.timerChange(MyOptions.getCurrentTimer()); MyPandaUI.pandaGStats.setPandaTimer(MyOptions.getCurrentTimer()); MyPanda.hamTimerChange(changes.hamTimer);
        MyPandaUI.pandaGStats.setHamTimer(changes.hamTimer); MySearch.timerChange(changes.searchTimer); MyPandaUI.pandaGStats.setSearchTimer(changes.searchTimer);
        MyQueue.timerChange(changes.queueTimer); MyPandaUI.pandaGStats.setQueueTimer(changes.queueTimer);
        MyMenus.updateTimerMenu(changes.timerIncrease, changes.timerDecrease, changes.timerAddMore);
        MyModal.closeModal(); changes = null;
      }
    });
    MyModal.showModal(_, () => {
      let df = document.createDocumentFragment(), timerRange = MyOptions.getTimerRange(), timerChange = MyOptions.getTimerChange();
      let searchRange = MyOptions.getTimerSearch(), queueRange = MyOptions.getTimerQueue();
      $(`<div class='pcm-detailsEdit'>Click on the options you would like to change below:<br><span class='small pcm-modalInfo'>All timers are in milliseconds unless specified otherwise.</span></div>`).appendTo(df);
      displayObjectData([
        {'label':'Main Timer:', 'type':'number', 'key':'mainTimer', 'tooltip':`Change the main timer duration in milliseconds.`, 'minMax':timerRange},
        {'label':'Timer #2:', 'type':'number', 'key':'secondTimer', 'tooltip':`Change the second timer duration in milliseconds.`, 'minMax':timerRange},
        {'label':'Timer #3:', 'type':'number', 'key':'thirdTimer', 'tooltip':`Change the third timer duration in milliseconds.`, 'minMax':timerRange},
        {'label':'GoHam Timer:', 'type':'number', 'key':'hamTimer', 'tooltip':`Change the go ham timer duration in milliseconds.`, 'minMax':timerRange},
        {'label':'Default GoHam Timer Delay (Seconds):', 'type':'number', 'seconds':true, 'key':'hamDelayTimer', 'tooltip':'Change the default duration for jobs going into ham automatically by delay.', 'minMax':this.hamDur},
        {'label':'Search Timer:', 'type':'number', 'key':'searchTimer', 'tooltip':`Change the search timer duration for HITs to be searched and found in milliseconds.`, 'minMax':searchRange},
        {'label':'Check Queue Every:', 'type':'number', 'key':'queueTimer', 'tooltip':'Change the timer duration for the MTURK queue to be checked and updated in milliseconds. Higher amount may lower data use.', 'minMax':queueRange},
        {'label':'Timer Increase By:', 'type':'number', 'key':'timerIncrease', 'tooltip':'Change the value in milliseconds on the increase menu button to increase the current timer by.', 'minMax':timerChange},
        {'label':'Timer Decrease By:', 'type':'number', 'key':'timerDecrease', 'tooltip':'Change the value in milliseconds on the decrease menu button to decrease the current timer by.', 'minMax':timerChange},
        {'label':'Timer Add Timer By:', 'type':'number', 'key':'timerAddMore', 'tooltip':'Change the value in milliseconds on the add more time menu button to increase the current timer by.', 'minMax':timerChange},
      ], df, MyModal.tempObject[idName], true);
      $(`<table class='table table-dark table-hover table-sm pcm-detailsTable table-bordered'></table>`).append($(`<tbody></tbody>`).append(df)).appendTo(`#${idName} .${MyModal.classModalBody}`);
      if (MyPandaUI !== null) MyPandaUI.resetToolTips(MyOptions.doGeneral().showHelpTooltips);
      df = null;
    }, () => { MyModal = null; if (afterClose) afterClose(); });
  }
  /** Shows a modal to change the themes or load up a theme file.
   * @param  {function} [afterClose] - After close function.
  **/
  showThemeModal(afterClose=null) {
    let currentThemeIndex = MyOptions.theThemeIndex(), currentThemeCSS = MyOptions.theThemes();
    if (!MyModal) MyModal = new ModalClass();
    const idName = MyModal.prepareModal(null, '900px', 'pcm-themesModal', 'modal-lg', 'Change your themes', '', '', '', 'visible btn-sm', 'Use Current Theme', () => {
      MyOptions.theThemeIndex(currentThemeIndex); MyOptions.theThemes(currentThemeIndex, $(`#pcm-themeTextArea`).val());
      MyThemes.theStyle = MyOptions.theThemes(); MyThemes.themeIndex = currentThemeIndex; MyThemes.prepareThemes(true);
      MyModal.closeModal();
    });
    MyModal.showModal(_, () => {
      let resetFileInput = () => { $(`#${idName} .pcm-fileInput`)[0].reset(); }
      let setFileInput = (fileName='Choose file...') => {
        $(`#${idName} .custom-file-input`).next('.custom-file-label').removeClass('selected').html(fileName);
        $(`#${idName} .pcm-inputError`).html('');
      }
      let df = document.createDocumentFragment();
      $(`<div class='pcm-detailsEdit small'>The text box area below shows the current theme that is added to pages. Any CSS styles below will<br>be added to the default CSS style. If it's blank then nothing is added and nothing will change.<br>After changing the theme you may have to reload the page especially if you changed CSS variables.</div>`).appendTo(df);
      let buttonGroup = $(`<div class='pcm-themeSelection'></div>`).appendTo(df);
      $(`<button class='btn btn-xs pcm-themeSelect0 pcm-buttonOff pcm-tooltipData pcm-tooltipHelper' data-original-title='Click to select theme #1 as current theme and display the CSS styles in the textarea below for edit.'>Theme #1</button>`).data('index', 0).appendTo(buttonGroup);
      $(`<button class='btn btn-xs pcm-themeSelect1 pcm-buttonOff pcm-tooltipData pcm-tooltipHelper' data-original-title='Click to select theme #2 as current theme and display the CSS styles in the textarea below for edit.'>Theme #2</button>`).data('index', 1).appendTo(buttonGroup);
      $(`<button class='btn btn-xs pcm-themeSelect2 pcm-buttonOff pcm-tooltipData pcm-tooltipHelper' data-original-title='Click to select theme #3 as current theme and display the CSS styles in the textarea below for edit.'>Theme #3</button>`).data('index', 2).appendTo(buttonGroup);
      $(`<button class='btn btn-xs pcm-themeSelect3 pcm-buttonOff pcm-tooltipData pcm-tooltipHelper' data-original-title='Click to select theme #4 as current theme and display the CSS styles in the textarea below for edit.'>Theme #4</button>`).data('index', 3).appendTo(buttonGroup);
      buttonGroup.find('.btn').on( 'click', e => {
        let theBody = $(`#${idName} .${MyModal.classModalBody}`);
        MyOptions.theThemes(currentThemeIndex, $(`#pcm-themeTextArea`).val());
        currentThemeIndex = $(e.target).data('index'); currentThemeCSS = MyOptions.theThemes(currentThemeIndex); $(`#pcm-themeTextArea`).val(currentThemeCSS);
        theBody.find(`.pcm-themeSelection .btn`).removeClass('pcm-buttonOn').addClass('pcm-buttonOff');
        theBody.find(`.pcm-themeSelect${currentThemeIndex}`).removeClass('pcm-buttonOff').addClass('pcm-buttonOn');
        theBody = null;
      })
      let themeInput = $(`<div class='pcm-themeInput'></div>`).appendTo(df);
      let textArea = $(`<textarea class='input-sm col-9' id='pcm-themeTextArea' multiple rows='10'></textarea>`).appendTo(themeInput);
      $(`<div class='pcm-inputError'></div>`).appendTo(df);
      let inputContainer = $(`<form class='pcm-fileInput'></form>`).appendTo(df);
      createFileInput(inputContainer, 'text/css', 'Browse for a CSS theme file on your computer to load for the current theme selected.');
      $(`<button class='btn btn-xs pcm-loadCSSFile pcm-disabled pcm-tooltipData pcm-tooltipHelper' data-original-title='Load the selected file to the current theme selected.'>Load CSS File</button>`).prop('disabled',true).on( 'click', e => {
        MyModal.showDialogModal('700px', 'Reset Theme?', `Do you really want to replace Theme #${currentThemeIndex + 1} with contents of file?`, () => {
          currentThemeCSS = this.reader.result; $(`#pcm-themeTextArea`).val(currentThemeCSS);
          MyOptions.theThemes(currentThemeIndex, currentThemeCSS); setFileInput(); resetFileInput(); MyModal.closeModal();
          $(e.target).addClass('pcm-disabled').prop('disabled',true);
        }, true, true,_,_,_,_, () => {});
        return false;
      }).appendTo(inputContainer);
      $(`<button class='btn btn-xs pcm-resetCSSFile pcm-tooltipData pcm-tooltipHelper' data-original-title='Reset this theme selected to the default value which will be blank.'>Reset Theme</button>`).on( 'click', e => {
        MyModal.showDialogModal('700px', 'Reset Theme?', `Do you really want to reset Theme #${currentThemeIndex + 1} to a blank theme?`, () => {
          currentThemeCSS = ''; $(`#pcm-themeTextArea`).val(currentThemeCSS);
          MyOptions.theThemes(currentThemeIndex, currentThemeCSS); setFileInput(); resetFileInput(); MyModal.closeModal();
        }, true, true,_,_,_,_, () => {});
        return false;
      }).appendTo(inputContainer);
      $(`<div class='pcm-themeArea'></div>`).append(df).appendTo(`#${idName} .${MyModal.classModalBody}`);
      buttonGroup.find(`.pcm-themeSelect${currentThemeIndex}`).removeClass('pcm-buttonOff').addClass('pcm-buttonOn');
      textArea.val(currentThemeCSS);
      $('.custom-file-input').on('change', (e) => {
        let fileName = $(e.target).val().replace('C:\\fakepath\\', '');
        if (fileName.slice(-3) === 'css') {
          setFileInput(fileName);
          this.reader.onload = () => {
            try { if (this.reader.result) { $('.pcm-loadCSSFile').removeClass('pcm-disabled').prop('disabled',false); } }
            catch(e) { console.info('Not a valid import file. ',e); this.statusFile(false); }
          };
          this.reader.readAsBinaryString($(e.target).prop('files')[0]);
          this.reader.onerror = () => { console.info('can not read the file'); }
        } else { $(`#${idName} .pcm-inputError`).html('Only allows a CSS file to be loaded!'); }
      });
      df = null; buttonGroup = null; themeInput = null; textArea = null; inputContainer = null;
    }, () => { MyModal = null; if (afterClose) afterClose(); });
  }
  /** Shows a modal with all search options that can be changed by the user.
   * @param  {function} [afterClose] - After close function.
  **/
   showSearchOptions(afterClose=null) {
    let searchOptions = Object.assign({}, MyOptions.doSearch()), oldMinReward = searchOptions.minReward, oldTempDuration = searchOptions.defaultDur;
    let oldTempFetches = searchOptions.defaultFetches, oldCustTempDuration = searchOptions.defaultCustDur, oldCustTempFetches = searchOptions.defaultCustFetches;
    /** Function to save all the options with a warning modal given if necessary. Will call closeAndSave function if user accepts warning or no warning given. */
    let saveFunction = (changes) => {
      /** When options are changed, make sure the global options are saved too.
       * @async - To wait for the search class to change timer and reset the search URL.
      **/
      let closeAndSave = async () => {
        MyOptions.theToSearchUI(changes.toSearchUI, false); MyOptions.theSearchTimer(changes.searchTimer, false); MyOptions.doGeneral(Object.assign(MyOptions.doGeneral(), changes.general));
        MyOptions.doSearch(Object.assign(MyOptions.doSearch(), changes.options)); await MySearch.timerChange(changes.searchTimer); await MySearch.resetSearch();
        if (changes.options.displayApproval) $('.pcm-approvalRateCol').show(); else $('.pcm-approvalRateCol').hide();
        setTimeout( () => MyModal.closeModal(), 0);
      }
      if (changes.options.defaultDur === 0 && changes.options.defaultFetches === 0) {
        changes.options.defaultDur = (changes.options.defaultDur !== oldTempDuration) ? oldTempDuration : changes.options.defaultDur;
        changes.options.defaultFetches = (changes.options.defaultFetches !== oldTempFetches) ? oldTempFetches : changes.options.defaultFetches;
      }
      if (changes.options.defaultCustDur === 0 && changes.options.defaultCustFetches === 0) {
        changes.options.defaultCustDur = (changes.options.defaultCustDur !== oldCustTempDuration) ? oldCustTempDuration : changes.options.defaultCustDur;
        changes.options.defaultCustFetches = (changes.options.defaultCustFetches !== oldCustTempFetches) ? oldCustTempFetches : changes.options.defaultCustFetches;
      }
      if (changes.options.minReward === 0 && oldMinReward !== changes.options.minReward) MyModal.showDialogModal('700px', 'Minimum Reward at $0.00 Warning.', 'When setting Minimum Reward for MTURK search page to $0.00 there may be better HITs missed if there are a lot of HITs at $0.00.', null, false, false,_,_,_,_, () => { closeAndSave(); } );
      else closeAndSave();
    }
    if (!MyModal) MyModal = new ModalClass();
    let theData = {'toSearchUI':MyOptions.theToSearchUI(), 'searchTimer':MyOptions.theSearchTimer(), 'options':Object.assign({}, searchOptions),
      'general':Object.assign({}, MyOptions.doGeneral())};
    const idName = MyModal.prepareModal(theData, '860px', 'pcm-triggerOptModal', 'modal-lg', 'Edit Search General Options', '', '', '', 'visible btn-sm', 'Save Options', (changes) => { saveFunction(changes); }, 'invisible', 'No', null, 'invisible', 'Cancel');
    MyModal.showModal(() => {}, async () => {
      let df = document.createDocumentFragment();
      $(`<div class='pcm-detailsEdit'>Click on the options you would like to change below:</div>`).appendTo(df);
      if (searchOptions.minReward === 0) $(`<div class='pcm-optionEditWarning'>Having the Minimum Reward at $0.00 may cause better HITs to slip by if there are many HITs at $0.00.</div>`).appendTo(df);
      displayObjectData( [
        {'label':'Show Help Tooltips:', 'type':'trueFalse', 'key1':'general', 'key':'showHelpTooltips', 'tooltip':'Should help tooltips be shown for buttons and options? What you are reading is a tooltip.'},
        {'label':'Search Job Buttons Create Search UI Triggers:', 'type':'trueFalse', 'key':'toSearchUI', 'tooltip':'Using search buttons creates search triggers in the search UI instead of panda UI.'},
        {'label':'Search Timer:', 'type':'number', 'key':'searchTimer', 'tooltip':`Change the search timer duration for HITs to be searched and found in milliseconds.`, 'minMax':MyOptions.getTimerSearch()},
        {'label':'Default Trigger Temporary Duration (Seconds):', 'seconds':true, 'type':'number', 'key1':'options', 'key':'defaultDur', 'tooltip':`The TEMPORARY default duration for new triggers to use on panda jobs. This value can not be 0 if Temporary Fetches is 0 and will revert back to previous value.`, 'minMax':this.pandaDurSeconds, 'minFunc': () => {
          let otherValue = $(`#pcm-defaultFetchesDetailS`).html() || $(`#pcm-defaultFetchesDetailI`).val();
          return (Number(otherValue) === this.pandaDurSeconds.min);
        }},
        {'label':'Default Trigger Temporary Fetches Limit:', 'type':'number', 'key1':'options', 'key':'defaultFetches', 'tooltip':`The TEMPORARY default number of fetches for new triggers to use on panda jobs. This value can not be 0 if Temporary Duration is 0 and will go back to previous value.`, 'minMax':this.fetchesTempDur, 'minFunc': () => {
          let otherValue = $(`#pcm-defaultDurDetailS`).html() || $(`#pcm-defaultDurDetailI`).val();
          return (Number(otherValue) === this.fetchesTempDur.min);
        }},
        {'label':'Default Trigger Temporary Ham Duration (Seconds):', 'seconds':true, 'type':'number', 'key1':'options', 'key':'defaultHamDur', 'tooltip':`The default ham duration for new triggers to use on panda jobs. Every panda job created by a trigger will go into Ham mode at beginning.`, 'minMax':this.hamDur},
        {'label':'Default Custom Temporary Duration (Seconds):', 'seconds':true, 'type':'number', 'key1':'options', 'key':'defaultCustDur', 'tooltip':`The TEMPORARY default duration for new custom triggers to use on panda jobs. This value can not be 0 if Temporary Fetches is 0 and will revert back to previous value.`, 'minMax':this.pandaDurSeconds, 'minFunc': () => {
          let otherValue = $(`#pcm-defaultFetchesDetailS`).html() || $(`#pcm-defaultFetchesDetailI`).val();
          return (Number(otherValue) === this.pandaDurSeconds.min);
        }},
        {'label':'Default Custom Temporary Fetches Limit:', 'type':'number', 'key1':'options', 'key':'defaultCustFetches', 'tooltip':`The TEMPORARY default number of fetches for new custom triggers to use on panda jobs. This value can not be 0 if Temporary Duration is 0 and will go back to previous value.`, 'minMax':this.fetchesTempDur, 'minFunc': () => {
          let otherValue = $(`#pcm-defaultDurDetailS`).html() || $(`#pcm-defaultDurDetailI`).val();
          return (Number(otherValue) === this.fetchesTempDur.min);
        }},
        {'label':'Default Custom Temporary Ham Duration (Seconds):', 'seconds':true, 'type':'number', 'key1':'options', 'key':'defaultCustHamDur', 'tooltip':`The default ham duration for new custom triggers to use on panda jobs. Every panda job created by a trigger will go into Ham mode at beginning.`, 'minMax':this.hamDur},
        {'label':'Page Size for MTURK Search Page:', 'type':'number', 'key1':'options', 'key':'pageSize', 'tooltip':`Number of HITs used on MTURK first search page. The higher the number can slow searching but also can give a better chance of finding HITs you want.`, 'minMax':this.pageSize},
        {'label':'Minimum Reward for MTURK Search Page:', 'type':'number', 'key1':'options', 'key':'minReward', 'money':true, 'default':0, 'tooltip':`The minimum reward to show on the search page. The default value is $0.01 but there may be some HITs at $0.00 which are qualifications. Most HITs at $0.00 are no good. Be sure to change this back after getting any qualifications you were looking for.`, 'minMax':this.minPayRange},
        {'label':'Display MTURK Approval Rate For Requesters:', 'type':'trueFalse', 'key1':'options', 'key':'displayApproval', 'tooltip':`Should Approval Rate from MTURK be shown on the Custom Triggered Hits Tab or only shown on mouse over requester name?`},
        {'label':'Search Page JSON Format:', 'type':'trueFalse', 'key1':'options', 'key':'useJSON', 'tooltip':`Should MTURK return the search results in JSON or HTML format? JSON should be the fastest.`},
      ], df, MyModal.tempObject[idName], true);
      $(`<table class='table table-dark table-hover table-sm pcm-detailsTable table-bordered'></table>`).append($(`<tbody></tbody>`).append(df)).appendTo(`#${idName} .${MyModal.classModalBody}`);
      $(`#${idName}`).keypress( e => { if ((e.keyCode ? e.keyCode : e.which) == '13') saveFunction(MyModal.tempObject[idName]); });
      if (MySearchUI) MySearchUI.resetToolTips(MyOptions.doGeneral().showHelpTooltips);
      theData = null; df = null;
    }, () => { MyModal = null; if (afterClose) afterClose(); });
  }
  /** Shows the general options in a modal for changes.
   * @param  {function} [afterClose] - After close function.
  **/
   showAdvancedOptions(afterClose=null) {
    if (!MyModal) MyModal = new ModalClass();
    let advOptions = {'general': Object.assign({}, MyOptions.doGeneral()), 'search': Object.assign({}, MyOptions.doSearch())};
    const idName = MyModal.prepareModal(advOptions, '700px', 'pcm-advancedOptModal', 'modal-lg', 'Advanced Options', '', '', '', 'visible btn-sm', 'Save Advanced Options', changes => {
      /** When options have changed, make sure the global options are changed too. */
      MyOptions.doGeneral(Object.assign(MyOptions.doGeneral(), changes.general)); MyOptions.doSearch(Object.assign(MyOptions.doSearch(), changes.search));
      if (changes.general.advancedSearchJobs) $('.pcm-requesterButton').show(); else $('.pcm-requesterButton').hide();
      gDebugLog.changeErrorLevel(changes.general.debugErrorLevel); gDebugLog.changeLogLevel(changes.general.debugger);
      setTimeout( () => MyModal.closeModal(), 0);
    });
    MyModal.showModal(_, () => {
      let df = document.createDocumentFragment();
      $(`<div class='pcm-detailsEdit'>Click on the options you would like to change below:</div>`).appendTo(df);
      displayObjectData([
        {'label':'Enable Advanced Search Jobs:', 'type':'trueFalse', 'key1':'general', 'key':'advancedSearchJobs', 'tooltip':'Allow search jobs to do a requester search from old script. Shows a button search jobs to toggle requester search option.'},
        {'label':'Debugging Log Levels:', 'type':'string', 'string':`Type of information shown on chrome debugger.`},
        {'label':'', 'type':'string', 'string':`0 - nothing = Shows no information from program.`},
        {'label':'', 'type':'string', 'string':`1 - info = Shows basic information of progress of program.`},
        {'label':'', 'type':'string', 'string':`2 - debug = Shows the flow of the program with information.`},
        {'label':'', 'type':'string', 'string':`3 - trace = Shows contents and functions being called.`},
        {'label':'', 'type':'string', 'string':`4 - trace URLs = Shows full details with URLs!`},
        {'label':'Debugging Log Level:', 'type':'range', 'key1':'general', 'key':'debugger', 'min':0, 'max':4, 'tooltip':'What log messages should be shown in debugger.'},
        {'label':'Debugging Error Levels:', 'type':'string', 'string':`Type of error information shown on chrome debugger.`},
        {'label':'', 'type':'string', 'string':`0 - fatal = Errors that can crash or stall program.`},
        {'label':'', 'type':'string', 'string':`1 - error = Errors that shouldn't be happening but may not be fatal.`},
        {'label':'', 'type':'string', 'string':`2 - warn = Warnings of errors but usually can be self corrected.`},
        {'label':'Debugging Error Level:', 'type':'range', 'key1':'general', 'key':'debugErrorLevel', 'min':0, 'max':2, 'tooltip':'What error messages should be shown in debugger.'},
      ], df, MyModal.tempObject[idName], true);
      $(`<table class='table table-dark table-hover table-sm pcm-detailsTable table-bordered'></table>`).append($(`<tbody></tbody>`).append(df)).appendTo(`#${idName} .${MyModal.classModalBody}`);
      df = null;
    }, () => { MyModal = null; if (afterClose) afterClose(); });
  }
}
