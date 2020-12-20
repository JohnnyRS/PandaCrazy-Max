/** This class deals with any showing of modals for option changing.
 * @class ModalOptionsClass ##
 * @author JohnnyRS - johnnyrs@allbyjohn.com */
class ModalOptionsClass {
	constructor() {
    this.defDur = {'min':0, 'max':120000};
    this.reader = new FileReader();
  }
  /** Shows the general options in a modal for changes.
   * @param  {function} [afterClose] - After Close Function */
  showGeneralOptions(afterClose=null) {
    if (!modal) modal = new ModalClass();
    const idName = modal.prepareModal(globalOpt.doGeneral(), '700px', 'pcm-generalOptModal', 'modal-lg', 'General Options', '', '', '', 'visible btn-sm', 'Save General Options', changes => {
      globalOpt.doGeneral(Object.assign(globalOpt.doGeneral(), changes));
      $('.pcm-volumeHorizGroup').css('display',(changes.volHorizontal) ? 'block' : 'none'); $('.pcm-volumeVertGroup').css('display',(changes.volHorizontal) ? 'none': 'flex');
      modal.closeModal();
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
        {'label':'Volume Slider Horizontal:', 'type':'trueFalse', 'key':'volHorizontal', 'tooltip':'Should volume slider be shown horizontal or vertical?'}, 
        {'label':'Search Job Buttons Create Search UI Triggers:', 'type':'trueFalse', 'key':'toSearchUI', 'tooltip':'Using search buttons creates search triggers in the search UI instead of panda UI.'}, 
        {'label':'Disable Monitoring Alert:', 'type':'trueFalse', 'key':'disableMonitorAlert', 'tooltip':'Disable the Monitor Queue Speech Alert When Queue Monitoring is Turned on.'}, 
        {'label':'Disable Captcha Alert:', 'type':'trueFalse', 'key':'disableCaptchaAlert', 'tooltip':'Disable the captcha alert and notification. Disable this if you are a master or using another script for captchas.'}, 
        {'label':'Show Captcha Counter Text:', 'type':'trueFalse', 'key':'captchaCountText', 'tooltip':'Should the captcha count be shown on the bottom log tabbed area? Disable this if you are a master.'}, 
        {'label':'Captcha Shown After #HITs:', 'type':'text', 'key':'captchaAt', 'tooltip':'How many HITs on average will mturk show a captcha for you?'}, 
      ], df, modal.tempObject[idName], true);
      $(`<table class='table table-dark table-hover table-sm pcm-detailsTable table-bordered'></table>`).append($(`<tbody></tbody>`).append(df)).appendTo(`#${idName} .${modal.classModalBody}`);
      pandaUI.resetToolTips(globalOpt.doGeneral().showHelpTooltips);
      df = null;
    }, () => { modal = null; if (afterClose) afterClose(); });
  }
  /** Shows the timer options in a modal for changes.
   * @param  {function} [afterClose] - After Close Function */
  showTimerOptions(afterClose=null) {
    if (!modal) modal = new ModalClass();
    const idName = modal.prepareModal(globalOpt.doTimers(), '850px', 'pcm-timerOptModal', 'modal-lg', 'Timer Options', '', '', '', 'visible btn-sm', 'Save Timer Options', changes => {
      let errorsFound = $('.pcm-eleLabel.pcm-optionLimited').length;
      if (errorsFound === 0) {
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
      pandaUI.resetToolTips(globalOpt.doGeneral().showHelpTooltips);
      df = null;
    }, () => { modal = null; if (afterClose) afterClose(); });
  }
  showThemeModal(afterClose=null) {
    let currentThemeIndex = globalOpt.theThemeIndex(), currentThemeCSS = globalOpt.theThemes();
    if (!modal) modal = new ModalClass();
    const idName = modal.prepareModal(null, '900px', 'pcm-themesModal', 'modal-lg', 'Change your themes', '', '', '', 'visible btn-sm', 'Use Current Theme', () => {
      globalOpt.theThemeIndex(currentThemeIndex); globalOpt.theThemes(currentThemeIndex, $(`#pcm-themeTextArea`).val());
      themes.theStyle = globalOpt.theThemes(); themes.themeIndex = currentThemeIndex; themes.prepareThemes(true);
      modal.closeModal();
    });
    modal.showModal(_, () => {
      let resetFileInput = () => { $(`#${idName} .pcm-fileInput`)[0].reset(); }
      let setFileInput = (fileName='Choose file...') => {
        $(`#${idName} .custom-file-input`).next('.custom-file-label').removeClass('selected').html(fileName);
        $(`#${idName} .pcm-inputError`).html('');
      }
      let df = document.createDocumentFragment();
      $(`<div class='pcm-detailsEdit small'>The textbox area below shows the current theme that is added to pages. Any CSS styles below will<br>be added to the default CSS style. If it's blank then nothing is added and nothing will change.</div>`).appendTo(df);
      let buttonGroup = $(`<div class='pcm-themeSelection'></div>`).appendTo(df);
      $(`<button class='btn btn-xs pcm-themeSelect0 pcm-buttonOff pcm-tooltipData pcm-tooltipHelper' data-original-title='Click to select theme #1 as current theme and display the CSS styles in the textarea below for edit.'>Theme #1</button>`).data('index', 0).appendTo(buttonGroup);
      $(`<button class='btn btn-xs pcm-themeSelect1 pcm-buttonOff pcm-tooltipData pcm-tooltipHelper' data-original-title='Click to select theme #2 as current theme and display the CSS styles in the textarea below for edit.'>Theme #2</button>`).data('index', 1).appendTo(buttonGroup);
      $(`<button class='btn btn-xs pcm-themeSelect2 pcm-buttonOff pcm-tooltipData pcm-tooltipHelper' data-original-title='Click to select theme #3 as current theme and display the CSS styles in the textarea below for edit.'>Theme #3</button>`).data('index', 2).appendTo(buttonGroup);
      $(`<button class='btn btn-xs pcm-themeSelect3 pcm-buttonOff pcm-tooltipData pcm-tooltipHelper' data-original-title='Click to select theme #4 as current theme and display the CSS styles in the textarea below for edit.'>Theme #4</button>`).data('index', 3).appendTo(buttonGroup);
      buttonGroup.find('.btn').on( 'click', e => {
        let theBody = $(`#${idName} .${modal.classModalBody}`);
        globalOpt.theThemes(currentThemeIndex, $(`#pcm-themeTextArea`).val());
        currentThemeIndex = $(e.target).data('index'); currentThemeCSS = globalOpt.theThemes(currentThemeIndex); $(`#pcm-themeTextArea`).val(currentThemeCSS);
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
        modal.showDialogModal('700px', 'Reset Theme?', `Do you really want to replace Theme #${currentThemeIndex + 1} with contents of file?`, () => {
          currentThemeCSS = this.reader.result; $(`#pcm-themeTextArea`).val(currentThemeCSS);
          globalOpt.theThemes(currentThemeIndex, currentThemeCSS); setFileInput(); resetFileInput(); modal.closeModal();
          $(e.target).addClass('pcm-disabled').prop('disabled',true);
        }, true, true,_,_,_,_, () => {});
        return false;
      }).appendTo(inputContainer);
      $(`<button class='btn btn-xs pcm-resetCSSFile pcm-tooltipData pcm-tooltipHelper' data-original-title='Reset this theme selected to the default value which will be blank.'>Reset Theme</button>`).on( 'click', e => {
        modal.showDialogModal('700px', 'Reset Theme?', `Do you really want to reset Theme #${currentThemeIndex + 1} to a blank theme?`, () => {
          currentThemeCSS = ''; $(`#pcm-themeTextArea`).val(currentThemeCSS);
          globalOpt.theThemes(currentThemeIndex, currentThemeCSS); setFileInput(); resetFileInput(); modal.closeModal();
        }, true, true,_,_,_,_, () => {});
        return false;
      }).appendTo(inputContainer);
      $(`<div class='pcm-themeArea'></div>`).append(df).appendTo(`#${idName} .${modal.classModalBody}`);
      buttonGroup.find(`.pcm-themeSelect${currentThemeIndex}`).removeClass('pcm-buttonOff').addClass('pcm-buttonOn');
      textArea.val(currentThemeCSS);
      $('.custom-file-input').on('change', (e) => {
        let fileName = $(e.target).val().replace('C:\\fakepath\\', '');
        if (fileName.slice(-3) === 'css') {
          setFileInput(fileName);
          this.reader.onload = () => {
            try { if (this.reader.result) { $('.pcm-loadCSSFile').removeClass('pcm-disabled').prop('disabled',false); } }
            catch(e) { console.log('Not a valid import file. ',e); this.statusFile(false); }
          };
          this.reader.readAsBinaryString($(e.target).prop('files')[0]);
          this.reader.onerror = () => { console.log('can not read the file'); }
        } else { $(`#${idName} .pcm-inputError`).html('Only allows a CSS file to be loaded!'); }
      });
      df = null; buttonGroup = null; themeInput = null; textArea = null; inputContainer = null;
    }, () => { modal = null; if (afterClose) afterClose(); });
  }
}